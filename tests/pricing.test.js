import test from 'node:test';
import assert from 'node:assert/strict';
import { erfn, Ncdf, Npdf, BS, impliedVol, putCallParityGap, noArbBounds } from '../src/pricing.js';

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected} ± ${tol}, got ${actual}`);

test('normal distribution helpers', () => {
  close(erfn(0), 0, 1e-7);
  close(erfn(1), 0.8427007929, 1e-6);
  close(erfn(-1), -0.8427007929, 1e-6);
  close(Ncdf(0), 0.5, 1e-7);
  close(Ncdf(1.96), 0.9750021, 1e-6);
  close(Ncdf(-1.96) + Ncdf(1.96), 1, 1e-7);
  close(Npdf(0), 1 / Math.sqrt(2 * Math.PI), 1e-12);
});

test('textbook Black-Scholes values (S=100, K=100, T=1, r=5%, vol=20%)', () => {
  close(BS(100, 100, 1, 0.05, 0.2, 'call').price, 10.4506, 1e-3, 'call');
  close(BS(100, 100, 1, 0.05, 0.2, 'put').price, 5.5735, 1e-3, 'put');
});

test('Greek units: theta per day, vega per vol point', () => {
  const c = BS(100, 100, 1, 0.05, 0.2, 'call');
  close(c.delta, 0.6368, 1e-3, 'delta');
  close(c.gamma, 0.018762, 1e-5, 'gamma');
  close(c.vega, 0.37524, 1e-4, 'vega per 1 vol point');
  close(c.theta, -6.414 / 365, 1e-4, 'theta per day');
  // vega matches a finite-difference bump of one vol point
  const bumped = BS(100, 100, 1, 0.05, 0.21, 'call').price - BS(100, 100, 1, 0.05, 0.19, 'call').price;
  close(c.vega, bumped / 2, 1e-3, 'finite-difference vega');
});

test('put-call parity holds across strikes and maturities', () => {
  const S = 100, r = 0.04, sig = 0.3;
  for (const K of [60, 80, 95, 100, 105, 120, 150]) {
    for (const T of [7 / 365, 30 / 365, 0.25, 1, 3]) {
      const c = BS(S, K, T, r, sig, 'call').price;
      const p = BS(S, K, T, r, sig, 'put').price;
      close(putCallParityGap(c, p, S, K, T, r), 0, 1e-5, `K=${K} T=${T}`);
    }
  }
});

test('putCallParityGap detects mispricing', () => {
  const S = 100, K = 100, T = 1, r = 0.05;
  const c = BS(S, K, T, r, 0.2, 'call').price;
  const p = BS(S, K, T, r, 0.2, 'put').price;
  close(putCallParityGap(c + 1, p, S, K, T, r), 1, 1e-5);
  close(putCallParityGap(c, p + 0.5, S, K, T, r), -0.5, 1e-5);
});

test('delta, gamma and vega behave', () => {
  for (const K of [70, 90, 100, 110, 130]) {
    for (const T of [0.05, 0.5, 2]) {
      const c = BS(100, K, T, 0.03, 0.25, 'call');
      const p = BS(100, K, T, 0.03, 0.25, 'put');
      assert.ok(c.delta > 0 && c.delta < 1, `call delta in (0,1), K=${K} T=${T}`);
      close(p.delta, c.delta - 1, 1e-12, 'put delta = call delta - 1');
      assert.ok(c.gamma > 0 && p.gamma > 0, 'gamma positive');
      assert.ok(c.vega > 0 && p.vega > 0, 'vega positive');
      close(c.gamma, p.gamma, 1e-12, 'call and put gamma equal');
      close(c.vega, p.vega, 1e-12, 'call and put vega equal');
    }
  }
});

test('implied volatility round-trips', () => {
  const cases = [
    [100, 100, 1, 0.05, 0.2],
    [100, 100, 30 / 365, 0.05, 0.35],
    [100, 60, 0.5, 0.03, 0.25],   // deep ITM call / deep OTM put
    [100, 150, 0.5, 0.03, 0.4],   // deep OTM call / deep ITM put
    [100, 120, 2, 0.01, 0.15],
    [50, 45, 0.1, 0.0, 0.8],
    [200, 210, 0.25, 0.05, 1.5],
  ];
  for (const [S, K, T, r, sig] of cases) {
    for (const type of ['call', 'put']) {
      const price = BS(S, K, T, r, sig, type).price;
      const iv = impliedVol(price, S, K, T, r, type);
      assert.notEqual(iv, null, `solved ${type} S=${S} K=${K} T=${T}`);
      // Deep ITM/OTM prices are insensitive to vol, so check the repriced value too
      close(BS(S, K, T, r, iv, type).price, price, 1e-6, `reprice ${type} K=${K}`);
      if (BS(S, K, T, r, sig, type).vega > 0.01) close(iv, sig, 1e-4, `iv ${type} K=${K} T=${T}`);
    }
  }
});

test('impliedVol returns null outside no-arbitrage bounds', () => {
  const S = 100, K = 80, T = 0.5, r = 0.05;
  const { lower } = noArbBounds(S, K, T, r, 'call');
  assert.equal(impliedVol(lower - 0.5, S, K, T, r, 'call'), null, 'call below intrinsic');
  assert.equal(impliedVol(5, 100, 120, 0.5, 0.05, 'put'), null, 'put below intrinsic');
  assert.equal(impliedVol(101, 100, 100, 1, 0.05, 'call'), null, 'call above spot');
  assert.equal(impliedVol(96, 100, 100, 1, 0.05, 'put'), null, 'put above discounted strike');
  assert.equal(impliedVol(-1, 100, 100, 1, 0.05, 'call'), null, 'negative price');
});

test('expiry edge case', () => {
  const c = BS(110, 100, 0, 0.05, 0.2, 'call');
  const p = BS(90, 100, 0, 0.05, 0.2, 'put');
  assert.equal(c.price, 10);
  assert.equal(p.price, 10);
  assert.equal(BS(90, 100, 0, 0.05, 0.2, 'call').price, 0);
  for (const g of [c, p]) {
    assert.equal(g.delta, 0);
    assert.equal(g.gamma, 0);
    assert.equal(g.theta, 0);
    assert.equal(g.vega, 0);
  }
  assert.equal(impliedVol(10, 110, 100, 0, 0.05, 'call'), null, 'vol undefined at expiry');
  // Just before the expiry cut-off pricing is still finite and IV still solves
  const T = 2 / 365;
  const price = BS(100, 100, T, 0.05, 0.3, 'call').price;
  assert.ok(Number.isFinite(price) && price > 0);
  close(impliedVol(price, 100, 100, T, 0.05, 'call'), 0.3, 1e-4);
});
