import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar,
  ComposedChart, Cell
} from "recharts";

// ── UNIVERSE ──────────────────────────────────────────────────────────────────
const SP500 = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO", "LLY", "JPM", "V", "UNH", "XOM", "MA", "JNJ", "PG", "HD", "COST", "MRK", "ABBV", "BAC", "CRM", "CVX", "NFLX", "KO", "AMD", "PEP", "TMO", "ACN", "MCD", "CSCO", "WMT", "LIN", "ABT", "TXN", "ADBE", "NEE", "NKE", "PM", "RTX", "MS", "ORCL", "HON", "IBM", "GE", "CAT", "AMGN", "SPGI", "AXP", "BKNG", "MDT", "GILD", "GS", "BLK", "SYK", "DE", "ELV", "VRTX", "REGN", "CB", "ADI", "ISRG", "LRCX", "MO", "PLD", "SO", "COP", "BSX", "MDLZ", "ETN", "WM", "HCA", "EOG", "ADP", "CI", "ITW", "CME", "APD", "ZTS", "TJX", "USB", "FISV", "DUK", "NOC", "EMR", "GM", "F", "SLB", "FCX", "MCK", "KLAC", "SNPS", "CDNS", "ICE", "PANW", "CRWD", "INTC", "QCOM", "INTU"];
const NASDAQ_EXTRA = ["AMAT", "MU", "MRVL", "PYPL", "MELI", "CTAS", "ORLY", "DXCM", "FTNT", "WDAY", "IDXX", "PCAR", "VRSK", "ODFL", "MNST", "KDP", "BIIB", "TTD", "FAST", "DLTR", "GEHC", "SMCI", "ARM", "DASH", "CEG", "ILMN", "TEAM", "ZS", "ANSS"];
const ALL_TICKERS = [...new Set([...SP500, ...NASDAQ_EXTRA])];
const QUICK = ["AAPL", "NVDA", "TSLA", "MSFT", "META", "AMZN", "GOOGL", "AMD", "NFLX", "SPY", "QQQ", "AVGO"];

// ── REALISTIC BASE PRICES ─────────────────────────────────────────────────────
const BASE_PRICES = {
  AAPL: 213.49, MSFT: 415.32, NVDA: 875.40, AMZN: 198.12, GOOGL: 178.23, META: 522.90, TSLA: 177.58, AVGO: 1642.30, LLY: 890.45, JPM: 215.67, V: 279.34, UNH: 522.80, XOM: 118.45, MA: 478.92, JNJ: 156.78, PG: 168.23, HD: 362.45, COST: 865.30, MRK: 128.90, ABBV: 178.45, BAC: 42.67, CRM: 312.45, CVX: 162.34, NFLX: 672.80, KO: 62.45, AMD: 162.34, PEP: 168.90, TMO: 524.30, ACN: 342.10, MCD: 283.45, CSCO: 56.78, WMT: 67.89, LIN: 452.30, ABT: 112.45, TXN: 198.67, ADBE: 452.30, NEE: 78.34, NKE: 92.45, PM: 98.67, RTX: 122.34, MS: 112.45, ORCL: 142.30, HON: 212.45, IBM: 192.30, GE: 162.45, CAT: 378.90, AMGN: 312.45, SPGI: 487.30, AXP: 245.67, BKNG: 3782.45, MDT: 87.34, GILD: 78.45, GS: 478.90, BLK: 845.30, SYK: 342.80, DE: 392.30, ELV: 478.90, VRTX: 452.30, REGN: 992.45, CB: 267.80, ADI: 212.45, ISRG: 412.30, LRCX: 892.45, MO: 45.67, PLD: 112.34, SO: 78.45, COP: 112.34, BSX: 87.45, MDLZ: 67.34, ETN: 312.45, WM: 212.30, HCA: 378.45, EOG: 134.56, ADP: 245.67, CI: 342.30, ITW: 267.45, CME: 212.30, APD: 267.45, ZTS: 178.90, TJX: 112.34, USB: 45.67, FISV: 178.45, DUK: 112.34, NOC: 512.30, EMR: 112.34, GM: 47.89, F: 12.45, SLB: 47.34, FCX: 42.30, MCK: 612.45, KLAC: 712.30, SNPS: 542.45, CDNS: 278.90, ICE: 145.67, PANW: 312.45, CRWD: 342.30, INTC: 29.67, QCOM: 178.45, INTU: 645.30, AMAT: 212.45, MU: 112.34, MRVL: 78.45, PYPL: 67.34, MELI: 1892.30, CTAS: 178.45, ORLY: 1056.30, DXCM: 67.45, FTNT: 78.34, WDAY: 245.67, IDXX: 445.30, PCAR: 112.45, VRSK: 245.30, ODFL: 178.90, MNST: 56.34, KDP: 34.56, BIIB: 212.45, TTD: 89.34, FAST: 67.45, DLTR: 78.90, GEHC: 87.34, SMCI: 812.45, ARM: 145.67, DASH: 112.34, CEG: 212.45, ILMN: 134.56, TEAM: 245.30, ZS: 178.45, ANSS: 345.67, SPY: 543.20, QQQ: 465.30, DIA: 402.45, IWM: 212.30,
};

const BETA = { TSLA: 1.8, NVDA: 1.6, AMD: 1.7, SMCI: 1.9, META: 1.3, AMZN: 1.2, NFLX: 1.4, AAPL: 1.1, MSFT: 1.0, GOOGL: 1.1, AVGO: 1.2, SPY: 1.0, QQQ: 1.1, CRWD: 1.5, PANW: 1.4, ARM: 1.7, DASH: 1.5, INTC: 0.9, KO: 0.6, PG: 0.6, JNJ: 0.7, MCD: 0.8, WMT: 0.7 };

// ── PRICE ENGINE ──────────────────────────────────────────────────────────────
const priceState = {};
function initPriceState(sym) {
  if (priceState[sym]) return;
  const base = BASE_PRICES[sym] || 100;
  const beta = BETA[sym] || 1.0;
  const sessionDrift = (Math.random() - 0.48) * 0.04 * beta;
  priceState[sym] = { price: base * (1 + sessionDrift), base, beta, trend: (Math.random() - 0.5) * 0.002 };
}
function tickPrice(sym) {
  initPriceState(sym);
  const s = priceState[sym];
  const vol = 0.0008 * s.beta;
  s.price = s.price * (1 + s.trend + (Math.random() - 0.5) * 2 * vol + (s.base - s.price) / s.base * 0.001);
  s.price = Math.max(s.price, s.base * 0.5);
  return s.price;
}
function getQuote(sym) {
  initPriceState(sym);
  const s = priceState[sym];
  const price = +s.price.toFixed(2);
  const prev = +(s.base).toFixed(2);
  const change = +(price - prev).toFixed(2);
  const pct = +((change / prev) * 100).toFixed(2);
  const spread = price * 0.005;
  return { sym, price, prev, change, pct, high: +(price + spread * Math.random()).toFixed(2), low: +(price - spread * Math.random()).toFixed(2), vol: Math.round(1e6 + Math.random() * 50e6), source: "Simulated" };
}

// ── HISTORY WITH OHLC ─────────────────────────────────────────────────────────
function generateHistory(sym, range) {
  initPriceState(sym);
  const s = priceState[sym];
  const rangeDays = { "1mo": 22, "3mo": 66, "6mo": 132, "1y": 252, "2y": 504 };
  const days = rangeDays[range] || 66;
  const beta = s.beta;
  const vol = 0.012 * beta;

  const closes = [s.price];
  for (let i = 1; i < days; i++) {
    const prev = closes[closes.length - 1];
    closes.push(prev * (1 - (Math.random() - 0.5) * 2 * vol));
  }
  closes.reverse();

  const result = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - i));
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const close = +closes[i].toFixed(2);
    const open = i === 0 ? close : +(closes[i - 1] * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2);
    const wickVol = vol * 0.8;
    const high = +(Math.max(open, close) * (1 + Math.random() * wickVol)).toFixed(2);
    const low = +(Math.min(open, close) * (1 - Math.random() * wickVol)).toFixed(2);

    result.push({
      date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
      open, high, low, close,
      price: close,
      vol: Math.round(5e6 + Math.random() * 30e6),
      bullish: close >= open,
    });
  }
  return result;
}

// ── VIX ───────────────────────────────────────────────────────────────────────
let simVix = 18 + Math.random() * 8;
function tickVix() { simVix += (Math.random() - 0.5) * 0.3; simVix = Math.max(12, Math.min(45, simVix)); return +simVix.toFixed(2); }

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = { bg: "#06080f", card: "#0b0f1a", card2: "#0f1422", border: "#1c2838", blue: "#38bdf8", green: "#4ade80", red: "#f87171", yellow: "#fbbf24", purple: "#a78bfa", orange: "#fb923c", teal: "#2dd4bf", muted: "#475569", text: "#e2eaf4", dim: "#64748b" };
const VERDICT_STYLE = { "STRONG BUY": { bg: "#052e16", col: "#4ade80" }, "BUY": { bg: "#0a2e1a", col: "#86efac" }, "NEUTRAL": { bg: "#1c1a0a", col: "#fbbf24" }, "AVOID": { bg: "#2a0f0f", col: "#fca5a5" }, "STRONG AVOID": { bg: "#3b0000", col: "#f87171" } };

// ── BLACK-SCHOLES ─────────────────────────────────────────────────────────────
function erfn(x) { const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911; const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + p * x); return s * (1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x)); }
function Ncdf(x) { return 0.5 * (1 + erfn(x / Math.sqrt(2))); }
function Npdf(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
function BS(S, K, T, r, sig, type) {
  if (T <= 1 / 365) { return { price: Math.max(0, type === "call" ? S - K : K - S), delta: 0, gamma: 0, theta: 0, vega: 0 }; }
  const d1 = (Math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * Math.sqrt(T)), d2 = d1 - sig * Math.sqrt(T);
  if (type === "call") { return { price: Math.max(0, S * Ncdf(d1) - K * Math.exp(-r * T) * Ncdf(d2)), delta: Ncdf(d1), gamma: Npdf(d1) / (S * sig * Math.sqrt(T)), theta: (-S * Npdf(d1) * sig / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Ncdf(d2)) / 365, vega: S * Npdf(d1) * Math.sqrt(T) / 100 }; }
  return { price: Math.max(0, K * Math.exp(-r * T) * Ncdf(-d2) - S * Ncdf(-d1)), delta: Ncdf(d1) - 1, gamma: Npdf(d1) / (S * sig * Math.sqrt(T)), theta: (-S * Npdf(d1) * sig / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * Ncdf(-d2)) / 365, vega: S * Npdf(d1) * Math.sqrt(T) / 100 };
}

// ── STRATEGIES ────────────────────────────────────────────────────────────────
const STRATS = {
  "Long Call": { legs: [{ t: "call", side: "buy", k: 1.00, q: 1 }], risk: "High", desc: "Buy a call. Bullish with unlimited upside." },
  "Long Put": { legs: [{ t: "put", side: "buy", k: 1.00, q: 1 }], risk: "High", desc: "Buy a put. Bearish with capped downside." },
  "Bull Call Spread": { legs: [{ t: "call", side: "buy", k: 1.00, q: 1 }, { t: "call", side: "sell", k: 1.05, q: 1 }], risk: "Low", desc: "Buy ATM call, sell OTM call. Capped bullish." },
  "Bear Put Spread": { legs: [{ t: "put", side: "buy", k: 1.00, q: 1 }, { t: "put", side: "sell", k: 0.95, q: 1 }], risk: "Low", desc: "Buy ATM put, sell OTM put. Capped bearish." },
  "Straddle": { legs: [{ t: "call", side: "buy", k: 1.00, q: 1 }, { t: "put", side: "buy", k: 1.00, q: 1 }], risk: "High", desc: "Buy call + put ATM. Profit from big moves." },
  "Strangle": { legs: [{ t: "call", side: "buy", k: 1.05, q: 1 }, { t: "put", side: "buy", k: 0.95, q: 1 }], risk: "High", desc: "OTM call + put. Cheaper than straddle." },
  "Covered Call": { legs: [{ t: "stock", side: "buy", k: 1, q: 100 }, { t: "call", side: "sell", k: 1.05, q: 1 }], risk: "Medium", desc: "Own stock, sell call for income." },
  "Protective Put": { legs: [{ t: "stock", side: "buy", k: 1, q: 100 }, { t: "put", side: "buy", k: 0.95, q: 1 }], risk: "Low", desc: "Own stock + put for downside protection." },
  "Bull Put Spread": { legs: [{ t: "put", side: "sell", k: 1.00, q: 1 }, { t: "put", side: "buy", k: 0.95, q: 1 }], risk: "Medium", desc: "Sell higher put, buy lower. Bullish credit." },
  "Bear Call Spread": { legs: [{ t: "call", side: "sell", k: 1.00, q: 1 }, { t: "call", side: "buy", k: 1.05, q: 1 }], risk: "Medium", desc: "Sell lower call, buy higher. Bearish credit." },
  "Butterfly": { legs: [{ t: "call", side: "buy", k: 0.95, q: 1 }, { t: "call", side: "sell", k: 1.00, q: 2 }, { t: "call", side: "buy", k: 1.05, q: 1 }], risk: "Low", desc: "Buy wings, sell body. Max profit near middle." },
  "Iron Condor": { legs: [{ t: "put", side: "buy", k: 0.90, q: 1 }, { t: "put", side: "sell", k: 0.95, q: 1 }, { t: "call", side: "sell", k: 1.05, q: 1 }, { t: "call", side: "buy", k: 1.10, q: 1 }], risk: "Medium", desc: "Sell OTM call + put spread. Range-bound." },
};

// ── OPTIONS CHAIN ─────────────────────────────────────────────────────────────
function genChain(S, iv, T, vix, type) {
  const strikes = [];
  for (let p = -0.25; p <= 0.255; p += 0.025)strikes.push(+(S * (1 + p)).toFixed(2));
  return strikes.map(K => {
    const mono = K / S, skew = type === "put" ? (1 - mono) * 0.45 * (vix / 20) : (mono - 1) * -0.12 * (vix / 20);
    const localIV = Math.max(0.06, iv + skew), opt = BS(S, K, T, 0.05, localIV, type);
    const prox = Math.exp(-Math.pow((K - S) / S, 2) * 80);
    return { strike: K, bid: +Math.max(0.01, opt.price * 0.96).toFixed(2), ask: +(opt.price * 1.04).toFixed(2), last: +opt.price.toFixed(2), iv: +(localIV * 100).toFixed(1), delta: +opt.delta.toFixed(3), gamma: +opt.gamma.toFixed(4), theta: +opt.theta.toFixed(3), vega: +opt.vega.toFixed(3), vol: Math.round(prox * (800 + Math.random() * 4000) * (vix / 20)), oi: Math.round(prox * (3000 + Math.random() * 18000)), itm: type === "call" ? K <= S : K >= S };
  });
}

// ── PAYOFF ────────────────────────────────────────────────────────────────────
function calcPayoff(stratName, S0, ivPct, days) {
  const strat = STRATS[stratName];
  if (!strat) return { points: [], greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 }, cost: 0, maxProfit: 0, maxLoss: 0, breakevens: [] };
  const T = days / 365, r = 0.05, sig = ivPct / 100;
  let cost = 0, dG = 0, gG = 0, tG = 0, vG = 0;
  for (const l of strat.legs) { if (l.t === "stock") continue; const o = BS(S0, S0 * l.k, T, r, sig, l.t); const s = l.side === "buy" ? 1 : -1; cost += s * o.price * l.q * 100; dG += s * o.delta * l.q * 100; gG += s * o.gamma * l.q * 100; tG += s * o.theta * l.q * 100; vG += s * o.vega * l.q * 100; }
  const points = [];
  for (let i = 0; i < 100; i++) { const St = S0 * 0.55 + i * S0 * 0.9 / 99; let pnl = 0; for (const l of strat.legs) { if (l.t === "stock") { pnl += l.side === "buy" ? (St - S0) * l.q : (S0 - St) * l.q; continue; } const intr = l.t === "call" ? Math.max(0, St - S0 * l.k) : Math.max(0, S0 * l.k - St); const o0 = BS(S0, S0 * l.k, T, r, sig, l.t); pnl += (l.side === "buy" ? 1 : -1) * (intr - o0.price) * l.q * 100; } points.push({ price: +St.toFixed(2), pnl: +pnl.toFixed(2) }); }
  const pnls = points.map(p => p.pnl), maxProfit = Math.max(...pnls), maxLoss = Math.min(...pnls), breakevens = [];
  for (let i = 1; i < points.length; i++) { const prev = points[i - 1].pnl, curr = points[i].pnl; if ((prev < 0 && curr >= 0) || (prev >= 0 && curr < 0)) breakevens.push(+((points[i - 1].price + points[i].price) / 2).toFixed(2)); }
  return { points, greeks: { delta: dG, gamma: gG, theta: tG, vega: vG }, cost, maxProfit, maxLoss, breakevens };
}

function computeScenarios(stratName, S0, ivPct, days) {
  const scenarios = [{ label: "-20%", mult: 0.80 }, { label: "-10%", mult: 0.90 }, { label: "-5%", mult: 0.95 }, { label: "Flat", mult: 1.00 }, { label: "+5%", mult: 1.05 }, { label: "+10%", mult: 1.10 }, { label: "+20%", mult: 1.20 }];
  const strat = STRATS[stratName]; if (!strat) return [];
  const T = days / 365, r = 0.05, sig = ivPct / 100;
  return scenarios.map(sc => { const St = S0 * sc.mult; let pnl = 0; for (const l of strat.legs) { if (l.t === "stock") { pnl += l.side === "buy" ? (St - S0) * l.q : (S0 - St) * l.q; continue; } const intr = l.t === "call" ? Math.max(0, St - S0 * l.k) : Math.max(0, S0 * l.k - St); const opt0 = BS(S0, S0 * l.k, T, r, sig, l.t); pnl += (l.side === "buy" ? 1 : -1) * (intr - opt0.price) * l.q * 100; } return { ...sc, pnl: +pnl.toFixed(0) }; });
}

// ── AI ────────────────────────────────────────────────────────────────────────
async function runAI(strat, ticker, price, iv, vix, days, maxP, maxL) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 900, system: 'You are a senior options trader. Respond ONLY valid JSON no markdown: {"verdict":"STRONG BUY|BUY|NEUTRAL|AVOID|STRONG AVOID","confidence":0-100,"summary":"2-3 sentences","vixImpact":"1 sentence","greekRisk":"1 sentence","suggestedDTE":45,"sizingAdvice":"small|medium|full"}', messages: [{ role: "user", content: `Strategy=${strat}, Ticker=${ticker}, Spot=$${price}, IV=${iv}%, VIX=${vix}, DTE=${days}, MaxProfit=$${Math.round(maxP)}, MaxLoss=$${Math.round(Math.abs(maxL))}. Evaluate this trade.` }] }) });
    const d = await res.json(); return JSON.parse(((d.content?.[0]?.text) || "{}").replace(/```json|```/g, "").trim());
  } catch (e) { return null; }
}

// ── SCANNER ───────────────────────────────────────────────────────────────────
function generateScanResults(quotes, vix) {
  const results = []; Object.values(quotes).forEach(q => { if (!q || !SP500.includes(q.sym)) return; const beta = BETA[q.sym] || 1.2; const iv = Math.max(8, (vix || 20) / 100 * beta * 115 + Math.abs(q.pct / 100) * 35) * 100; const ivRank = Math.min(100, Math.max(0, (iv - 15) / (60 - 15) * 100)); const momentum = q.pct; let signal = "NEUTRAL"; if (momentum > 3 && ivRank < 40) signal = "BUY CALLS"; else if (momentum < -3 && ivRank < 40) signal = "BUY PUTS"; else if (ivRank > 70) signal = "SELL PREMIUM"; else if (Math.abs(momentum) < 1 && ivRank > 50) signal = "IRON CONDOR"; results.push({ sym: q.sym, price: q.price, pct: q.pct, iv: iv.toFixed(1), ivRank: ivRank.toFixed(0), signal, vol: (q.vol / 1e6).toFixed(1) + "M" }); });
  return results.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 20);
}

// ── CANDLESTICK CHART ─────────────────────────────────────────────────────────
function CandlestickChart({ data, up }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [dims, setDims] = useState({ w: 800, h: 200 });

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  if (!data?.length) return null;

  const pad = { top: 12, right: 16, bottom: 32, left: 56 };
  const W = dims.w - pad.left - pad.right;
  const H = dims.h - pad.top - pad.bottom;

  const maxCandles = Math.floor(W / 10);
  const visible = data.slice(-Math.min(maxCandles, data.length));
  const n = visible.length;

  const allPrices = visible.flatMap(d => [d.high, d.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const paddedMin = minP - range * 0.05;
  const paddedMax = maxP + range * 0.05;
  const paddedRange = paddedMax - paddedMin;

  const scaleY = v => H - ((v - paddedMin) / paddedRange) * H;
  const candleW = Math.max(2, (W / n) * 0.65);
  const step = W / n;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => paddedMin + (paddedRange / (tickCount - 1)) * i);
  const xLabelEvery = Math.max(1, Math.floor(n / 6));

  return (
    <div style={{ position: "relative", width: "100%", height: 220 }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }}>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {yTicks.map((v, i) => (
            <line key={i} x1={0} y1={scaleY(v)} x2={W} y2={scaleY(v)} stroke={C.border} strokeDasharray="3 5" strokeWidth={0.8} />
          ))}
          {yTicks.map((v, i) => (
            <text key={i} x={-6} y={scaleY(v) + 4} textAnchor="end" fontSize={9} fill={C.muted}>${v.toFixed(0)}</text>
          ))}
          {visible.map((d, i) => {
            if (i % xLabelEvery !== 0) return null;
            const cx = step * i + step / 2;
            return <text key={i} x={cx} y={H + 18} textAnchor="middle" fontSize={9} fill={C.muted}>{d.date}</text>;
          })}
          {visible.map((d, i) => {
            const cx = step * i + step / 2;
            const yO = scaleY(d.open);
            const yC = scaleY(d.close);
            const yH = scaleY(d.high);
            const yL = scaleY(d.low);
            const bodyTop = Math.min(yO, yC);
            const bodyH = Math.max(1, Math.abs(yO - yC));
            const color = d.bullish ? C.green : C.red;
            const halfW = candleW / 2;
            return (
              <g key={i}
                onMouseEnter={() => setTooltip({ d, x: cx + pad.left, y: (bodyTop + pad.top) })}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "crosshair" }}
              >
                <line x1={cx} y1={yH} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1} opacity={0.75} />
                <line x1={cx} y1={bodyTop + bodyH} x2={cx} y2={yL} stroke={color} strokeWidth={1} opacity={0.75} />
                <rect x={cx - halfW} y={bodyTop} width={candleW} height={bodyH} fill={color} fillOpacity={d.bullish ? 0.80 : 0.90} stroke={color} strokeWidth={0.5} rx={0.5} />
              </g>
            );
          })}
          <line x1={0} y1={H} x2={W} y2={H} stroke={C.border} strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={H} stroke={C.border} strokeWidth={1} />
        </g>
      </svg>
      {tooltip && (
        <div style={{ position: "absolute", left: Math.min(tooltip.x, dims.w - 160), top: Math.max(4, tooltip.y - 10), pointerEvents: "none", zIndex: 50, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 11, minWidth: 140, boxShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 5 }}>{tooltip.d.date}</div>
          {[["O", tooltip.d.open], ["H", tooltip.d.high], ["L", tooltip.d.low], ["C", tooltip.d.close]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 2 }}>
              <span style={{ color: C.dim }}>{k}</span>
              <span style={{ fontWeight: 700, color: k === "C" ? (tooltip.d.bullish ? C.green : C.red) : C.text }}>${v?.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ marginTop: 5, paddingTop: 5, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: C.dim }}>Chg</span>
            <span style={{ fontWeight: 700, color: tooltip.d.bullish ? C.green : C.red }}>
              {tooltip.d.bullish ? "+" : ""}{((tooltip.d.close - tooltip.d.open) / tooltip.d.open * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      <div style={{ position: "absolute", top: 6, right: 8, display: "flex", gap: 10, fontSize: 9, color: C.muted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 8, background: C.green, borderRadius: 1, display: "inline-block" }} /> Bull</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 8, height: 8, background: C.red, borderRadius: 1, display: "inline-block" }} /> Bear</span>
      </div>
    </div>
  );
}

// ── INDICATOR CALCULATIONS ────────────────────────────────────────────────────
function calcSMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return +(slice.reduce((s, d) => s + d.close, 0) / period).toFixed(2);
  });
}
function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const result = [];
  let ema = null;
  data.forEach(d => {
    if (ema === null) { ema = d.close; result.push(+ema.toFixed(2)); return; }
    ema = d.close * k + ema * (1 - k);
    result.push(+ema.toFixed(2));
  });
  return result;
}
function calcRSI(data, period = 14) {
  const result = Array(period).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  result.push(avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    avgGain = (avgGain * (period - 1) + Math.max(0, diff)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -diff)) / period;
    result.push(avgLoss === 0 ? 100 : +(100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
  }
  return result;
}
function calcMACD(data) {
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);
  const macdLine = ema12.map((v, i) => v !== null && ema26[i] !== null ? +(v - ema26[i]).toFixed(3) : null);
  const signalData = macdLine.filter(v => v !== null).map((v, i) => ({ close: v }));
  const signalEMA = calcEMA(signalData, 9);
  const signal = macdLine.map((v, i) => {
    if (v === null) return null;
    const si = macdLine.slice(0, i + 1).filter(x => x !== null).length - 1;
    return signalEMA[si] !== undefined ? +signalEMA[si].toFixed(3) : null;
  });
  const histogram = macdLine.map((v, i) => v !== null && signal[i] !== null ? +(v - signal[i]).toFixed(3) : null);
  return { macdLine, signal, histogram };
}
function calcBollingerBands(data, period = 20, mult = 2) {
  const sma = calcSMA(data, period);
  return data.map((_, i) => {
    if (sma[i] === null) return { upper: null, mid: null, lower: null };
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const std = Math.sqrt(slice.reduce((s, d) => s + Math.pow(d.close - mean, 2), 0) / period);
    return { upper: +(mean + mult * std).toFixed(2), mid: +mean.toFixed(2), lower: +(mean - mult * std).toFixed(2) };
  });
}

// ── FULL PRICE CHART COMPONENT ────────────────────────────────────────────────
function PriceChart({ history, ticker, up, chartType, setChartType }) {
  const [indicator, setIndicator] = useState("none");
  const [showVolume, setShowVolume] = useState(true);
  const [crosshair, setCrosshair] = useState(null);
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 300 });

  useEffect(() => {
    if (!svgRef.current) return;
    const ro = new ResizeObserver(e => {
      const { width } = e[0].contentRect;
      setDims({ w: width, h: 300 });
    });
    ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  const indicators = [
    { id: "none", label: "None" },
    { id: "sma20", label: "SMA 20" },
    { id: "ema20", label: "EMA 20" },
    { id: "bb", label: "Bollinger" },
    { id: "rsi", label: "RSI" },
    { id: "macd", label: "MACD" },
  ];

  const hasSubPane = indicator === "rsi" || indicator === "macd";
  const mainH = hasSubPane ? 200 : (showVolume ? 220 : 270);
  const subH = hasSubPane ? 80 : 0;
  const volH = showVolume && !hasSubPane ? 40 : 0;
  const totalChartH = mainH + subH + volH + 40;

  const visible = history.slice(-Math.min(Math.floor((dims.w - 72) / 9), history.length));
  const n = visible.length;
  const padL = 60, padR = 16, padT = 12, padB = 24;
  const W = dims.w - padL - padR;

  const allPrices = visible.flatMap(d => [d.high, d.low]);
  const minP = Math.min(...allPrices), maxP = Math.max(...allPrices);
  const pRange = (maxP - minP) || 1;
  const pMin = minP - pRange * 0.06, pMax = maxP + pRange * 0.06;
  const scaleY = v => mainH - ((v - pMin) / (pMax - pMin)) * mainH;
  const step = W / Math.max(n - 1, 1);
  const barW = Math.max(2, (W / n) * 0.62);
  const cx = i => (W / n) * i + (W / n) / 2;

  // Indicator data
  const sma20 = (indicator === "sma20") ? calcSMA(history, 20) : [];
  const ema20 = (indicator === "ema20") ? calcEMA(history, 20) : [];
  const bb = (indicator === "bb") ? calcBollingerBands(history) : [];
  const rsi = (indicator === "rsi") ? calcRSI(history) : [];
  const macd = (indicator === "macd") ? calcMACD(history) : { macdLine: [], signal: [], histogram: [] };

  const visibleStart = history.length - visible.length;

  // Price area path (for area chart)
  const areaPath = visible.map((d, i) => `${i === 0 ? "M" : "L"}${cx(i)},${scaleY(d.close)}`).join(" ");
  const closedArea = `${areaPath} L${cx(n - 1)},${mainH} L${cx(0)},${mainH} Z`;

  // Y ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => pMin + (pMax - pMin) * i / 4);
  const xLabelEvery = Math.max(1, Math.floor(n / 7));

  // RSI scale
  const rsiMin = 0, rsiMax = 100;
  const scaleRSI = v => subH - ((v - rsiMin) / (rsiMax - rsiMin)) * subH;

  // MACD scale
  const visMACD = macd.histogram.slice(visibleStart);
  const macdExtreme = Math.max(...visMACD.filter(Boolean).map(Math.abs), 0.001);
  const scaleMACDY = v => subH / 2 - (v / macdExtreme) * (subH / 2 - 4);

  return (
    <div>
      {/* ── TOOLBAR ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginRight: 4 }}>CHART — {ticker}</div>
        {/* Chart type */}
        <div style={{ display: "flex", gap: 3, background: C.card2, borderRadius: 6, padding: 2 }}>
          {[["area", "Area"], ["candle", "Candles"], ["bar", "Bars"]].map(([id, label]) => (
            <button key={id} onClick={() => setChartType(id)}
              style={{ padding: "3px 10px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit", background: chartType === id ? C.blue + "22" : "transparent", color: chartType === id ? C.blue : C.dim }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: C.border }} />
        {/* Indicators */}
        <div style={{ fontSize: 9, color: C.muted }}>INDICATOR</div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {indicators.map(ind => (
            <button key={ind.id} onClick={() => setIndicator(ind.id)}
              style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid " + (indicator === ind.id ? C.purple : C.border), cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit", background: indicator === ind.id ? C.purple + "22" : "transparent", color: indicator === ind.id ? C.purple : C.dim }}>
              {ind.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <button onClick={() => setShowVolume(v => !v)}
          style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid " + (showVolume ? C.teal : C.border), cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit", background: showVolume ? C.teal + "22" : "transparent", color: showVolume ? C.teal : C.dim }}>
          VOL
        </button>
      </div>

      {/* ── SVG CHART ── */}
      <div ref={svgRef} style={{ width: "100%", position: "relative", userSelect: "none" }}>
        <svg width="100%" height={totalChartH} style={{ display: "block", cursor: "crosshair" }}
          onMouseMove={e => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = e.clientX - rect.left - padL;
            const idx = Math.max(0, Math.min(n - 1, Math.round(mx / (W / n))));
            if (visible[idx]) setCrosshair({ idx, d: visible[idx] });
          }}
          onMouseLeave={() => setCrosshair(null)}>
          <defs>
            <linearGradient id="tvgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? C.green : C.red} stopOpacity={0.22} />
              <stop offset="100%" stopColor={up ? C.green : C.red} stopOpacity={0} />
            </linearGradient>
            <clipPath id="mainClip"><rect x="0" y="0" width={W} height={mainH} /></clipPath>
            <clipPath id="subClip"><rect x="0" y="0" width={W} height={subH} /></clipPath>
          </defs>

          {/* ── MAIN PANE ── */}
          <g transform={`translate(${padL},${padT})`}>
            {/* Grid */}
            {yTicks.map((v, i) => (
              <line key={i} x1={0} y1={scaleY(v)} x2={W} y2={scaleY(v)} stroke={C.border} strokeDasharray="3 5" strokeWidth={0.7} />
            ))}
            {/* Y labels */}
            {yTicks.map((v, i) => (
              <text key={i} x={-6} y={scaleY(v) + 4} textAnchor="end" fontSize={9} fill={C.muted}>${v.toFixed(0)}</text>
            ))}
            {/* X labels */}
            {visible.map((d, i) => i % xLabelEvery === 0 && (
              <text key={i} x={cx(i)} y={mainH + 16} textAnchor="middle" fontSize={9} fill={C.muted}>{d.date}</text>
            ))}

            <g clipPath="url(#mainClip)">
              {/* AREA chart */}
              {chartType === "area" && <>
                <path d={closedArea} fill="url(#tvgrad)" />
                <path d={areaPath} fill="none" stroke={up ? C.green : C.red} strokeWidth={2} />
              </>}

              {/* CANDLESTICK chart */}
              {chartType === "candle" && visible.map((d, i) => {
                const col = d.bullish ? C.green : C.red;
                const bTop = Math.min(scaleY(d.open), scaleY(d.close));
                const bH = Math.max(1, Math.abs(scaleY(d.open) - scaleY(d.close)));
                return (
                  <g key={i}>
                    <line x1={cx(i)} y1={scaleY(d.high)} x2={cx(i)} y2={bTop} stroke={col} strokeWidth={1} opacity={0.8} />
                    <line x1={cx(i)} y1={bTop + bH} x2={cx(i)} y2={scaleY(d.low)} stroke={col} strokeWidth={1} opacity={0.8} />
                    <rect x={cx(i) - barW / 2} y={bTop} width={barW} height={bH} fill={col} fillOpacity={0.85} rx={0.5} />
                  </g>
                );
              })}

              {/* BAR chart (OHLC bars) */}
              {chartType === "bar" && visible.map((d, i) => {
                const col = d.bullish ? C.green : C.red;
                return (
                  <g key={i}>
                    <line x1={cx(i)} y1={scaleY(d.high)} x2={cx(i)} y2={scaleY(d.low)} stroke={col} strokeWidth={1.5} />
                    <line x1={cx(i) - barW / 2} y1={scaleY(d.open)} x2={cx(i)} y2={scaleY(d.open)} stroke={col} strokeWidth={1.2} />
                    <line x1={cx(i)} y1={scaleY(d.close)} x2={cx(i) + barW / 2} y2={scaleY(d.close)} stroke={col} strokeWidth={1.2} />
                  </g>
                );
              })}

              {/* OVERLAY INDICATORS */}
              {/* SMA 20 */}
              {indicator === "sma20" && (() => {
                const visSMA = sma20.slice(visibleStart);
                const pts = visSMA.map((v, i) => v !== null ? `${cx(i)},${scaleY(v)}` : null).filter(Boolean);
                if (!pts.length) return null;
                let d = ""; let inLine = false;
                visSMA.forEach((v, i) => { if (v !== null) { d += `${inLine ? "L" : "M"}${cx(i)},${scaleY(v)}`; inLine = true; } else inLine = false; });
                return <path d={d} fill="none" stroke={C.yellow} strokeWidth={1.5} strokeDasharray="0" opacity={0.9} />;
              })()}
              {/* EMA 20 */}
              {indicator === "ema20" && (() => {
                const visEMA = ema20.slice(visibleStart);
                let d = ""; let inLine = false;
                visEMA.forEach((v, i) => { if (v !== null) { d += `${inLine ? "L" : "M"}${cx(i)},${scaleY(v)}`; inLine = true; } else inLine = false; });
                return <path d={d} fill="none" stroke={C.orange} strokeWidth={1.5} opacity={0.9} />;
              })()}
              {/* Bollinger Bands */}
              {indicator === "bb" && (() => {
                const visBB = bb.slice(visibleStart);
                let upper = "", mid = "", lower = "", fill = "";
                let inU = false, inM = false, inL = false, inF = false;
                visBB.forEach((b, i) => {
                  if (b.upper !== null) {
                    upper += `${inU ? "L" : "M"}${cx(i)},${scaleY(b.upper)}`;
                    mid += `${inM ? "L" : "M"}${cx(i)},${scaleY(b.mid)}`;
                    lower += `${inL ? "L" : "M"}${cx(i)},${scaleY(b.lower)}`;
                    fill += `${inF ? "L" : "M"}${cx(i)},${scaleY(b.upper)}`;
                    inU = inM = inL = inF = true;
                  }
                });
                const lowerRev = visBB.filter(b => b.lower !== null).map((b, i) => ({ b, i: visBB.indexOf(b) }));
                const fillPath = fill + " " + lowerRev.reverse().map(({ b, i }) => `L${cx(i)},${scaleY(b.lower)}`).join(" ") + " Z";
                return <>
                  <path d={fillPath} fill={C.purple} fillOpacity={0.05} />
                  <path d={upper} fill="none" stroke={C.purple} strokeWidth={1} opacity={0.6} strokeDasharray="3 3" />
                  <path d={mid} fill="none" stroke={C.purple} strokeWidth={1.2} opacity={0.8} />
                  <path d={lower} fill="none" stroke={C.purple} strokeWidth={1} opacity={0.6} strokeDasharray="3 3" />
                </>;
              })()}
            </g>

            {/* Crosshair */}
            {crosshair && (
              <>
                <line x1={cx(crosshair.idx)} y1={0} x2={cx(crosshair.idx)} y2={mainH} stroke={C.blue} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
                <line x1={0} y1={scaleY(crosshair.d.close)} x2={W} y2={scaleY(crosshair.d.close)} stroke={C.blue} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.6} />
                <rect x={W + 2} y={scaleY(crosshair.d.close) - 9} width={padR + padL - 4} height={18} fill={C.blue} rx={3} />
                <text x={W + padR / 2 + 24} y={scaleY(crosshair.d.close) + 4} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="700">${crosshair.d.close}</text>
              </>
            )}

            <line x1={0} y1={mainH} x2={W} y2={mainH} stroke={C.border} strokeWidth={1} />
            <line x1={0} y1={0} x2={0} y2={mainH} stroke={C.border} strokeWidth={1} />
          </g>

          {/* ── VOLUME PANE ── */}
          {showVolume && !hasSubPane && (
            <g transform={`translate(${padL},${padT + mainH + 4})`}>
              <text x={-6} y={volH / 2 + 4} textAnchor="end" fontSize={8} fill={C.muted}>Vol</text>
              {visible.map((d, i) => {
                const maxVol = Math.max(...visible.map(x => x.vol));
                const barH = (d.vol / maxVol) * (volH - 2);
                return <rect key={i} x={cx(i) - barW / 2} y={volH - barH} width={barW} height={barH} fill={d.bullish ? C.green : C.red} opacity={0.35} rx={0.5} />;
              })}
              <line x1={0} y1={volH} x2={W} y2={volH} stroke={C.border} strokeWidth={0.5} />
            </g>
          )}

          {/* ── RSI PANE ── */}
          {indicator === "rsi" && (
            <g transform={`translate(${padL},${padT + mainH + 8})`}>
              <text x={-6} y={12} textAnchor="end" fontSize={9} fill={C.purple}>RSI</text>
              {[30, 50, 70].map(level => (
                <g key={level}>
                  <line x1={0} y1={scaleRSI(level)} x2={W} y2={scaleRSI(level)} stroke={level === 50 ? C.border : (level === 70 ? C.red : C.green)} strokeDasharray="3 4" strokeWidth={0.7} opacity={0.6} />
                  <text x={-4} y={scaleRSI(level) + 3} textAnchor="end" fontSize={8} fill={C.muted}>{level}</text>
                </g>
              ))}
              <g clipPath="url(#subClip)">
                {(() => {
                  const visRSI = rsi.slice(visibleStart);
                  let d = ""; let inLine = false;
                  visRSI.forEach((v, i) => {
                    if (v !== null) { d += `${inLine ? "L" : "M"}${cx(i)},${scaleRSI(v)}`; inLine = true; }
                    else inLine = false;
                  });
                  return <path d={d} fill="none" stroke={C.purple} strokeWidth={1.8} />;
                })()}
              </g>
              <line x1={0} y1={subH} x2={W} y2={subH} stroke={C.border} strokeWidth={0.5} />
            </g>
          )}

          {/* ── MACD PANE ── */}
          {indicator === "macd" && (
            <g transform={`translate(${padL},${padT + mainH + 8})`}>
              <text x={-6} y={12} textAnchor="end" fontSize={9} fill={C.teal}>MACD</text>
              <line x1={0} y1={subH / 2} x2={W} y2={subH / 2} stroke={C.border} strokeDasharray="3 4" strokeWidth={0.7} />
              <g clipPath="url(#subClip)">
                {/* Histogram bars */}
                {macd.histogram.slice(visibleStart).map((v, i) => {
                  if (v === null) return null;
                  const y0 = subH / 2, y1 = scaleMACDY(v);
                  return <rect key={i} x={cx(i) - barW / 2} y={Math.min(y0, y1)} width={barW} height={Math.max(1, Math.abs(y0 - y1))} fill={v >= 0 ? C.green : C.red} opacity={0.5} />;
                })}
                {/* MACD line */}
                {(() => {
                  const visML = macd.macdLine.slice(visibleStart);
                  let d = ""; let inLine = false;
                  visML.forEach((v, i) => { if (v !== null) { d += `${inLine ? "L" : "M"}${cx(i)},${scaleMACDY(v)}`; inLine = true; } else inLine = false; });
                  return <path d={d} fill="none" stroke={C.blue} strokeWidth={1.5} />;
                })()}
                {/* Signal line */}
                {(() => {
                  const visSig = macd.signal.slice(visibleStart);
                  let d = ""; let inLine = false;
                  visSig.forEach((v, i) => { if (v !== null) { d += `${inLine ? "L" : "M"}${cx(i)},${scaleMACDY(v)}`; inLine = true; } else inLine = false; });
                  return <path d={d} fill="none" stroke={C.orange} strokeWidth={1.2} strokeDasharray="4 2" />;
                })()}
              </g>
              <line x1={0} y1={subH} x2={W} y2={subH} stroke={C.border} strokeWidth={0.5} />
            </g>
          )}
        </svg>

        {/* Floating crosshair tooltip */}
        {crosshair && (
          <div style={{ position: "absolute", top: padT + 4, left: padL + 8, pointerEvents: "none", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 10, zIndex: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.7)", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ color: C.dim }}>{crosshair.d.date}</span>
            {[["O", crosshair.d.open], ["H", crosshair.d.high], ["L", crosshair.d.low], ["C", crosshair.d.close]].map(([k, v]) => (
              <span key={k}><span style={{ color: C.dim }}>{k} </span><strong style={{ color: k === "C" ? (crosshair.d.bullish ? C.green : C.red) : C.text }}>${v}</strong></span>
            ))}
            <span><span style={{ color: C.dim }}>Vol </span><strong style={{ color: C.muted }}>{(crosshair.d.vol / 1e6).toFixed(1)}M</strong></span>
          </div>
        )}

        {/* Legend for active indicator */}
        {indicator !== "none" && (
          <div style={{ position: "absolute", top: padT + 4, right: padR + 8, pointerEvents: "none", display: "flex", gap: 10, fontSize: 9, alignItems: "center" }}>
            {indicator === "sma20" && <span style={{ color: C.yellow }}>── SMA 20</span>}
            {indicator === "ema20" && <span style={{ color: C.orange }}>── EMA 20</span>}
            {indicator === "bb" && <><span style={{ color: C.purple }}>── BB Mid</span><span style={{ color: C.purple, opacity: 0.6 }}>- - BB Bands</span></>}
            {indicator === "rsi" && <><span style={{ color: C.green }}>30</span><span style={{ color: C.purple }}>── RSI 14</span><span style={{ color: C.red }}>70</span></>}
            {indicator === "macd" && <><span style={{ color: C.blue }}>── MACD</span><span style={{ color: C.orange }}>- - Signal</span><span style={{ color: C.green }}>▌ Hist</span></>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SPARKLINE ─────────────────────────────────────────────────────────────────
function SparklineChart({ data, color, sym }) {
  if (!data?.length) return <div style={{ height: 58 }} />;
  const gid = "spk" + (sym || "x") + color.replace(/[^a-z0-9]/gi, "");
  return (
    <ResponsiveContainer width="100%" height={58}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gid})`}
          dot={false}
          isAnimationActive={false}
        />
        <XAxis dataKey="date" hide />
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip
          contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 5, fontSize: 9, padding: "3px 8px" }}
          formatter={v => ["$" + (+v).toFixed(2), ""]}
          labelStyle={{ color: C.muted, fontSize: 9 }}
          itemStyle={{ color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── UI HELPERS ────────────────────────────────────────────────────────────────
function Badge({ bg, color, size = 9, children }) { return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: size, fontWeight: 700, background: bg, color }}>{children}</span>; }
function SimTag() { return <span style={{ fontSize: 8, fontWeight: 700, color: C.teal, letterSpacing: "0.1em", marginLeft: 4 }}>●SIM</span>; }

function VIXMeter({ vix }) {
  const lvl = !vix ? "—" : vix < 15 ? "LOW" : vix < 20 ? "NORMAL" : vix < 30 ? "ELEVATED" : vix < 40 ? "HIGH" : "EXTREME";
  const col = !vix ? C.muted : vix < 15 ? C.green : vix < 20 ? C.teal : vix < 30 ? C.yellow : vix < 40 ? C.orange : C.red;
  return (
    <div style={{ textAlign: "center", padding: "4px 0" }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: col, lineHeight: 1 }}>{vix ? vix.toFixed(2) : "—"}</div>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.12em", marginTop: 2 }}>VIX</div>
      <div style={{ background: "#1a2535", borderRadius: 4, height: 5, margin: "6px 0 5px" }}><div style={{ height: 5, borderRadius: 4, background: col, width: vix ? Math.min(100, (vix / 50) * 100) + "%" : "0%", transition: "width 1s" }} /></div>
      <Badge bg={col + "33"} color={col}>{lvl}</Badge>
      <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>{!vix ? "" : vix < 15 ? "Options cheap" : vix < 20 ? "Normal vol" : vix < 30 ? "Elevated fear" : vix < 40 ? "High fear" : "Extreme caution"}</div>
    </div>
  );
}

function MiniChart({ data, color, height = 70 }) {
  if (!data?.length) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 10 }}>No data</div>;
  return (<ResponsiveContainer width="100%" height={height}><AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}><defs><linearGradient id="mcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs><Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#mcg)" dot={false} /><XAxis dataKey="date" hide /><YAxis domain={["auto", "auto"]} hide /></AreaChart></ResponsiveContainer>);
}

function AIResultBox({ res }) {
  const vs = VERDICT_STYLE[res.verdict] || { bg: "#1a2535", col: C.muted };
  return (<div style={{ background: "#06090f", border: "1px solid " + C.border, borderRadius: 8, padding: 12, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><Badge bg={vs.bg} color={vs.col} size={11}>{res.verdict}</Badge><span style={{ fontSize: 10, color: C.blue }}>Conf: {res.confidence}%</span></div><div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, marginBottom: 6 }}>{res.summary}</div><div style={{ fontSize: 10, color: C.yellow, marginBottom: 3 }}>VIX: {res.vixImpact}</div><div style={{ fontSize: 10, color: C.red, marginBottom: 3 }}>Greeks: {res.greekRisk}</div><div style={{ display: "flex", gap: 10, fontSize: 10, color: C.muted }}><span>DTE: <strong style={{ color: C.blue }}>{res.suggestedDTE}d</strong></span><span>Size: <strong style={{ color: C.yellow }}>{res.sizingAdvice}</strong></span></div></div>);
}

function ChainRow({ row, spot, type, onBuy, onSell }) {
  const atm = Math.abs(row.strike - spot) < spot * 0.013;
  const bg = atm ? "rgba(56,189,248,0.07)" : row.itm ? "rgba(74,222,128,0.03)" : "transparent";
  return (<tr style={{ background: bg, borderBottom: "1px solid " + C.border + "18" }}><td style={{ padding: "4px 6px" }}>{atm && <Badge bg="#0f2a40" color={C.blue}>ATM</Badge>}{!atm && row.itm && <Badge bg="#0a2010" color={C.green}>ITM</Badge>}{!atm && !row.itm && <Badge bg="#111" color={C.muted}>OTM</Badge>}</td><td style={{ padding: "5px 8px", fontWeight: 700, color: atm ? C.blue : C.text }}>${row.strike}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.red }}>${row.bid}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.green }}>${row.ask}</td><td style={{ padding: "5px 8px", textAlign: "right" }}>${row.last}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.yellow }}>{row.iv}%</td><td style={{ padding: "5px 8px", textAlign: "right", color: type === "call" ? C.green : C.red }}>{row.delta}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.purple }}>{row.gamma}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.orange }}>{row.theta}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.teal }}>{row.vega}</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{row.vol.toLocaleString()}</td><td style={{ padding: "5px 8px", textAlign: "right", color: C.dim }}>{row.oi.toLocaleString()}</td><td style={{ padding: "4px 8px", textAlign: "right" }}><div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}><button onClick={onBuy} style={{ padding: "3px 10px", background: "#052e16", color: C.green, border: "1px solid #166534", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit" }}>BUY</button><button onClick={onSell} style={{ padding: "3px 10px", background: "#3b0000", color: C.red, border: "1px solid #7f1d1d", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit" }}>SELL</button></div></td></tr>);
}

function LegRow({ leg: l, spot, days, iv }) {
  const K = l.t === "stock" ? null : spot * l.k; const opt = (l.t !== "stock" && K) ? BS(spot, K, days / 365, 0.05, iv, l.t) : null;
  return (<div style={{ background: "#080c14", borderRadius: 7, padding: "10px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}><Badge bg={l.side === "buy" ? "#052e16" : "#3b0000"} color={l.side === "buy" ? C.green : C.red}>{l.side.toUpperCase()}</Badge><span style={{ fontWeight: 700, fontSize: 12 }}>{l.t === "stock" ? "STOCK" : l.t.toUpperCase()}</span></div>{K && <div style={{ fontSize: 10, color: C.muted }}>K: <span style={{ color: C.text }}>${K.toFixed(2)}</span>{" · Prem: "}<span style={{ color: C.yellow }}>{opt ? "$" + opt.price.toFixed(2) : "—"}</span></div>}</div><span style={{ color: C.dim, fontSize: 11 }}>x{l.q}</span></div>);
}

function TradeRow({ trade: t, liveQuote, onClose }) {
  const lp = liveQuote ? liveQuote.price : t.spot; const chg = ((lp - t.spot) / t.spot * 100).toFixed(2); const tup = +chg >= 0; const vs = VERDICT_STYLE[t.verdict] || { bg: "#1a2535", col: C.muted };
  const contracts = t.contracts || 1;
  return (<div style={{ background: "#090d18", borderRadius: 8, padding: "12px 14px", marginBottom: 8, border: "1px solid " + C.border }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><div><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}><span style={{ fontWeight: 700, fontSize: 14 }}>{t.ticker}</span><span style={{ fontSize: 11, color: C.dim }}>{t.strategy}</span><Badge bg={vs.bg} color={vs.col}>{t.verdict}</Badge>{t.conf > 0 && <Badge bg="#0f1a2e" color={C.blue}>AI {t.conf}%</Badge>}{contracts > 1 && <Badge bg="#0a1f1e" color={C.teal}>{contracts} contracts</Badge>}</div><div style={{ display: "flex", gap: 14, fontSize: 10, color: C.muted, flexWrap: "wrap" }}><span>Entry: <strong style={{ color: C.text }}>${t.spot}</strong></span><span>Live: <strong style={{ color: tup ? C.green : C.red }}>{liveQuote ? "$" + lp : "—"}</strong> ({tup ? "+" : ""}{chg}%)</span><span>Cost: <strong>${t.cost.toFixed(0)}</strong></span><span>Expires: <strong style={{ color: C.yellow }}>{t.expiry}</strong></span></div></div><button onClick={onClose} style={{ padding: "6px 14px", background: "#450a0a", color: C.red, border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 10, fontFamily: "inherit" }}>Close</button></div></div>);
}

// Lot size options (contracts × 100 shares each)
const LOT_SIZES = [1, 2, 5, 10, 20, 50];

function CartItem({ item, onRemove, onQtyChange, onLotChange }) {
  const totalCost = item.price * item.qty * item.lotSize * 100;
  const isBuy = item.side === "buy";
  const qtyBtnStyle = (disabled) => ({
    width: 26, height: 26, borderRadius: 5, border: "1px solid " + C.border,
    background: disabled ? "#0a0e18" : "#131b2a", color: disabled ? C.muted : C.text,
    cursor: disabled ? "default" : "pointer", fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", lineHeight: 1, flexShrink: 0,
  });
  return (
    <div style={{ background: "#0a0e18", borderRadius: 8, padding: "10px 12px", marginBottom: 6, border: "1px solid " + C.border + "55" }}>
      {/* Top row: badge + name + expiry/iv */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Badge bg={isBuy ? "#052e16" : "#3b0000"} color={isBuy ? C.green : C.red}>{item.side.toUpperCase()}</Badge>
          <span style={{ fontWeight: 700, fontSize: 12 }}>{item.ticker} {item.type.toUpperCase()} ${item.strike}</span>
          <span style={{ color: C.muted, fontSize: 10 }}>{item.expDays}d · IV {item.iv}% · Δ {item.delta}</span>
        </div>
        <button onClick={onRemove} style={{ background: "#450a0a", color: C.red, border: "none", borderRadius: 5, padding: "3px 9px", cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 700 }}>✕</button>
      </div>

      {/* Bottom row: qty stepper + lot size + cost */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Quantity stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#080c14", borderRadius: 6, border: "1px solid " + C.border, overflow: "hidden" }}>
          <button
            style={{ ...qtyBtnStyle(item.qty <= 1), borderRadius: 0, border: "none", borderRight: "1px solid " + C.border }}
            onClick={() => item.qty > 1 && onQtyChange(item.qty - 1)}
          >−</button>
          <div style={{ padding: "0 12px", fontSize: 13, fontWeight: 700, color: C.blue, minWidth: 32, textAlign: "center", lineHeight: "26px" }}>{item.qty}</div>
          <button
            style={{ ...qtyBtnStyle(item.qty >= 99), borderRadius: 0, border: "none", borderLeft: "1px solid " + C.border }}
            onClick={() => item.qty < 99 && onQtyChange(item.qty + 1)}
          >+</button>
        </div>

        {/* Lot size selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.08em" }}>LOT</span>
          <select
            value={item.lotSize}
            onChange={e => onLotChange(+e.target.value)}
            style={{ background: "#080c14", border: "1px solid " + C.border, borderRadius: 6, padding: "4px 8px", color: C.teal, fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {LOT_SIZES.map(l => <option key={l} value={l}>{l} × 100</option>)}
          </select>
        </div>

        {/* Per-contract price */}
        <div style={{ fontSize: 10, color: C.muted }}>
          @ <span style={{ color: C.text }}>${item.price.toFixed(2)}</span>/contract
        </div>

        {/* Total cost — pushed right */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 1 }}>{item.qty} × {item.lotSize} lots</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.yellow }}>${totalCost.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}

// ── MARKET NEWS ──────────────────────────────────────────────────────────────
const NEWS_TAGS = {
  "Fed": C.yellow, "Rate": C.yellow, "Inflation": C.red, "CPI": C.yellow,
  "Earnings": C.green, "Beat": C.green, "Miss": C.red, "AI": C.blue,
  "Tech": C.blue, "Energy": C.orange, "Rally": C.green, "Selloff": C.red,
  "IPO": C.purple, "M&A": C.teal, "Upgrade": C.green, "Downgrade": C.red,
};

function MarketNews({ vix, quotes }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [activeTag, setActiveTag] = useState("All");

  const tickers = ["SPY", "QQQ", "AAPL", "NVDA", "TSLA", "MSFT", "META", "AMZN", "GOOGL"];
  const allTags = ["All", "Fed", "Earnings", "Tech", "AI", "Energy", "M&A"];

  const fetchNews = async () => {
    setLoading(true);
    try {
      const snap = tickers.map(t => {
        const q = quotes[t];
        return q ? `${t}: $${q.price} (${q.pct >= 0 ? "+" : ""}${q.pct}%)` : t;
      }).join(", ");

      const prompt = `You are a financial news wire. Generate 8 realistic, varied market news headlines for today based on these simulated prices: ${snap}. VIX is at ${vix ? vix.toFixed(1) : "18.5"}.

Return ONLY a JSON array of 8 objects, no markdown, no backticks:
[
  {
    "headline": "Short punchy headline (max 12 words)",
    "summary": "One sentence detail (max 20 words)",
    "tag": "one of: Fed, Earnings, Tech, AI, Energy, M&A, Macro, Crypto",
    "sentiment": "bullish or bearish or neutral",
    "ticker": "relevant ticker or empty string",
    "time": "e.g. 2m ago or 14m ago or 1h ago"
  }
]`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setNews(parsed);
      setLastFetch(new Date());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const sentCol = { bullish: C.green, bearish: C.red, neutral: C.muted };
  const sentBg = { bullish: "#052e16", bearish: "#3b0000", neutral: "#1a2535" };

  const filtered = activeTag === "All" ? news : news.filter(n => n.tag === activeTag);

  return (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: C.blue }}>MARKET NEWS</div>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.teal, display: "inline-block", animation: "pulse 2s infinite" }} />
          {lastFetch && <span style={{ fontSize: 9, color: C.muted }}>{lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <button onClick={fetchNews} disabled={loading}
          style={{ padding: "4px 10px", background: loading ? "#0f1422" : "#0f2a40", color: loading ? C.muted : C.blue, border: "1px solid " + (loading ? C.border : C.blue + "44"), borderRadius: 6, cursor: loading ? "default" : "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit" }}>
          {loading ? "Fetching…" : "↻ Refresh"}
        </button>
      </div>

      {/* Tag filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {allTags.map(t => (
          <button key={t} onClick={() => setActiveTag(t)}
            style={{ padding: "3px 9px", background: activeTag === t ? "rgba(56,189,248,0.15)" : "#0b0f1a", border: "1px solid " + (activeTag === t ? C.blue : C.border), borderRadius: 5, cursor: "pointer", fontSize: 9, fontWeight: 700, color: activeTag === t ? C.blue : C.dim, fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && news.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: "#0b0f1a", borderRadius: 7, padding: "12px 14px", animation: "pulse 1.5s infinite" }}>
              <div style={{ height: 10, background: "#1a2535", borderRadius: 4, marginBottom: 6, width: "70%" }} />
              <div style={{ height: 8, background: "#131b2a", borderRadius: 4, width: "50%" }} />
            </div>
          ))}
        </div>
      )}

      {/* News items */}
      {!loading && filtered.length === 0 && news.length > 0 && (
        <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "24px 0" }}>No {activeTag} news right now</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((item, i) => {
          const sc = sentCol[item.sentiment] || C.muted;
          const sb = sentBg[item.sentiment] || "#1a2535";
          const tc = NEWS_TAGS[item.tag] || C.dim;
          return (
            <div key={i} style={{ background: "#0b0f1a", borderRadius: 7, padding: "10px 12px", borderLeft: "3px solid " + sc, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: tc, background: tc + "18", padding: "1px 6px", borderRadius: 4 }}>{item.tag}</span>
                  {item.ticker && <span style={{ fontSize: 9, fontWeight: 700, color: C.blue, background: "#0f2a40", padding: "1px 6px", borderRadius: 4 }}>{item.ticker}</span>}
                  <span style={{ fontSize: 9, fontWeight: 700, color: sc, background: sb, padding: "1px 6px", borderRadius: 4 }}>{item.sentiment?.toUpperCase()}</span>
                  <span style={{ fontSize: 9, color: C.muted, marginLeft: "auto" }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.4, marginBottom: 3 }}>{item.headline}</div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{item.summary}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── LEARN DATA ────────────────────────────────────────────────────────────────
const LEARN_ITEMS = [{ name: "Bull Call Spread", tag: "Bullish", level: "Beginner", what: "Buy a lower-strike call and sell a higher-strike call with same expiry.", when: "You expect moderate upside, want to reduce cost vs buying a naked call.", risk: "Max loss = net premium paid. Max profit = spread width minus premium.", greeks: "Net positive delta, low gamma, negative theta, low vega." }, { name: "Straddle", tag: "Volatile", level: "Intermediate", what: "Buy a call and a put at the same strike and expiry.", when: "You expect a big move but don't know direction. Earnings plays.", risk: "Max loss = total premium paid. Profit requires a large move.", greeks: "Delta near zero, high gamma, negative theta, high positive vega." }, { name: "Covered Call", tag: "Income", level: "Beginner", what: "Own 100 shares and sell a call option against them.", when: "Moderately bullish or neutral. Generate income from existing position.", risk: "Upside capped at strike. Downside same as holding stock.", greeks: "Low effective delta, negative gamma from short call, positive theta." }, { name: "Iron Condor", tag: "Neutral", level: "Advanced", what: "Sell an OTM call spread + sell an OTM put spread simultaneously.", when: "You expect low volatility and range-bound price action.", risk: "Max profit = net credit. Max loss = spread width minus credit.", greeks: "Near-zero delta, short gamma, positive theta, short vega." }, { name: "Butterfly", tag: "Neutral", level: "Intermediate", what: "Buy wings, sell two ATM calls. All same expiry.", when: "Stock will stay near current price through expiration.", risk: "Max loss = net debit. Max profit at center strike.", greeks: "Near-zero delta, positive gamma at wings, positive theta." }, { name: "Protective Put", tag: "Hedging", level: "Beginner", what: "Own 100 shares and buy a put for downside insurance.", when: "Bullish long-term but want protection against a sharp drop.", risk: "Max loss limited to strike minus entry price plus premium.", greeks: "Higher delta than naked stock, positive gamma, negative theta." }];
const STRAT_REC_MAP = { "Bullish-High-1-3 months": ["Bull Call Spread", "Straddle", "Butterfly"], "Bullish-Low-Short (<1 month)": ["Covered Call", "Bull Put Spread", "Bull Call Spread"], "Bullish-Neutral-1-3 months": ["Bull Call Spread", "Bull Put Spread", "Covered Call"], "Bearish-High-1-3 months": ["Bear Put Spread", "Straddle", "Bear Call Spread"], "Bearish-Low-Short (<1 month)": ["Bear Call Spread", "Bear Put Spread", "Protective Put"], "Neutral-Low-1-3 months": ["Butterfly", "Covered Call", "Bull Put Spread"], "Neutral-High-1-3 months": ["Straddle", "Strangle", "Butterfly"] };

// ── WATCHLIST PAGE ────────────────────────────────────────────────────────────
function WatchlistPage({ quotes, vix, onSelectTicker }) {
  const [watchlist, setWatchlist] = useState(["AAPL", "NVDA", "TSLA", "META", "AMZN"]); const [addTicker, setAddTicker] = useState(""); const [alerts, setAlerts] = useState({}); const [alertInput, setAlertInput] = useState({}); const [triggered, setTriggered] = useState([]);
  useEffect(() => { watchlist.forEach(sym => { const q = quotes[sym]; if (!q) return; const al = alerts[sym]; if (!al) return; if (al.above && q.price >= al.above) setTriggered(t => [...t.filter(x => x.sym !== sym || x.type !== "above"), { sym, type: "above", price: q.price, target: al.above, time: new Date().toLocaleTimeString() }]); if (al.below && q.price <= al.below) setTriggered(t => [...t.filter(x => x.sym !== sym || x.type !== "below"), { sym, type: "below", price: q.price, target: al.below, time: new Date().toLocaleTimeString() }]); }); }, [quotes]);
  const addToWatchlist = () => { const sym = addTicker.trim().toUpperCase(); if (sym && !watchlist.includes(sym)) { setWatchlist(w => [...w, sym]); setAddTicker(""); } };
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };
  return (<div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Watchlist & Alerts</div>{triggered.length > 0 && triggered.slice(-3).map((t, i) => (<div key={i} style={{ background: "#1c1a0a", border: "1px solid " + C.yellow, borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 12, color: C.yellow }}>🔔 <strong>{t.sym}</strong> hit ${t.price} — alert {t.type} ${t.target}</div><span style={{ fontSize: 10, color: C.dim }}>{t.time}</span></div>))}<div style={{ display: "flex", gap: 8, marginBottom: 16 }}><input value={addTicker} onChange={e => setAddTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && addToWatchlist()} placeholder="Add ticker (e.g. AAPL)" style={{ flex: 1, background: "#080c14", border: "1px solid " + C.border, borderRadius: 7, padding: "9px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} /><button onClick={addToWatchlist} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>Add</button></div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{watchlist.map(sym => { const q = quotes[sym]; const up = q ? q.change >= 0 : true; const al = alerts[sym] || {}; const ivEst = Math.max(8, (vix || 20) / 100 * (BETA[sym] || 1.2) * 115) * 100; return (<div key={sym} style={card}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}><div style={{ cursor: "pointer" }} onClick={() => onSelectTicker(sym)}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 16, color: C.blue }}>{sym}</span><SimTag /></div>{q ? (<div><span style={{ fontSize: 22, fontWeight: 700, color: up ? C.green : C.red }}>${q.price}</span><span style={{ fontSize: 12, color: up ? C.green : C.red, marginLeft: 8 }}>{up ? "+" : ""}{q.pct}%</span><div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>H: ${q.high} · L: ${q.low} · IV est: {ivEst.toFixed(0)}%</div></div>) : <div style={{ fontSize: 12, color: C.muted }}>Loading…</div>}</div><div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 200 }}><div style={{ fontSize: 10, color: C.dim, fontWeight: 700, letterSpacing: "0.1em" }}>PRICE ALERTS</div><div style={{ display: "flex", gap: 6 }}><input type="number" placeholder="Alert above $" value={alertInput[sym + "_above"] || ""} onChange={e => setAlertInput(a => ({ ...a, [sym + "_above"]: e.target.value }))} style={{ flex: 1, background: "#080c14", border: "1px solid " + (al.above ? C.green : C.border), borderRadius: 6, padding: "6px 8px", color: C.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} /><input type="number" placeholder="Alert below $" value={alertInput[sym + "_below"] || ""} onChange={e => setAlertInput(a => ({ ...a, [sym + "_below"]: e.target.value }))} style={{ flex: 1, background: "#080c14", border: "1px solid " + (al.below ? C.red : C.border), borderRadius: 6, padding: "6px 8px", color: C.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} /><button onClick={() => { const ab = parseFloat(alertInput[sym + "_above"]); const bw = parseFloat(alertInput[sym + "_below"]); setAlerts(a => ({ ...a, [sym]: { above: isNaN(ab) ? null : ab, below: isNaN(bw) ? null : bw } })); }} style={{ padding: "6px 10px", background: "#0f2a40", color: C.blue, border: "1px solid " + C.blue + "44", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>Set</button><button onClick={() => setWatchlist(w => w.filter(s => s !== sym))} style={{ padding: "6px 10px", background: "#3b0000", color: C.red, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>✕</button></div>{(al.above || al.below) && <div style={{ fontSize: 10, color: C.muted }}>Active: {al.above ? "↑$" + al.above : ""}{al.above && al.below ? " / " : ""}{al.below ? "↓$" + al.below : ""}</div>}</div></div></div>); })}</div></div>);
}

// ── SCANNER PAGE ──────────────────────────────────────────────────────────────
function ScannerPage({ quotes, vix, onSelectTicker }) {
  const [filter, setFilter] = useState("ALL"); const [minIVRank, setMinIVRank] = useState(0);
  const results = useMemo(() => generateScanResults(quotes, vix), [quotes, vix]);
  const signals = ["ALL", "BUY CALLS", "BUY PUTS", "SELL PREMIUM", "IRON CONDOR", "NEUTRAL"];
  const filtered = results.filter(r => { if (filter !== "ALL" && r.signal !== filter) return false; if (+r.ivRank < minIVRank) return false; return true; });
  const sigCol = { "BUY CALLS": C.green, "BUY PUTS": C.red, "SELL PREMIUM": C.purple, "IRON CONDOR": C.teal, "NEUTRAL": C.muted };
  const sigBg = { "BUY CALLS": "#052e16", "BUY PUTS": "#3b0000", "SELL PREMIUM": "#1a0f2e", "IRON CONDOR": "#0a1f1e", "NEUTRAL": "#1a2535" };
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };
  return (<div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Options Scanner</div><div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Signals based on IV rank, momentum & volatility regime</div><div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>{signals.map(s => (<button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 12px", background: filter === s ? "rgba(56,189,248,0.15)" : C.card, border: "1px solid " + (filter === s ? C.blue : C.border), borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700, color: filter === s ? C.blue : C.dim, fontFamily: "inherit" }}>{s}</button>))}<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.dim }}>IV Rank ≥<input type="number" value={minIVRank} onChange={e => setMinIVRank(+e.target.value)} style={{ width: 50, background: "#080c14", border: "1px solid " + C.border, borderRadius: 5, padding: "4px 8px", color: C.text, fontSize: 11, outline: "none", fontFamily: "inherit" }} />%</div></div><div style={card}><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}><thead><tr style={{ borderBottom: "1px solid " + C.border }}>{["Ticker", "Price", "Day %", "IV Est", "IV Rank", "Signal", "Volume", ""].map((h, i) => (<th key={i} style={{ padding: "8px 10px", color: C.dim, textAlign: i === 0 ? "left" : "right", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>))}</tr></thead><tbody>{filtered.length === 0 && <tr><td colSpan={8} style={{ padding: "28px", textAlign: "center", color: C.muted, fontSize: 12 }}>No results match current filters</td></tr>}{filtered.map((r, i) => (<tr key={i} style={{ borderBottom: "1px solid " + C.border + "18", cursor: "pointer" }} onClick={() => onSelectTicker(r.sym)}><td style={{ padding: "8px 10px", fontWeight: 700, color: C.blue }}>{r.sym}</td><td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>${r.price}</td><td style={{ padding: "8px 10px", textAlign: "right", color: r.pct >= 0 ? C.green : C.red, fontWeight: 700 }}>{r.pct >= 0 ? "+" : ""}{r.pct}%</td><td style={{ padding: "8px 10px", textAlign: "right", color: C.yellow }}>{r.iv}%</td><td style={{ padding: "8px 10px", textAlign: "right" }}><div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}><div style={{ width: 50, height: 5, background: "#1a2535", borderRadius: 3 }}><div style={{ width: r.ivRank + "%", height: 5, background: +r.ivRank > 70 ? C.red : +r.ivRank > 40 ? C.yellow : C.green, borderRadius: 3 }} /></div><span style={{ color: +r.ivRank > 70 ? C.red : +r.ivRank > 40 ? C.yellow : C.green }}>{r.ivRank}%</span></div></td><td style={{ padding: "8px 10px", textAlign: "right" }}><Badge bg={sigBg[r.signal] || "#1a2535"} color={sigCol[r.signal] || C.muted} size={9}>{r.signal}</Badge></td><td style={{ padding: "8px 10px", textAlign: "right", color: C.dim }}>{r.vol}</td><td style={{ padding: "8px 10px", textAlign: "right" }}><button onClick={e => { e.stopPropagation(); onSelectTicker(r.sym); }} style={{ padding: "3px 10px", background: "#0f2a40", color: C.blue, border: "1px solid " + C.blue + "44", borderRadius: 5, cursor: "pointer", fontSize: 9, fontFamily: "inherit" }}>Trade →</button></td></tr>))}</tbody></table></div><div style={{ fontSize: 9, color: C.muted, marginTop: 10 }}>Prices are simulated for educational/paper trading purposes. Not financial advice.</div></div></div>);
}

// ── GREEKS DASHBOARD ──────────────────────────────────────────────────────────
function GreeksDashboard({ spot, iv, vix, ticker }) {
  const [dte, setDte] = useState(30);
  const atkGreeks = useMemo(() => { if (!spot || !iv) return null; const T = dte / 365, sig = iv; return { call: BS(spot, spot, T, 0.05, sig, "call"), put: BS(spot, spot, T, 0.05, sig, "put") }; }, [spot, iv, dte]);
  const dvData = useMemo(() => { const rows = []; for (let s = spot * 0.8; s <= spot * 1.2; s += spot * 0.01) { const T = dte / 365; const c = BS(s, spot, T, 0.05, iv, "call"); const p = BS(s, spot, T, 0.05, iv, "put"); rows.push({ price: +s.toFixed(0), callDelta: +c.delta.toFixed(3), putDelta: +p.delta.toFixed(3) }); } return rows; }, [spot, iv, dte]);
  const thetaData = useMemo(() => { const rows = []; for (let d = 1; d <= 90; d += 2) { const T = d / 365; const c = BS(spot, spot, T, 0.05, iv, "call"); rows.push({ days: d, theta: +c.theta.toFixed(3), vega: +c.vega.toFixed(3) }); } return rows; }, [spot, iv]);
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };
  return (<div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}><div><div style={{ fontSize: 18, fontWeight: 700 }}>Greeks Dashboard</div><div style={{ fontSize: 12, color: C.dim }}>{ticker} · Spot ${spot} · IV {(iv * 100).toFixed(1)}%</div></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 10, color: C.dim }}>DTE:</span>{[7, 14, 30, 45, 60, 90].map(d => (<button key={d} onClick={() => setDte(d)} style={{ padding: "4px 10px", background: dte === d ? "rgba(56,189,248,0.15)" : C.card, border: "1px solid " + (dte === d ? C.blue : C.border), borderRadius: 5, cursor: "pointer", fontSize: 10, color: dte === d ? C.blue : C.dim, fontFamily: "inherit" }}>{d}d</button>))}</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>{[["Delta", atkGreeks?.call.delta.toFixed(3), C.blue, "Price sensitivity per $1 move"], ["Gamma", atkGreeks?.call.gamma.toFixed(5), C.purple, "Delta change per $1 move"], ["Theta", atkGreeks?.call.theta.toFixed(3), C.orange, "Daily time decay (ATM call)"], ["Vega", atkGreeks?.call.vega.toFixed(3), C.teal, "P&L per 1% IV move"]].map(([label, val, col, desc]) => (<div key={label} style={Object.assign({}, card, { textAlign: "center" })}><div style={{ fontSize: 24, fontWeight: 700, color: col }}>{val || "—"}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 4 }}>{label}</div><div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{desc}</div></div>))}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}><div style={card}><div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 8 }}>DELTA vs SPOT PRICE</div><ResponsiveContainer width="100%" height={180}><LineChart data={dvData} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}><CartesianGrid strokeDasharray="2 4" stroke={C.border} /><XAxis dataKey="price" stroke={C.border} tick={{ fontSize: 8, fill: C.muted }} tickFormatter={v => "$" + v} /><YAxis stroke={C.border} tick={{ fontSize: 8, fill: C.muted }} domain={[-1, 1]} /><Tooltip contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 6, fontSize: 10 }} /><ReferenceLine x={spot} stroke={C.blue} strokeDasharray="3 3" /><ReferenceLine y={0} stroke={C.border} strokeDasharray="2 2" /><Line type="monotone" dataKey="callDelta" stroke={C.green} strokeWidth={2} dot={false} name="Call Δ" /><Line type="monotone" dataKey="putDelta" stroke={C.red} strokeWidth={2} dot={false} name="Put Δ" /></LineChart></ResponsiveContainer></div><div style={card}><div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 8 }}>THETA DECAY vs TIME</div><ResponsiveContainer width="100%" height={180}><LineChart data={thetaData} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}><CartesianGrid strokeDasharray="2 4" stroke={C.border} /><XAxis dataKey="days" stroke={C.border} tick={{ fontSize: 8, fill: C.muted }} tickFormatter={v => v + "d"} /><YAxis stroke={C.border} tick={{ fontSize: 8, fill: C.muted }} /><Tooltip contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 6, fontSize: 10 }} /><Line type="monotone" dataKey="theta" stroke={C.orange} strokeWidth={2} dot={false} name="Theta" /><Line type="monotone" dataKey="vega" stroke={C.teal} strokeWidth={2} dot={false} name="Vega" /></LineChart></ResponsiveContainer></div></div><div style={card}><div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 12 }}>ATM OPTIONS GREEKS — CALLS vs PUTS</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}><thead><tr style={{ borderBottom: "1px solid " + C.border }}>{["Type", "Price", "Delta", "Gamma", "Theta/day", "Vega/1%IV"].map((h, i) => (<th key={i} style={{ padding: "6px 10px", color: C.dim, textAlign: i === 0 ? "left" : "right", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>{h}</th>))}</tr></thead><tbody>{atkGreeks && [["CALL", atkGreeks.call, C.green], ["PUT", atkGreeks.put, C.red]].map(([type, g, col]) => (<tr key={type} style={{ borderBottom: "1px solid " + C.border + "22" }}><td style={{ padding: "8px 10px", fontWeight: 700, color: col }}>{type}</td><td style={{ padding: "8px 10px", textAlign: "right" }}>${g.price.toFixed(2)}</td><td style={{ padding: "8px 10px", textAlign: "right", color: C.blue }}>{g.delta.toFixed(3)}</td><td style={{ padding: "8px 10px", textAlign: "right", color: C.purple }}>{g.gamma.toFixed(5)}</td><td style={{ padding: "8px 10px", textAlign: "right", color: C.orange }}>${g.theta.toFixed(3)}</td><td style={{ padding: "8px 10px", textAlign: "right", color: C.teal }}>${g.vega.toFixed(3)}</td></tr>))}</tbody></table></div></div></div>);
}

// ── AI ANALYSIS HUB ──────────────────────────────────────────────────────────
function AIAnalysisHub({ quotes, vix, ticker, spot, ivPct, history, up }) {
  const [aiTicker, setAiTicker] = useState(ticker);
  const [analysisType, setAnalysisType] = useState("full");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };

  const ANALYSIS_TYPES = [
    { id: "full", label: "Full Analysis", icon: "🔬", desc: "Deep dive: technicals, sentiment, risk, entry points" },
    { id: "bullbear", label: "Bull vs Bear", icon: "⚖️", desc: "Balanced case for both sides of the trade" },
    { id: "entry", label: "Entry Signals", icon: "🎯", desc: "Specific price levels, triggers and timing" },
    { id: "risk", label: "Risk Assessment", icon: "🛡️", desc: "Key risks, black swans, position sizing" },
    { id: "compare", label: "Sector Compare", icon: "📊", desc: "How this stock compares to peers" },
  ];

  const runAnalysis = async () => {
    setLoading(true); setResult(null);
    const q = quotes[aiTicker];
    const price = q ? q.price : spot;
    const pct = q ? q.pct : 0;
    const prompts = {
      full: `You are a senior equity analyst. Analyze ${aiTicker} at $${price} (${pct > 0 ? "+" : ""}${pct}% today). IV=${ivPct}%, VIX=${vix}. Provide a professional analysis. Respond ONLY in valid JSON: {"verdict":"STRONG BUY|BUY|HOLD|SELL|STRONG SELL","confidence":0-100,"priceTarget":number,"targetTimeframe":"string","summary":"2-3 sentence overview","technicalSignal":"1 sentence on price action","catalysts":["catalyst1","catalyst2","catalyst3"],"risks":["risk1","risk2","risk3"],"supportLevel":number,"resistanceLevel":number,"keyInsight":"1 bold contrarian or key insight","optionsActivity":"1 sentence on options flow implication","positionSizing":"small|medium|full","tradePlan":"1-2 sentence actionable plan"}`,
      bullbear: `Analyze ${aiTicker} at $${price}. Give both bull and bear cases. Respond ONLY in valid JSON: {"verdict":"BULL|BEAR|NEUTRAL","confidence":0-100,"bullCase":{"title":"string","points":["p1","p2","p3"],"priceTarget":number,"probability":number},"bearCase":{"title":"string","points":["p1","p2","p3"],"priceTarget":number,"probability":number},"keySwing":"what would make you change your view","verdict_summary":"1 sentence"}`,
      entry: `Analyze entry signals for ${aiTicker} at $${price}, IV=${ivPct}%, VIX=${vix}. Respond ONLY in valid JSON: {"currentSignal":"BUY|SELL|WAIT","confidence":0-100,"idealEntry":number,"stopLoss":number,"target1":number,"target2":number,"riskReward":number,"entryTriggers":["trigger1","trigger2"],"avoidIf":["condition1","condition2"],"bestTimeframe":"string","signalStrength":"Weak|Moderate|Strong","commentary":"2 sentence tactical view"}`,
      risk: `Risk assessment for ${aiTicker} at $${price}. VIX=${vix}, IV=${ivPct}%. Respond ONLY in valid JSON: {"overallRisk":"Low|Medium|High|Extreme","riskScore":0-100,"mainRisks":[{"name":"string","severity":"Low|Medium|High","description":"string"}],"blackSwans":["scenario1","scenario2"],"correlationRisk":"string","liquidityRisk":"Low|Medium|High","earningsRisk":"string","maxDrawdown":number,"hedgingSuggestion":"string","positionLimit":"% of portfolio as number"}`,
      compare: `Compare ${aiTicker} at $${price} to its sector peers. Respond ONLY in valid JSON: {"relativeStrength":"Outperformer|In-line|Underperformer","sectorRank":number,"sectorSize":number,"valuationVsPeers":"Cheap|Fair|Expensive","momentumVsPeers":"Leading|Middle|Lagging","keyDifferentiators":["d1","d2"],"peerTickers":["p1","p2","p3"],"recommendation":"string","sectorOutlook":"Bullish|Neutral|Bearish","summary":"2 sentences"}`
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: "You are a professional financial analyst. Always respond ONLY with valid JSON, no markdown, no extra text.", messages: [{ role: "user", content: prompts[analysisType] }] }) });
      const d = await res.json();
      const text = (d.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
      setResult({ type: analysisType, data: JSON.parse(text) });
    } catch (e) { setResult({ type: "error", data: { message: "Analysis failed. Check API key in app." } }); }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, system: `You are an expert trading mentor and financial analyst. The user is viewing ${aiTicker} at $${quotes[aiTicker]?.price || spot}. VIX=${vix}, IV=${ivPct}%. Give concise, actionable answers. Be direct. Format responses clearly with bullet points where helpful.`, messages: newHistory }) });
      const d = await res.json();
      const reply = (d.content?.[0]?.text || "Sorry, could not get a response.");
      setChatHistory(h => [...h, { role: "assistant", content: reply }]);
    } catch (e) { setChatHistory(h => [...h, { role: "assistant", content: "Error connecting to AI. Please try again." }]); }
    setChatLoading(false);
  };

  const QUICK_QUESTIONS = ["Should I buy this dip?", "What's the options strategy for earnings?", "Is the IV too high to buy calls?", "What's the biggest risk here?", "Compare to the sector", "Where's the next support level?"];

  const VerdictColors = { "STRONG BUY": { bg: "#052e16", col: C.green }, "BUY": { bg: "#0a2e1a", col: "#86efac" }, "HOLD": { bg: "#1c1a0a", col: C.yellow }, "BULL": { bg: "#052e16", col: C.green }, "BEAR": { bg: "#3b0000", col: C.red }, "NEUTRAL": { bg: "#1c1a0a", col: C.yellow }, "SELL": { bg: "#2a0f0f", col: "#fca5a5" }, "STRONG SELL": { bg: "#3b0000", col: C.red }, "WAIT": { bg: "#1c1a0a", col: C.yellow } };
  const vc = v => VerdictColors[v] || { bg: "#1a2535", col: C.dim };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>🤖 AI Analysis Hub</div>
          <div style={{ fontSize: 12, color: C.dim }}>Claude-powered deep market analysis & trading assistant</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={aiTicker} onChange={e => setAiTicker(e.target.value)} style={{ background: "#080c14", border: "1px solid " + C.border, borderRadius: 7, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer", fontWeight: 700 }}>
            {[ticker, ...QUICK.filter(s => s !== ticker)].map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            {[["analysis", "Analysis"], ["chat", "AI Chat"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: "8px 16px", background: activeTab === id ? "rgba(56,189,248,0.15)" : C.card, border: "1px solid " + (activeTab === id ? C.blue : C.border), borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, color: activeTab === id ? C.blue : C.dim, fontFamily: "inherit" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "analysis" && (
        <div>
          {/* Analysis type selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }} className="main-grid-4">
            {ANALYSIS_TYPES.map(a => (
              <div key={a.id} onClick={() => setAnalysisType(a.id)} style={{ ...card, cursor: "pointer", border: "1px solid " + (analysisType === a.id ? C.blue : C.border), background: analysisType === a.id ? "rgba(56,189,248,0.06)" : C.card, transition: "all .15s" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: analysisType === a.id ? C.blue : C.text, marginBottom: 3 }}>{a.label}</div>
                <div style={{ fontSize: 9, color: C.dim, lineHeight: 1.4 }}>{a.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={runAnalysis} disabled={loading} style={{ padding: "11px 28px", background: loading ? "#1a2535" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: loading ? "none" : "0 4px 14px rgba(168,85,247,0.3)" }}>
              {loading ? <><span style={{ width: 14, height: 14, border: "2px solid #fff3", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Analyzing…</> : <>🔬 Run {ANALYSIS_TYPES.find(a => a.id === analysisType)?.label}</>}
            </button>
            {result && <button onClick={() => setResult(null)} style={{ padding: "11px 18px", background: "#1a2535", color: C.dim, border: "1px solid " + C.border, borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Clear</button>}
          </div>

          {/* Results */}
          {result && result.type !== "error" && (() => {
            const { type, data } = result;
            if (type === "full") return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="main-grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ ...card, border: "1px solid " + (vc(data.verdict).col + "44") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 9, color: C.dim, marginBottom: 4 }}>AI VERDICT — {aiTicker}</div>
                        <div style={{ display: "inline-flex", padding: "4px 14px", borderRadius: 6, background: vc(data.verdict).bg, color: vc(data.verdict).col, fontWeight: 700, fontSize: 16 }}>{data.verdict}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.dim }}>CONFIDENCE</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: data.confidence > 70 ? C.green : data.confidence > 40 ? C.yellow : C.red }}>{data.confidence}%</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#1a2535", borderRadius: 3, marginBottom: 12 }}>
                      <div style={{ height: 6, borderRadius: 3, width: data.confidence + "%", background: data.confidence > 70 ? C.green : data.confidence > 40 ? C.yellow : C.red, transition: "width 1s ease" }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>{data.summary}</div>
                    <div style={{ background: "#080c14", borderRadius: 8, padding: "10px 12px", border: "1px solid " + C.border }}>
                      <div style={{ fontSize: 9, color: C.purple, fontWeight: 700, marginBottom: 4 }}>💡 KEY INSIGHT</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{data.keyInsight}</div>
                    </div>
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>PRICE LEVELS</div>
                    {[["Price Target", data.priceTarget, "$", C.green], ["Support", data.supportLevel, "$", C.teal], ["Resistance", data.resistanceLevel, "$", C.red]].map(([label, val, pre, col]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.border + "22" }}>
                        <div style={{ fontSize: 11, color: C.dim }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: col }}>{pre}{val}</div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, fontSize: 10, color: C.dim }}>⏱ {data.targetTimeframe}</div>
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>TRADE PLAN</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>{data.tradePlan}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Badge bg="#0f2340" color={C.blue}>Position: {data.positionSizing}</Badge>
                      <Badge bg="#1a2535" color={C.muted}>Options: {data.optionsActivity?.slice(0, 40)}…</Badge>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>✅ CATALYSTS</div>
                    {(data.catalysts || []).map((c, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}><span style={{ color: C.green, fontSize: 14, marginTop: 1 }}>↑</span><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{c}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>⚠️ RISKS</div>
                    {(data.risks || []).map((r, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}><span style={{ color: C.red, fontSize: 14, marginTop: 1 }}>↓</span><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{r}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>TECHNICAL SIGNAL</div>
                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{data.technicalSignal}</div>
                  </div>
                </div>
              </div>
            );
            if (type === "bullbear") return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="main-grid-2">
                {[["BULL", data.bullCase, C.green, "#052e16"], ["BEAR", data.bearCase, C.red, "#3b0000"]].map(([side, caseData, col, bg]) => (
                  <div key={side} style={{ ...card, border: "1px solid " + col + "44" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: col }}>{side === "BULL" ? "📈" : "📉"} {caseData?.title || side + " Case"}</div>
                      <Badge bg={bg} color={col}>P: {caseData?.probability}%</Badge>
                    </div>
                    <div style={{ marginBottom: 10, padding: 8, background: bg, borderRadius: 6, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: col, opacity: 0.7 }}>PRICE TARGET</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: col }}>${caseData?.priceTarget}</div>
                    </div>
                    {(caseData?.points || []).map((p, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}><span style={{ color: col, flexShrink: 0 }}>{side === "BULL" ? "✓" : "✗"}</span><div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{p}</div></div>)}
                  </div>
                ))}
                <div style={{ ...card, gridColumn: "1/-1", background: "#0a0e18", border: "1px solid " + C.purple + "44" }}>
                  <div style={{ fontSize: 9, color: C.purple, fontWeight: 700, marginBottom: 6 }}>🔄 KEY SWING FACTOR</div>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{data.keySwing}</div>
                </div>
              </div>
            );
            if (type === "entry") return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="main-grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ ...card, border: "1px solid " + (vc(data.currentSignal).col + "44") }}>
                    <div style={{ fontSize: 9, color: C.dim, marginBottom: 6 }}>CURRENT SIGNAL</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: vc(data.currentSignal).col }}>{data.currentSignal}</div>
                      <div><div style={{ fontSize: 9, color: C.dim }}>Strength</div><div style={{ fontSize: 14, fontWeight: 700, color: data.signalStrength === "Strong" ? C.green : data.signalStrength === "Moderate" ? C.yellow : C.red }}>{data.signalStrength}</div></div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>{data.commentary}</div>
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>KEY LEVELS</div>
                    {[["Ideal Entry", data.idealEntry, "$", C.blue], ["Stop Loss", data.stopLoss, "$", C.red], ["Target 1", data.target1, "$", C.green], ["Target 2", data.target2, "$", C.teal], ["Risk/Reward", "1:" + data.riskReward, "", C.yellow]].map(([label, val, pre, col]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid " + C.border + "22" }}>
                        <div style={{ fontSize: 11, color: C.dim }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{pre}{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>ENTRY TRIGGERS</div>
                    {(data.entryTriggers || []).map((t, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: C.green }}>▶</span><div style={{ fontSize: 12, color: "#94a3b8" }}>{t}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>AVOID IF…</div>
                    {(data.avoidIf || []).map((t, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: C.red }}>✗</span><div style={{ fontSize: 12, color: "#94a3b8" }}>{t}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, marginBottom: 6 }}>BEST TIMEFRAME</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{data.bestTimeframe}</div>
                  </div>
                </div>
              </div>
            );
            if (type === "risk") return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="main-grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ ...card, border: "1px solid " + (data.overallRisk === "High" || data.overallRisk === "Extreme" ? C.red : data.overallRisk === "Medium" ? C.yellow : C.green) + "44" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div><div style={{ fontSize: 9, color: C.dim, marginBottom: 4 }}>OVERALL RISK</div><div style={{ fontSize: 20, fontWeight: 700, color: data.overallRisk === "High" || data.overallRisk === "Extreme" ? C.red : data.overallRisk === "Medium" ? C.yellow : C.green }}>{data.overallRisk}</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: C.dim }}>RISK SCORE</div><div style={{ fontSize: 28, fontWeight: 700, color: data.riskScore > 70 ? C.red : data.riskScore > 40 ? C.yellow : C.green }}>{data.riskScore}</div></div>
                    </div>
                    <div style={{ height: 6, background: "#1a2535", borderRadius: 3 }}><div style={{ height: 6, borderRadius: 3, width: data.riskScore + "%", background: data.riskScore > 70 ? C.red : data.riskScore > 40 ? C.yellow : C.green }} /></div>
                  </div>
                  {(data.mainRisks || []).map((r, i) => (
                    <div key={i} style={{ ...card, borderLeft: "3px solid " + (r.severity === "High" ? C.red : r.severity === "Medium" ? C.yellow : C.green) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div><Badge bg={r.severity === "High" ? "#3b0000" : r.severity === "Medium" ? "#1c1a0a" : "#052e16"} color={r.severity === "High" ? C.red : r.severity === "Medium" ? C.yellow : C.green}>{r.severity}</Badge></div>
                      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{r.description}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={card}><div style={{ fontSize: 9, color: C.orange, fontWeight: 700, marginBottom: 8 }}>⚡ BLACK SWAN SCENARIOS</div>{(data.blackSwans || []).map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: C.orange }}>!</span><div style={{ fontSize: 12, color: "#94a3b8" }}>{s}</div></div>)}</div>
                  <div style={card}>{[["Max Drawdown", "-" + data.maxDrawdown + "%", C.red], ["Position Limit", data.positionLimit + "%", C.yellow], ["Liquidity Risk", data.liquidityRisk, C.blue]].map(([label, val, col]) => (<div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border + "22" }}><div style={{ fontSize: 11, color: C.dim }}>{label}</div><div style={{ fontSize: 13, fontWeight: 700, color: col }}>{val}</div></div>))}</div>
                  <div style={{ ...card, background: "#0a1220", border: "1px solid " + C.teal + "44" }}><div style={{ fontSize: 9, color: C.teal, fontWeight: 700, marginBottom: 6 }}>🛡️ HEDGING SUGGESTION</div><div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{data.hedgingSuggestion}</div></div>
                </div>
              </div>
            );
            if (type === "compare") return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="main-grid-2">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={card}>
                    <div style={{ fontSize: 9, color: C.dim, marginBottom: 10 }}>RELATIVE PERFORMANCE</div>
                    {[["Relative Strength", data.relativeStrength, data.relativeStrength === "Outperformer" ? C.green : data.relativeStrength === "Underperformer" ? C.red : C.yellow], ["Momentum", data.momentumVsPeers, data.momentumVsPeers === "Leading" ? C.green : data.momentumVsPeers === "Lagging" ? C.red : C.yellow], ["Valuation", data.valuationVsPeers, data.valuationVsPeers === "Cheap" ? C.green : data.valuationVsPeers === "Expensive" ? C.red : C.yellow], ["Sector Outlook", data.sectorOutlook, data.sectorOutlook === "Bullish" ? C.green : data.sectorOutlook === "Bearish" ? C.red : C.yellow]].map(([label, val, col]) => (<div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.border + "22" }}><div style={{ fontSize: 11, color: C.dim }}>{label}</div><div style={{ fontSize: 13, fontWeight: 700, color: col }}>{val}</div></div>))}
                    <div style={{ marginTop: 8, fontSize: 9, color: C.dim }}>Rank #{data.sectorRank} of {data.sectorSize} in sector</div>
                  </div>
                  <div style={card}><div style={{ fontSize: 9, color: C.blue, fontWeight: 700, marginBottom: 8 }}>PEER TICKERS</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{(data.peerTickers || []).map(p => <Badge key={p} bg="#0f2340" color={C.blue}>{p}</Badge>)}</div></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={card}><div style={{ fontSize: 9, color: C.green, fontWeight: 700, marginBottom: 8 }}>KEY DIFFERENTIATORS</div>{(data.keyDifferentiators || []).map((d, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}><span style={{ color: C.green }}>★</span><div style={{ fontSize: 12, color: "#94a3b8" }}>{d}</div></div>)}</div>
                  <div style={card}><div style={{ fontSize: 9, color: C.dim, fontWeight: 700, marginBottom: 6 }}>RECOMMENDATION</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>{data.recommendation}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{data.summary}</div></div>
                </div>
              </div>
            );
            return null;
          })()}
          {result && result.type === "error" && <div style={{ ...card, border: "1px solid " + C.red + "44", color: C.red, fontSize: 13 }}>{result.data.message}</div>}
          {!result && !loading && (
            <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 48 }}>🤖</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dim }}>Select analysis type and click Run</div>
              <div style={{ fontSize: 11, color: C.muted }}>Powered by Claude AI</div>
            </div>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }} className="main-grid-2">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: 420, maxHeight: 500, overflow: "hidden" }}>
              <div style={{ fontSize: 9, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid " + C.border }}>🤖 AI TRADING ASSISTANT — {aiTicker}</div>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
                {chatHistory.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 8, color: C.muted }}>
                    <div style={{ fontSize: 32 }}>💬</div>
                    <div style={{ fontSize: 12, textAlign: "center" }}>Ask me anything about {aiTicker} or trading in general</div>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 2 }}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{m.role === "user" ? "You" : "Claude AI"}</div>
                    <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", background: m.role === "user" ? "rgba(56,189,248,0.15)" : C.card2, border: "1px solid " + (m.role === "user" ? C.blue + "44" : C.border), fontSize: 12, color: m.role === "user" ? C.blue : C.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.content}</div>
                  </div>
                ))}
                {chatLoading && <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.muted, fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, animation: "pulse 1s infinite" }} />Claude is thinking…</div>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid " + C.border }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()} placeholder={`Ask about ${aiTicker}…`} style={{ flex: 1, background: "#080c14", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ padding: "10px 16px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit", opacity: chatLoading || !chatInput.trim() ? 0.5 : 1 }}>Send</button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={card}>
              <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>QUICK QUESTIONS</div>
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => { setChatInput(q); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", background: "#080c14", border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer", fontSize: 11, color: C.dim, fontFamily: "inherit", marginBottom: 6, transition: "all .15s" }} onMouseEnter={e => { e.target.style.borderColor = C.purple; e.target.style.color = C.text; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.dim; }}>
                  💬 {q}
                </button>
              ))}
            </div>
            <div style={card}>
              <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, marginBottom: 8 }}>CONTEXT</div>
              {[["Ticker", aiTicker], [`Price`, "$" + (quotes[aiTicker]?.price || spot)], ["IV", ivPct + "%"], ["VIX", vix]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + C.border + "22", fontSize: 11 }}>
                  <span style={{ color: C.dim }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ACADEMY DATA ──────────────────────────────────────────────────────────────
const ACADEMY_COURSES = [
  {
    id: "stock_basics", title: "Stock Market Basics", emoji: "📈", color: "#4ade80", darkBg: "#052e16",
    level: "Beginner", totalLessons: 6, xp: 300,
    desc: "Everything you need to know before your first trade.",
    lessons: [
      {
        id: "what_stocks", title: "What Are Stocks?", duration: "8 min", videoId: "p7HKvqRI_Bo",
        summary: "Stocks represent ownership in a company. When you buy a share, you become a part-owner and benefit as the company grows.",
        keyPoints: ["A share = fractional ownership of a company", "Stock price moves with supply & demand", "Companies list on exchanges (NSE, BSE, NYSE) to raise capital", "You profit via price appreciation or dividends"],
        analogy: "Think of a company like a pizza. Stocks are slices — when the pizza grows, every slice is worth more.",
        quiz: { q: "What does owning a stock represent?", opts: ["A loan to a company", "Ownership in a company", "A bond contract", "A futures contract"], ans: 1, exp: "A stock represents fractional ownership. You are a part-owner of the business and share in its profits and losses." }
      },
      {
        id: "how_markets_work", title: "How Markets Work", duration: "10 min", videoId: "lNdOtlgrH-4",
        summary: "Stock exchanges connect buyers and sellers. Prices move when the balance of buyers and sellers shifts.",
        keyPoints: ["Stock exchanges: NSE, BSE, NYSE, NASDAQ", "Market hours: 9:15 AM – 3:30 PM IST", "Bid = buyers offer, Ask = sellers want", "Price discovery happens in real time via order matching"],
        analogy: "A stock exchange is like a massive auction house — millions of auctions happening every second.",
        quiz: { q: "What does the 'Bid' price represent?", opts: ["The price sellers want", "The price buyers are willing to pay", "The last traded price", "The exchange fee"], ans: 1, exp: "Bid is the highest price a buyer is currently willing to pay. Ask is the lowest a seller will accept. Trades happen when they meet." }
      },
      {
        id: "reading_charts", title: "Reading Candlestick Charts", duration: "12 min", videoId: "qzRhGOMPdoQ",
        summary: "Candlestick charts are the universal language of trading. Each candle tells the story of one time period.",
        keyPoints: ["Green candle = price closed HIGHER than open (bullish)", "Red candle = price closed LOWER than open (bearish)", "Body = range between open and close", "Wick/Shadow = high and low extremes", "Longer wicks = more indecision or rejection"],
        analogy: "A candle is like a daily news report — it tells you where the stock started, where it went, and where it ended up.",
        quiz: { q: "What does a long upper wick on a candlestick mean?", opts: ["Strong buying pressure", "Price attempted highs but was rejected", "The stock hit its 52-week high", "Low trading volume"], ans: 1, exp: "A long upper wick means buyers pushed price up, but sellers drove it back down — showing rejection at higher prices." }
      },
      {
        id: "support_resistance", title: "Support & Resistance", duration: "9 min", videoId: "6vELVn0-4bE",
        summary: "Support and resistance are price floors and ceilings — the most fundamental concepts in technical analysis.",
        keyPoints: ["Support = price floor where buyers tend to step in", "Resistance = price ceiling where sellers dominate", "Once broken, support becomes resistance (and vice versa)", "More tests of a level = stronger the level", "Round numbers often act as psychological levels"],
        analogy: "Support is the floor of a room — price bounces off it. Resistance is the ceiling — price struggles to break through.",
        quiz: { q: "When a resistance level is broken, what often happens?", opts: ["It disappears", "It becomes a new support level", "Price immediately reverses", "Volume drops to zero"], ans: 1, exp: "When resistance is broken, buyers overcome sellers. The former resistance often flips to a support zone — key for finding re-entry points." }
      },
      {
        id: "bull_bear", title: "Bull & Bear Markets", duration: "7 min", videoId: "yxNbVRMz-7E",
        summary: "Understanding market cycles helps you position on the right side of the trend.",
        keyPoints: ["Bull Market: 20%+ rise from recent lows — optimism, rising economy", "Bear Market: 20%+ decline from recent highs — fear, recession", "Correction: 10-20% pullback (normal, temporary)", "Cycle: Accumulation → Markup → Distribution → Markdown"],
        analogy: "A bull thrusts horns upward = rising prices. A bear swipes paws downward = falling prices.",
        quiz: { q: "A 'correction' is defined as a decline of:", opts: ["5-10%", "10-20%", "20-30%", "More than 40%"], ans: 1, exp: "A correction is a 10-20% decline from recent highs. It's normal and healthy. Below 20% sustained = bear market." }
      },
      {
        id: "fundamental_analysis", title: "Fundamental Analysis", duration: "11 min", videoId: "_YG5bpSBB7E",
        summary: "Fundamental analysis values a company based on its actual financial health, not just price movements.",
        keyPoints: ["P/E Ratio = Price ÷ Earnings (higher = more expensive)", "EPS = Earnings Per Share (profitability)", "Revenue growth = how fast the company expands", "Debt-to-Equity = financial leverage (lower = safer)", "Free Cash Flow = actual cash generated by the business"],
        analogy: "Buying a stock without fundamentals is like buying a house without checking if it has a foundation.",
        quiz: { q: "A low P/E ratio generally suggests a stock is:", opts: ["Overvalued", "Undervalued or cheap", "High-risk", "About to crash"], ans: 1, exp: "A low P/E means you're paying less per dollar of earnings. Always compare within the same sector — P/E varies by industry." }
      },
    ]
  },
  {
    id: "options_fundamentals", title: "Options Fundamentals", emoji: "⚙️", color: "#38bdf8", darkBg: "#0c2a47",
    level: "Beginner", totalLessons: 7, xp: 450,
    desc: "Calls, puts, strikes, premiums — completely demystified.",
    lessons: [
      {
        id: "what_options", title: "What Are Options?", duration: "10 min", videoId: "4HMm6mBvGKE",
        summary: "Options give you the RIGHT but not OBLIGATION to buy or sell at a set price. That flexibility is what makes them powerful.",
        keyPoints: ["Options are contracts, not ownership", "Call = right to BUY at strike price", "Put = right to SELL at strike price", "Premium = the price you pay for this right", "Max loss for buyers = premium paid only"],
        analogy: "Buying an option is like paying a deposit to reserve a house at today's price. If prices rise, you profit. If not, you only lose the small deposit.",
        quiz: { q: "What is the maximum loss when you BUY a call option?", opts: ["Unlimited", "The stock price", "The premium paid", "The strike price"], ans: 2, exp: "When buying options, your maximum loss is always limited to the premium paid — a key advantage over other leveraged instruments." }
      },
      {
        id: "calls_deep", title: "Call Options Deep Dive", duration: "12 min", videoId: "7PM4rNDr4oI",
        summary: "Calls give you the right to BUY shares at the strike price. You profit when the stock rises above your breakeven.",
        keyPoints: ["Breakeven = Strike Price + Premium Paid", "Max profit: unlimited (stock can rise infinitely)", "Max loss: premium paid (if stock stays below strike)", "ITM call: stock price > strike", "OTM call: stock price < strike"],
        analogy: "A call option is like a coupon that lets you buy Apple at $200 no matter what the current market price is.",
        quiz: { q: "If you buy a $150 call for $5 premium, your breakeven is:", opts: ["$145", "$150", "$155", "$160"], ans: 2, exp: "Breakeven = Strike ($150) + Premium ($5) = $155. Below $155 at expiry you lose. Above $155 you profit." }
      },
      {
        id: "puts_deep", title: "Put Options Deep Dive", duration: "12 min", videoId: "7PM4rNDr4oI",
        summary: "Puts give you the right to SELL shares at the strike price — the cleanest way to profit from falling prices with limited risk.",
        keyPoints: ["Breakeven = Strike Price - Premium Paid", "Max profit: strike - premium (if stock goes to zero)", "Max loss: premium paid (if stock rises above strike)", "ITM put: stock price < strike", "Common use: portfolio insurance / hedging"],
        analogy: "A put option is like insurance on your car — pay a small premium so if something bad happens, your downside is protected.",
        quiz: { q: "When does a put option become profitable?", opts: ["When stock rises above the strike", "When stock falls below the breakeven", "When volatility decreases", "When time passes"], ans: 1, exp: "A put profits when the stock falls below breakeven (Strike - Premium). The further the stock falls, the more you profit." }
      },
      {
        id: "options_pricing", title: "How Options Are Priced", duration: "14 min", videoId: "9YYB2mImIp8",
        summary: "Option pricing combines intrinsic value (real worth now) and time value (hope premium) to make the total premium.",
        keyPoints: ["Premium = Intrinsic Value + Time Value", "Intrinsic Value: how much the option is worth if exercised now", "Time Value: premium for the possibility of moving your way", "Time value → zero as expiry approaches", "Higher volatility = higher premiums"],
        analogy: "An option price is like a concert ticket. Face value (intrinsic) + scalper premium (time value). As the date approaches, the scalper premium drops.",
        quiz: { q: "What is Intrinsic Value of a $100 call when stock is at $110?", opts: ["$0", "$5", "$10", "$110"], ans: 2, exp: "Intrinsic Value = Stock Price - Strike = $110 - $100 = $10. The option is $10 'in the money'." }
      },
      {
        id: "expiry_dte", title: "Expiration & DTE", duration: "8 min", videoId: "fYbzElCXk5c",
        summary: "Every option has an expiry. As that date approaches, time value melts away — this is called Theta decay.",
        keyPoints: ["DTE = Days To Expiration", "As DTE → 0, time value → 0 (theta decay accelerates)", "0DTE options: highest risk/reward, expire same day", "LEAPS: options with 1-2+ year expiry", "ATM options lose time value fastest near expiry"],
        analogy: "A melting ice cube — it melts slowly at first, then faster and faster as it gets smaller. That's theta decay.",
        quiz: { q: "Which option loses time value the FASTEST?", opts: ["A 6-month option", "A 3-month option", "A 7-day option", "A 2-year LEAP"], ans: 2, exp: "Theta decay accelerates exponentially near expiry. A 7-day option loses value much faster per day than a 6-month option." }
      },
      {
        id: "itm_atm_otm", title: "ITM, ATM & OTM Explained", duration: "9 min", videoId: "a4GUxG2KcnQ",
        summary: "The relationship between strike price and current stock price determines whether an option is In, At, or Out of the money.",
        keyPoints: ["ITM Call: Stock > Strike → has intrinsic value", "ATM: Stock ≈ Strike → highest time value, most liquid", "OTM Call: Stock < Strike → pure time value, cheap but risky", "Delta approximates probability of expiring ITM", "ATM options have ≈ 0.50 delta"],
        analogy: "ITM = you're winning the bet. ATM = even odds. OTM = you need a big move to win.",
        quiz: { q: "An ATM call option has approximately what delta?", opts: ["0.10", "0.25", "0.50", "0.90"], ans: 2, exp: "ATM options have ≈ 0.50 delta — roughly 50/50 chance of expiring in the money. Delta also measures how much the option moves per $1 stock move." }
      },
      {
        id: "options_chain", title: "Reading an Options Chain", duration: "11 min", videoId: "uQLMjRDMuFc",
        summary: "The options chain is your command center — all available strikes, expirations, and Greeks in one view.",
        keyPoints: ["Calls on left, Puts on right (typically)", "Columns: Bid, Ask, Last, IV, Delta, Gamma, Theta, Vega, OI, Volume", "Open Interest (OI) = total outstanding contracts", "High OI = liquid strike, easy to enter/exit", "Green highlight = ITM, no highlight = OTM"],
        analogy: "An options chain is like a restaurant menu — all your choices with prices, but you need to know what you're ordering.",
        quiz: { q: "What does high Open Interest (OI) tell you about a strike?", opts: ["It will definitely go up", "It is very liquid and easy to trade", "It is overpriced", "It expires soon"], ans: 1, exp: "High OI means many contracts are open at that strike — more buyers and sellers = tighter bid-ask spread = easier and cheaper to trade." }
      },
    ]
  },
  {
    id: "greeks_mastery", title: "Mastering the Greeks", emoji: "🇬🇷", color: "#a78bfa", darkBg: "#1a0f2e",
    level: "Intermediate", totalLessons: 5, xp: 500,
    desc: "Delta, Theta, Vega, Gamma — the four forces that move option prices.",
    lessons: [
      {
        id: "delta", title: "Delta — The Direction Greek", duration: "11 min", videoId: "OkNLs6Nd3FQ",
        summary: "Delta measures how much an option's price changes for every $1 move in the underlying stock.",
        keyPoints: ["Call delta: 0 to +1 (moves with stock)", "Put delta: -1 to 0 (moves against stock)", "ATM ≈ 0.50 | Deep ITM ≈ 0.90-1.0 | Far OTM ≈ 0.05-0.15", "Delta as probability: 0.70 delta ≈ 70% chance of expiring ITM", "Delta neutral: combine positions to have net zero directional exposure"],
        analogy: "Delta is like a gear ratio. Low delta (OTM) = pedaling hard, moving slowly. High delta (ITM) = every pedal stroke moves you fully.",
        quiz: { q: "If you own a call with 0.60 delta and stock rises $2, the option gains approximately:", opts: ["$0.60", "$1.20", "$2.00", "$0.30"], ans: 1, exp: "Delta × Stock Move = Option Move. 0.60 × $2 = $1.20 per share. For one contract (100 shares) = $120 total gain." }
      },
      {
        id: "theta", title: "Theta — Time is Your Enemy", duration: "10 min", videoId: "7PM4rNDr4oI",
        summary: "Theta is the daily cost of holding an option. Every day that passes, your option loses value even if the stock doesn't move.",
        keyPoints: ["Theta = daily time decay (always negative for buyers)", "Theta accelerates exponentially near expiry", "ATM options have the highest theta decay", "Theta benefits SELLERS — they collect decay daily", "Rule: theta doubles in the last 30 days before expiry"],
        analogy: "Theta is like an ice cream melting on a hot day. It melts slowly at first, then faster and faster. That's your option's time value disappearing.",
        quiz: { q: "If your option has -$0.05 theta, what happens overnight?", opts: ["Gains $5", "Loses $5", "Stays the same", "Expires"], ans: 1, exp: "Theta = -$0.05 per share per day. On a standard 100-share contract = $5 lost per night from time decay alone, regardless of stock movement." }
      },
      {
        id: "vega", title: "Vega — Volatility is Power", duration: "10 min", videoId: "KAH3bBKqLqM",
        summary: "Vega measures how much an option's price changes when implied volatility (IV) changes by 1%.",
        keyPoints: ["Long options have POSITIVE vega (benefit from rising IV)", "Short options have NEGATIVE vega (hurt by rising IV)", "ATM options have highest vega exposure", "IV crush: after earnings, IV collapses, destroying option premiums", "Buy options before expected IV expansion, sell before IV crush"],
        analogy: "Vega is like a weather forecast premium. Storm coming = umbrella prices rise. Storm passes = umbrella prices crash. That's IV crush.",
        quiz: { q: "You buy a call before earnings. Earnings are great, stock rises 5%, but your call LOSES value. Why?", opts: ["Wrong strike bought", "IV crush — implied volatility collapsed after earnings", "Broker error", "The call expired"], ans: 1, exp: "IV crush is the most common beginner trap. Before earnings, IV is inflated. After (good or bad), IV collapses, wiping out the fear premium in your option." }
      },
      {
        id: "gamma", title: "Gamma — The Accelerator", duration: "9 min", videoId: "9YYB2mImIp8",
        summary: "Gamma is the rate of change of Delta. It tells you how fast your delta — and therefore profits — will accelerate.",
        keyPoints: ["Gamma = how fast delta changes per $1 stock move", "High gamma near expiry ATM options", "Long options = positive gamma (delta accelerates your way)", "Short options = negative gamma (delta accelerates against you)", "0DTE options have explosive gamma — small moves = big P&L swings"],
        analogy: "If delta is speed, gamma is acceleration. High-gamma positions can go from 0 to 100 very quickly — in both directions.",
        quiz: { q: "Where is Gamma highest?", opts: ["Deep ITM options", "Far OTM options", "ATM options close to expiry", "LEAPS (long-dated options)"], ans: 2, exp: "Gamma peaks at ATM options with little time left. This is why 0DTE trading is so explosive — small stock moves create massive delta shifts." }
      },
      {
        id: "rho_combined", title: "Putting the Greeks Together", duration: "12 min", videoId: "4HMm6mBvGKE",
        summary: "Combine all four Greeks to read a position holistically and manage risk like a professional.",
        keyPoints: ["Rho = interest rate sensitivity (less important for short-dated options)", "Read a position: check delta (direction), theta (daily cost), vega (IV risk), gamma (acceleration)", "Net Greeks show your total risk profile across all positions", "Short Iron Condor = negative delta, positive theta, negative vega, negative gamma"],
        analogy: "Greeks are like a car dashboard — delta is steering, theta is fuel consumption, vega is weather sensitivity, gamma is acceleration.",
        quiz: { q: "A position with positive theta and negative vega benefits from:", opts: ["Big stock moves and rising IV", "Time passing and falling IV", "Rising stock prices only", "High volume trading days"], ans: 1, exp: "Positive theta = you earn money as time passes. Negative vega = you profit when IV drops. This is the profile of short premium strategies like Iron Condors." }
      },
    ]
  },
  {
    id: "strategies_course", title: "Options Strategies A-Z", emoji: "♟️", color: "#fbbf24", darkBg: "#1c1a0a",
    level: "Intermediate", totalLessons: 8, xp: 600,
    desc: "From simple calls to iron condors — when and how to use each strategy.",
    lessons: [
      {
        id: "covered_call", title: "Covered Call — Income Strategy", duration: "11 min", videoId: "OkNLs6Nd3FQ",
        summary: "Own 100 shares and sell a call against them. Collect premium every month as income.",
        keyPoints: ["Requirements: own 100 shares", "Sell OTM call above current price to collect premium", "Max profit: premium + stock gains up to strike", "Max loss: stock drops (premium provides small buffer)", "Typical return: 1-3% per month in premium income"],
        analogy: "Like renting out a room in your house. You still own the house (stock) but collect rent (premium) every month.",
        quiz: { q: "In a covered call, you sell a call when you:", opts: ["Expect a massive rally", "Already own 100 shares", "Are bearish", "Want unlimited profit potential"], ans: 1, exp: "Covered call requires owning 100 shares. You sell a call against that position to generate monthly income, capping your upside at the strike." }
      },
      {
        id: "protective_put", title: "Protective Put — Portfolio Insurance", duration: "9 min", videoId: "7PM4rNDr4oI",
        summary: "Buy a put option against shares you own. Guarantees a minimum selling price — perfect for uncertain markets.",
        keyPoints: ["Buy a put below current price as insurance", "Max loss: limited to (entry price - strike) + premium", "Max profit: unlimited upside from stock rising", "Cost: ongoing premium (like insurance premium)", "Best before major events: elections, earnings, economic data"],
        analogy: "Car insurance for your stocks. Pay a small premium so if the market crashes, your losses are capped.",
        quiz: { q: "What does a Protective Put guarantee?", opts: ["A profit on your stock", "A maximum selling price for your stock", "A minimum selling price for your stock", "A fixed dividend"], ans: 2, exp: "A protective put guarantees you can sell your stock at the strike price, even if it crashes to zero — setting a floor on your losses." }
      },
      {
        id: "bull_call_spread", title: "Bull Call Spread — Cheap Bullish Bet", duration: "12 min", videoId: "_YG5bpSBB7E",
        summary: "Buy a lower-strike call, sell a higher-strike call. Reduces cost vs naked call, but caps your upside.",
        keyPoints: ["Structure: Buy Call (lower strike) + Sell Call (higher strike)", "Max profit: spread width - net debit paid", "Max loss: net debit paid", "Breakeven: lower strike + net debit", "Best for: moderately bullish, want to reduce cost"],
        analogy: "Like a round-trip flight within a city range — you're bullish but within limits, making the ticket cheaper.",
        quiz: { q: "A Bull Call Spread reduces cost compared to a naked call because:", opts: ["You buy fewer contracts", "The sold call's premium offsets the bought call cost", "You use less margin", "The spread expires faster"], ans: 1, exp: "Selling the upper call collects premium that partially funds the lower call purchase, reducing net cost but capping maximum profit at the spread width." }
      },
      {
        id: "bear_put_spread", title: "Bear Put Spread — Cheap Bearish Bet", duration: "10 min", videoId: "p7HKvqRI_Bo",
        summary: "Buy a higher-strike put, sell a lower-strike put. Cost-effective way to bet on a stock decline.",
        keyPoints: ["Structure: Buy Put (higher strike) + Sell Put (lower strike)", "Max profit: spread width - net debit", "Max loss: net debit paid", "Breakeven: higher strike - net debit", "Lower cost than buying a naked put"],
        analogy: "The bear version of a bull call spread — you define both profit and loss before entering.",
        quiz: { q: "In a Bear Put Spread, you BUY the:", opts: ["Lower strike put", "Higher strike put", "Call option", "ATM put"], ans: 1, exp: "You buy the higher strike put (closer to ATM, more delta) and sell the lower strike put to reduce cost." }
      },
      {
        id: "straddle_strangle", title: "Straddle & Strangle — Volatility Plays", duration: "13 min", videoId: "lNdOtlgrH-4",
        summary: "When you don't know direction but know a big move is coming — buy both a call and put.",
        keyPoints: ["Straddle: buy ATM call + ATM put (same strike)", "Strangle: buy OTM call + OTM put (cheaper, needs bigger move)", "Profit when stock moves big in EITHER direction", "Risk: stock stays flat → lose both premiums", "Best before major catalysts (earnings, FDA, elections)", "IV crush danger: buy BEFORE IV expansion, not after"],
        analogy: "Straddle = betting both teams will score heavily. Strangle = same bet but at more extreme scores at a lower ticket price.",
        quiz: { q: "A Straddle loses maximum value when:", opts: ["The stock makes a huge move up", "The stock makes a huge move down", "The stock stays near the strike at expiry", "IV spikes dramatically"], ans: 2, exp: "Maximum loss occurs when the stock closes exactly at the strike at expiry — both call and put expire worthless." }
      },
      {
        id: "iron_condor", title: "Iron Condor — Range-Bound Income", duration: "14 min", videoId: "qzRhGOMPdoQ",
        summary: "Sell a call spread + sell a put spread. Collect premium when you expect the stock to stay in a defined range.",
        keyPoints: ["Structure: Sell OTM call spread + Sell OTM put spread (4 legs)", "Max profit: net credit received (stock stays between short strikes)", "Max loss: spread width - credit (stock breaks out of range)", "Best for: low volatility, range-bound stocks", "Net theta positive, vega negative, near-zero delta"],
        analogy: "Iron Condor is like renting a property within town limits — you profit as long as the tenant (stock) stays within city limits.",
        quiz: { q: "An Iron Condor profits when:", opts: ["The stock makes a massive move", "The stock stays within the range of short strikes", "IV increases dramatically", "A dividend is paid"], ans: 1, exp: "Max profit when the stock closes between the two short strikes at expiry — all four legs expire worthless and you keep the credit." }
      },
      {
        id: "butterfly", title: "Butterfly — Pinpoint Precision", duration: "11 min", videoId: "4HMm6mBvGKE",
        summary: "Maximum profit when the stock lands exactly at your target strike. Very cheap, very precise.",
        keyPoints: ["Structure: Buy 1 low strike + Sell 2 ATM + Buy 1 high strike call", "Max profit: at center strike at expiry", "Max loss: net debit (wings protect you)", "Very low cost, high reward-to-risk ratio", "Best when you have a strong price target"],
        analogy: "A butterfly is an archer's strategy — aiming for a bullseye. Huge payoff if right, small loss if off target.",
        quiz: { q: "A Butterfly Spread's maximum profit occurs when:", opts: ["Far above the center strike", "Far below the center strike", "At the center strike at expiry", "Stock is highly volatile"], ans: 2, exp: "Maximum profit when the stock closes at the center (middle) strike at expiry. The further away, the less you profit." }
      },
      {
        id: "calendar_spread", title: "Calendar Spread — Time Arbitrage", duration: "12 min", videoId: "uQLMjRDMuFc",
        summary: "Sell a near-term option, buy a longer-term option at the same strike. Profit from the difference in time decay rates.",
        keyPoints: ["Structure: Sell near-term ATM option + Buy same-strike further-dated option", "Profit from faster theta decay on the short option", "Max profit: near-term expires worthless, back-month retains value", "Risk: big move in either direction hurts the trade", "Can roll the short option month after month for recurring income"],
        analogy: "Like leasing your car month-by-month (short option) while owning it long-term (long option). The monthly lease pays your ownership costs.",
        quiz: { q: "A calendar spread benefits from which phenomenon?", opts: ["Large stock moves", "Faster time decay on near-term options", "Rising implied volatility", "Higher stock prices"], ans: 1, exp: "Near-term options decay faster than longer-dated options. You sell that faster decay while holding the slower-decaying longer option." }
      },
    ]
  },
  {
    id: "risk_psychology", title: "Risk & Trading Psychology", emoji: "🧠", color: "#fb923c", darkBg: "#1c0a00",
    level: "Beginner", totalLessons: 5, xp: 350,
    desc: "The mental game — why most traders fail and how to stay disciplined.",
    lessons: [
      {
        id: "position_sizing", title: "Position Sizing — The #1 Rule", duration: "9 min", videoId: "9YYB2mImIp8",
        summary: "How much you put in each trade determines whether you survive long enough to profit.",
        keyPoints: ["The 2% Rule: never risk more than 2% of total capital per trade", "With ₹1,00,000: max risk per trade = ₹2,000", "Position size = Risk Amount ÷ (Entry - Stop Loss)", "Professionals risk 0.5-1% per trade", "Consistent sizing = consistent results"],
        analogy: "Your capital is like oxygen tanks for deep-sea diving. Risk too much per dive and you run out before surfacing.",
        quiz: { q: "Using the 2% rule with ₹5,00,000 capital, your max risk per trade is:", opts: ["₹500", "₹1,000", "₹10,000", "₹50,000"], ans: 2, exp: "2% of ₹5,00,000 = ₹10,000. This is the maximum you should be willing to lose on any single trade." }
      },
      {
        id: "stop_losses", title: "Stop Losses — Protecting Capital", duration: "8 min", videoId: "fYbzElCXk5c",
        summary: "A stop loss is a pre-planned exit when a trade goes wrong. Never enter without knowing exactly where you'll exit.",
        keyPoints: ["Set stop BEFORE entering, not after", "Technical stop: below support / above resistance", "Percentage stop: 5-8% below entry for stocks", "Options stop: close if option loses 50% of value", "Trailing stop: moves with price to lock in profits", "Mental stops almost never work — use hard stops"],
        analogy: "A stop loss is a seat belt. You don't put it on during the crash — you wear it before you start driving.",
        quiz: { q: "When should you set your stop loss?", opts: ["After the trade starts losing", "When you feel nervous", "Before you enter the trade", "When you're profitable"], ans: 2, exp: "Always set your stop loss BEFORE entering. This removes emotion from the exit decision and ensures you know your maximum loss upfront." }
      },
      {
        id: "trading_psychology", title: "Trading Psychology & Biases", duration: "13 min", videoId: "6vELVn0-4bE",
        summary: "Your biggest enemy in trading is not the market — it's yourself. Understanding cognitive biases is as important as technical analysis.",
        keyPoints: ["Loss Aversion: losses feel 2× worse than equal gains feel good", "Overconfidence: after wins, traders take excessive risk", "FOMO: fear of missing out causes chasing highs", "Revenge Trading: trying to make back losses quickly", "Confirmation Bias: only seeing data that supports your view", "Solution: journaling, rules-based trading, position limits"],
        analogy: "Trading without psychology awareness is like driving with your eyes closed — you might get lucky briefly, but eventually you crash.",
        quiz: { q: "Loss aversion means traders typically feel losses:", opts: ["The same as gains", "Half as bad as gains feel good", "Twice as bad as equal gains feel good", "Only if they are large losses"], ans: 2, exp: "Research shows losses feel approximately 2× as painful as equivalent gains feel pleasurable — causing traders to hold losers too long and cut winners too early." }
      },
      {
        id: "trading_journal", title: "The Trading Journal", duration: "7 min", videoId: "yxNbVRMz-7E",
        summary: "Professional traders journal every trade. It's the single best tool for improving performance over time.",
        keyPoints: ["Record: date, ticker, setup reason, entry/exit, P&L, emotions", "Review weekly: find patterns in wins AND losses", "Track win rate, average win vs average loss", "Identify your best setups and worst habits", "Paper trade first: journal without real money"],
        analogy: "A trading journal is like a flight recorder — it captures everything so you can review after a crash and improve next time.",
        quiz: { q: "The most important benefit of a trading journal is:", opts: ["Impressing other traders", "Finding patterns in your behavior to improve", "Tax documentation", "Showing brokers your history"], ans: 1, exp: "Journaling reveals patterns — your best setups, worst emotional mistakes, best times to trade. Without one, you repeat mistakes without knowing it." }
      },
      {
        id: "building_system", title: "Building a Trading System", duration: "11 min", videoId: "_YG5bpSBB7E",
        summary: "Successful trading is systematic, not intuitive. A trading system removes emotion and gives you a testable edge.",
        keyPoints: ["Define your setup: exact conditions that trigger a trade", "Entry rules: price, indicator, volume confirmation", "Exit rules: target, stop loss, time-based exit", "Position sizing rules: fixed % or Kelly Criterion", "Backtest before going live: does this system have edge?"],
        analogy: "A trading system is like a recipe — follow it consistently and get predictable results. Improvise every time and you'll never know why something worked.",
        quiz: { q: "The most critical component of a trading system is:", opts: ["Predicting market direction", "Having clear entry AND exit rules defined in advance", "Using the most indicators", "Trading the most volatile stocks"], ans: 1, exp: "Without pre-defined exit rules (profit target and stop loss), emotional decisions take over. A complete system must have rules for entry, exit, and sizing before any money goes in." }
      },
    ]
  },
  {
    id: "technical_analysis", title: "Technical Analysis", emoji: "📐", color: "#2dd4bf", darkBg: "#0a1f1e",
    level: "Intermediate", totalLessons: 6, xp: 500,
    desc: "Chart patterns, indicators, and setups that professional traders use.",
    lessons: [
      {
        id: "trend_lines", title: "Trend Lines & Channels", duration: "10 min", videoId: "6vELVn0-4bE",
        summary: "Trend lines connect price pivots to show direction and structure of a market move.",
        keyPoints: ["Uptrend line: connect higher lows", "Downtrend line: connect lower highs", "Channel: parallel trend lines (buy support, sell resistance)", "Break of trendline = potential reversal signal", "Retest after break = high-probability trade entry"],
        analogy: "A trend line is like a highway guardrail — as long as price stays between the rails, you know the direction. When it breaks through, something has changed.",
        quiz: { q: "In an uptrend, you draw a trend line connecting:", opts: ["Lower highs", "Higher lows", "All price points", "Horizontal levels only"], ans: 1, exp: "An uptrend line connects a series of higher lows. Each time price dips, it makes a higher low than the previous dip — this defines an uptrend." }
      },
      {
        id: "chart_patterns", title: "Chart Patterns That Work", duration: "14 min", videoId: "qzRhGOMPdoQ",
        summary: "Chart patterns are recurring formations that signal a likely next move — the psychology of buyers and sellers made visual.",
        keyPoints: ["Head & Shoulders: classic reversal pattern (bearish)", "Inverse H&S: bullish reversal", "Double Top/Bottom: strong reversal signals", "Triangle (ascending, descending, symmetrical): continuation", "Cup & Handle: bullish continuation, breakout pattern", "Flag & Pennant: short-term consolidation before continuation"],
        analogy: "Chart patterns are like body language — they reveal what the crowd is thinking before it acts.",
        quiz: { q: "A Head & Shoulders pattern is typically a signal of:", opts: ["Bullish continuation", "Bearish reversal", "Sideways consolidation", "Volume spike"], ans: 1, exp: "Head & Shoulders is one of the most reliable bearish reversal patterns — three peaks followed by a neckline break, signaling that buyers are exhausted." }
      },
      {
        id: "moving_averages", title: "Moving Averages", duration: "11 min", videoId: "lNdOtlgrH-4",
        summary: "Moving averages smooth out price noise and reveal the underlying trend — the most widely watched indicator.",
        keyPoints: ["SMA = Simple Moving Average (equal weight to all days)", "EMA = Exponential Moving Average (more weight to recent days)", "20 EMA = short-term trend | 50 EMA = medium-term | 200 EMA = long-term", "Price above 200 EMA = bull market; below = bear market", "Golden Cross: 50 EMA crosses above 200 EMA (bullish)", "Death Cross: 50 EMA crosses below 200 EMA (bearish)"],
        analogy: "A moving average is like looking at the 7-day average temperature — it smooths out hot and cold days to show the actual seasonal trend.",
        quiz: { q: "The 'Golden Cross' occurs when:", opts: ["Price crosses above the 200 EMA", "The 50 EMA crosses above the 200 EMA", "Volume doubles in one day", "RSI crosses 50"], ans: 1, exp: "Golden Cross = 50 EMA crossing above 200 EMA. It signals that medium-term momentum is stronger than long-term — historically a bullish signal." }
      },
      {
        id: "rsi_macd", title: "RSI & MACD", duration: "12 min", videoId: "KAH3bBKqLqM",
        summary: "RSI measures momentum (overbought/oversold). MACD measures trend direction and momentum together.",
        keyPoints: ["RSI > 70 = Overbought (potential reversal down)", "RSI < 30 = Oversold (potential reversal up)", "RSI divergence = powerful signal (price and RSI disagree)", "MACD = 12 EMA - 26 EMA", "MACD histogram above zero = bullish momentum", "MACD crossover = entry signal"],
        analogy: "RSI is like a rubber band — stretch it too far and it snaps back. MACD is a radar gun measuring the speed of the move.",
        quiz: { q: "RSI divergence occurs when:", opts: ["RSI and price both make new highs", "RSI moves in the opposite direction to price", "Volume and price diverge", "MACD crosses zero"], ans: 1, exp: "Divergence = price makes a new high but RSI makes a lower high (or vice versa). This mismatch often predicts reversals before they happen." }
      },
      {
        id: "bollinger_bands", title: "Bollinger Bands", duration: "10 min", videoId: "a4GUxG2KcnQ",
        summary: "Bollinger Bands adapt to volatility automatically. When bands squeeze, a big move is coming.",
        keyPoints: ["3 lines: 20 SMA ± 2 standard deviations", "Band width = current volatility measure", "Bollinger Squeeze: bands narrow = low volatility = breakout coming", "Price touching upper band = relatively expensive", "Price touching lower band = relatively cheap"],
        analogy: "Bollinger Bands are like a river with flood banks. Calm water (squeeze) before a flood (breakout). When river touches its banks, it usually reverses.",
        quiz: { q: "A Bollinger Squeeze (bands narrowing) signals:", opts: ["The stock is overvalued", "Volatility is likely to expand soon — breakout coming", "The stock is about to crash", "Low volume trading"], ans: 1, exp: "A squeeze means volatility has compressed. Like a coiled spring — the longer the squeeze, the bigger the eventual breakout. Direction, however, is not predicted by the squeeze alone." }
      },
      {
        id: "volume_analysis", title: "Volume Analysis", duration: "9 min", videoId: "fYbzElCXk5c",
        summary: "Volume confirms price moves. A breakout on high volume is real. A breakout on low volume often fails.",
        keyPoints: ["Volume = conviction behind price moves", "High volume up move = strong buying interest", "High volume down move = strong selling pressure", "Low volume rally = weak, likely to fail", "Volume spike on breakout = confirms the move", "OBV (On Balance Volume): running total confirming trend"],
        analogy: "Volume is like a crowd cheering at a sports event. A goal scored with 50,000 fans cheering is significant. With 200 fans, it's much less meaningful.",
        quiz: { q: "A stock breaks resistance on LOW volume. This suggests:", opts: ["A very strong breakout", "The breakout may fail or be a false move", "Volume doesn't matter for breakouts", "The stock will definitely rally 20%"], ans: 1, exp: "Low-volume breakouts lack conviction. Without buyers rushing in to confirm the move, it often fails and price returns below resistance." }
      },
    ]
  }
];

const ALL_QUIZ_QUESTIONS = ACADEMY_COURSES.flatMap(course =>
  course.lessons.map(l => ({ ...l.quiz, courseTitle: course.title, lessonTitle: l.title, courseColor: course.color }))
).filter(q => q && q.q);

const ALL_GLOSSARY = [
  { term: "Ask", def: "The lowest price a seller will accept for a security", cat: "Basics" },
  { term: "Bid", def: "The highest price a buyer will pay for a security", cat: "Basics" },
  { term: "Bull Market", def: "Extended period of rising stock prices (generally 20%+ rise)", cat: "Markets" },
  { term: "Bear Market", def: "Extended period of falling stock prices (generally 20%+ fall)", cat: "Markets" },
  { term: "Call Option", def: "Right to BUY shares at the strike price before expiration", cat: "Options" },
  { term: "Put Option", def: "Right to SELL shares at the strike price before expiration", cat: "Options" },
  { term: "Delta", def: "Option's price sensitivity to a $1 change in the underlying stock", cat: "Greeks" },
  { term: "Theta", def: "Rate of time decay — how much option value is lost per day", cat: "Greeks" },
  { term: "Vega", def: "Option's sensitivity to changes in implied volatility", cat: "Greeks" },
  { term: "Gamma", def: "Rate of change of Delta per $1 stock move", cat: "Greeks" },
  { term: "DTE", def: "Days To Expiration — time remaining until an option expires", cat: "Options" },
  { term: "Premium", def: "The price paid to buy an options contract", cat: "Options" },
  { term: "Strike Price", def: "The price at which an option can be exercised", cat: "Options" },
  { term: "ITM", def: "In The Money — call: stock > strike; put: stock < strike (has intrinsic value)", cat: "Options" },
  { term: "ATM", def: "At The Money — strike price equals current stock price", cat: "Options" },
  { term: "OTM", def: "Out of The Money — option has no intrinsic value yet", cat: "Options" },
  { term: "Implied Volatility", def: "Market's forecast of likely price movement, expressed as annualized %", cat: "Options" },
  { term: "IV Rank", def: "Compares current IV to its 52-week range (0-100 scale)", cat: "Options" },
  { term: "IV Crush", def: "Sharp drop in implied volatility after a major event, destroying option premiums", cat: "Options" },
  { term: "Iron Condor", def: "Sell OTM call spread + OTM put spread; profits in range-bound markets", cat: "Strategies" },
  { term: "Bull Call Spread", def: "Buy lower call + sell higher call; bullish, limited risk and reward", cat: "Strategies" },
  { term: "Bear Put Spread", def: "Buy higher put + sell lower put; bearish, limited risk and reward", cat: "Strategies" },
  { term: "Straddle", def: "Buy ATM call + ATM put; profits from big moves in either direction", cat: "Strategies" },
  { term: "Strangle", def: "Buy OTM call + OTM put; cheaper than straddle, needs bigger move", cat: "Strategies" },
  { term: "Butterfly", def: "3-strike spread; max profit when stock pins at center strike at expiry", cat: "Strategies" },
  { term: "Covered Call", def: "Own 100 shares and sell a call to generate monthly income", cat: "Strategies" },
  { term: "Protective Put", def: "Own 100 shares and buy a put for downside protection", cat: "Strategies" },
  { term: "Calendar Spread", def: "Sell near-term option + buy same-strike further-dated option", cat: "Strategies" },
  { term: "P/E Ratio", def: "Price-to-Earnings — stock price ÷ earnings per share", cat: "Fundamentals" },
  { term: "EPS", def: "Earnings Per Share — company profit ÷ shares outstanding", cat: "Fundamentals" },
  { term: "Market Cap", def: "Total company value = share price × total shares outstanding", cat: "Basics" },
  { term: "Dividend", def: "Cash payment made to shareholders from company profits", cat: "Basics" },
  { term: "Volume", def: "Number of shares or contracts traded in a given period", cat: "Technical" },
  { term: "Support", def: "Price level where buying interest typically stops a price decline", cat: "Technical" },
  { term: "Resistance", def: "Price level where selling interest typically caps a price rise", cat: "Technical" },
  { term: "RSI", def: "Relative Strength Index — momentum indicator; >70 overbought, <30 oversold", cat: "Technical" },
  { term: "MACD", def: "Moving Average Convergence Divergence — trend and momentum indicator", cat: "Technical" },
  { term: "EMA", def: "Exponential Moving Average — more weight to recent prices", cat: "Technical" },
  { term: "Bollinger Bands", def: "3 lines: 20 SMA ± 2 standard deviations; adapts to volatility", cat: "Technical" },
  { term: "Open Interest", def: "Total number of outstanding options contracts not yet settled", cat: "Options" },
  { term: "SPAN Margin", def: "Standard Portfolio Analysis of Risk — margin based on worst-case scenario", cat: "Basics" },
  { term: "Stop Loss", def: "Pre-set price where a trade is auto-closed to limit losses", cat: "Risk" },
  { term: "Position Sizing", def: "Deciding how much capital to allocate to each trade", cat: "Risk" },
  { term: "Risk/Reward Ratio", def: "Potential profit vs potential loss; aim for at least 1:2", cat: "Risk" },
  { term: "Paper Trading", def: "Simulated trading with virtual money to practice without real risk", cat: "Basics" },
  { term: "VIX", def: "CBOE Volatility Index — measures expected S&P 500 volatility", cat: "Markets" },
  { term: "LEAPS", def: "Long-term equity anticipation securities — options expiring 1-2+ years out", cat: "Options" },
  { term: "Head & Shoulders", def: "Classic bearish reversal chart pattern showing buyer exhaustion", cat: "Technical" },
  { term: "Golden Cross", def: "50 EMA crosses above 200 EMA — bullish long-term signal", cat: "Technical" },
  { term: "Death Cross", def: "50 EMA crosses below 200 EMA — bearish long-term signal", cat: "Technical" },
].sort((a, b) => a.term.localeCompare(b.term));

// ── LEARN PAGE (Full Academy) ─────────────────────────────────────────────────
function LearnPage() {
  const [view, setView] = useState("home");
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completed, setCompleted] = useState({});
  const [xp, setXp] = useState(0);
  const [quizState, setQuizState] = useState({ active: false, qIdx: 0, score: 0, answered: null, done: false, questions: [] });
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCat, setGlossaryCat] = useState("All");
  const [aiExplain, setAiExplain] = useState({ loading: false, topic: "", result: "" });
  const [streak] = useState(3);
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };

  const totalLessons = ACADEMY_COURSES.reduce((a, c) => a + c.totalLessons, 0);
  const completedCount = Object.keys(completed).length;
  const totalXP = ACADEMY_COURSES.reduce((a, c) => a + c.xp, 0);

  const markComplete = (lessonId, courseXp) => {
    if (!completed[lessonId]) {
      setCompleted(p => ({ ...p, [lessonId]: true }));
      const earnedXP = Math.round(courseXp / ACADEMY_COURSES.find(c => c.lessons.some(l => l.id === lessonId))?.totalLessons || 50);
      setXp(p => p + earnedXP);
    }
  };

  const explainWithAI = async (topic) => {
    setAiExplain({ loading: true, topic, result: "" });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, system: "You are a friendly, encouraging trading tutor for complete beginners. Explain concepts simply, use relatable analogies, avoid jargon. Keep responses under 200 words. Use plain text with line breaks. End with one Key Takeaway.", messages: [{ role: "user", content: `Explain "${topic}" in simple terms for a complete beginner to trading. Use a real-world analogy if possible.` }] }) });
      const d = await res.json();
      setAiExplain({ loading: false, topic, result: d.content?.[0]?.text || "Could not get explanation." });
    } catch (e) { setAiExplain({ loading: false, topic, result: "AI explanation unavailable." }); }
  };

  const startQuiz = (questions) => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuizState({ active: true, qIdx: 0, score: 0, answered: null, done: false, questions: shuffled });
  };
  const answerQuiz = (idx) => {
    if (quizState.answered !== null) return;
    const correct = idx === quizState.questions[quizState.qIdx].ans;
    setQuizState(s => ({ ...s, answered: idx, score: s.score + (correct ? 1 : 0) }));
  };
  const nextQuiz = () => {
    const next = quizState.qIdx + 1;
    if (next >= quizState.questions.length) setQuizState(s => ({ ...s, done: true }));
    else setQuizState(s => ({ ...s, qIdx: next, answered: null }));
  };

  const glossaryCats = ["All", ...[...new Set(ALL_GLOSSARY.map(g => g.cat))]];
  const filteredGlossary = ALL_GLOSSARY.filter(g =>
    (glossaryCat === "All" || g.cat === glossaryCat) &&
    (g.term.toLowerCase().includes(glossarySearch.toLowerCase()) || g.def.toLowerCase().includes(glossarySearch.toLowerCase()))
  );

  const NAV_ITEMS = [
    { id: "home", label: "Home", emoji: "🏠" },
    { id: "courses", label: "Courses", emoji: "📚" },
    { id: "quiz", label: "Quiz", emoji: "🧠" },
    { id: "glossary", label: "Glossary", emoji: "📖" },
    { id: "ai_tutor", label: "AI Tutor", emoji: "🤖" },
  ];

  // ── LESSON VIEW ──
  if (view === "lesson" && activeCourse && activeLesson) {
    const course = ACADEMY_COURSES.find(c => c.id === activeCourse);
    const lesson = course?.lessons.find(l => l.id === activeLesson);
    if (!lesson || !course) return null;
    const lessonIdx = course.lessons.indexOf(lesson);
    const nextLesson = course.lessons[lessonIdx + 1];
    const prevLesson = course.lessons[lessonIdx - 1];
    const isDone = completed[lesson.id];

    return (
      <div>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setView("home")} style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0 }}>🎓 Academy</button>
          <span style={{ color: C.border }}>›</span>
          <button onClick={() => { setView("course"); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0 }}>{course.emoji} {course.title}</button>
          <span style={{ color: C.border }}>›</span>
          <span style={{ color: C.text, fontSize: 12 }}>{lesson.title}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }} className="main-grid-2">
          <div>
            {/* Video Player */}
            <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, background: "#000" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${lesson.videoId}?rel=0&modestbranding=1`}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
              <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid " + C.border }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{lesson.title}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{course.title} · {lesson.duration}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge bg={isDone ? "#052e16" : "#1a2535"} color={isDone ? C.green : C.dim}>{isDone ? "✓ Done" : "Not done"}</Badge>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: course.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>📝 LESSON SUMMARY</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 14 }}>{lesson.summary}</div>
              <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>KEY POINTS</div>
              {lesson.keyPoints.map((pt, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <span style={{ color: course.color, flexShrink: 0, fontSize: 14, marginTop: 1 }}>→</span>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{pt}</div>
                </div>
              ))}
            </div>

            {/* Analogy */}
            <div style={{ ...card, background: "#0a0d1a", border: "1px solid " + course.color + "33", marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: course.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>💡 ANALOGY</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, fontStyle: "italic" }}>"{lesson.analogy}"</div>
            </div>

            {/* Lesson Quiz */}
            <div style={{ ...card, border: "1px solid " + C.purple + "44", marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: C.purple, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>🧠 KNOWLEDGE CHECK</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{lesson.quiz.q}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lesson.quiz.opts.map((opt, i) => {
                  const isCorrect = i === lesson.quiz.ans;
                  const isSelected = quizState.answered === i && quizState.questions.length === 0;
                  return (
                    <button key={i} style={{ padding: "10px 14px", background: C.card2, border: "1px solid " + C.border, borderRadius: 8, cursor: "pointer", fontSize: 12, color: C.dim, fontFamily: "inherit", textAlign: "left", transition: "all .15s" }}
                      onMouseEnter={e => { e.target.style.borderColor = C.purple; e.target.style.color = C.text; }}
                      onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.dim; }}
                      onClick={() => {
                        if (!completed["quiz_" + lesson.id]) {
                          setCompleted(p => ({ ...p, ["quiz_" + lesson.id]: isCorrect }));
                        }
                      }}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  );
                })}
              </div>
              {completed["quiz_" + lesson.id] !== undefined && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: completed["quiz_" + lesson.id] ? "#052e16" : "#1c0a0a", borderRadius: 8, border: "1px solid " + (completed["quiz_" + lesson.id] ? C.green : C.red) + "44" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: completed["quiz_" + lesson.id] ? C.green : C.red, marginBottom: 4 }}>{completed["quiz_" + lesson.id] ? "✅ Correct!" : "Review the answer:"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{lesson.quiz.exp}</div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: 10 }}>
              {prevLesson && <button onClick={() => setActiveLesson(prevLesson.id)} style={{ flex: 1, padding: "11px", background: "#1a2535", color: C.dim, border: "1px solid " + C.border, borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit" }}>← {prevLesson.title}</button>}
              {!isDone && <button onClick={() => { markComplete(lesson.id, course.xp); }} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#14532d,#166534)", color: C.green, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>✓ Mark Complete & Earn XP</button>}
              {isDone && <div style={{ flex: 1, padding: "11px", background: "#052e16", color: C.green, borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700 }}>✓ Completed</div>}
              {nextLesson && <button onClick={() => { setActiveLesson(nextLesson.id); }} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit" }}>Next: {nextLesson.title} →</button>}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Course progress */}
            <div style={card}>
              <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>COURSE PROGRESS</div>
              {course.lessons.map((l, i) => {
                const isDoneL = completed[l.id];
                const isActive = l.id === activeLesson;
                return (
                  <div key={l.id} onClick={() => setActiveLesson(l.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: isActive ? "rgba(56,189,248,0.08)" : "transparent", border: "1px solid " + (isActive ? C.blue + "44" : "transparent"), marginBottom: 4, transition: "all .15s" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: isDoneL ? course.color : "#1a2535", border: "2px solid " + (isDoneL ? course.color : isActive ? C.blue : C.border), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isDoneL ? <span style={{ fontSize: 10, color: "#000" }}>✓</span> : <span style={{ fontSize: 9, color: isActive ? C.blue : C.dim }}>{i + 1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? C.blue : isDoneL ? C.green : C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                      <div style={{ fontSize: 9, color: C.dim }}>{l.duration}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* AI Explain */}
            <div style={card}>
              <div style={{ fontSize: 9, color: C.purple, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>🤖 AI TUTOR</div>
              <button onClick={() => explainWithAI(lesson.title)} disabled={aiExplain.loading} style={{ width: "100%", padding: "10px", background: "rgba(168,85,247,0.15)", color: C.purple, border: "1px solid " + C.purple + "44", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: "inherit", marginBottom: aiExplain.result ? 8 : 0 }}>
                {aiExplain.loading && aiExplain.topic === lesson.title ? "Thinking…" : "✨ Explain this lesson"}
              </button>
              {aiExplain.result && aiExplain.topic === lesson.title && (
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>{aiExplain.result}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── COURSE VIEW ──
  if (view === "course" && activeCourse) {
    const course = ACADEMY_COURSES.find(c => c.id === activeCourse);
    if (!course) return null;
    const courseDone = course.lessons.filter(l => completed[l.id]).length;
    const courseProgress = Math.round(courseDone / course.lessons.length * 100);
    return (
      <div>
        <button onClick={() => setView("courses")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 16 }}>
          ← Back to Courses
        </button>
        <div style={{ ...card, background: course.darkBg, border: "1px solid " + course.color + "44", marginBottom: 20, padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{course.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: course.color, marginBottom: 6 }}>{course.title}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 14 }}>{course.desc}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>
            <span>📚 {course.totalLessons} lessons</span>
            <span>⭐ {course.xp} XP</span>
            <span>🎯 {course.level}</span>
            <span>✅ {courseDone}/{course.lessons.length} completed</span>
          </div>
          <div style={{ background: "#1a2535", borderRadius: 4, height: 6, maxWidth: 300 }}>
            <div style={{ height: 6, borderRadius: 4, background: course.color, width: courseProgress + "%", transition: "width .5s" }} />
          </div>
          <div style={{ fontSize: 10, color: course.color, marginTop: 4 }}>{courseProgress}% complete</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {course.lessons.map((lesson, i) => {
            const isDone = completed[lesson.id];
            return (
              <div key={lesson.id} onClick={() => { setActiveLesson(lesson.id); setView("lesson"); }} style={{ ...card, cursor: "pointer", transition: "all .15s", display: "flex", gap: 14, alignItems: "center" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = course.color + "66"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: isDone ? course.color + "22" : "#1a2535", border: "2px solid " + (isDone ? course.color : C.border), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isDone ? <span style={{ fontSize: 16, color: course.color }}>✓</span> : <span style={{ fontSize: 14, color: C.dim }}>{i + 1}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: isDone ? course.color : C.text }}>{lesson.title}</div>
                  <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{lesson.summary.slice(0, 80)}…</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>▶ {lesson.duration}</div>
                  {isDone && <Badge bg={course.color + "22"} color={course.color} size={9}>Done</Badge>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => { setActiveLesson(course.lessons[0].id); setView("lesson"); }} style={{ width: "100%", marginTop: 16, padding: "13px", background: `linear-gradient(135deg,${course.color}33,${course.color}22)`, color: course.color, border: "1px solid " + course.color + "44", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
          {courseDone === 0 ? "Start Course →" : courseDone === course.totalLessons ? "Review Course →" : "Continue Course →"}
        </button>
      </div>
    );
  }

  // ── QUIZ VIEW ──
  if (view === "quiz") {
    return (
      <div>
        <button onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 16 }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🧠 Knowledge Quiz</div>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Test everything you've learned — {ALL_QUIZ_QUESTIONS.length} questions across all courses</div>
        {!quizState.active && !quizState.done && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 16 }} className="main-grid-2">
            {[{ label: "Quick Quiz", desc: "10 random questions", n: 10, icon: "⚡" }, { label: "Full Exam", desc: "All " + ALL_QUIZ_QUESTIONS.length + " questions", n: ALL_QUIZ_QUESTIONS.length, icon: "🎓" }].map(opt => (
              <div key={opt.label} onClick={() => startQuiz(ALL_QUIZ_QUESTIONS.slice(0, opt.n))} style={{ ...card, cursor: "pointer", textAlign: "center", padding: 24 }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: C.dim }}>{opt.desc}</div>
              </div>
            ))}
            {ACADEMY_COURSES.map(course => {
              const courseQ = ALL_QUIZ_QUESTIONS.filter(q => q.courseTitle === course.title);
              return (
                <div key={course.id} onClick={() => startQuiz(courseQ)} style={{ ...card, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }} onMouseEnter={e => { e.currentTarget.style.borderColor = course.color; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                  <span style={{ fontSize: 22 }}>{course.emoji}</span>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: course.color }}>{course.title}</div><div style={{ fontSize: 10, color: C.dim }}>{courseQ.length} questions</div></div>
                </div>
              );
            })}
          </div>
        )}
        {quizState.active && !quizState.done && (() => {
          const q = quizState.questions[quizState.qIdx];
          return (
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                <div style={{ fontSize: 10, color: C.dim }}>Question {quizState.qIdx + 1} / {quizState.questions.length}</div>
                <div style={{ fontSize: 11, color: C.green }}>Score: {quizState.score}</div>
              </div>
              <div style={{ height: 4, background: "#1a2535", borderRadius: 2, marginBottom: 16 }}>
                <div style={{ height: 4, borderRadius: 2, background: C.blue, width: (quizState.qIdx / quizState.questions.length * 100) + "%", transition: "width .3s" }} />
              </div>
              <div style={{ fontSize: 10, color: C.dim, marginBottom: 8 }}>{q.courseTitle} › {q.lessonTitle}</div>
              <div style={{ ...card, marginBottom: 10 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.6 }}>{q.q}</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {q.opts.map((opt, i) => {
                  const isAnswered = quizState.answered !== null;
                  const isCorrect = i === q.ans;
                  const isSelected = quizState.answered === i;
                  let bg = C.card, border = C.border, col = C.text;
                  if (isAnswered) { if (isCorrect) { bg = "#052e16"; border = C.green; col = C.green; } else if (isSelected) { bg = "#3b0000"; border = C.red; col = C.red; } }
                  return (
                    <button key={i} onClick={() => answerQuiz(i)} style={{ padding: "12px 16px", background: bg, border: "1px solid " + border, borderRadius: 8, cursor: isAnswered ? "default" : "pointer", fontSize: 12, color: col, fontFamily: "inherit", textAlign: "left", transition: "all .2s" }}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  );
                })}
              </div>
              {quizState.answered !== null && (
                <div style={{ ...card, background: quizState.answered === q.ans ? "#052e16" : "#1c0a0a", border: "1px solid " + (quizState.answered === q.ans ? C.green : C.red) + "44", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: quizState.answered === q.ans ? C.green : C.red, marginBottom: 4 }}>{quizState.answered === q.ans ? "✅ Correct!" : "❌ Not quite"}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{q.exp}</div>
                </div>
              )}
              {quizState.answered !== null && <button onClick={nextQuiz} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>{quizState.qIdx + 1 < quizState.questions.length ? "Next Question →" : "See Results"}</button>}
            </div>
          );
        })()}
        {quizState.done && (
          <div style={{ ...card, textAlign: "center", padding: 40, maxWidth: 480, margin: "0 auto" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{quizState.score >= quizState.questions.length * 0.8 ? "🏆" : quizState.score >= quizState.questions.length * 0.6 ? "⭐" : "📚"}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Quiz Complete!</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: quizState.score >= quizState.questions.length * 0.8 ? C.green : quizState.score >= quizState.questions.length * 0.6 ? C.yellow : C.red, marginBottom: 8 }}>
              {quizState.score}/{quizState.questions.length}
            </div>
            <div style={{ fontSize: 14, color: C.dim, marginBottom: 20 }}>
              {quizState.score >= quizState.questions.length * 0.8 ? "Excellent! You've mastered this material." : quizState.score >= quizState.questions.length * 0.6 ? "Good job! A bit more study and you'll ace it." : "Keep learning — the Academy courses will help!"}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => startQuiz(ALL_QUIZ_QUESTIONS)} style={{ padding: "11px 24px", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>Retry</button>
              <button onClick={() => setView("courses")} style={{ padding: "11px 24px", background: "#1a2535", color: C.blue, border: "1px solid " + C.blue + "44", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>Study Courses</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── GLOSSARY VIEW ──
  if (view === "glossary") {
    return (
      <div>
        <button onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 16 }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>📖 Trading Glossary</div>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>{ALL_GLOSSARY.length} terms defined in plain English</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} placeholder="Search terms…" style={{ flex: 1, background: "#080c14", border: "1px solid " + C.border, borderRadius: 8, padding: "9px 13px", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit", minWidth: 180 }} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {glossaryCats.map(cat => (
              <button key={cat} onClick={() => setGlossaryCat(cat)} style={{ padding: "8px 12px", background: glossaryCat === cat ? "rgba(56,189,248,0.15)" : C.card, border: "1px solid " + (glossaryCat === cat ? C.blue : C.border), borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700, color: glossaryCat === cat ? C.blue : C.dim, fontFamily: "inherit" }}>{cat}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }} className="main-grid-2">
          {filteredGlossary.map(g => (
            <div key={g.term} style={{ ...card, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{g.term}</span>
                  <Badge bg="#0f1422" color={C.dim} size={8}>{g.cat}</Badge>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{g.def}</div>
              </div>
              <button onClick={() => { explainWithAI(g.term); setView("ai_tutor"); }} style={{ flexShrink: 0, padding: "4px 8px", background: "rgba(168,85,247,0.1)", color: C.purple, border: "1px solid " + C.purple + "22", borderRadius: 5, cursor: "pointer", fontSize: 9, fontFamily: "inherit" }} title="AI Explain">🤖</button>
            </div>
          ))}
          {filteredGlossary.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: C.muted, padding: "32px 0", fontSize: 12 }}>No terms match "{glossarySearch}"</div>}
        </div>
      </div>
    );
  }

  // ── AI TUTOR VIEW ──
  if (view === "ai_tutor") {
    return (
      <div>
        <button onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 16 }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🤖 AI Tutor</div>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Ask anything about trading — explained simply for beginners</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }} className="main-grid-2">
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input value={aiExplain.topic} onChange={e => setAiExplain(s => ({ ...s, topic: e.target.value }))} onKeyDown={e => e.key === "Enter" && explainWithAI(aiExplain.topic)} placeholder="e.g. What is a covered call?" style={{ flex: 1, background: "#080c14", border: "1px solid " + C.border, borderRadius: 8, padding: "11px 14px", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
              <button onClick={() => explainWithAI(aiExplain.topic)} disabled={aiExplain.loading || !aiExplain.topic.trim()} style={{ padding: "11px 20px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit", opacity: aiExplain.loading || !aiExplain.topic.trim() ? 0.5 : 1 }}>
                {aiExplain.loading ? "…" : "Ask"}
              </button>
            </div>
            {aiExplain.result ? (
              <div style={{ ...card, border: "1px solid " + C.purple + "44", background: "#0a0d1a" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <div style={{ fontSize: 9, color: C.purple, fontWeight: 700 }}>CLAUDE EXPLAINS: {aiExplain.topic.toUpperCase()}</div>
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiExplain.result}</div>
              </div>
            ) : (
              <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 8 }}>
                <div style={{ fontSize: 40 }}>💬</div>
                <div style={{ fontSize: 13, color: C.dim }}>Type a question or pick a topic →</div>
              </div>
            )}
          </div>
          <div style={card}>
            <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>POPULAR TOPICS</div>
            {["What is a stock?", "How do options work?", "What is IV crush?", "Explain Delta simply", "What is the VIX?", "How to read candlesticks?", "What is paper trading?", "Explain Bull Call Spread", "When to use Iron Condor?", "What is a stop loss?", "How does theta decay work?", "What is the risk/reward ratio?"].map(topic => (
              <button key={topic} onClick={() => explainWithAI(topic)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", background: "#080c14", border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer", fontSize: 11, color: C.dim, fontFamily: "inherit", marginBottom: 5, transition: "all .15s" }} onMouseEnter={e => { e.target.style.borderColor = C.purple; e.target.style.color = C.text; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.dim; }}>
                💡 {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── COURSES VIEW ──
  if (view === "courses") {
    return (
      <div>
        <button onClick={() => setView("home")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.dim, fontSize: 12, fontFamily: "inherit", padding: 0, marginBottom: 16 }}>← Back</button>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>📚 All Courses</div>
        <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>{ACADEMY_COURSES.length} courses · {totalLessons} lessons · {totalXP} XP</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }} className="main-grid-2">
          {ACADEMY_COURSES.map(course => {
            const done = course.lessons.filter(l => completed[l.id]).length;
            const pct = Math.round(done / course.lessons.length * 100);
            return (
              <div key={course.id} onClick={() => { setActiveCourse(course.id); setView("course"); }} style={{ ...card, cursor: "pointer", transition: "all .15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = course.color + "66"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 28 }}>{course.emoji}</div>
                  <Badge bg={course.level === "Beginner" ? "#052e16" : "#1c1a0a"} color={course.level === "Beginner" ? C.green : C.yellow}>{course.level}</Badge>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: course.color, marginBottom: 4 }}>{course.title}</div>
                <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, marginBottom: 12 }}>{course.desc}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.muted, marginBottom: 10 }}>
                  <span>📖 {course.totalLessons} lessons</span>
                  <span>⭐ {course.xp} XP</span>
                </div>
                <div style={{ background: "#1a2535", borderRadius: 3, height: 4, marginBottom: 4 }}>
                  <div style={{ height: 4, borderRadius: 3, background: course.color, width: pct + "%", transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: 10, color: pct === 100 ? course.color : C.dim }}>{pct === 100 ? "✓ Completed" : pct > 0 ? `${pct}% — ${done}/${course.lessons.length} lessons` : "Not started"}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── HOME VIEW ──
  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e1a3a)", border: "1px solid " + C.purple + "44", borderRadius: 14, padding: "24px 28px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.06 }}>🎓</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>OptiFlow Trading Academy</div>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 16, maxWidth: 560 }}>
          From absolute beginner to confident options trader. {ACADEMY_COURSES.length} structured courses, {totalLessons} video lessons, interactive quizzes, and an AI tutor available 24/7.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setView("courses")} style={{ padding: "11px 22px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", boxShadow: "0 4px 14px rgba(168,85,247,0.3)" }}>Browse All Courses →</button>
          <button onClick={() => setView("quiz")} style={{ padding: "11px 22px", background: "#1a2535", color: C.blue, border: "1px solid " + C.blue + "44", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Take the Quiz</button>
        </div>
      </div>

      {/* Progress stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }} className="main-grid-4">
        {[
          { label: "Lessons Done", val: `${completedCount}/${totalLessons}`, color: C.green, emoji: "✅" },
          { label: "XP Earned", val: xp + " XP", color: C.yellow, emoji: "⭐" },
          { label: "Day Streak", val: streak + " days", color: C.orange, emoji: "🔥" },
          { label: "Courses", val: `${ACADEMY_COURSES.filter(c => c.lessons.some(l => completed[l.id])).length}/${ACADEMY_COURSES.length}`, color: C.blue, emoji: "📚" },
        ].map(stat => (
          <div key={stat.label} style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.val}</div>
            <div style={{ fontSize: 9, color: C.dim }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Nav shortcuts */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {NAV_ITEMS.filter(n => n.id !== "home").map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: C.card, border: "1px solid " + C.border, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: C.dim, fontFamily: "inherit", transition: "all .15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}>
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.text }}>All Courses</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }} className="main-grid-3">
        {ACADEMY_COURSES.map(course => {
          const done = course.lessons.filter(l => completed[l.id]).length;
          const pct = Math.round(done / course.lessons.length * 100);
          return (
            <div key={course.id} onClick={() => { setActiveCourse(course.id); setView("course"); }} style={{ ...card, cursor: "pointer", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = course.color + "66"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{course.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: course.color, marginBottom: 4 }}>{course.title}</div>
              <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5, marginBottom: 10 }}>{course.desc}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <Badge bg={course.level === "Beginner" ? "#052e16" : "#1c1a0a"} color={course.level === "Beginner" ? C.green : C.yellow}>{course.level}</Badge>
                <Badge bg="#0f1422" color={C.dim}>{course.totalLessons} lessons</Badge>
                <Badge bg="#0f1422" color={C.yellow}>{course.xp} XP</Badge>
              </div>
              <div style={{ background: "#1a2535", borderRadius: 3, height: 4 }}>
                <div style={{ height: 4, borderRadius: 3, background: course.color, width: pct + "%", transition: "width .5s" }} />
              </div>
              <div style={{ fontSize: 9, color: pct === 100 ? course.color : C.dim, marginTop: 4 }}>{pct === 100 ? "✓ Complete" : pct > 0 ? `${pct}% done` : "Not started"}</div>
            </div>
          );
        })}
      </div>

      {/* Tips & mistakes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="main-grid-2">
        <div style={card}>
          <div style={{ fontSize: 9, color: C.yellow, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>💡 PRO TIPS</div>
          {["Never risk more than 2% of capital on one trade", "High IV = expensive options. Sell high IV, buy low IV", "Paper trade first — practice before using real money", "IV crush kills options after earnings — be careful", "The trend is your friend — don't fight the market"].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ color: C.yellow, flexShrink: 0 }}>★</span>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{tip}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>⚠️ BEGINNER MISTAKES</div>
          {["Buying OTM calls and ignoring time decay (theta)", "Over-leveraging — too much capital per trade", "Not having a stop loss before entering a trade", "Chasing stocks after they already moved 20%", "Ignoring earnings dates when trading options"].map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ color: C.red, flexShrink: 0 }}>✗</span>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{m}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── RECOMMENDER PAGE ──────────────────────────────────────────────────────────
function RecommenderPage({ onSelectStrategy }) {
  const [view, setView] = useState("Bullish"); const [vol, setVol] = useState("Neutral"); const [horizon, setHorizon] = useState("1-3 months"); const [result, setResult] = useState(null);
  const recommend = () => { const key = `${view}-${vol}-${horizon}`; const found = STRAT_REC_MAP[key] || ["Bull Call Spread", "Bear Put Spread", "Butterfly"]; setResult(found); };
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };
  return (<div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Strategy Recommender</div><div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Tell us your market view and we'll suggest the right strategies.</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><div style={card}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.blue, marginBottom: 16 }}>YOUR MARKET VIEW</div><div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, color: C.dim, fontWeight: 700, marginBottom: 8 }}>DIRECTIONAL VIEW</div><div style={{ display: "flex", gap: 8 }}>{["Bullish", "Bearish", "Neutral"].map(v => (<button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "10px 8px", background: view === v ? "rgba(56,189,248,0.15)" : "#0f1422", border: "1px solid " + (view === v ? C.blue : C.border), borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: view === v ? C.blue : C.dim, fontFamily: "inherit" }}>{v === "Bullish" ? "📈" : v === "Bearish" ? "📉" : "↔"} {v}</button>))}</div></div><div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, color: C.dim, fontWeight: 700, marginBottom: 8 }}>VOLATILITY VIEW</div><div style={{ display: "flex", gap: 8 }}>{["High", "Low", "Neutral"].map(v => (<button key={v} onClick={() => setVol(v)} style={{ flex: 1, padding: "10px", background: vol === v ? "rgba(56,189,248,0.15)" : "#0f1422", border: "1px solid " + (vol === v ? C.blue : C.border), borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: vol === v ? C.blue : C.dim, fontFamily: "inherit" }}>{v}</button>))}</div></div><div style={{ marginBottom: 20 }}><div style={{ fontSize: 10, color: C.dim, fontWeight: 700, marginBottom: 8 }}>TIME HORIZON</div><select value={horizon} onChange={e => setHorizon(e.target.value)} style={{ width: "100%", background: "#080c14", border: "1px solid " + C.border, borderRadius: 7, padding: "9px 12px", color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit", cursor: "pointer" }}><option>Short (&lt;1 month)</option><option>1-3 months</option><option>3-6 months</option><option>6+ months</option></select></div><button onClick={recommend} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Get Recommendations →</button></div><div>{result ? (<div style={card}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.blue, marginBottom: 12 }}>RECOMMENDED STRATEGIES</div><div style={{ fontSize: 11, color: C.dim, marginBottom: 16 }}>For a <strong style={{ color: C.blue }}>{view}</strong> view with <strong style={{ color: C.purple }}>{vol} vol</strong>, {horizon}:</div>{result.map((name, i) => { const s = STRATS[name]; return s ? (<div key={name} style={{ background: "#0f1422", border: "1px solid " + C.border, borderRadius: 8, padding: 14, marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 13 }}>#{i + 1} {name}</span><Badge bg={s.risk === "Low" ? "#052e16" : s.risk === "Medium" ? "#1c1a0a" : "#3b0000"} color={s.risk === "Low" ? C.green : s.risk === "Medium" ? C.yellow : C.red}>{s.risk} Risk</Badge></div><div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>{s.desc}</div><button onClick={() => onSelectStrategy(name)} style={{ padding: "5px 14px", background: "#0f2a40", color: C.blue, border: "1px solid " + C.blue + "44", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>Build Strategy →</button></div>) : null; })}</div>) : (<div style={Object.assign({}, card, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 })}><div style={{ textAlign: "center", color: "#334155" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div><div style={{ fontWeight: 600, color: C.dim }}>Set your view & get recommendations</div></div></div>)}</div></div></div>);
}

// ── SPAN MARGIN CALCULATOR ────────────────────────────────────────────────────
function calcSPANMargin(orderType, spot, strike, iv, days, qty, side) {
  const T = days / 365;
  const sigma = iv / 100;
  // SPAN: Initial margin = max(scan risk range scenarios)
  const scenarios = [
    { price: spot * 0.97, vol: sigma * 1.1 },
    { price: spot * 0.94, vol: sigma * 1.2 },
    { price: spot * 0.91, vol: sigma * 1.3 },
    { price: spot * 1.03, vol: sigma * 1.1 },
    { price: spot * 1.06, vol: sigma * 1.2 },
    { price: spot * 1.09, vol: sigma * 1.3 },
    { price: spot, vol: sigma * 0.75 },
    { price: spot, vol: sigma * 1.25 },
    { price: spot * 0.97, vol: sigma * 0.9 },
    { price: spot * 1.03, vol: sigma * 0.9 },
    { price: spot * 0.88, vol: sigma },
    { price: spot * 1.12, vol: sigma },
    { price: spot * 0.85, vol: sigma * 1.4, weight: 0.35 },
    { price: spot * 1.15, vol: sigma * 1.4, weight: 0.35 },
    { price: spot * 0.80, vol: sigma * 1.5, weight: 0.25 },
    { price: spot * 1.20, vol: sigma * 1.5, weight: 0.25 },
  ];
  const K = strike || spot;
  const currVal = BS(spot, K, T, 0.05, sigma, orderType === "put" ? "put" : "call").price;
  let maxLoss = 0;
  scenarios.forEach(sc => {
    const newVal = BS(sc.price, K, Math.max(0.001, T - 1 / 365), 0.05, sc.vol, orderType === "put" ? "put" : "call").price;
    const scenLoss = side === "sell" ? Math.max(0, newVal - currVal) : Math.max(0, currVal - newVal);
    const weighted = scenLoss * (sc.weight || 1.0);
    if (weighted > maxLoss) maxLoss = weighted;
  });
  const exposureMargin = spot * 0.012;
  const spanMargin = Math.max(maxLoss, exposureMargin) * qty * 100;
  return {
    span: +spanMargin.toFixed(0),
    exposure: +(exposureMargin * qty * 100).toFixed(0),
    total: +(spanMargin * 1.1 + exposureMargin * qty * 100 * 0.5).toFixed(0),
    premium: +(currVal * qty * 100).toFixed(0),
  };
}

// ── ORDER TICKET MODAL ────────────────────────────────────────────────────────
function OrderTicket({ item, spot, vix, onConfirm, onCancel }) {
  const [orderType, setOrderType] = useState("market");
  const [limitPrice, setLimitPrice] = useState(item.price);
  const [triggerPrice, setTriggerPrice] = useState(item.side === "buy" ? +(item.price * 0.98).toFixed(2) : +(item.price * 1.02).toFixed(2));
  const [targetPrice, setTargetPrice] = useState(+(item.price * (item.side === "buy" ? 1.15 : 0.85)).toFixed(2));
  const [stopPrice, setStopPrice] = useState(+(item.price * (item.side === "buy" ? 0.93 : 1.07)).toFixed(2));
  const [gttExpiry, setGttExpiry] = useState("");
  const [validity, setValidity] = useState("DAY");
  const [showMargin, setShowMargin] = useState(false);

  const margin = useMemo(() => calcSPANMargin(item.type, spot, item.strike, parseFloat(item.iv) || 25, item.expDays, item.qty * (item.lotSize || 1), item.side), [item, spot]);
  const execPrice = orderType === "market" ? item.price : limitPrice;
  const totalCost = execPrice * item.qty * (item.lotSize || 1) * 100;
  const isBuy = item.side === "buy";

  const ORDER_TYPES = [
    { id: "market", label: "Market", desc: "Execute immediately at best price" },
    { id: "limit", label: "Limit", desc: "Execute only at your specified price or better" },
    { id: "sl", label: "SL", desc: "Stop Loss — triggers at SL price, executes at market" },
    { id: "sl_m", label: "SL-M", desc: "Stop Loss Market — triggers at SL, executes at market instantly" },
    { id: "bracket", label: "Bracket", desc: "Entry + Target + Stop Loss in one order" },
    { id: "cover", label: "Cover", desc: "Market order with compulsory stop loss" },
    { id: "gtt", label: "GTT", desc: "Good Till Triggered — stays active till price hit" },
  ];

  const inputSt = { background: "#080c14", border: "1px solid " + C.border, borderRadius: 7, padding: "8px 11px", color: C.text, fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const labelSt = { fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.9)" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
              <Badge bg={isBuy ? "#052e16" : "#3b0000"} color={isBuy ? C.green : C.red} size={11}>{item.side.toUpperCase()}</Badge>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{item.ticker} {item.type?.toUpperCase()} ${item.strike}</span>
              <span style={{ fontSize: 10, color: C.dim }}>{item.expDays}d exp · Δ {item.delta}</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>{item.qty} × {item.lotSize || 1} lots = {item.qty * (item.lotSize || 1) * 100} contracts</div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18, padding: 4, fontFamily: "inherit" }}>✕</button>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Order type selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>ORDER TYPE</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {ORDER_TYPES.map(ot => (
                <button key={ot.id} onClick={() => setOrderType(ot.id)}
                  style={{ padding: "7px 4px", background: orderType === ot.id ? (isBuy ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)") : "#0a0e18", border: "1px solid " + (orderType === ot.id ? (isBuy ? C.green : C.red) : C.border), borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700, color: orderType === ot.id ? (isBuy ? C.green : C.red) : C.dim, fontFamily: "inherit", textAlign: "center" }}>
                  {ot.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 6, padding: "6px 10px", background: "#0a0e18", borderRadius: 6, border: "1px solid " + C.border + "44" }}>
              ℹ️ {ORDER_TYPES.find(o => o.id === orderType)?.desc}
            </div>
          </div>

          {/* Price inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {(orderType === "limit" || orderType === "bracket") && (
              <div>
                <label style={labelSt}>LIMIT PRICE</label>
                <input type="number" value={limitPrice} onChange={e => setLimitPrice(+e.target.value)} style={inputSt} step="0.01" />
              </div>
            )}
            {(orderType === "sl" || orderType === "sl_m") && (
              <div>
                <label style={labelSt}>TRIGGER PRICE</label>
                <input type="number" value={triggerPrice} onChange={e => setTriggerPrice(+e.target.value)} style={inputSt} step="0.01" />
              </div>
            )}
            {orderType === "sl" && (
              <div>
                <label style={labelSt}>LIMIT PRICE (after trigger)</label>
                <input type="number" value={limitPrice} onChange={e => setLimitPrice(+e.target.value)} style={inputSt} step="0.01" />
              </div>
            )}
            {(orderType === "bracket" || orderType === "cover") && (
              <>
                <div>
                  <label style={labelSt}>STOP LOSS</label>
                  <input type="number" value={stopPrice} onChange={e => setStopPrice(+e.target.value)} style={{ ...inputSt, borderColor: C.red + "66" }} step="0.01" />
                </div>
                {orderType === "bracket" && (
                  <div>
                    <label style={labelSt}>TARGET / TAKE PROFIT</label>
                    <input type="number" value={targetPrice} onChange={e => setTargetPrice(+e.target.value)} style={{ ...inputSt, borderColor: C.green + "66" }} step="0.01" />
                  </div>
                )}
              </>
            )}
            {orderType === "gtt" && (
              <>
                <div>
                  <label style={labelSt}>TRIGGER PRICE</label>
                  <input type="number" value={triggerPrice} onChange={e => setTriggerPrice(+e.target.value)} style={inputSt} step="0.01" />
                </div>
                <div>
                  <label style={labelSt}>EXPIRY DATE (optional)</label>
                  <input type="date" value={gttExpiry} onChange={e => setGttExpiry(e.target.value)} style={inputSt} />
                </div>
              </>
            )}
            <div>
              <label style={labelSt}>VALIDITY</label>
              <select value={validity} onChange={e => setValidity(e.target.value)} style={{ ...inputSt, cursor: "pointer" }}>
                <option value="DAY">DAY (expires EOD)</option>
                <option value="IOC">IOC (Immediate or Cancel)</option>
                <option value="GTC">GTC (Good Till Cancelled)</option>
              </select>
            </div>
          </div>

          {/* SPAN Margin section */}
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setShowMargin(m => !m)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.yellow, fontSize: 10, fontWeight: 700, fontFamily: "inherit", padding: 0, marginBottom: showMargin ? 8 : 0 }}>
              🧮 {showMargin ? "▼" : "▶"} SPAN MARGIN CALCULATOR
            </button>
            {showMargin && (
              <div style={{ background: "#080c14", borderRadius: 8, padding: 14, border: "1px solid " + C.border }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 10 }}>Estimated margin requirement for this position (SPAN methodology)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    ["SPAN Margin", "$" + margin.span.toLocaleString(), C.yellow, "Core risk-based margin from price/vol scenarios"],
                    ["Exposure Margin", "$" + margin.exposure.toLocaleString(), C.orange, "Additional margin for extreme moves (5% buffer)"],
                    ["Total Margin Req.", "$" + margin.total.toLocaleString(), C.red, "SPAN + Exposure margin combined"],
                    ["Net Premium", "$" + margin.premium.toLocaleString(), isBuy ? C.green : C.red, isBuy ? "Premium you pay (debit)" : "Premium you collect (credit)"],
                  ].map(([label, val, col, hint]) => (
                    <div key={label} style={{ background: "#0b0f1a", borderRadius: 7, padding: "10px 12px" }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: col }}>{val}</div>
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 3, lineHeight: 1.4 }}>{hint}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: "8px 10px", background: "#0f1422", borderRadius: 6, border: "1px solid " + C.border + "44", fontSize: 10, color: C.dim, lineHeight: 1.5 }}>
                  <strong style={{ color: C.text }}>How SPAN works:</strong> 16 price × volatility scenarios are simulated. Your margin = worst-case loss across all scenarios. Actual exchange requirements may vary.
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div style={{ background: "#0a0e18", borderRadius: 8, padding: 14, marginBottom: 16, border: "1px solid " + (isBuy ? C.green : C.red) + "22" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                ["Execution Price", orderType === "market" ? "Market" : "$" + execPrice.toFixed(2), C.text],
                ["Total Cost", "$" + totalCost.toFixed(0), C.yellow],
                ["Order Type", ORDER_TYPES.find(o => o.id === orderType)?.label, C.blue],
              ].map(([l, v, col]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual order preview for bracket/cover */}
          {(orderType === "bracket" || orderType === "cover") && (
            <div style={{ marginBottom: 14, padding: 12, background: "#080c14", borderRadius: 8, border: "1px solid " + C.border }}>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 8 }}>ORDER LEVELS PREVIEW</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
                {orderType === "bracket" && (
                  <div style={{ flex: 1, textAlign: "center", padding: "6px 4px", background: "#052e16", borderRadius: "6px 0 0 6px", border: "1px solid " + C.green + "44" }}>
                    <div style={{ fontSize: 8, color: C.green }}>TARGET</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>${targetPrice}</div>
                  </div>
                )}
                <div style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: C.blue + "18", border: "1px solid " + C.blue + "44" }}>
                  <div style={{ fontSize: 8, color: C.blue }}>ENTRY</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>${execPrice.toFixed(2)}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "6px 4px", background: "#3b0000", borderRadius: "0 6px 6px 0", border: "1px solid " + C.red + "44" }}>
                  <div style={{ fontSize: 8, color: C.red }}>STOP</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>${stopPrice}</div>
                </div>
              </div>
              {orderType === "bracket" && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10 }}>
                  <span style={{ color: C.green }}>+{((targetPrice - execPrice) / execPrice * 100).toFixed(1)}% gain</span>
                  <span style={{ color: C.red }}>{((stopPrice - execPrice) / execPrice * 100).toFixed(1)}% loss</span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "12px", background: "#1a2535", color: C.dim, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={() => onConfirm({ orderType, limitPrice, triggerPrice, targetPrice, stopPrice, validity, gttExpiry, execPrice, totalCost })}
              style={{ flex: 2, padding: "12px", background: isBuy ? "linear-gradient(135deg,#14532d,#166534)" : "linear-gradient(135deg,#450a0a,#7f1d1d)", color: isBuy ? C.green : C.red, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", letterSpacing: "0.05em" }}>
              {isBuy ? "✓ BUY" : "✓ SELL"} — {ORDER_TYPES.find(o => o.id === orderType)?.label} Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MARGIN CALCULATOR PAGE ────────────────────────────────────────────────────
function MarginCalculatorPage({ spot, vix, ticker, iv: ivProp, chain }) {
  const [optType2, setOptType2] = useState("call");
  const [selectedStrike, setSelectedStrike] = useState(null);
  const [qty, setQty] = useState(1);
  const [side, setSide] = useState("sell");
  const [days2, setDays2] = useState(30);
  const iv = ivProp || 25;
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };

  const atmStrike = spot ? Math.round(spot / 10) * 10 : 100;
  const strikes = [];
  for (let p = -0.15; p <= 0.155; p += 0.025) strikes.push(+(spot * (1 + p)).toFixed(2));

  const selStrike = selectedStrike || atmStrike;
  const margin = useMemo(() => calcSPANMargin(optType2, spot, selStrike, iv * 100, days2, qty, side), [optType2, spot, selStrike, iv, days2, qty, side]);

  const scenarios = useMemo(() => {
    const rows = [];
    for (let p = -0.20; p <= 0.205; p += 0.05) {
      const sPrice = +(spot * (1 + p)).toFixed(2);
      const optVal = BS(sPrice, selStrike, Math.max(0.001, days2 / 365 - 1 / 365), 0.05, iv, optType2 === "put" ? "put" : "call");
      const currOptVal = BS(spot, selStrike, days2 / 365, 0.05, iv, optType2 === "put" ? "put" : "call");
      const pnl = side === "sell"
        ? (currOptVal.price - optVal.price) * qty * 100
        : (optVal.price - currOptVal.price) * qty * 100;
      rows.push({ move: (p * 100).toFixed(0) + "%", price: sPrice, pnl: +pnl.toFixed(0) });
    }
    return rows;
  }, [optType2, spot, selStrike, iv, days2, qty, side]);

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🧮 Margin & SPAN Calculator</div>
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>Simulate margin requirements using 16-scenario SPAN methodology</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="main-grid-2">
        {/* Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontSize: 9, color: C.blue, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>POSITION PARAMETERS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Side */}
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 6 }}>SIDE</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["buy", "BUY", C.green], ["sell", "SELL", C.red]].map(([id, label, col]) => (
                    <button key={id} onClick={() => setSide(id)}
                      style={{ flex: 1, padding: "8px", background: side === id ? col + "22" : "#0a0e18", border: "1px solid " + (side === id ? col : C.border), borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: side === id ? col : C.dim, fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Type */}
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 6 }}>OPTION TYPE</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["call", "CALL"], ["put", "PUT"]].map(([id, label]) => (
                    <button key={id} onClick={() => setOptType2(id)}
                      style={{ flex: 1, padding: "8px", background: optType2 === id ? "rgba(56,189,248,0.15)" : "#0a0e18", border: "1px solid " + (optType2 === id ? C.blue : C.border), borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: optType2 === id ? C.blue : C.dim, fontFamily: "inherit" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Strike */}
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 6 }}>STRIKE PRICE — {ticker} spot: ${spot?.toFixed(2)}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {strikes.filter((_, i) => i % 2 === 0).map(k => (
                    <button key={k} onClick={() => setSelectedStrike(k)}
                      style={{ padding: "4px 8px", background: selStrike === k ? "rgba(56,189,248,0.2)" : "#0a0e18", border: "1px solid " + (selStrike === k ? C.blue : (Math.abs(k - spot) < spot * 0.013 ? C.yellow + "66" : C.border)), borderRadius: 5, cursor: "pointer", fontSize: 10, color: selStrike === k ? C.blue : (Math.abs(k - spot) < spot * 0.013 ? C.yellow : C.dim), fontFamily: "inherit", fontWeight: selStrike === k ? 700 : 400 }}>
                      ${k}
                    </button>
                  ))}
                </div>
              </div>
              {/* Qty */}
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 6 }}>QUANTITY (lots)</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 5, 10, 25].map(n => (
                    <button key={n} onClick={() => setQty(n)}
                      style={{ flex: 1, padding: "7px 4px", background: qty === n ? "rgba(56,189,248,0.15)" : "#0a0e18", border: "1px solid " + (qty === n ? C.blue : C.border), borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, color: qty === n ? C.blue : C.dim, fontFamily: "inherit" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {/* DTE */}
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, marginBottom: 6 }}>DAYS TO EXPIRY</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[7, 14, 30, 45, 60, 90].map(d => (
                    <button key={d} onClick={() => setDays2(d)}
                      style={{ flex: 1, padding: "7px 2px", background: days2 === d ? "rgba(56,189,248,0.15)" : "#0a0e18", border: "1px solid " + (days2 === d ? C.blue : C.border), borderRadius: 5, cursor: "pointer", fontSize: 9, fontWeight: 700, color: days2 === d ? C.blue : C.dim, fontFamily: "inherit" }}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Margin result */}
          <div style={{ ...card, border: "1px solid " + C.yellow + "44" }}>
            <div style={{ fontSize: 9, color: C.yellow, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>MARGIN REQUIREMENT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["SPAN Margin", "$" + margin.span.toLocaleString(), C.yellow, "Risk-based (16 scenarios)"],
                ["Exposure Margin", "$" + margin.exposure.toLocaleString(), C.orange, "Exchange buffer margin"],
                ["Total Required", "$" + margin.total.toLocaleString(), C.red, "Total to keep in account"],
                [side === "buy" ? "Premium Paid" : "Premium Received", "$" + margin.premium.toLocaleString(), side === "buy" ? C.green : C.teal, side === "buy" ? "Debit to your account" : "Credit to your account"],
              ].map(([label, val, col, hint]) => (
                <div key={label} style={{ background: "#080c14", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: col, marginBottom: 3 }}>{val}</div>
                  <div style={{ fontSize: 9, color: C.dim, lineHeight: 1.4 }}>{hint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scenarios table */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>P&L SCENARIO ANALYSIS</div>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 10 }}>
              {side === "sell" ? "SELL" : "BUY"} {qty} lot × {optType2.toUpperCase()} ${selStrike} — {days2}d
            </div>
            {scenarios.map((sc, i) => {
              const maxAbs = Math.max(...scenarios.map(s => Math.abs(s.pnl)), 1);
              const pct = Math.abs(sc.pnl) / maxAbs * 100;
              const isPos = sc.pnl >= 0;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "50px 80px 1fr 80px", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: parseFloat(sc.move) > 0 ? C.green : parseFloat(sc.move) < 0 ? C.red : C.muted }}>{sc.move}</div>
                  <div style={{ fontSize: 10, color: C.dim }}>${sc.price}</div>
                  <div style={{ background: "#1a2535", borderRadius: 3, height: 6, overflow: "hidden" }}>
                    <div style={{ height: 6, borderRadius: 3, width: pct + "%", background: isPos ? C.green : C.red, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isPos ? C.green : C.red, textAlign: "right" }}>{isPos ? "+" : ""}${sc.pnl.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
          <div style={card}>
            <div style={{ fontSize: 9, color: C.teal, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>HOW SPAN WORKS</div>
            {[
              ["16 Scenarios", "Price moves ±3%, ±6%, ±9%, ±12%, ±15%, ±20% + flat with IV up/down"],
              ["Worst Case", "Maximum loss across all scenarios = your SPAN margin"],
              ["Exposure Margin", "Additional 1.2% of notional value as exchange buffer"],
              ["Total Margin", "SPAN × 1.1 + (Exposure × 0.5) — aligns with NSE/BSE methodology"],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid " + C.border + "22" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── INDEX LABELS ──────────────────────────────────────────────────────────────
const INDEX_LABELS = { SPY: "S&P 500", QQQ: "NASDAQ 100", DIA: "DOW JONES", IWM: "RUSSELL 2K" };

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("market");
  const [ticker, setTicker] = useState("AAPL");
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState({});
  const [vix, setVix] = useState(simVix);
  const [history, setHistory] = useState([]);
  const [histRange, setHistRange] = useState("3mo");
  const [chartType, setChartType] = useState("area");
  const [strategy, setStrategy] = useState("Bull Call Spread");
  const [days, setDays] = useState(45);
  const [optExp, setOptExp] = useState(30);
  const [optType, setOptType] = useState("call");
  const [calls, setCalls] = useState([]);
  const [puts, setPuts] = useState([]);
  const [aiRes, setAiRes] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [trades, setTrades] = useState([]);
  const [cash, setCash] = useState(50000);
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);
  const [marketTab, setMarketTab] = useState("sp500");
  const [optTab, setOptTab] = useState("chain");
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderTicket, setOrderTicket] = useState(null); // item being reviewed in OrderTicket modal
  // ── NEW: index sparkline history ──
  const [indexHistory, setIndexHistory] = useState({});
  // ── Strategy builder quantity + lot size ──
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeLotSize, setTradeLotSize] = useState(1);
  // ── Options chain size ──
  const [chainQty, setChainQty] = useState(1);
  const [chainLotSize, setChainLotSize] = useState(1);

  const tickerRef = useRef(ticker);
  tickerRef.current = ticker;

  const showToast = useCallback((msg, type) => { setToast({ msg, type: type || "ok" }); setTimeout(() => setToast(null), 4000); }, []);

  // ── Seed index sparklines once on mount ──
  useEffect(() => {
    const indices = ["SPY", "QQQ", "DIA", "IWM"];
    const h = {};
    indices.forEach(s => {
      initPriceState(s);
      h[s] = generateHistory(s, "1mo");
    });
    setIndexHistory(h);
  }, []);

  useEffect(() => {
    const allSyms = [...new Set([...QUICK, ...SP500.slice(0, 40), "SPY", "QQQ", "DIA", "IWM", "TSLA", "NVDA", "AMD"])];
    allSyms.forEach(s => initPriceState(s));
    const initial = {};
    allSyms.forEach(s => { initial[s] = getQuote(s); });
    setQuotes(initial);
    setVix(tickVix());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuotes(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(s => { tickPrice(s); next[s] = getQuote(s); });
        const cur = tickerRef.current;
        if (!next[cur]) { initPriceState(cur); next[cur] = getQuote(cur); }
        return next;
      });
      setVix(tickVix());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    initPriceState(ticker);
    setHistory(generateHistory(ticker, histRange));
    setQuotes(prev => { if (prev[ticker]) return prev; return { ...prev, [ticker]: getQuote(ticker) }; });
  }, [ticker, histRange]);

  const getIV = useCallback((sym, vixVal) => {
    const beta = BETA[sym] || 1.2;
    const q = quotes[sym];
    const extra = q ? Math.abs(q.pct / 100) * 0.35 : 0;
    return Math.max(0.08, (vixVal || 20) / 100 * beta * 1.15 + extra);
  }, [quotes]);

  useEffect(() => {
    const q = quotes[ticker]; if (!q || !vix) return;
    const iv = getIV(ticker, vix); const T = optExp / 365;
    setCalls(genChain(q.price, iv, T, vix, "call"));
    setPuts(genChain(q.price, iv, T, vix, "put"));
  }, [ticker, quotes, vix, optExp, getIV]);

  const spot = (quotes[ticker]?.price) || BASE_PRICES[ticker] || 150;
  const iv = getIV(ticker, vix || 20);
  const ivPct = +(iv * 100).toFixed(1);
  const q = quotes[ticker];
  const up = q ? q.change >= 0 : true;
  const payoff = useMemo(() => calcPayoff(strategy, spot, ivPct, days), [strategy, spot, ivPct, days]);
  const chain = optType === "call" ? calls : puts;
  const openTrades = trades.filter(t => t.status === "open");
  const closedTrades = trades.filter(t => t.status === "closed");
  const totalPnl = closedTrades.reduce((a, t) => a + t.pnl, 0);
  const cartTotal = cart.reduce((a, x) => a + x.price * x.qty * (x.lotSize || 1) * 100, 0);
  const searchResults = search ? ALL_TICKERS.filter(t => t.includes(search.toUpperCase())).slice(0, 24) : null;
  const allQuoteVals = Object.values(quotes).filter(q2 => q2?.sym && SP500.includes(q2.sym));
  const sortedGain = [...allQuoteVals].sort((a, b) => b.pct - a.pct);
  const pnlChartData = useMemo(() => { const all = [...openTrades, ...closedTrades].sort((a, b) => a.id - b.id); let running = 0; return all.map(t => { running += t.pnl || 0; return { name: t.ticker, pnl: +(t.pnl || 0).toFixed(0), cumPnl: +running.toFixed(0) }; }); }, [openTrades, closedTrades]);

  const addToCart = useCallback((row, type, side) => {
    const price = side === "buy" ? row.ask : row.bid;
    const item = { id: Date.now(), ticker, strike: row.strike, type, side, expDays: optExp, price, iv: row.iv, delta: row.delta, qty: chainQty, lotSize: chainLotSize };
    setOrderTicket(item);
  }, [ticker, optExp, chainQty, chainLotSize]);

  const confirmOrderTicket = useCallback((item, orderDetails) => {
    const { execPrice, totalCost, orderType, limitPrice, triggerPrice, targetPrice, stopPrice, validity } = orderDetails;
    const enhancedItem = { ...item, price: execPrice, orderType, limitPrice, triggerPrice, targetPrice, stopPrice, validity };
    setCart(c => [...c, enhancedItem]);
    setOrderTicket(null);
    showToast(`${orderType.toUpperCase()} order added: ${item.side.toUpperCase()} ${item.type.toUpperCase()} $${item.strike} — $${totalCost.toFixed(0)}`);
  }, [showToast]);
  const removeFromCart = useCallback(idx => setCart(c => c.filter((_, j) => j !== idx)), []);
  const updateCartItem = useCallback((idx, patch) => setCart(c => c.map((item, j) => j === idx ? { ...item, ...patch } : item)), []);

  const executeTrade = useCallback(() => {
    if (!cart.length) { showToast("Select options first", "err"); return; }
    if (cartTotal > cash) { showToast("Insufficient balance", "err"); return; }
    const t = { id: Date.now(), ticker, strategy: "Custom: " + cart.map(x => x.side.toUpperCase() + " " + x.type + " $" + x.strike).join(" / "), spot, iv: ivPct, vix: vix || 20, days: optExp, cost: cartTotal, maxP: payoff.maxProfit, maxL: payoff.maxLoss, opened: new Date().toLocaleDateString(), expiry: new Date(Date.now() + optExp * 864e5).toLocaleDateString(), pnl: 0, status: "open", verdict: "MANUAL", conf: 0 };
    setTrades(upd => [t, ...upd]); setCash(nc => nc - cartTotal); setCart([]);
    showToast("Order executed: $" + cartTotal.toFixed(0) + " deducted");
  }, [cart, cartTotal, cash, ticker, spot, ivPct, vix, optExp, payoff, showToast]);

  const executeStrategy = useCallback(() => {
    if (!aiRes) { showToast("Run AI Analysis first", "err"); return; }
    const multiplier = tradeQty * tradeLotSize;
    const cost = Math.abs(payoff.cost) * multiplier;
    if (cost > cash) { showToast("Insufficient balance", "err"); return; }
    const t = {
      id: Date.now(), ticker, strategy, spot, iv: ivPct, vix: vix || 20, days, cost,
      qty: tradeQty, lotSize: tradeLotSize, contracts: multiplier,
      maxP: payoff.maxProfit * multiplier, maxL: payoff.maxLoss * multiplier,
      opened: new Date().toLocaleDateString(),
      expiry: new Date(Date.now() + days * 864e5).toLocaleDateString(),
      pnl: 0, status: "open", verdict: aiRes.verdict, conf: aiRes.confidence
    };
    setTrades(upd => [t, ...upd]); setCash(nc => nc - cost);
    setTradeQty(1); setTradeLotSize(1);
    showToast(`Placed ${multiplier} contract${multiplier > 1 ? "s" : ""}: ${strategy} on ${ticker} — $${cost.toFixed(0)}`);
  }, [aiRes, payoff, cash, ticker, strategy, spot, ivPct, vix, days, tradeQty, tradeLotSize, showToast]);

  const handleClose = useCallback((id) => {
    const t = trades.find(x => x.id === id); if (!t) return;
    const lp = (quotes[t.ticker]?.price) || t.spot;
    const mv = (lp - t.spot) / t.spot;
    const pnl = +(mv * t.cost * (mv > 0 ? 2.1 : 0.65)).toFixed(2);
    setTrades(upd => upd.map(x => x.id === id ? { ...x, status: "closed", pnl, closeDate: new Date().toLocaleDateString() } : x));
    setCash(nc => nc + t.cost + pnl);
    showToast("Closed: " + (pnl >= 0 ? "+" : "") + "$" + pnl, pnl >= 0 ? "ok" : "err");
  }, [trades, quotes, showToast]);

  const handleAnalyse = useCallback(async () => {
    setAiLoading(true); setAiRes(null);
    const r = await runAI(strategy, ticker, spot, ivPct, vix || 20, days, payoff.maxProfit, payoff.maxLoss);
    setAiRes(r); setAiLoading(false);
  }, [strategy, ticker, spot, ivPct, vix, days, payoff]);

  const selectTicker = (sym) => { setTicker(sym); setPage("options"); setMenuOpen(false); };
  const selectStrategy = (name) => { setStrategy(name); setPage("trade"); setMenuOpen(false); };

  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };
  const inp = { width: "100%", background: "#080c14", border: "1px solid " + C.border, borderRadius: 7, padding: "8px 11px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const sel = Object.assign({}, inp, { cursor: "pointer" });
  const tabSt = a => ({ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "inherit", background: a ? "rgba(56,189,248,0.15)" : C.card, color: a ? C.blue : C.dim, transition: "all .15s" });
  const btnSt = v => { const b = { padding: "9px 18px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "inherit", transition: "all .15s" }; if (v === "primary") return { ...b, background: "linear-gradient(135deg,#0369a1,#0ea5e9)", color: "#fff", boxShadow: "0 4px 14px rgba(14,165,233,0.25)" }; if (v === "success") return { ...b, background: "#14532d", color: C.green }; if (v === "danger") return { ...b, background: "#450a0a", color: C.red }; return { ...b, background: "#1a2535", color: "#8898aa" }; };

  const ALL_PAGES = [["market", "Market"], ["options", "Options"], ["trade", "Builder"], ["greeks", "Greeks"], ["scanner", "Scanner"], ["watchlist", "Watchlist"], ["portfolio", "Portfolio"], ["margin", "🧮 Margin"], ["ai_hub", "🤖 AI Hub"], ["learn", "🎓 Academy"], ["recommender", "Recommender"]];

  return (
    <div style={{ fontFamily: "'Space Mono',monospace", background: C.bg, minHeight: "100vh", color: C.text, fontSize: 13 }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Order Ticket Modal */}
      {orderTicket && (
        <OrderTicket
          item={orderTicket}
          spot={spot}
          vix={vix}
          onConfirm={(details) => confirmOrderTicket(orderTicket, details)}
          onCancel={() => setOrderTicket(null)}
        />
      )}
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        *{scrollbar-width:thin;scrollbar-color:#1c2838 transparent}
        @media(max-width:768px){
          .desktop-nav{display:none!important}.mobile-menu-btn{display:flex!important}
          .main-grid-2{grid-template-columns:1fr!important}.main-grid-3{grid-template-columns:1fr!important}
          .main-grid-4{grid-template-columns:1fr 1fr!important}.chain-table{font-size:9px!important}
        }
        @media(min-width:769px){.mobile-menu-btn{display:none!important}.mobile-nav{display:none!important}}
      `}</style>

      {toast && <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999, background: toast.type === "err" ? "#450a0a" : "#0a2a1a", border: "1px solid " + (toast.type === "err" ? C.red : C.green), borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 700, color: toast.type === "err" ? C.red : C.green, boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>{toast.msg}</div>}

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderBottom: "1px solid " + C.border, background: "rgba(6,8,15,0.98)", position: "sticky", top: 0, zIndex: 200, backdropFilter: "blur(20px)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.blue, letterSpacing: "0.18em", marginRight: 4 }}>OPTIFLOW</div>
        <div className="desktop-nav" style={{ display: "flex", gap: 2, flexWrap: "nowrap", overflowX: "auto" }}>
          {ALL_PAGES.map(([id, label]) => <button key={id} style={tabSt(page === id)} onClick={() => setPage(id)}>{label}</button>)}
        </div>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(m => !m)} style={{ padding: "6px 10px", background: "#1a2535", color: C.blue, border: "1px solid " + C.border, borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>☰ Menu</button>
        {cart.length > 0 && <button style={{ ...btnSt("primary"), marginLeft: 4, padding: "5px 12px", fontSize: 10 }} onClick={() => setPage("options")}>Order ({cart.length})</button>}
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
          <div><div style={{ fontSize: 8, color: C.muted }}>CASH</div><div style={{ fontSize: 12, fontWeight: 700, color: C.green }}>${cash.toLocaleString()}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: C.teal }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.teal, display: "inline-block", animation: "pulse 2s infinite" }} />SIM LIVE
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid " + C.border, paddingLeft: 14 }}>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: "0.08em" }}>LIVE TIME</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
              {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && <div className="mobile-nav" style={{ background: "#0b0f1a", border: "1px solid " + C.border, padding: 12, borderBottom: "1px solid " + C.border }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>{ALL_PAGES.map(([id, label]) => <button key={id} onClick={() => { setPage(id); setMenuOpen(false); }} style={{ padding: "8px", background: page === id ? "rgba(56,189,248,0.15)" : "#0f1422", border: "1px solid " + (page === id ? C.blue : C.border), borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700, color: page === id ? C.blue : C.dim, fontFamily: "inherit" }}>{label}</button>)}</div></div>}

      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "16px 14px" }}>

        {/* ── MARKET ── */}
        {page === "market" && (
          <div>
            <div style={{ background: "#0a1220", border: "1px solid " + C.teal + "44", borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.teal }}>
              <span>●</span><span>Prices are <strong>simulated</strong> using realistic base prices + live random walk. Options math is real Black-Scholes. AI analysis via Claude API. Paper trading only.</span>
            </div>

            {/* ── INDEX CARDS WITH SPARKLINES ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }} className="main-grid-4">
              {["SPY", "QQQ", "DIA", "IWM"].map(s => {
                const iq = quotes[s];
                const iup = iq ? iq.change >= 0 : true;
                const sparkColor = iup ? C.green : C.red;
                return (
                  <div
                    key={s}
                    style={{
                      ...card,
                      cursor: "pointer",
                      padding: "14px 14px 0",
                      overflow: "hidden",
                      transition: "border-color .15s",
                    }}
                    onClick={() => selectTicker(s)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3 }}>
                          {INDEX_LABELS[s]}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>{s}</div>
                      </div>
                      {iq && (
                        <div style={{
                          fontSize: 9, fontWeight: 700,
                          color: iup ? C.green : C.red,
                          background: iup ? "#052e16" : "#3b0000",
                          padding: "2px 6px", borderRadius: 5
                        }}>
                          {iup ? "+" : ""}{iq.pct}%
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {iq ? (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: iup ? C.green : C.red, lineHeight: 1 }}>
                            ${iq.price}
                          </span>
                          <SimTag />
                        </div>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>
                          {iup ? "+" : ""}{iq.change} &nbsp;·&nbsp; H: ${iq.high} &nbsp;·&nbsp; L: ${iq.low}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>Loading…</div>
                    )}

                    {/* Sparkline — flush to card bottom */}
                    <div style={{ margin: "0 -14px" }}>
                      <SparklineChart data={indexHistory[s]} color={sparkColor} sym={s} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...card, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}><VIXMeter vix={vix} /></div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input style={inp} placeholder="Search ticker…" value={search} onChange={e => setSearch(e.target.value)} />
              {searchResults && (<div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.card, border: "1px solid " + C.border, borderRadius: 8, zIndex: 50, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}>{searchResults.map(s => { const sq = quotes[s]; if (!sq) { initPriceState(s); } const freshQ = sq || getQuote(s); const freshUp = freshQ.change >= 0; return <div key={s} onClick={() => { setTicker(s); setSearch(""); setPage("options"); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid " + C.border + "22", fontSize: 12, fontWeight: 700, color: C.blue, display: "flex", justifyContent: "space-between" }}><span>{s}</span><span style={{ color: freshUp ? C.green : C.red }}>${freshQ.price} {freshQ.pct >= 0 ? "+" : ""}{freshQ.pct}%</span></div>; })}</div>)}
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4, scrollbarWidth: "none" }}>
              {QUICK.map(s => { const tq = quotes[s]; const tup = tq ? tq.change >= 0 : true; return <div key={s} onClick={() => selectTicker(s)} style={{ padding: "8px 12px", background: ticker === s ? "rgba(56,189,248,0.1)" : C.card, border: "1px solid " + (ticker === s ? C.blue : C.border), borderRadius: 7, cursor: "pointer", minWidth: 88, transition: "all .15s", flexShrink: 0 }}><div style={{ fontWeight: 700, color: ticker === s ? C.blue : C.text, fontSize: 11 }}>{s}</div>{tq ? (<div><div style={{ fontSize: 13, fontWeight: 700, color: tup ? C.green : C.red }}>${tq.price}</div><div style={{ fontSize: 10, color: tup ? C.green : C.red }}>{tup ? "+" : ""}{tq.pct}%</div></div>) : <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>…</div>}</div>; })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }} className="main-grid-2">
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>{[["sp500", "S&P 500"], ["nasdaq", "NASDAQ 100"], ["gainers", "Gainers"], ["losers", "Losers"]].map(([id, label]) => <button key={id} style={tabSt(marketTab === id)} onClick={() => setMarketTab(id)}>{label}</button>)}</div>
                {(marketTab === "sp500" || marketTab === "nasdaq") && (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 8 }}>{(marketTab === "sp500" ? SP500 : NASDAQ_EXTRA).slice(0, 80).map(s => { const sq = quotes[s]; const sup = sq ? sq.change >= 0 : true; return <div key={s} onClick={() => selectTicker(s)} style={{ background: C.card2, border: "1px solid " + C.border, borderRadius: 8, padding: 10, cursor: "pointer", transition: "border .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.blue} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}><div style={{ fontWeight: 700, fontSize: 11, color: marketTab === "nasdaq" ? C.teal : C.text }}>{s}</div>{sq ? (<div><div style={{ fontSize: 12, fontWeight: 700, color: sup ? C.green : C.red }}>${sq.price}</div><div style={{ fontSize: 9, color: sup ? C.green : C.red }}>{sup ? "+" : ""}{sq.pct}%</div></div>) : <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>—</div>}</div>; })}</div>)}
                {(marketTab === "gainers" || marketTab === "losers") && (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{(marketTab === "gainers" ? sortedGain : [...sortedGain].reverse()).slice(0, 10).map(gq => { const gup = gq.pct >= 0; return <div key={gq.sym} onClick={() => selectTicker(gq.sym)} style={Object.assign({}, card, { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" })}><div><div style={{ fontWeight: 700, fontSize: 14 }}>{gq.sym}<SimTag /></div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 700, color: gup ? C.green : C.red }}>${gq.price}</div><div style={{ color: gup ? C.green : C.red }}>{gup ? "+" : ""}{gq.pct}%</div></div></div>; })}</div>)}
              </div>
              <MarketNews vix={vix} quotes={quotes} />
            </div>
          </div>
        )}

        {/* ── OPTIONS CHAIN ── */}
        {page === "options" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <select style={Object.assign({}, sel, { width: 120, fontSize: 14, fontWeight: 700 })} value={ticker} onChange={e => setTicker(e.target.value)}>
                    {ALL_TICKERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {q && <Badge bg={up ? "#052e16" : "#3b0000"} color={up ? C.green : C.red} size={11}>{up ? "+" : ""}{q.pct}% TODAY</Badge>}
                  {q && <Badge bg="#0f1a2c" color={C.blue} size={10}>IV {ivPct}%</Badge>}
                  <SimTag />
                </div>
                {q && <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.dim, flexWrap: "wrap", alignItems: "baseline" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: up ? C.green : C.red }}>${q.price}</span>
                  <span>H: ${q.high}</span><span>L: ${q.low}</span><span>Prev: ${q.prev}</span>
                </div>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select style={Object.assign({}, sel, { width: 80 })} value={histRange} onChange={e => setHistRange(e.target.value)}>
                  {["1mo", "3mo", "6mo", "1y", "2y"].map(r => <option key={r}>{r}</option>)}
                </select>
                <button style={btnSt("primary")} onClick={() => setPage("trade")}>Builder</button>
                <button style={btnSt("default")} onClick={() => setPage("greeks")}>Greeks</button>
                <button style={btnSt("default")} onClick={() => setPage("margin")}>🧮 Margin</button>
              </div>
            </div>
            <div style={Object.assign({}, card, { marginBottom: 14 })}>
              <PriceChart history={history} ticker={ticker} up={up} chartType={chartType} setChartType={setChartType} />
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, color: C.muted }}>EXPIRY:</span>
              {[7, 14, 21, 30, 45, 60, 90].map(d => <button key={d} style={tabSt(optExp === d)} onClick={() => setOptExp(d)}>{d}d</button>)}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              {[["chain", "Chain"], ["smile", "IV Smile"]].map(([id, label]) => <button key={id} style={tabSt(optTab === id)} onClick={() => setOptTab(id)}>{label}</button>)}
              {cart.length > 0 && <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: C.yellow }}>{cart.length} leg(s) — ${cartTotal.toFixed(0)}</span>
                <button style={Object.assign({}, btnSt("success"), { padding: "6px 12px", fontSize: 10 })} onClick={executeTrade}>Execute</button>
                <button style={Object.assign({}, btnSt("danger"), { padding: "6px 12px", fontSize: 10 })} onClick={() => setCart([])}>Clear</button>
              </div>}
            </div>
            {optTab === "chain" && (
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button style={tabSt(optType === "call")} onClick={() => setOptType("call")}>Calls</button>
                  <button style={tabSt(optType === "put")} onClick={() => setOptType("put")}>Puts</button>
                </div>

                {/* ── ORDER SIZE BAR ── */}
                <div style={{ background: "#090e1a", border: "1px solid " + C.border, borderRadius: 9, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, letterSpacing: "0.1em", flexShrink: 0 }}>ORDER SIZE</div>

                  {/* Qty stepper */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: C.dim, fontWeight: 700 }}>QTY</span>
                    <div style={{ display: "flex", alignItems: "center", background: "#060a10", borderRadius: 6, border: "1px solid " + C.border, overflow: "hidden" }}>
                      <button onClick={() => setChainQty(q => Math.max(1, q - 1))}
                        style={{ width: 28, height: 28, background: chainQty <= 1 ? "transparent" : "#131b2a", border: "none", borderRight: "1px solid " + C.border, color: chainQty <= 1 ? C.muted : C.text, fontSize: 16, fontWeight: 700, cursor: chainQty <= 1 ? "default" : "pointer", fontFamily: "inherit" }}>−</button>
                      <input type="number" min={1} max={99} value={chainQty}
                        onChange={e => setChainQty(Math.max(1, Math.min(99, +e.target.value || 1)))}
                        style={{ width: 36, background: "transparent", border: "none", outline: "none", color: C.blue, fontSize: 14, fontWeight: 700, textAlign: "center", fontFamily: "inherit", padding: "0 2px" }} />
                      <button onClick={() => setChainQty(q => Math.min(99, q + 1))}
                        style={{ width: 28, height: 28, background: chainQty >= 99 ? "transparent" : "#131b2a", border: "none", borderLeft: "1px solid " + C.border, color: chainQty >= 99 ? C.muted : C.text, fontSize: 16, fontWeight: 700, cursor: chainQty >= 99 ? "default" : "pointer", fontFamily: "inherit" }}>+</button>
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[1, 5, 10, 25].map(n => (
                        <button key={n} onClick={() => setChainQty(n)}
                          style={{ padding: "3px 7px", background: chainQty === n ? "rgba(56,189,248,0.18)" : "#0f1422", border: "1px solid " + (chainQty === n ? C.blue : C.border), borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 700, color: chainQty === n ? C.blue : C.dim, fontFamily: "inherit" }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

                  {/* Lot size */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: C.dim, fontWeight: 700 }}>LOT</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {LOT_SIZES.map(l => (
                        <button key={l} onClick={() => setChainLotSize(l)}
                          style={{ padding: "3px 8px", background: chainLotSize === l ? "rgba(45,212,191,0.15)" : "#0f1422", border: "1px solid " + (chainLotSize === l ? C.teal : C.border), borderRadius: 4, cursor: "pointer", fontSize: 10, fontWeight: 700, color: chainLotSize === l ? C.teal : C.dim, fontFamily: "inherit" }}>{l}×</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

                  {/* Live summary */}
                  <div style={{ display: "flex", gap: 16, fontSize: 11, flexShrink: 0, flexWrap: "wrap" }}>
                    <div><span style={{ color: C.dim, fontSize: 9 }}>CONTRACTS </span><strong style={{ color: C.text }}>{chainQty * chainLotSize}</strong></div>
                    <div><span style={{ color: C.dim, fontSize: 9 }}>EST. COST (ATM) </span><strong style={{ color: C.yellow }}>${chain.length ? ((chain.find(r => Math.abs(r.strike - spot) === Math.min(...chain.map(r => Math.abs(r.strike - spot))))?.ask || 0) * chainQty * chainLotSize * 100).toFixed(0) : "—"}</strong></div>
                  </div>
                </div>

                <div style={card}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="chain-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead><tr style={{ borderBottom: "1px solid " + C.border }}>{["", "Strike", "Bid", "Ask", "Last", "IV%", "Delta", "Gamma", "Theta", "Vega", "Vol", "OI", "Action"].map((h, i) => <th key={i} style={{ padding: "6px 8px", color: C.dim, textAlign: i < 2 ? "left" : "right", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                      <tbody>{chain.map((row, i) => <ChainRow key={i} row={row} spot={spot} type={optType} onBuy={() => addToCart(row, optType, "buy")} onSell={() => addToCart(row, optType, "sell")} />)}</tbody>
                    </table>
                  </div>
                </div>
                {cart.length > 0 && (
                  <div style={Object.assign({}, card, { marginTop: 12, border: "1px solid " + C.yellow + "44" })}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.yellow, letterSpacing: "0.12em" }}>PENDING ORDER — {cart.length} LEG{cart.length > 1 ? "S" : ""}</div>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Adjust quantity and lot size before executing</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.muted }}>TOTAL COST</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.yellow }}>${cartTotal.toFixed(0)}</div>
                      </div>
                    </div>

                    {/* Cart legs */}
                    {cart.map((item, i) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onRemove={() => removeFromCart(i)}
                        onQtyChange={qty => updateCartItem(i, { qty })}
                        onLotChange={lotSize => updateCartItem(i, { lotSize })}
                      />
                    ))}

                    {/* Order summary footer */}
                    <div style={{ borderTop: "1px solid " + C.border, marginTop: 10, paddingTop: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                        {[
                          ["Legs", cart.length],
                          ["Total Contracts", cart.reduce((a, x) => a + x.qty * (x.lotSize || 1), 0)],
                          ["Buying Power", "$" + cartTotal.toFixed(0)],
                        ].map(([label, val]) => (
                          <div key={label} style={{ background: "#080c14", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button style={Object.assign({}, btnSt("success"), { padding: "9px 22px" })} onClick={executeTrade}>Execute Order</button>
                        <button style={btnSt()} onClick={() => setCart([])}>Clear All</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {optTab === "smile" && (
              <div style={card}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 10 }}>IV SMILE — {ticker}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart margin={{ top: 4, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke={C.border} />
                    <XAxis dataKey="strike" type="number" domain={["auto", "auto"]} stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => "$" + v} />
                    <YAxis stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => v + "%"} />
                    <Tooltip contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 6, fontSize: 11 }} formatter={(v, n) => [v + "%", n]} />
                    <ReferenceLine x={spot} stroke={C.blue} strokeDasharray="3 3" label={{ value: "Spot", fill: C.blue, fontSize: 9 }} />
                    <Line data={calls} type="monotone" dataKey="iv" stroke={C.green} strokeWidth={2} dot={false} name="Call IV" />
                    <Line data={puts} type="monotone" dataKey="iv" stroke={C.red} strokeWidth={2} dot={false} name="Put IV" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ── STRATEGY BUILDER ── */}
        {page === "trade" && (
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Strategy Builder</div>
              <select style={Object.assign({}, sel, { width: 150 })} value={ticker} onChange={e => { setTicker(e.target.value); setAiRes(null); }}>{ALL_TICKERS.map(s => <option key={s}>{s}</option>)}</select>
              {q && <div style={{ fontSize: 13, fontWeight: 700, color: up ? C.green : C.red }}>${q.price}</div>}
              {q && <Badge bg="#0f1a2c" color={C.blue} size={10}>IV {ivPct}%</Badge>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: 14 }} className="main-grid-2">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={card}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: C.blue, marginBottom: 12 }}>CONFIGURE</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: C.dim, display: "block", marginBottom: 4 }}>STRATEGY</label>
                    <select style={sel} value={strategy} onChange={e => { setStrategy(e.target.value); setAiRes(null); }}>{Object.keys(STRATS).map(n => <option key={n}>{n}</option>)}</select>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{STRATS[strategy].desc}</div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: C.dim, display: "block", marginBottom: 4 }}>DTE: <strong style={{ color: C.blue }}>{days}d</strong></label>
                    <input type="range" min={1} max={180} value={days} onChange={e => { setDays(+e.target.value); setAiRes(null); }} style={{ width: "100%", accentColor: C.blue }} />
                  </div>
                  <div style={{ borderTop: "1px solid " + C.border, margin: "10px 0" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
                    {[["IV", ivPct + "%", C.yellow], ["VIX", vix ? vix.toFixed(1) : "—", vix && vix < 20 ? C.green : C.yellow], ["Max Profit", "$" + payoff.maxProfit.toFixed(0), C.green], ["Max Loss", "$" + Math.abs(payoff.maxLoss).toFixed(0), C.red], ["Net Cost", "$" + Math.abs(payoff.cost).toFixed(0), C.text], ["BE", payoff.breakevens.length ? payoff.breakevens.join(", ") : "—", C.teal]].map(([label, val, col]) => (<div key={label} style={{ background: "#080c14", borderRadius: 7, padding: "8px 10px" }}><div style={{ fontSize: 9, color: C.muted }}>{label}</div><div style={{ fontSize: 12, fontWeight: 700, color: col, marginTop: 2 }}>{val}</div></div>))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                    {[["Delta", payoff.greeks.delta, C.blue], ["Gamma", payoff.greeks.gamma, C.purple], ["Theta", payoff.greeks.theta, C.orange], ["Vega", payoff.greeks.vega, C.teal]].map(([label, val, col]) => (<div key={label} style={{ background: "#080c14", borderRadius: 7, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 10, color: C.muted }}>{label}</span><span style={{ fontSize: 12, fontWeight: 700, color: col }}>{val.toFixed(3)}</span></div>))}
                  </div>
                  <button style={Object.assign({}, btnSt("primary"), { width: "100%", marginBottom: 8 })} onClick={handleAnalyse} disabled={aiLoading}>{aiLoading ? "Analysing…" : "AI Trade Analysis"}</button>
                  {aiRes && <AIResultBox res={aiRes} />}

                  {/* ── QUANTITY & LOT SIZE CONTROLS ── */}
                  <div style={{ background: "#080c14", borderRadius: 8, padding: "12px", marginBottom: 8, border: "1px solid " + C.border }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, letterSpacing: "0.1em", marginBottom: 10 }}>ORDER SIZE</div>

                    {/* Quantity row */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, marginBottom: 6 }}>QUANTITY (CONTRACTS)</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#060a10", borderRadius: 7, border: "1px solid " + C.border, overflow: "hidden" }}>
                        <button
                          onClick={() => setTradeQty(q => Math.max(1, q - 1))}
                          style={{ width: 36, height: 36, background: tradeQty <= 1 ? "transparent" : "#131b2a", border: "none", borderRight: "1px solid " + C.border, color: tradeQty <= 1 ? C.muted : C.text, fontSize: 18, fontWeight: 700, cursor: tradeQty <= 1 ? "default" : "pointer", fontFamily: "inherit" }}
                        >−</button>
                        <input
                          type="number" min={1} max={99} value={tradeQty}
                          onChange={e => setTradeQty(Math.max(1, Math.min(99, +e.target.value || 1)))}
                          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.blue, fontSize: 16, fontWeight: 700, textAlign: "center", fontFamily: "inherit", padding: "0 4px" }}
                        />
                        <button
                          onClick={() => setTradeQty(q => Math.min(99, q + 1))}
                          style={{ width: 36, height: 36, background: tradeQty >= 99 ? "transparent" : "#131b2a", border: "none", borderLeft: "1px solid " + C.border, color: tradeQty >= 99 ? C.muted : C.text, fontSize: 18, fontWeight: 700, cursor: tradeQty >= 99 ? "default" : "pointer", fontFamily: "inherit" }}
                        >+</button>
                      </div>
                      {/* Quick qty presets */}
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        {[1, 2, 5, 10, 25].map(n => (
                          <button key={n} onClick={() => setTradeQty(n)}
                            style={{ flex: 1, padding: "4px 0", background: tradeQty === n ? "rgba(56,189,248,0.18)" : "#0f1422", border: "1px solid " + (tradeQty === n ? C.blue : C.border), borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, color: tradeQty === n ? C.blue : C.dim, fontFamily: "inherit" }}
                          >{n}</button>
                        ))}
                      </div>
                    </div>

                    {/* Lot size row */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: C.dim, fontWeight: 700, marginBottom: 6 }}>LOT SIZE (× 100 SHARES)</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {LOT_SIZES.map(l => (
                          <button key={l} onClick={() => setTradeLotSize(l)}
                            style={{ flex: 1, padding: "6px 0", background: tradeLotSize === l ? "rgba(45,212,191,0.15)" : "#0f1422", border: "1px solid " + (tradeLotSize === l ? C.teal : C.border), borderRadius: 5, cursor: "pointer", fontSize: 9, fontWeight: 700, color: tradeLotSize === l ? C.teal : C.dim, fontFamily: "inherit" }}
                          >{l}×</button>
                        ))}
                      </div>
                    </div>

                    {/* Summary row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 2 }}>
                      {[
                        ["Contracts", tradeQty * tradeLotSize, C.text],
                        ["Total Cost", "$" + (Math.abs(payoff.cost) * tradeQty * tradeLotSize).toFixed(0), C.yellow],
                        ["Max Profit", "$" + (payoff.maxProfit * tradeQty * tradeLotSize).toFixed(0), C.green],
                      ].map(([label, val, col]) => (
                        <div key={label} style={{ background: "#060a10", borderRadius: 6, padding: "7px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 8, color: C.muted, marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button style={Object.assign({}, btnSt("success"), { width: "100%" })} onClick={executeStrategy} disabled={!aiRes}>
                    Place {tradeQty * tradeLotSize} Contract{tradeQty * tradeLotSize !== 1 ? "s" : ""} →
                  </button>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, marginBottom: 10 }}>TRADE LEGS</div>
                  {STRATS[strategy].legs.map((l, i) => <LegRow key={i} leg={l} spot={spot} days={days} iv={iv} />)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={card}>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>PAYOFF AT EXPIRY — {strategy} · {ticker}</div>
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={payoff.points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.2} /><stop offset="100%" stopColor={C.green} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="2 4" stroke={C.border} />
                      <XAxis dataKey="price" stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => "$" + v} />
                      <YAxis stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => "$" + v} />
                      <Tooltip contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 6, fontSize: 11 }} formatter={v => ["$" + v, "P&L"]} labelFormatter={l => "Price: $" + l} />
                      <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 2" />
                      <ReferenceLine x={spot} stroke={C.blue} strokeDasharray="3 3" label={{ value: "Spot", fill: C.blue, fontSize: 9, position: "top" }} />
                      {payoff.breakevens.map((be, i) => <ReferenceLine key={i} x={be} stroke={C.yellow} strokeDasharray="2 2" label={{ value: "BE", fill: C.yellow, fontSize: 8, position: "top" }} />)}
                      <Area type="monotone" dataKey="pnl" stroke={C.green} strokeWidth={2} fill="url(#pg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 12 }}>SCENARIO ANALYSIS</div>
                  {computeScenarios(strategy, spot, ivPct, days).map(sc => {
                    const isPos = sc.pnl >= 0;
                    const maxAbs = Math.max(...computeScenarios(strategy, spot, ivPct, days).map(x => Math.abs(x.pnl)));
                    const w = maxAbs > 0 ? Math.abs(sc.pnl) / maxAbs * 100 : 0;
                    return (<div key={sc.label} style={{ display: "grid", gridTemplateColumns: "55px 1fr 70px", gap: 8, alignItems: "center", marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{sc.label}</div><div style={{ background: "#1a2535", borderRadius: 4, height: 8, position: "relative", overflow: "hidden" }}><div style={{ height: 8, borderRadius: 4, background: isPos ? C.green : C.red, width: w + "%" }} /></div><div style={{ fontSize: 12, fontWeight: 700, color: isPos ? C.green : C.red, textAlign: "right" }}>{isPos ? "+" : ""}{sc.pnl}</div></div>);
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={card}><div style={{ fontSize: 9, color: C.muted, marginBottom: 6 }}>{ticker} PRICE</div><MiniChart data={history} color={up ? C.green : C.red} height={90} /></div>
                  <div style={Object.assign({}, card, { display: "flex", alignItems: "center", justifyContent: "center" })}><VIXMeter vix={vix} /></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === "greeks" && <GreeksDashboard spot={spot} iv={iv} vix={vix} ticker={ticker} />}
        {page === "scanner" && <ScannerPage quotes={quotes} vix={vix} onSelectTicker={selectTicker} />}
        {page === "watchlist" && <WatchlistPage quotes={quotes} vix={vix} onSelectTicker={selectTicker} />}

        {/* ── PORTFOLIO ── */}
        {page === "portfolio" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Paper Portfolio</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }} className="main-grid-3">
              {[{ l: "Cash", v: "$" + cash.toLocaleString(), c: C.green }, { l: "Open", v: openTrades.length, c: C.blue }, { l: "Closed P&L", v: (totalPnl >= 0 ? "+" : "") + "$" + totalPnl.toFixed(0), c: totalPnl >= 0 ? C.green : C.red }, { l: "Win Rate", v: closedTrades.length ? Math.round(closedTrades.filter(t => t.pnl > 0).length / closedTrades.length * 100) + "%" : "—", c: C.yellow }, { l: "Trades", v: trades.length, c: C.purple }].map(item => (<div key={item.l} style={card}><div style={{ fontSize: 9, color: C.muted }}>{item.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: item.c, marginTop: 4 }}>{item.v}</div></div>))}
            </div>
            {pnlChartData.length > 0 && (<div style={Object.assign({}, card, { marginBottom: 14 })}><div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 8 }}>CUMULATIVE P&L CHART</div><ResponsiveContainer width="100%" height={180}><AreaChart data={pnlChartData} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}><defs><linearGradient id="cpnl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={totalPnl >= 0 ? C.green : C.red} stopOpacity={0.3} /><stop offset="100%" stopColor={totalPnl >= 0 ? C.green : C.red} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="2 4" stroke={C.border} /><XAxis dataKey="name" stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} /><YAxis stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => "$" + v} /><Tooltip contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 6, fontSize: 11 }} formatter={v => ["$" + v]} /><ReferenceLine y={0} stroke={C.border} strokeDasharray="4 2" /><Area type="monotone" dataKey="cumPnl" stroke={totalPnl >= 0 ? C.green : C.red} strokeWidth={2} fill="url(#cpnl)" dot={false} name="Cumulative P&L" /></AreaChart></ResponsiveContainer></div>)}
            <div style={Object.assign({}, card, { marginBottom: 12 })}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, marginBottom: 12 }}>OPEN POSITIONS ({openTrades.length})</div>
              {!openTrades.length && <div style={{ color: C.muted, textAlign: "center", padding: "28px 0", fontSize: 12 }}>No open positions. Use Options Chain or Strategy Builder to place paper trades.</div>}
              {openTrades.map(t => <TradeRow key={t.id} trade={t} liveQuote={quotes[t.ticker]} onClose={() => handleClose(t.id)} />)}
            </div>
            {closedTrades.length > 0 && (<div style={card}><div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 12 }}>CLOSED TRADES ({closedTrades.length})</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}><thead><tr style={{ borderBottom: "1px solid " + C.border }}>{["Date", "Ticker", "Strategy", "Entry", "Cost", "P&L", "Result"].map(h => <th key={h} style={{ padding: "6px 10px", color: C.muted, textAlign: "left", fontSize: 9, letterSpacing: "0.08em" }}>{h}</th>)}</tr></thead><tbody>{closedTrades.map(t => (<tr key={t.id} style={{ borderBottom: "1px solid " + C.border + "22" }}><td style={{ padding: "8px 10px" }}>{t.closeDate}</td><td style={{ padding: "8px 10px", fontWeight: 700 }}>{t.ticker}</td><td style={{ padding: "8px 10px", color: C.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.strategy}</td><td style={{ padding: "8px 10px" }}>${t.spot}</td><td style={{ padding: "8px 10px" }}>${t.cost.toFixed(0)}</td><td style={{ padding: "8px 10px", fontWeight: 700, color: t.pnl >= 0 ? C.green : C.red }}>{t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}</td><td style={{ padding: "8px 10px" }}><Badge bg={t.pnl >= 0 ? "#052e16" : "#3b0000"} color={t.pnl >= 0 ? C.green : C.red}>{t.pnl >= 0 ? "WIN" : "LOSS"}</Badge></td></tr>))}</tbody></table></div></div>)}
          </div>
        )}

        {page === "learn" && <LearnPage />}
        {page === "ai_hub" && <AIAnalysisHub quotes={quotes} vix={vix} ticker={ticker} spot={spot} ivPct={ivPct} history={history} up={up} />}
        {page === "margin" && <MarginCalculatorPage spot={spot} vix={vix} ticker={ticker} iv={iv} chain={chain} />}
        {page === "recommender" && <RecommenderPage onSelectStrategy={selectStrategy} />}

      </div>
    </div>
  );
}
