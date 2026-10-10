import test from 'node:test';
import assert from 'node:assert/strict';
import { STRATS, calcPayoff, computeScenarios } from '../src/strategies.js';
import { BS } from '../src/pricing.js';

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected} ± ${tol}, got ${actual}`);

// Common inputs: spot $100, 30% IV, 30 days to expiry.
const S0 = 100, IV = 30, DAYS = 30;
const T = DAYS / 365, R = 0.05, SIG = IV / 100;

// calcPayoff evaluates P&L on 100 evenly spaced prices from 0.55×S0 to 1.45×S0.
const STEP = (S0 * 0.9) / 99;
// Points are rounded to cents, so values that should be equal can differ by a few cents.
const CENTS = 0.05;

const premium = (k, type) => BS(S0, S0 * k, T, R, SIG, type).price;

test('STRATS defines the 12 strategies with well-formed legs', () => {
  const names = Object.keys(STRATS);
  assert.equal(names.length, 12);
  for (const name of names) {
    const s = STRATS[name];
    assert.ok(Array.isArray(s.legs) && s.legs.length > 0, name);
    assert.ok(['Low', 'Medium', 'High'].includes(s.risk), name);
    assert.equal(typeof s.desc, 'string');
    for (const l of s.legs) {
      assert.ok(['call', 'put', 'stock'].includes(l.t), `${name} leg type`);
      assert.ok(['buy', 'sell'].includes(l.side), `${name} leg side`);
      assert.ok(l.k > 0 && l.q > 0, `${name} leg strike/qty`);
    }
  }
});

test('price grid spans 0.55×–1.45× spot in 100 steps', () => {
  const p = calcPayoff('Long Call', S0, IV, DAYS);
  assert.equal(p.points.length, 100);
  close(p.points[0].price, 55, 0.01);
  close(p.points[99].price, 145, 0.01);
});

test('every strategy returns finite numbers', () => {
  for (const name of Object.keys(STRATS)) {
    for (const [spot, iv, days] of [[100, 30, 30], [12.5, 80, 7], [4500, 15, 365], [250, 45, 1]]) {
      const p = calcPayoff(name, spot, iv, days);
      const label = `${name} (${spot}, ${iv}%, ${days}d)`;
      assert.equal(p.points.length, 100, label);
      for (const pt of p.points) assert.ok(Number.isFinite(pt.price) && Number.isFinite(pt.pnl), label);
      for (const v of [p.cost, p.maxProfit, p.maxLoss, ...Object.values(p.greeks), ...p.breakevens])
        assert.ok(Number.isFinite(v), `${label}: ${v}`);
      assert.ok(p.maxProfit >= p.maxLoss, label);
      for (const sc of computeScenarios(name, spot, iv, days)) assert.ok(Number.isFinite(sc.pnl), label);
    }
  }
});

test('unknown strategy returns an empty result', () => {
  const p = calcPayoff('Nope', S0, IV, DAYS);
  assert.deepEqual(p.points, []);
  assert.equal(p.maxProfit, 0);
  assert.equal(p.maxLoss, 0);
  assert.deepEqual(computeScenarios('Nope', S0, IV, DAYS), []);
});

test('bull call spread: max profit = (width − debit)×100, max loss = debit×100', () => {
  const p = calcPayoff('Bull Call Spread', S0, IV, DAYS);
  const debit = premium(1.0, 'call') - premium(1.05, 'call');
  assert.ok(debit > 0 && debit < 5);
  close(p.cost, debit * 100, 1e-9, 'cost');
  close(p.maxProfit, (5 - debit) * 100, CENTS, 'max profit');
  close(p.maxLoss, -debit * 100, CENTS, 'max loss');
  assert.equal(p.breakevens.length, 1);
  close(p.breakevens[0], 100 + debit, STEP, 'breakeven');
});

test('bear put spread: max profit = (width − debit)×100, max loss = debit×100', () => {
  const p = calcPayoff('Bear Put Spread', S0, IV, DAYS);
  const debit = premium(1.0, 'put') - premium(0.95, 'put');
  assert.ok(debit > 0 && debit < 5);
  close(p.cost, debit * 100, 1e-9, 'cost');
  close(p.maxProfit, (5 - debit) * 100, CENTS, 'max profit');
  close(p.maxLoss, -debit * 100, CENTS, 'max loss');
  assert.equal(p.breakevens.length, 1);
  close(p.breakevens[0], 100 - debit, STEP, 'breakeven');
});

test('long straddle: breakevens ≈ K ± total premium, loss at K = premium', () => {
  const p = calcPayoff('Straddle', S0, IV, DAYS);
  const prem = premium(1.0, 'call') + premium(1.0, 'put');
  close(p.cost, prem * 100, 1e-9, 'cost');
  assert.equal(p.breakevens.length, 2);
  close(p.breakevens[0], 100 - prem, STEP, 'lower breakeven');
  close(p.breakevens[1], 100 + prem, STEP, 'upper breakeven');
  // The strike is not a grid point; the "Flat" scenario evaluates exactly at K.
  const flat = computeScenarios('Straddle', S0, IV, DAYS).find(s => s.label === 'Flat');
  close(flat.pnl, -prem * 100, 1, 'P&L at K');
  // The grid minimum lies within half a step of K, where the slope is $100 per $1.
  assert.ok(p.maxLoss >= -prem * 100 - CENTS);
  assert.ok(p.maxLoss <= -prem * 100 + 100 * STEP / 2 + CENTS);
});

test('iron condor: max profit = net credit, max loss = (wing width − credit)×100', () => {
  const p = calcPayoff('Iron Condor', S0, IV, DAYS);
  const credit = premium(0.95, 'put') - premium(0.90, 'put') + premium(1.05, 'call') - premium(1.10, 'call');
  assert.ok(credit > 0 && credit < 5);
  close(p.cost, -credit * 100, 1e-9, 'cost is a credit');
  close(p.maxProfit, credit * 100, CENTS, 'max profit');
  close(p.maxLoss, -(5 - credit) * 100, CENTS, 'max loss');
  assert.equal(p.breakevens.length, 2);
  close(p.breakevens[0], 95 - credit, STEP, 'lower breakeven');
  close(p.breakevens[1], 105 + credit, STEP, 'upper breakeven');
});

test('covered call: profit is capped at (K − S0)×100 + premium', () => {
  const p = calcPayoff('Covered Call', S0, IV, DAYS);
  const prem = premium(1.05, 'call');
  close(p.maxProfit, (5 + prem) * 100, CENTS, 'max profit');
  // Every point above the strike earns the same capped profit.
  const above = p.points.filter(pt => pt.price >= 105);
  assert.ok(above.length > 10);
  for (const pt of above) close(pt.pnl, p.maxProfit, CENTS, `capped at ${pt.price}`);
  // Below the strike it behaves like stock plus premium.
  const low = p.points[0];
  close(low.pnl, (low.price - S0 + prem) * 100, 1, 'downside');
});

test('protective put: loss is floored at (S0 − K + premium)×100', () => {
  const p = calcPayoff('Protective Put', S0, IV, DAYS);
  const prem = premium(0.95, 'put');
  close(p.maxLoss, -(5 + prem) * 100, CENTS, 'max loss');
  const last = p.points[99];
  close(last.pnl, (last.price - S0 - prem) * 100, 1, 'upside');
});

test('butterfly: max loss = debit, max profit ≈ (wing width − debit)×100 at the body', () => {
  const p = calcPayoff('Butterfly', S0, IV, DAYS);
  const debit = premium(0.95, 'call') - 2 * premium(1.0, 'call') + premium(1.05, 'call');
  assert.ok(debit > 0);
  close(p.maxLoss, -debit * 100, CENTS, 'max loss');
  assert.ok(p.maxProfit <= (5 - debit) * 100 + CENTS);
  assert.ok(p.maxProfit >= (5 - debit) * 100 - 100 * STEP / 2 - CENTS);
});

test('credit spreads mirror their debit counterparts', () => {
  const bullPut = calcPayoff('Bull Put Spread', S0, IV, DAYS);
  const putCredit = premium(1.0, 'put') - premium(0.95, 'put');
  close(bullPut.maxProfit, putCredit * 100, CENTS);
  close(bullPut.maxLoss, -(5 - putCredit) * 100, CENTS);

  const bearCall = calcPayoff('Bear Call Spread', S0, IV, DAYS);
  const callCredit = premium(1.0, 'call') - premium(1.05, 'call');
  close(bearCall.maxProfit, callCredit * 100, CENTS);
  close(bearCall.maxLoss, -(5 - callCredit) * 100, CENTS);
});

test('payoff at extreme prices has the right sign', () => {
  // [strategy, sign at 0.55×S0, sign at 1.45×S0]
  const expected = [
    ['Long Call', -1, 1], ['Long Put', 1, -1],
    ['Bull Call Spread', -1, 1], ['Bear Put Spread', 1, -1],
    ['Bull Put Spread', -1, 1], ['Bear Call Spread', 1, -1],
    ['Straddle', 1, 1], ['Strangle', 1, 1],
    ['Butterfly', -1, -1], ['Iron Condor', -1, -1],
    ['Covered Call', -1, 1], ['Protective Put', -1, 1],
  ];
  assert.equal(expected.length, Object.keys(STRATS).length);
  for (const [name, lo, hi] of expected) {
    const pts = calcPayoff(name, S0, IV, DAYS).points;
    assert.equal(Math.sign(pts[0].pnl), lo, `${name} at ${pts[0].price}: ${pts[0].pnl}`);
    assert.equal(Math.sign(pts[99].pnl), hi, `${name} at ${pts[99].price}: ${pts[99].pnl}`);
  }
});

test('long call / long put lose exactly the premium when out of the money', () => {
  const call = calcPayoff('Long Call', S0, IV, DAYS);
  close(call.maxLoss, -premium(1.0, 'call') * 100, CENTS);
  close(call.points[99].pnl, (call.points[99].price - 100 - premium(1.0, 'call')) * 100, 1);
  const put = calcPayoff('Long Put', S0, IV, DAYS);
  close(put.maxLoss, -premium(1.0, 'put') * 100, CENTS);
});

test('scenario P&L agrees with the expiry payoff', () => {
  for (const name of Object.keys(STRATS)) {
    for (const sc of computeScenarios(name, S0, IV, DAYS)) {
      const St = S0 * sc.mult;
      let pnl = 0;
      for (const l of STRATS[name].legs) {
        const sign = l.side === 'buy' ? 1 : -1;
        if (l.t === 'stock') { pnl += sign * (St - S0) * l.q; continue; }
        const K = S0 * l.k;
        const intr = l.t === 'call' ? Math.max(0, St - K) : Math.max(0, K - St);
        pnl += sign * (intr - premium(l.k, l.t)) * l.q * 100;
      }
      close(sc.pnl, pnl, 0.5, `${name} ${sc.label}`);
    }
  }
});
