import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar,
  ComposedChart, Cell
} from "recharts";

// ── UNIVERSE ──────────────────────────────────────────────────────────────────
const SP500 = ["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AVGO","LLY","JPM","V","UNH","XOM","MA","JNJ","PG","HD","COST","MRK","ABBV","BAC","CRM","CVX","NFLX","KO","AMD","PEP","TMO","ACN","MCD","CSCO","WMT","LIN","ABT","TXN","ADBE","NEE","NKE","PM","RTX","MS","ORCL","HON","IBM","GE","CAT","AMGN","SPGI","AXP","BKNG","MDT","GILD","GS","BLK","SYK","DE","ELV","VRTX","REGN","CB","ADI","ISRG","LRCX","MO","PLD","SO","COP","BSX","MDLZ","ETN","WM","HCA","EOG","ADP","CI","ITW","CME","APD","ZTS","TJX","USB","FISV","DUK","NOC","EMR","GM","F","SLB","FCX","MCK","KLAC","SNPS","CDNS","ICE","PANW","CRWD","INTC","QCOM","INTU"];
const NASDAQ_EXTRA = ["AMAT","MU","MRVL","PYPL","MELI","CTAS","ORLY","DXCM","FTNT","WDAY","IDXX","PCAR","VRSK","ODFL","MNST","KDP","BIIB","TTD","FAST","DLTR","GEHC","SMCI","ARM","DASH","CEG","ILMN","TEAM","ZS","ANSS"];
const ALL_TICKERS = [...new Set([...SP500,...NASDAQ_EXTRA])];
const QUICK = ["AAPL","NVDA","TSLA","MSFT","META","AMZN","GOOGL","AMD","NFLX","SPY","QQQ","AVGO"];

// ── REALISTIC BASE PRICES ─────────────────────────────────────────────────────
const BASE_PRICES = {
  AAPL:213.49,MSFT:415.32,NVDA:875.40,AMZN:198.12,GOOGL:178.23,META:522.90,TSLA:177.58,AVGO:1642.30,LLY:890.45,JPM:215.67,V:279.34,UNH:522.80,XOM:118.45,MA:478.92,JNJ:156.78,PG:168.23,HD:362.45,COST:865.30,MRK:128.90,ABBV:178.45,BAC:42.67,CRM:312.45,CVX:162.34,NFLX:672.80,KO:62.45,AMD:162.34,PEP:168.90,TMO:524.30,ACN:342.10,MCD:283.45,CSCO:56.78,WMT:67.89,LIN:452.30,ABT:112.45,TXN:198.67,ADBE:452.30,NEE:78.34,NKE:92.45,PM:98.67,RTX:122.34,MS:112.45,ORCL:142.30,HON:212.45,IBM:192.30,GE:162.45,CAT:378.90,AMGN:312.45,SPGI:487.30,AXP:245.67,BKNG:3782.45,MDT:87.34,GILD:78.45,GS:478.90,BLK:845.30,SYK:342.80,DE:392.30,ELV:478.90,VRTX:452.30,REGN:992.45,CB:267.80,ADI:212.45,ISRG:412.30,LRCX:892.45,MO:45.67,PLD:112.34,SO:78.45,COP:112.34,BSX:87.45,MDLZ:67.34,ETN:312.45,WM:212.30,HCA:378.45,EOG:134.56,ADP:245.67,CI:342.30,ITW:267.45,CME:212.30,APD:267.45,ZTS:178.90,TJX:112.34,USB:45.67,FISV:178.45,DUK:112.34,NOC:512.30,EMR:112.34,GM:47.89,F:12.45,SLB:47.34,FCX:42.30,MCK:612.45,KLAC:712.30,SNPS:542.45,CDNS:278.90,ICE:145.67,PANW:312.45,CRWD:342.30,INTC:29.67,QCOM:178.45,INTU:645.30,AMAT:212.45,MU:112.34,MRVL:78.45,PYPL:67.34,MELI:1892.30,CTAS:178.45,ORLY:1056.30,DXCM:67.45,FTNT:78.34,WDAY:245.67,IDXX:445.30,PCAR:112.45,VRSK:245.30,ODFL:178.90,MNST:56.34,KDP:34.56,BIIB:212.45,TTD:89.34,FAST:67.45,DLTR:78.90,GEHC:87.34,SMCI:812.45,ARM:145.67,DASH:112.34,CEG:212.45,ILMN:134.56,TEAM:245.30,ZS:178.45,ANSS:345.67,SPY:543.20,QQQ:465.30,DIA:402.45,IWM:212.30,
};

const BETA = {TSLA:1.8,NVDA:1.6,AMD:1.7,SMCI:1.9,META:1.3,AMZN:1.2,NFLX:1.4,AAPL:1.1,MSFT:1.0,GOOGL:1.1,AVGO:1.2,SPY:1.0,QQQ:1.1,CRWD:1.5,PANW:1.4,ARM:1.7,DASH:1.5,INTC:0.9,KO:0.6,PG:0.6,JNJ:0.7,MCD:0.8,WMT:0.7};

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║          LIVE MARKET DATA — CONFIGURATION                               ║
// ║                                                                          ║
// ║  Set USE_LIVE_DATA = true and fill in your API keys below.              ║
// ║  The app will automatically switch from simulation to real prices.       ║
// ║                                                                          ║
// ║  SUPPORTED PROVIDERS:                                                    ║
// ║  • Finnhub    – free, real-time US stocks via WebSocket                  ║
// ║  • Polygon.io – free delayed / paid real-time US stocks + history        ║
// ║  • Alpha Vantage – free daily OHLC + fundamentals                       ║
// ║  • Upstox     – free Indian NSE/BSE real-time + F&O                     ║
// ║  • Angel One  – free Indian NSE/BSE real-time                            ║
// ║                                                                          ║
// ║  HOW TO GET API KEYS:                                                    ║
// ║  1. Finnhub:      https://finnhub.io  → Sign up → Dashboard → API Key   ║
// ║  2. Polygon:      https://polygon.io  → Sign up → Dashboard → API Key   ║
// ║  3. AlphaVantage: https://alphavantage.co → Get Free API Key             ║
// ║  4. Upstox:       https://upstox.com/developer → Create App → OAuth     ║
// ║  5. Angel One:    https://smartapi.angelbroking.com → Register → API Key ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const DATA_CONFIG = {
  USE_LIVE_DATA: true,           // ✅ LIVE PRICES ENABLED

  // ── US Market Providers ──────────────────────────────────────────────────
  FINNHUB_KEY:       "d6o8k8pr01qu09cihrk0d6o8k8pr01qu09cihrkg",  // ✅ Real-time WebSocket
  POLYGON_KEY:       "",                                             // Not configured
  ALPHAVANTAGE_KEY:  "MBTF0YAYWJ3FS6J4",                           // ✅ History + backup quotes

  // ── Indian Market Providers ──────────────────────────────────────────────
  UPSTOX_TOKEN:      "",   // Not configured — Indian markets use simulation
  ANGEL_KEY:         "",
  ANGEL_JWT:         "",

  // ── Provider selection ───────────────────────────────────────────────────
  // Finnhub: real-time WebSocket for US stocks (primary)
  // Alpha Vantage: daily OHLC history for charts (backup quotes, 25 req/day)
  // India: simulation (no API key provided)
  US_PROVIDER:    "finnhub",     // Real-time via WebSocket
  INDIA_PROVIDER: "simulation",  // Simulated — add Upstox/Angel key to go live

  // ── Rate limiting ────────────────────────────────────────────────────────
  // Finnhub free: 60 API calls/min, unlimited WebSocket trades
  // Alpha Vantage free: 25 calls/day — used only for chart history
  POLL_INTERVAL_MS: 15000,  // 15s polling fallback if WebSocket drops
};

// ── PROVIDER IMPLEMENTATIONS ──────────────────────────────────────────────────

// Normalize any provider's quote response to OptiFlow's internal format
function normalizeQuote(sym, raw, source) {
  const price  = +(raw.price  || raw.c  || raw.last || raw.lp  || 0).toFixed(2);
  const prev   = +(raw.prev   || raw.pc || raw.close|| raw.cp  || price).toFixed(2);
  const change = +(price - prev).toFixed(2);
  const pct    = prev > 0 ? +((change / prev) * 100).toFixed(2) : 0;
  return {
    sym, price, prev, change, pct,
    high:  +(raw.high  || raw.h  || price).toFixed(2),
    low:   +(raw.low   || raw.l  || price).toFixed(2),
    vol:   Math.round(raw.volume || raw.v || raw.vol || 0),
    source,
  };
}

// Normalize OHLCV history bars from any provider
function normalizeBar(bar, source) {
  const close = +(bar.close || bar.c || bar.vwap || 0);
  const open  = +(bar.open  || bar.o || close);
  const high  = +(bar.high  || bar.h || close);
  const low   = +(bar.low   || bar.l || close);
  const ts    = bar.timestamp || bar.t || bar.date || bar.datetime;
  const d     = new Date(typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts);
  return {
    date:    d.toLocaleDateString([], { month:"short", day:"numeric" }),
    open, high, low, close, price: close,
    vol:     Math.round(bar.volume || bar.v || 0),
    bullish: close >= open,
  };
}

// ── FINNHUB ───────────────────────────────────────────────────────────────────
const FinnhubAPI = {
  _prevClose: {},  // cache prev close prices for accurate % change

  async quote(sym) {
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${DATA_CONFIG.FINNHUB_KEY}`
    );
    if (r.status === 429) {
      console.warn(`[Finnhub] Rate limited — waiting 60s before retry`);
      await new Promise(res => setTimeout(res, 60000));
      return this.quote(sym); // retry once after cooldown
    }
    if (!r.ok) throw new Error(`Finnhub quote failed: ${r.status}`);
    const d = await r.json();
    if (!d.c || d.c === 0) throw new Error(`Finnhub: no data for ${sym}`);
    this._prevClose[sym] = d.pc;
    return normalizeQuote(sym, { price:d.c, prev:d.pc, high:d.h, low:d.l, volume:d.v }, "Finnhub");
  },

  async history(sym, range) {
    const resMap = { "1mo":"D","3mo":"D","6mo":"D","1y":"W","2y":"W" };
    const daysMap= { "1mo":30,"3mo":90,"6mo":180,"1y":365,"2y":730 };
    const res  = resMap[range] || "D";
    const days = daysMap[range] || 90;
    const to   = Math.floor(Date.now() / 1000);
    const from = to - days * 86400;
    const r = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${sym}&resolution=${res}&from=${from}&to=${to}&token=${DATA_CONFIG.FINNHUB_KEY}`
    );
    if (!r.ok) throw new Error(`Finnhub history failed: ${r.status}`);
    const d = await r.json();
    if (d.s !== "ok" || !d.t || !d.t.length) throw new Error("Finnhub: no history data");
    return d.t.map((t, i) => normalizeBar({
      timestamp: t, open: d.o[i], high: d.h[i], low: d.l[i], close: d.c[i], volume: d.v[i]
    }, "Finnhub"));
  },

  createWebSocket(symbols, onQuote) {
    const self = this;
    let ws = null;
    let reconnectTimer = null;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(`wss://ws.finnhub.io?token=${DATA_CONFIG.FINNHUB_KEY}`);

      ws.onopen = () => {
        console.log("[Finnhub WS] ✅ Connected — subscribing to", symbols.length, "symbols");
        symbols.forEach(sym => ws.send(JSON.stringify({ type:"subscribe", symbol:sym })));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "trade" && msg.data) {
            // Group by symbol — take the latest trade price
            const latest = {};
            msg.data.forEach(trade => {
              if (!latest[trade.s] || trade.t > latest[trade.s].t) latest[trade.s] = trade;
            });
            Object.values(latest).forEach(trade => {
              const sym = trade.s;
              const price = +trade.p.toFixed(2);
              const pc = self._prevClose[sym] || price;
              const change = +(price - pc).toFixed(2);
              const pct = pc > 0 ? +((change / pc) * 100).toFixed(2) : 0;
              onQuote(sym, {
                sym, price, prev: pc, change, pct,
                high: price, low: price,
                vol: trade.v || 0,
                source: "Finnhub·WS·Live",
              });
            });
          }
          if (msg.type === "ping") ws.send(JSON.stringify({ type:"pong" }));
        } catch(err) { console.warn("[Finnhub WS] parse error", err); }
      };

      ws.onerror = () => console.warn("[Finnhub WS] connection error");

      ws.onclose = () => {
        if (closed) return;
        console.log("[Finnhub WS] disconnected — reconnecting in 5s…");
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    // Return a handle that the app can close cleanly
    return {
      close() {
        closed = true;
        clearTimeout(reconnectTimer);
        ws?.close();
      }
    };
  },
};

// ── POLYGON.IO ────────────────────────────────────────────────────────────────
const PolygonAPI = {
  async quote(sym) {
    const r = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=${DATA_CONFIG.POLYGON_KEY}`
    );
    if (!r.ok) throw new Error(`Polygon quote failed: ${r.status}`);
    const d = await r.json();
    const bar = d.results?.[0];
    if (!bar) throw new Error("Polygon: no data");
    // Polygon prev-day only — use close as current (delayed)
    return normalizeQuote(sym, {
      price: bar.c, prev: bar.o, high: bar.h, low: bar.l, volume: bar.v
    }, "Polygon·Delayed");
  },

  async history(sym, range) {
    const daysMap = { "1mo":30,"3mo":90,"6mo":180,"1y":365,"2y":730 };
    const days    = daysMap[range] || 90;
    const to   = new Date().toISOString().slice(0,10);
    const from = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
    const r = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${DATA_CONFIG.POLYGON_KEY}`
    );
    if (!r.ok) throw new Error(`Polygon history failed: ${r.status}`);
    const d = await r.json();
    if (!d.results?.length) throw new Error("Polygon: no history");
    return d.results.map(b => normalizeBar({
      timestamp: b.t, open: b.o, high: b.h, low: b.l, close: b.c, volume: b.v
    }, "Polygon"));
  },

  // Polygon WebSocket (paid real-time subscription required)
  createWebSocket(symbols, onQuote) {
    const ws = new WebSocket("wss://socket.polygon.io/stocks");
    ws.onopen = () => {
      ws.send(JSON.stringify({ action:"auth", params: DATA_CONFIG.POLYGON_KEY }));
    };
    ws.onmessage = (e) => {
      try {
        const msgs = JSON.parse(e.data);
        msgs.forEach(msg => {
          if (msg.ev === "authenticated") {
            const subs = symbols.map(s => `T.${s}`).join(",");
            ws.send(JSON.stringify({ action:"subscribe", params: subs }));
          }
          if (msg.ev === "T") {
            onQuote(msg.sym, normalizeQuote(msg.sym, {
              price: msg.p, high: msg.p, low: msg.p, volume: msg.s
            }, "Polygon·WS"));
          }
        });
      } catch(err) { console.warn("[Polygon WS] parse error", err); }
    };
    ws.onerror = e => console.error("[Polygon WS] error", e);
    return ws;
  },
};

// ── ALPHA VANTAGE ─────────────────────────────────────────────────────────────
const AlphaVantageAPI = {
  async quote(sym) {
    const r = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${DATA_CONFIG.ALPHAVANTAGE_KEY}`
    );
    if (!r.ok) throw new Error(`AlphaVantage quote failed: ${r.status}`);
    const d = await r.json();
    const q = d["Global Quote"];
    if (!q || !q["05. price"]) throw new Error("AlphaVantage: no data or rate limited");
    return normalizeQuote(sym, {
      price:  parseFloat(q["05. price"]),
      prev:   parseFloat(q["08. previous close"]),
      high:   parseFloat(q["03. high"]),
      low:    parseFloat(q["04. low"]),
      volume: parseInt(q["06. volume"]),
    }, "AlphaVantage");
  },

  async history(sym, range) {
    const outputsize = (range === "1mo" || range === "3mo") ? "compact" : "full";
    const r = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${sym}&outputsize=${outputsize}&apikey=${DATA_CONFIG.ALPHAVANTAGE_KEY}`
    );
    if (!r.ok) throw new Error(`AlphaVantage history failed: ${r.status}`);
    const d = await r.json();
    const series = d["Time Series (Daily)"];
    if (!series) throw new Error("AlphaVantage: no history or rate limited");
    const daysMap = { "1mo":22,"3mo":66,"6mo":132,"1y":252,"2y":504 };
    const limit = daysMap[range] || 66;
    return Object.entries(series).slice(0, limit).reverse().map(([dateStr, bar]) =>
      normalizeBar({
        date:   dateStr,
        open:   parseFloat(bar["1. open"]),
        high:   parseFloat(bar["2. high"]),
        low:    parseFloat(bar["3. low"]),
        close:  parseFloat(bar["5. adjusted close"]),
        volume: parseInt(bar["6. volume"]),
      }, "AlphaVantage")
    );
  },
};

// ── UPSTOX (INDIA) ────────────────────────────────────────────────────────────
const UpstoxAPI = {
  // Symbol format for Upstox: "NSE_EQ|INE002A01018" (ISIN-based)
  // For simplicity we use the ticker symbol directly (works for most NSE stocks)
  _headers() {
    return {
      "Authorization": `Bearer ${DATA_CONFIG.UPSTOX_TOKEN}`,
      "Accept": "application/json",
    };
  },

  async quote(sym) {
    // Upstox instrument key format: "NSE_EQ|TICKER"
    const instrument = `NSE_EQ|${sym}`;
    const r = await fetch(
      `https://api.upstox.com/v2/market-quote/quotes?symbol=${encodeURIComponent(instrument)}`,
      { headers: this._headers() }
    );
    if (!r.ok) throw new Error(`Upstox quote failed: ${r.status}`);
    const d = await r.json();
    const q = d.data?.[instrument];
    if (!q) throw new Error("Upstox: no data for " + sym);
    return normalizeQuote(sym, {
      price:  q.last_price,
      prev:   q.ohlc?.close || q.last_price,
      high:   q.ohlc?.high  || q.last_price,
      low:    q.ohlc?.low   || q.last_price,
      volume: q.volume,
    }, "Upstox");
  },

  async history(sym, range) {
    const intervalMap = { "1mo":"day","3mo":"day","6mo":"day","1y":"week","2y":"month" };
    const daysMap     = { "1mo":30,"3mo":90,"6mo":180,"1y":365,"2y":730 };
    const interval    = intervalMap[range] || "day";
    const days        = daysMap[range] || 90;
    const toDate   = new Date().toISOString().slice(0,10);
    const fromDate = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
    const instrument = `NSE_EQ|${sym}`;
    const r = await fetch(
      `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instrument)}/${interval}/${toDate}/${fromDate}`,
      { headers: this._headers() }
    );
    if (!r.ok) throw new Error(`Upstox history failed: ${r.status}`);
    const d = await r.json();
    const candles = d.data?.candles;
    if (!candles?.length) throw new Error("Upstox: no history");
    // Upstox candle format: [timestamp, open, high, low, close, volume, OI]
    return candles.slice().reverse().map(c => normalizeBar({
      timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5]
    }, "Upstox"));
  },

  createWebSocket(symbols, onQuote) {
    // Upstox market data WebSocket v2
    const ws = new WebSocket("wss://api.upstox.com/v2/feed/market-data-feed", {
      headers: this._headers()
    });
    ws.onopen = () => {
      console.log("[Upstox WS] Connected");
      const keys = symbols.map(s => `NSE_EQ|${s}`);
      ws.send(JSON.stringify({
        guid: "optiflow-" + Date.now(),
        method: "sub",
        data: { mode: "full", instrumentKeys: keys }
      }));
    };
    ws.onmessage = (e) => {
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : null;
        if (!msg) return;
        Object.entries(msg.feeds || {}).forEach(([key, feed]) => {
          const sym = key.split("|")[1];
          const ff  = feed.fullFeed?.marketFF || feed.ltpc;
          if (!ff) return;
          onQuote(sym, normalizeQuote(sym, {
            price:  ff.ltp  || ff.last_traded_price,
            high:   ff.high || ff.day_high,
            low:    ff.low  || ff.day_low,
            volume: ff.vol  || ff.volume,
          }, "Upstox·WS"));
        });
      } catch(err) { console.warn("[Upstox WS] parse error", err); }
    };
    ws.onerror = e => console.error("[Upstox WS] error", e);
    return ws;
  },
};

// ── ANGEL ONE SMARTAPI (INDIA) ────────────────────────────────────────────────
const AngelAPI = {
  _headers() {
    return {
      "Authorization": `Bearer ${DATA_CONFIG.ANGEL_JWT}`,
      "Content-Type":  "application/json",
      "X-UserType":    "USER",
      "X-SourceID":    "WEB",
      "X-ClientLocalIP": "192.168.1.1",
      "X-ClientPublicIP": "1.1.1.1",
      "X-MACAddress":  "00:00:00:00:00:00",
      "X-PrivateKey":  DATA_CONFIG.ANGEL_KEY,
    };
  },

  async quote(sym) {
    const r = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/", {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ mode:"FULL", exchangeTokens: { NSE: [sym] } }),
    });
    if (!r.ok) throw new Error(`Angel quote failed: ${r.status}`);
    const d = await r.json();
    const q = d.data?.fetched?.[0];
    if (!q) throw new Error("Angel: no data");
    return normalizeQuote(sym, {
      price:  q.ltp,
      prev:   q.close,
      high:   q.high,
      low:    q.low,
      volume: q.tradeVolume,
    }, "AngelOne");
  },

  async history(sym, range) {
    const intervalMap = { "1mo":"ONE_DAY","3mo":"ONE_DAY","6mo":"ONE_DAY","1y":"ONE_WEEK","2y":"ONE_MONTH" };
    const daysMap     = { "1mo":30,"3mo":90,"6mo":180,"1y":365,"2y":730 };
    const toDate   = new Date().toISOString().slice(0,19);
    const fromDate = new Date(Date.now()-(daysMap[range]||90)*86400000).toISOString().slice(0,19);
    const r = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData", {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        exchange: "NSE",
        symboltoken: sym,
        interval: intervalMap[range] || "ONE_DAY",
        fromdate: fromDate,
        todate: toDate,
      }),
    });
    if (!r.ok) throw new Error(`Angel history failed: ${r.status}`);
    const d = await r.json();
    const candles = d.data;
    if (!candles?.length) throw new Error("Angel: no history");
    // Angel candle: [timestamp, open, high, low, close, volume]
    return candles.map(c => normalizeBar({
      timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5]
    }, "AngelOne"));
  },
};

// ── UNIFIED DATA ADAPTER ──────────────────────────────────────────────────────
// Single interface — the rest of the app calls ONLY these functions.
// Falls back to simulation if API fails or USE_LIVE_DATA is false.

const DataAdapter = {
  _wsRef: null,
  _wsStatus: "disconnected",   // "connecting" | "live" | "polling" | "disconnected"

  _isIndian(sym) {
    return sym in NSE_STOCKS;
  },

  _providerFor(sym) {
    if (this._isIndian(sym)) {
      if (DATA_CONFIG.INDIA_PROVIDER === "upstox") return UpstoxAPI;
      if (DATA_CONFIG.INDIA_PROVIDER === "angel")  return AngelAPI;
      return null; // simulation
    }
    if (DATA_CONFIG.US_PROVIDER === "polygon")      return PolygonAPI;
    if (DATA_CONFIG.US_PROVIDER === "alphavantage") return AlphaVantageAPI;
    return FinnhubAPI; // default
  },

  async fetchQuote(sym) {
    if (!DATA_CONFIG.USE_LIVE_DATA) return null;
    if (this._isIndian(sym)) return null; // simulation for India
    try {
      return await FinnhubAPI.quote(sym);
    } catch(e) {
      console.warn(`[DataAdapter] quote ${sym}:`, e.message);
      // Try Alpha Vantage as backup (only if Finnhub fails)
      try { return await AlphaVantageAPI.quote(sym); } catch { return null; }
    }
  },

  // For chart history: prefer Alpha Vantage (saves Finnhub quota)
  // Alpha Vantage has 25 req/day — we only call it when a chart is opened
  async fetchHistory(sym, range) {
    if (!DATA_CONFIG.USE_LIVE_DATA) return null;
    if (this._isIndian(sym)) return null; // simulation
    try {
      // Use Finnhub for history (Alpha Vantage rate limit too tight for frequent chart loads)
      return await FinnhubAPI.history(sym, range);
    } catch(e) {
      console.warn(`[DataAdapter] Finnhub history failed for ${sym}, trying Alpha Vantage:`, e.message);
      try { return await AlphaVantageAPI.history(sym, range); } catch { return null; }
    }
  },

  // Batch fetch: Finnhub, 5 at a time with 200ms gaps (stays under 60 req/min)
  async fetchBatch(symbols) {
    if (!DATA_CONFIG.USE_LIVE_DATA) return {};
    const usSymbols = symbols.filter(s => !this._isIndian(s));
    const results = {};
    const batchSize = 5;
    const delay = 220; // ~27 batches/min < 60 req/min limit
    for (let i = 0; i < usSymbols.length; i += batchSize) {
      const chunk = usSymbols.slice(i, i + batchSize);
      const fetched = await Promise.allSettled(chunk.map(s => FinnhubAPI.quote(s)));
      fetched.forEach((r, idx) => {
        if (r.status === "fulfilled" && r.value) results[chunk[idx]] = r.value;
      });
      if (i + batchSize < usSymbols.length) {
        await new Promise(res => setTimeout(res, delay));
      }
    }
    return results;
  },

  // WebSocket streaming via Finnhub
  startStreaming(symbols, onQuoteUpdate) {
    if (!DATA_CONFIG.USE_LIVE_DATA) return null;
    if (DATA_CONFIG.US_PROVIDER !== "finnhub") return null;
    try {
      this._wsStatus = "connecting";
      const usSymbols = symbols.filter(s => !this._isIndian(s));
      this._wsRef = FinnhubAPI.createWebSocket(usSymbols, (sym, quote) => {
        this._wsStatus = "live";
        onQuoteUpdate(sym, quote);
      });
      return this._wsRef;
    } catch(e) {
      console.warn("[DataAdapter] WebSocket failed:", e.message);
      this._wsStatus = "polling";
      return null;
    }
  },

  stopStreaming() {
    if (this._wsRef) {
      try { this._wsRef.close(); } catch(e) {}
      this._wsRef = null;
    }
    this._wsStatus = "disconnected";
  },
};

// ── SIMULATION ENGINE (fallback when USE_LIVE_DATA = false) ───────────────────
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
  s.price = s.price * (1 + s.trend + (Math.random()-0.5)*2*vol + (s.base-s.price)/s.base*0.001);
  s.price = Math.max(s.price, s.base * 0.5);
  return s.price;
}
function getQuote(sym) {
  initPriceState(sym);
  const s = priceState[sym];
  const price = +s.price.toFixed(2);
  const prev  = +(s.base).toFixed(2);
  const change = +(price - prev).toFixed(2);
  const pct    = +((change / prev) * 100).toFixed(2);
  const spread = price * 0.005;
  return { sym, price, prev, change, pct, high:+(price+spread*Math.random()).toFixed(2), low:+(price-spread*Math.random()).toFixed(2), vol:Math.round(1e6+Math.random()*50e6), source:"Simulated" };
}
function generateHistory(sym, range) {
  initPriceState(sym);
  const s = priceState[sym];
  const rangeDays = { "1mo":22,"3mo":66,"6mo":132,"1y":252,"2y":504 };
  const days = rangeDays[range] || 66;
  const beta = s.beta, vol = 0.012 * beta;
  const closes = [s.price];
  for (let i = 1; i < days; i++) {
    const prev = closes[closes.length-1];
    closes.push(prev * (1 - (Math.random()-0.5)*2*vol));
  }
  closes.reverse();
  const result = []; const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now); d.setDate(now.getDate()-(days-i));
    if (d.getDay()===0||d.getDay()===6) continue;
    const close = +closes[i].toFixed(2);
    const open  = i===0 ? close : +(closes[i-1]*(1+(Math.random()-0.5)*0.005)).toFixed(2);
    const wickVol = vol*0.8;
    const high = +(Math.max(open,close)*(1+Math.random()*wickVol)).toFixed(2);
    const low  = +(Math.min(open,close)*(1-Math.random()*wickVol)).toFixed(2);
    result.push({ date:d.toLocaleDateString([],{month:"short",day:"numeric"}), open, high, low, close, price:close, vol:Math.round(5e6+Math.random()*30e6), bullish:close>=open });
  }
  return result;
}
let simVix = 18 + Math.random() * 8;
function tickVix() { simVix += (Math.random()-0.5)*0.3; simVix = Math.max(12, Math.min(45, simVix)); return +simVix.toFixed(2); }

// ── COLORS ────────────────────────────────────────────────────────────────────
const C = { bg:"#06080f",card:"#0b0f1a",card2:"#0f1422",border:"#1c2838",blue:"#38bdf8",green:"#4ade80",red:"#f87171",yellow:"#fbbf24",purple:"#a78bfa",orange:"#fb923c",teal:"#2dd4bf",muted:"#475569",text:"#e2eaf4",dim:"#64748b" };
const C_LIGHT = { bg:"#f0f4f8",card:"#ffffff",card2:"#f8fafc",border:"#e2e8f0",blue:"#0284c7",green:"#16a34a",red:"#dc2626",yellow:"#d97706",purple:"#7c3aed",orange:"#ea580c",teal:"#0d9488",muted:"#94a3b8",text:"#0f172a",dim:"#64748b" };
const VERDICT_STYLE = { "STRONG BUY":{bg:"#052e16",col:"#4ade80"},"BUY":{bg:"#0a2e1a",col:"#86efac"},"NEUTRAL":{bg:"#1c1a0a",col:"#fbbf24"},"AVOID":{bg:"#2a0f0f",col:"#fca5a5"},"STRONG AVOID":{bg:"#3b0000",col:"#f87171"} };

// ── CRYPTO DATA ───────────────────────────────────────────────────────────────
const CRYPTO_PRICES = {
  BTC:67420,ETH:3456,BNB:412,SOL:178,XRP:0.62,ADA:0.48,AVAX:38,DOGE:0.18,
  DOT:8.4,MATIC:0.82,LINK:14.2,UNI:7.8,ATOM:9.1,LTC:84,BCH:478,
};
const CRYPTO_BETA = { BTC:1.0,ETH:1.3,SOL:1.8,DOGE:2.2,AVAX:1.6,MATIC:1.7,LINK:1.5 };
Object.entries(CRYPTO_PRICES).forEach(([sym,price])=>{
  if(!priceState["C:"+sym]){
    const beta=CRYPTO_BETA[sym]||1.4;
    const drift=(Math.random()-0.48)*0.06*beta;
    priceState["C:"+sym]={price:price*(1+drift),base:price,beta,trend:(Math.random()-0.5)*0.003};
  }
});

// ── BLACK-SCHOLES ─────────────────────────────────────────────────────────────
function erfn(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+p*x);return s*(1-(((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t)*Math.exp(-x*x));}
function Ncdf(x){return 0.5*(1+erfn(x/Math.sqrt(2)));}
function Npdf(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}
function BS(S,K,T,r,sig,type){
  if(T<=1/365){return{price:Math.max(0,type==="call"?S-K:K-S),delta:0,gamma:0,theta:0,vega:0};}
  const d1=(Math.log(S/K)+(r+0.5*sig*sig)*T)/(sig*Math.sqrt(T)),d2=d1-sig*Math.sqrt(T);
  if(type==="call"){return{price:Math.max(0,S*Ncdf(d1)-K*Math.exp(-r*T)*Ncdf(d2)),delta:Ncdf(d1),gamma:Npdf(d1)/(S*sig*Math.sqrt(T)),theta:(-S*Npdf(d1)*sig/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*Ncdf(d2))/365,vega:S*Npdf(d1)*Math.sqrt(T)/100};}
  return{price:Math.max(0,K*Math.exp(-r*T)*Ncdf(-d2)-S*Ncdf(-d1)),delta:Ncdf(d1)-1,gamma:Npdf(d1)/(S*sig*Math.sqrt(T)),theta:(-S*Npdf(d1)*sig/(2*Math.sqrt(T))+r*K*Math.exp(-r*T)*Ncdf(-d2))/365,vega:S*Npdf(d1)*Math.sqrt(T)/100};
}

// ── STRATEGIES ────────────────────────────────────────────────────────────────
const STRATS = {
  "Long Call":{legs:[{t:"call",side:"buy",k:1.00,q:1}],risk:"High",desc:"Buy a call. Bullish with unlimited upside."},
  "Long Put":{legs:[{t:"put",side:"buy",k:1.00,q:1}],risk:"High",desc:"Buy a put. Bearish with capped downside."},
  "Bull Call Spread":{legs:[{t:"call",side:"buy",k:1.00,q:1},{t:"call",side:"sell",k:1.05,q:1}],risk:"Low",desc:"Buy ATM call, sell OTM call. Capped bullish."},
  "Bear Put Spread":{legs:[{t:"put",side:"buy",k:1.00,q:1},{t:"put",side:"sell",k:0.95,q:1}],risk:"Low",desc:"Buy ATM put, sell OTM put. Capped bearish."},
  "Straddle":{legs:[{t:"call",side:"buy",k:1.00,q:1},{t:"put",side:"buy",k:1.00,q:1}],risk:"High",desc:"Buy call + put ATM. Profit from big moves."},
  "Strangle":{legs:[{t:"call",side:"buy",k:1.05,q:1},{t:"put",side:"buy",k:0.95,q:1}],risk:"High",desc:"OTM call + put. Cheaper than straddle."},
  "Covered Call":{legs:[{t:"stock",side:"buy",k:1,q:100},{t:"call",side:"sell",k:1.05,q:1}],risk:"Medium",desc:"Own stock, sell call for income."},
  "Protective Put":{legs:[{t:"stock",side:"buy",k:1,q:100},{t:"put",side:"buy",k:0.95,q:1}],risk:"Low",desc:"Own stock + put for downside protection."},
  "Bull Put Spread":{legs:[{t:"put",side:"sell",k:1.00,q:1},{t:"put",side:"buy",k:0.95,q:1}],risk:"Medium",desc:"Sell higher put, buy lower. Bullish credit."},
  "Bear Call Spread":{legs:[{t:"call",side:"sell",k:1.00,q:1},{t:"call",side:"buy",k:1.05,q:1}],risk:"Medium",desc:"Sell lower call, buy higher. Bearish credit."},
  "Butterfly":{legs:[{t:"call",side:"buy",k:0.95,q:1},{t:"call",side:"sell",k:1.00,q:2},{t:"call",side:"buy",k:1.05,q:1}],risk:"Low",desc:"Buy wings, sell body. Max profit near middle."},
  "Iron Condor":{legs:[{t:"put",side:"buy",k:0.90,q:1},{t:"put",side:"sell",k:0.95,q:1},{t:"call",side:"sell",k:1.05,q:1},{t:"call",side:"buy",k:1.10,q:1}],risk:"Medium",desc:"Sell OTM call + put spread. Range-bound."},
};

// ── OPTIONS CHAIN ─────────────────────────────────────────────────────────────
function genChain(S,iv,T,vix,type){
  const strikes=[];
  for(let p=-0.25;p<=0.255;p+=0.025)strikes.push(+(S*(1+p)).toFixed(2));
  return strikes.map(K=>{
    const mono=K/S,skew=type==="put"?(1-mono)*0.45*(vix/20):(mono-1)*-0.12*(vix/20);
    const localIV=Math.max(0.06,iv+skew),opt=BS(S,K,T,0.05,localIV,type);
    const prox=Math.exp(-Math.pow((K-S)/S,2)*80);
    return{strike:K,bid:+Math.max(0.01,opt.price*0.96).toFixed(2),ask:+(opt.price*1.04).toFixed(2),last:+opt.price.toFixed(2),iv:+(localIV*100).toFixed(1),delta:+opt.delta.toFixed(3),gamma:+opt.gamma.toFixed(4),theta:+opt.theta.toFixed(3),vega:+opt.vega.toFixed(3),vol:Math.round(prox*(800+Math.random()*4000)*(vix/20)),oi:Math.round(prox*(3000+Math.random()*18000)),itm:type==="call"?K<=S:K>=S};
  });
}

// ── PAYOFF ────────────────────────────────────────────────────────────────────
function calcPayoff(stratName,S0,ivPct,days){
  const strat=STRATS[stratName];
  if(!strat)return{points:[],greeks:{delta:0,gamma:0,theta:0,vega:0},cost:0,maxProfit:0,maxLoss:0,breakevens:[]};
  const T=days/365,r=0.05,sig=ivPct/100;
  let cost=0,dG=0,gG=0,tG=0,vG=0;
  for(const l of strat.legs){if(l.t==="stock")continue;const o=BS(S0,S0*l.k,T,r,sig,l.t);const s=l.side==="buy"?1:-1;cost+=s*o.price*l.q*100;dG+=s*o.delta*l.q*100;gG+=s*o.gamma*l.q*100;tG+=s*o.theta*l.q*100;vG+=s*o.vega*l.q*100;}
  const points=[];
  for(let i=0;i<100;i++){const St=S0*0.55+i*S0*0.9/99;let pnl=0;for(const l of strat.legs){if(l.t==="stock"){pnl+=l.side==="buy"?(St-S0)*l.q:(S0-St)*l.q;continue;}const intr=l.t==="call"?Math.max(0,St-S0*l.k):Math.max(0,S0*l.k-St);const o0=BS(S0,S0*l.k,T,r,sig,l.t);pnl+=(l.side==="buy"?1:-1)*(intr-o0.price)*l.q*100;}points.push({price:+St.toFixed(2),pnl:+pnl.toFixed(2)});}
  const pnls=points.map(p=>p.pnl),maxProfit=Math.max(...pnls),maxLoss=Math.min(...pnls),breakevens=[];
  for(let i=1;i<points.length;i++){const prev=points[i-1].pnl,curr=points[i].pnl;if((prev<0&&curr>=0)||(prev>=0&&curr<0))breakevens.push(+((points[i-1].price+points[i].price)/2).toFixed(2));}
  return{points,greeks:{delta:dG,gamma:gG,theta:tG,vega:vG},cost,maxProfit,maxLoss,breakevens};
}

function computeScenarios(stratName,S0,ivPct,days){
  const scenarios=[{label:"-20%",mult:0.80},{label:"-10%",mult:0.90},{label:"-5%",mult:0.95},{label:"Flat",mult:1.00},{label:"+5%",mult:1.05},{label:"+10%",mult:1.10},{label:"+20%",mult:1.20}];
  const strat=STRATS[stratName];if(!strat)return[];
  const T=days/365,r=0.05,sig=ivPct/100;
  return scenarios.map(sc=>{const St=S0*sc.mult;let pnl=0;for(const l of strat.legs){if(l.t==="stock"){pnl+=l.side==="buy"?(St-S0)*l.q:(S0-St)*l.q;continue;}const intr=l.t==="call"?Math.max(0,St-S0*l.k):Math.max(0,S0*l.k-St);const opt0=BS(S0,S0*l.k,T,r,sig,l.t);pnl+=(l.side==="buy"?1:-1)*(intr-opt0.price)*l.q*100;}return{...sc,pnl:+pnl.toFixed(0)};});
}

// ── AI ────────────────────────────────────────────────────────────────────────
async function runAI(strat,ticker,price,iv,vix,days,maxP,maxL){
  try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,system:'You are a senior options trader. Respond ONLY valid JSON no markdown: {"verdict":"STRONG BUY|BUY|NEUTRAL|AVOID|STRONG AVOID","confidence":0-100,"summary":"2-3 sentences","vixImpact":"1 sentence","greekRisk":"1 sentence","suggestedDTE":45,"sizingAdvice":"small|medium|full"}',messages:[{role:"user",content:`Strategy=${strat}, Ticker=${ticker}, Spot=$${price}, IV=${iv}%, VIX=${vix}, DTE=${days}, MaxProfit=$${Math.round(maxP)}, MaxLoss=$${Math.round(Math.abs(maxL))}. Evaluate this trade.`}]})});
  const d=await res.json();return JSON.parse(((d.content?.[0]?.text)||"{}").replace(/```json|```/g,"").trim());}catch(e){return null;}
}

// ── SCANNER ───────────────────────────────────────────────────────────────────
function generateScanResults(quotes,vix){
  const results=[];Object.values(quotes).forEach(q=>{if(!q||!SP500.includes(q.sym))return;const beta=BETA[q.sym]||1.2;const iv=Math.max(8,(vix||20)/100*beta*115+Math.abs(q.pct/100)*35)*100;const ivRank=Math.min(100,Math.max(0,(iv-15)/(60-15)*100));const momentum=q.pct;let signal="NEUTRAL";if(momentum>3&&ivRank<40)signal="BUY CALLS";else if(momentum<-3&&ivRank<40)signal="BUY PUTS";else if(ivRank>70)signal="SELL PREMIUM";else if(Math.abs(momentum)<1&&ivRank>50)signal="IRON CONDOR";results.push({sym:q.sym,price:q.price,pct:q.pct,iv:iv.toFixed(1),ivRank:ivRank.toFixed(0),signal,vol:(q.vol/1e6).toFixed(1)+"M"});});
  return results.sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct)).slice(0,20);
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
            const bodyTop    = Math.min(yO, yC);
            const bodyH      = Math.max(1, Math.abs(yO - yC));
            const color      = d.bullish ? C.green : C.red;
            const halfW      = candleW / 2;
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
  const subH  = hasSubPane ? 80 : 0;
  const volH  = showVolume && !hasSubPane ? 40 : 0;
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
  const bb    = (indicator === "bb")    ? calcBollingerBands(history) : [];
  const rsi   = (indicator === "rsi")   ? calcRSI(history) : [];
  const macd  = (indicator === "macd")  ? calcMACD(history) : { macdLine: [], signal: [], histogram: [] };

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
          {[["area","Area"],["candle","Candles"],["bar","Bars"]].map(([id,label]) => (
            <button key={id} onClick={() => setChartType(id)}
              style={{ padding: "3px 10px", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit", background: chartType === id ? C.blue+"22" : "transparent", color: chartType === id ? C.blue : C.dim }}>
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
              style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid " + (indicator === ind.id ? C.purple : C.border), cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit", background: indicator === ind.id ? C.purple+"22" : "transparent", color: indicator === ind.id ? C.purple : C.dim }}>
              {ind.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <button onClick={() => setShowVolume(v => !v)}
          style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid " + (showVolume ? C.teal : C.border), cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit", background: showVolume ? C.teal+"22" : "transparent", color: showVolume ? C.teal : C.dim }}>
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
                const bH   = Math.max(1, Math.abs(scaleY(d.open) - scaleY(d.close)));
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
                    mid   += `${inM ? "L" : "M"}${cx(i)},${scaleY(b.mid)}`;
                    lower += `${inL ? "L" : "M"}${cx(i)},${scaleY(b.lower)}`;
                    fill  += `${inF ? "L" : "M"}${cx(i)},${scaleY(b.upper)}`;
                    inU = inM = inL = inF = true;
                  }
                });
                const lowerRev = visBB.filter(b => b.lower !== null).map((b, i) => ({ b, i: visBB.indexOf(b) }));
                const fillPath = fill + " " + lowerRev.reverse().map(({ b, i }) => `L${cx(i)},${scaleY(b.lower)}`).join(" ") + " Z";
                return <>
                  <path d={fillPath} fill={C.purple} fillOpacity={0.05} />
                  <path d={upper} fill="none" stroke={C.purple} strokeWidth={1} opacity={0.6} strokeDasharray="3 3" />
                  <path d={mid}   fill="none" stroke={C.purple} strokeWidth={1.2} opacity={0.8} />
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
            {indicator === "bb"    && <><span style={{ color: C.purple }}>── BB Mid</span><span style={{ color: C.purple, opacity: 0.6 }}>- - BB Bands</span></>}
            {indicator === "rsi"   && <><span style={{ color: C.green }}>30</span><span style={{ color: C.purple }}>── RSI 14</span><span style={{ color: C.red }}>70</span></>}
            {indicator === "macd"  && <><span style={{ color: C.blue }}>── MACD</span><span style={{ color: C.orange }}>- - Signal</span><span style={{ color: C.green }}>▌ Hist</span></>}
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
function Badge({bg,color,size=9,children}){return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:size,fontWeight:700,background:bg,color}}>{children}</span>;}
function SimTag(){
  if (DATA_CONFIG.USE_LIVE_DATA) return <span style={{fontSize:7,fontWeight:700,color:C.green,letterSpacing:"0.08em",marginLeft:3}}>●LIVE</span>;
  return <span style={{fontSize:8,fontWeight:700,color:C.teal,letterSpacing:"0.1em",marginLeft:4}}>●SIM</span>;
}

function VIXMeter({vix}){
  const lvl=!vix?"—":vix<15?"LOW":vix<20?"NORMAL":vix<30?"ELEVATED":vix<40?"HIGH":"EXTREME";
  const col=!vix?C.muted:vix<15?C.green:vix<20?C.teal:vix<30?C.yellow:vix<40?C.orange:C.red;
  return(
    <div style={{textAlign:"center",padding:"4px 0"}}>
      <div style={{fontSize:26,fontWeight:700,color:col,lineHeight:1}}>{vix?vix.toFixed(2):"—"}</div>
      <div style={{fontSize:9,color:C.muted,letterSpacing:"0.12em",marginTop:2}}>VIX</div>
      <div style={{background:"#1a2535",borderRadius:4,height:5,margin:"6px 0 5px"}}><div style={{height:5,borderRadius:4,background:col,width:vix?Math.min(100,(vix/50)*100)+"%":"0%",transition:"width 1s"}}/></div>
      <Badge bg={col+"33"} color={col}>{lvl}</Badge>
      <div style={{fontSize:9,color:C.dim,marginTop:4}}>{!vix?"":vix<15?"Options cheap":vix<20?"Normal vol":vix<30?"Elevated fear":vix<40?"High fear":"Extreme caution"}</div>
    </div>
  );
}

function MiniChart({data,color,height=70}){
  if(!data?.length)return<div style={{height,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:10}}>No data</div>;
  return(<ResponsiveContainer width="100%" height={height}><AreaChart data={data} margin={{top:2,right:0,left:0,bottom:2}}><defs><linearGradient id="mcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#mcg)" dot={false}/><XAxis dataKey="date" hide/><YAxis domain={["auto","auto"]} hide/></AreaChart></ResponsiveContainer>);
}

function AIResultBox({res}){
  const vs=VERDICT_STYLE[res.verdict]||{bg:"#1a2535",col:C.muted};
  return(<div style={{background:"#06090f",border:"1px solid "+C.border,borderRadius:8,padding:12,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><Badge bg={vs.bg} color={vs.col} size={11}>{res.verdict}</Badge><span style={{fontSize:10,color:C.blue}}>Conf: {res.confidence}%</span></div><div style={{fontSize:11,color:"#94a3b8",lineHeight:1.6,marginBottom:6}}>{res.summary}</div><div style={{fontSize:10,color:C.yellow,marginBottom:3}}>VIX: {res.vixImpact}</div><div style={{fontSize:10,color:C.red,marginBottom:3}}>Greeks: {res.greekRisk}</div><div style={{display:"flex",gap:10,fontSize:10,color:C.muted}}><span>DTE: <strong style={{color:C.blue}}>{res.suggestedDTE}d</strong></span><span>Size: <strong style={{color:C.yellow}}>{res.sizingAdvice}</strong></span></div></div>);
}

function ChainRow({row,spot,type,onBuy,onSell}){
  const atm=Math.abs(row.strike-spot)<spot*0.013;
  const bg=atm?"rgba(56,189,248,0.07)":row.itm?"rgba(74,222,128,0.03)":"transparent";
  return(<tr style={{background:bg,borderBottom:"1px solid "+C.border+"18"}}><td style={{padding:"4px 6px"}}>{atm&&<Badge bg="#0f2a40" color={C.blue}>ATM</Badge>}{!atm&&row.itm&&<Badge bg="#0a2010" color={C.green}>ITM</Badge>}{!atm&&!row.itm&&<Badge bg="#111" color={C.muted}>OTM</Badge>}</td><td style={{padding:"5px 8px",fontWeight:700,color:atm?C.blue:C.text}}>${row.strike}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.red}}>${row.bid}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.green}}>${row.ask}</td><td style={{padding:"5px 8px",textAlign:"right"}}>${row.last}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.yellow}}>{row.iv}%</td><td style={{padding:"5px 8px",textAlign:"right",color:type==="call"?C.green:C.red}}>{row.delta}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.purple}}>{row.gamma}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.orange}}>{row.theta}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.teal}}>{row.vega}</td><td style={{padding:"5px 8px",textAlign:"right"}}>{row.vol.toLocaleString()}</td><td style={{padding:"5px 8px",textAlign:"right",color:C.dim}}>{row.oi.toLocaleString()}</td><td style={{padding:"4px 8px",textAlign:"right"}}><div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><button onClick={onBuy} style={{padding:"3px 10px",background:"#052e16",color:C.green,border:"1px solid #166534",borderRadius:5,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>BUY</button><button onClick={onSell} style={{padding:"3px 10px",background:"#3b0000",color:C.red,border:"1px solid #7f1d1d",borderRadius:5,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit"}}>SELL</button></div></td></tr>);
}

function LegRow({leg:l,spot,days,iv}){
  const K=l.t==="stock"?null:spot*l.k;const opt=(l.t!=="stock"&&K)?BS(spot,K,days/365,0.05,iv,l.t):null;
  return(<div style={{background:"#080c14",borderRadius:7,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><Badge bg={l.side==="buy"?"#052e16":"#3b0000"} color={l.side==="buy"?C.green:C.red}>{l.side.toUpperCase()}</Badge><span style={{fontWeight:700,fontSize:12}}>{l.t==="stock"?"STOCK":l.t.toUpperCase()}</span></div>{K&&<div style={{fontSize:10,color:C.muted}}>K: <span style={{color:C.text}}>${K.toFixed(2)}</span>{" · Prem: "}<span style={{color:C.yellow}}>{opt?"$"+opt.price.toFixed(2):"—"}</span></div>}</div><span style={{color:C.dim,fontSize:11}}>x{l.q}</span></div>);
}

function TradeRow({trade:t,liveQuote,onClose}){
  const lp = liveQuote ? liveQuote.price : t.spot;
  const chg = ((lp - t.spot) / t.spot * 100).toFixed(2);
  const tup = +chg >= 0;
  const vs = VERDICT_STYLE[t.verdict] || {bg:"#1a2535",col:C.muted};
  const contracts = t.contracts || 1;
  // Live P&L estimate: directional move × cost × leverage factor
  const livePnl = +((lp - t.spot) / t.spot * t.cost * (t.strategy?.includes("Put") ? -1 : 1) * 2.1).toFixed(2);
  const pnlUp = livePnl >= 0;
  const daysHeld = Math.max(0, Math.round((Date.now() - t.id) / 86400000));
  const daysLeft = t.expiry ? Math.max(0, Math.round((new Date(t.expiry) - Date.now()) / 86400000)) : t.days || 30;
  const timeUsed = t.days ? Math.min(100, ((t.days - daysLeft) / t.days) * 100) : 50;

  return (
    <div style={{background:"#090d18",borderRadius:10,padding:"14px 16px",marginBottom:8,border:"1px solid "+(pnlUp?C.green+"33":C.red+"22")}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:14}}>{t.ticker}</span>
            <span style={{fontSize:10,color:C.dim,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.strategy}</span>
            <Badge bg={vs.bg} color={vs.col}>{t.verdict}</Badge>
            {t.conf>0 && <Badge bg="#0f1a2e" color={C.blue}>AI {t.conf}%</Badge>}
            {contracts>1 && <Badge bg="#0a1f1e" color={C.teal}>{contracts} lots</Badge>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:8}}>
            {[
              ["Entry", "$"+t.spot, C.text],
              ["Live", "$"+lp, tup?C.green:C.red],
              ["Cost", "$"+t.cost.toFixed(0), C.yellow],
              ["Live P&L", (pnlUp?"+":"")+"$"+Math.abs(livePnl).toFixed(0), pnlUp?C.green:C.red],
            ].map(([label,val,col])=>(
              <div key={label} style={{background:"#06090f",borderRadius:6,padding:"6px 8px"}}>
                <div style={{fontSize:8,color:C.muted,marginBottom:2}}>{label}</div>
                <div style={{fontSize:12,fontWeight:700,color:col}}>{val}</div>
              </div>
            ))}
          </div>
          {/* Time decay progress bar */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:9,color:C.dim,flexShrink:0}}>DTE: {daysLeft}d</span>
            <div style={{flex:1,background:"#1a2535",borderRadius:3,height:4}}>
              <div style={{height:4,borderRadius:3,background:daysLeft<7?C.red:daysLeft<14?C.yellow:C.green,width:Math.max(2,100-timeUsed)+"%",transition:"width 1s"}}/>
            </div>
            <span style={{fontSize:9,color:C.muted,flexShrink:0}}>Exp: {t.expiry}</span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          <div style={{fontSize:20,fontWeight:700,color:pnlUp?C.green:C.red}}>{pnlUp?"+":""}${Math.abs(livePnl).toFixed(0)}</div>
          <div style={{fontSize:9,color:pnlUp?C.green:C.red}}>{tup?"+":""}{chg}% on underlying</div>
          <button onClick={onClose} style={{padding:"6px 16px",background:"#450a0a",color:C.red,border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:10,fontFamily:"inherit"}}>Close Position</button>
        </div>
      </div>
    </div>
  );
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

  const tickers = ["SPY","QQQ","AAPL","NVDA","TSLA","MSFT","META","AMZN","GOOGL"];
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
  const sentBg  = { bullish: "#052e16", bearish: "#3b0000", neutral: "#1a2535" };

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
          {[1,2,3,4].map(i => (
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
const LEARN_ITEMS=[{name:"Bull Call Spread",tag:"Bullish",level:"Beginner",what:"Buy a lower-strike call and sell a higher-strike call with same expiry.",when:"You expect moderate upside, want to reduce cost vs buying a naked call.",risk:"Max loss = net premium paid. Max profit = spread width minus premium.",greeks:"Net positive delta, low gamma, negative theta, low vega."},{name:"Straddle",tag:"Volatile",level:"Intermediate",what:"Buy a call and a put at the same strike and expiry.",when:"You expect a big move but don't know direction. Earnings plays.",risk:"Max loss = total premium paid. Profit requires a large move.",greeks:"Delta near zero, high gamma, negative theta, high positive vega."},{name:"Covered Call",tag:"Income",level:"Beginner",what:"Own 100 shares and sell a call option against them.",when:"Moderately bullish or neutral. Generate income from existing position.",risk:"Upside capped at strike. Downside same as holding stock.",greeks:"Low effective delta, negative gamma from short call, positive theta."},{name:"Iron Condor",tag:"Neutral",level:"Advanced",what:"Sell an OTM call spread + sell an OTM put spread simultaneously.",when:"You expect low volatility and range-bound price action.",risk:"Max profit = net credit. Max loss = spread width minus credit.",greeks:"Near-zero delta, short gamma, positive theta, short vega."},{name:"Butterfly",tag:"Neutral",level:"Intermediate",what:"Buy wings, sell two ATM calls. All same expiry.",when:"Stock will stay near current price through expiration.",risk:"Max loss = net debit. Max profit at center strike.",greeks:"Near-zero delta, positive gamma at wings, positive theta."},{name:"Protective Put",tag:"Hedging",level:"Beginner",what:"Own 100 shares and buy a put for downside insurance.",when:"Bullish long-term but want protection against a sharp drop.",risk:"Max loss limited to strike minus entry price plus premium.",greeks:"Higher delta than naked stock, positive gamma, negative theta."}];
const STRAT_REC_MAP={"Bullish-High-1-3 months":["Bull Call Spread","Straddle","Butterfly"],"Bullish-Low-Short (<1 month)":["Covered Call","Bull Put Spread","Bull Call Spread"],"Bullish-Neutral-1-3 months":["Bull Call Spread","Bull Put Spread","Covered Call"],"Bearish-High-1-3 months":["Bear Put Spread","Straddle","Bear Call Spread"],"Bearish-Low-Short (<1 month)":["Bear Call Spread","Bear Put Spread","Protective Put"],"Neutral-Low-1-3 months":["Butterfly","Covered Call","Bull Put Spread"],"Neutral-High-1-3 months":["Straddle","Strangle","Butterfly"]};

// ── WATCHLIST PAGE ────────────────────────────────────────────────────────────
function WatchlistPage({quotes, vix, onSelectTicker, priceAlerts, setPriceAlerts}){
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("optiflow_watchlist") || '["AAPL","NVDA","TSLA","META","AMZN","SPY","QQQ"]'); } catch { return ["AAPL","NVDA","TSLA","META","AMZN","SPY","QQQ"]; }
  });
  const [addTicker, setAddTicker] = useState("");
  const [alertInput, setAlertInput] = useState({});
  const [triggered, setTriggered] = useState([]);
  const [sortBy, setSortBy] = useState("default");

  // Persist watchlist
  useEffect(() => {
    try { localStorage.setItem("optiflow_watchlist", JSON.stringify(watchlist)); } catch {}
  }, [watchlist]);

  // Use shared alerts if provided, else local
  const alerts = priceAlerts || {};
  const setAlerts = setPriceAlerts || (() => {});

  // Alert checking
  useEffect(() => {
    watchlist.forEach(sym => {
      const q = quotes[sym]; if (!q) return;
      const al = alerts[sym]; if (!al) return;
      if (al.above && q.price >= al.above && !al.aboveTriggered) {
        setTriggered(t => [...t.slice(-9), {sym, type:"above", price:q.price, target:al.above, time:new Date().toLocaleTimeString()}]);
        setAlerts(a => ({...a, [sym]: {...a[sym], aboveTriggered:true}}));
      }
      if (al.below && q.price <= al.below && !al.belowTriggered) {
        setTriggered(t => [...t.slice(-9), {sym, type:"below", price:q.price, target:al.below, time:new Date().toLocaleTimeString()}]);
        setAlerts(a => ({...a, [sym]: {...a[sym], belowTriggered:true}}));
      }
    });
  }, [quotes]);

  const addToWatchlist = () => {
    const sym = addTicker.trim().toUpperCase();
    if (sym && !watchlist.includes(sym) && (ALL_TICKERS.includes(sym) || Object.keys(NSE_STOCKS).includes(sym) || sym.length <= 6)) {
      setWatchlist(w => [...w, sym]);
      setAddTicker("");
    }
  };

  const setAlert = (sym) => {
    const ab = parseFloat(alertInput[sym+"_above"]);
    const bw = parseFloat(alertInput[sym+"_below"]);
    setAlerts(a => ({...a, [sym]: {above:isNaN(ab)?null:ab, below:isNaN(bw)?null:bw, aboveTriggered:false, belowTriggered:false}}));
    setAlertInput(inp => ({...inp, [sym+"_above"]:"", [sym+"_below"]:""}));
  };

  const sorted = [...watchlist].sort((a,b) => {
    if (sortBy === "gainers") return (quotes[b]?.pct||0) - (quotes[a]?.pct||0);
    if (sortBy === "losers")  return (quotes[a]?.pct||0) - (quotes[b]?.pct||0);
    if (sortBy === "name")    return a.localeCompare(b);
    return 0;
  });

  const card = {background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:16};
  const inp = (border) => ({background:"#080c14", border:"1px solid "+(border||C.border), borderRadius:6, padding:"7px 10px", color:C.text, fontSize:12, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box"});

  return (
    <div>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10}}>
        <div>
          <div style={{fontSize:18, fontWeight:700, marginBottom:2}}>👁 Watchlist & Alerts</div>
          <div style={{fontSize:12, color:C.dim}}>Track stocks. Set price alerts. Get notified automatically.</div>
        </div>
        <div style={{display:"flex", gap:6}}>
          {[["default","Default"],["gainers","📈 Gainers"],["losers","📉 Losers"],["name","A–Z"]].map(([id,label])=>(
            <button key={id} onClick={()=>setSortBy(id)}
              style={{padding:"6px 12px", background:sortBy===id?"rgba(56,189,248,0.15)":C.card, border:"1px solid "+(sortBy===id?C.blue:C.border), borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, color:sortBy===id?C.blue:C.dim, fontFamily:"inherit"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Triggered alerts banner */}
      {triggered.length > 0 && (
        <div style={{marginBottom:14}}>
          {triggered.slice(-3).map((t,i) => (
            <div key={i} style={{background:"#1c1a0a", border:"1px solid "+C.yellow, borderRadius:8, padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{fontSize:12, color:C.yellow}}>🔔 <strong>{t.sym}</strong> hit ${t.price} — {t.type} alert ${t.target}</div>
              <span style={{fontSize:10, color:C.dim}}>{t.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add ticker */}
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        <input value={addTicker} onChange={e=>setAddTicker(e.target.value.toUpperCase())}
          onKeyDown={e=>e.key==="Enter"&&addToWatchlist()}
          placeholder="Add ticker (AAPL, RELIANCE, BTC…)"
          style={{flex:1, background:"#080c14", border:"1px solid "+C.border, borderRadius:7, padding:"10px 14px", color:C.text, fontSize:13, outline:"none", fontFamily:"inherit"}}/>
        <button onClick={addToWatchlist}
          style={{padding:"10px 20px", background:"linear-gradient(135deg,#0369a1,#0ea5e9)", color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit"}}>
          + Add
        </button>
      </div>

      {/* Summary stats */}
      {watchlist.length > 0 && (()=>{
        const vals = watchlist.map(s=>quotes[s]?.pct||0);
        const gainers = vals.filter(v=>v>0).length;
        const losers = vals.filter(v=>v<0).length;
        const avgMove = vals.length ? +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : 0;
        return (
          <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14}} className="main-grid-4">
            {[
              ["Watching", watchlist.length, C.blue],
              ["Gainers", gainers, C.green],
              ["Losers", losers, C.red],
              ["Avg Move", (avgMove>=0?"+":"")+avgMove+"%", avgMove>=0?C.green:C.red],
            ].map(([label,val,col])=>(
              <div key={label} style={{...card, textAlign:"center", padding:"10px 8px"}}>
                <div style={{fontSize:9, color:C.muted, marginBottom:3}}>{label}</div>
                <div style={{fontSize:16, fontWeight:700, color:col}}>{val}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Watchlist items */}
      <div style={{display:"flex", flexDirection:"column", gap:8}}>
        {sorted.length === 0 && (
          <div style={{...card, textAlign:"center", padding:"40px 0"}}>
            <div style={{fontSize:32, marginBottom:8}}>👁</div>
            <div style={{fontSize:13, color:C.dim}}>Your watchlist is empty. Add some tickers above.</div>
          </div>
        )}
        {sorted.map(sym => {
          const q = quotes[sym];
          const up = q ? q.change >= 0 : true;
          const al = alerts[sym] || {};
          const ivEst = Math.max(8, (vix||20)/100*(BETA[sym]||1.2)*115);
          const hasAlert = al.above || al.below;

          return (
            <div key={sym} style={{...card, borderLeft:"3px solid "+(hasAlert?C.yellow:up?C.green:C.red)}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12}}>

                {/* Left: price info */}
                <div style={{cursor:"pointer", flex:1}} onClick={()=>onSelectTicker(sym)}>
                  <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:6}}>
                    <span style={{fontWeight:700, fontSize:17, color:C.blue}}>{sym}</span>
                    <SimTag/>
                    {hasAlert && <span style={{fontSize:9, padding:"2px 7px", background:"rgba(251,191,36,0.15)", color:C.yellow, borderRadius:4, border:"1px solid "+C.yellow+"44"}}>🔔 Alert set</span>}
                  </div>
                  {q ? (
                    <div>
                      <div style={{display:"flex", alignItems:"baseline", gap:10}}>
                        <span style={{fontSize:24, fontWeight:700, color:up?C.green:C.red}}>${q.price}</span>
                        <span style={{fontSize:13, fontWeight:700, color:up?C.green:C.red}}>{up?"+":""}{q.change} ({up?"+":""}{q.pct}%)</span>
                      </div>
                      <div style={{display:"flex", gap:16, fontSize:10, color:C.dim, marginTop:4}}>
                        <span>H: ${q.high}</span>
                        <span>L: ${q.low}</span>
                        <span>Vol: {(q.vol/1e6).toFixed(1)}M</span>
                        <span>IV est: {ivEst.toFixed(0)}%</span>
                      </div>
                    </div>
                  ) : <div style={{fontSize:12, color:C.muted}}>Loading…</div>}

                  {/* Alert levels visual */}
                  {q && hasAlert && (
                    <div style={{display:"flex", gap:8, marginTop:8, flexWrap:"wrap"}}>
                      {al.above && (
                        <div style={{fontSize:9, padding:"2px 8px", background:q.price>=al.above?"#052e16":"#0a0e18", color:q.price>=al.above?C.green:C.dim, borderRadius:4, border:"1px solid "+(q.price>=al.above?C.green:C.border)}}>
                          ↑ Above ${al.above} {q.price>=al.above?"✓ TRIGGERED":""}
                        </div>
                      )}
                      {al.below && (
                        <div style={{fontSize:9, padding:"2px 8px", background:q.price<=al.below?"#3b0000":"#0a0e18", color:q.price<=al.below?C.red:C.dim, borderRadius:4, border:"1px solid "+(q.price<=al.below?C.red:C.border)}}>
                          ↓ Below ${al.below} {q.price<=al.below?"✓ TRIGGERED":""}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: alert inputs + actions */}
                <div style={{display:"flex", flexDirection:"column", gap:8, minWidth:220}}>
                  <div style={{fontSize:9, color:C.dim, fontWeight:700, letterSpacing:"0.1em"}}>SET PRICE ALERTS</div>
                  <div style={{display:"flex", gap:6}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8, color:C.green, marginBottom:2}}>Above $</div>
                      <input type="number" placeholder={q ? (q.price*1.05).toFixed(0) : "—"}
                        value={alertInput[sym+"_above"]||""}
                        onChange={e=>setAlertInput(a=>({...a,[sym+"_above"]:e.target.value}))}
                        style={inp(al.above?C.green:C.border)}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8, color:C.red, marginBottom:2}}>Below $</div>
                      <input type="number" placeholder={q ? (q.price*0.95).toFixed(0) : "—"}
                        value={alertInput[sym+"_below"]||""}
                        onChange={e=>setAlertInput(a=>({...a,[sym+"_below"]:e.target.value}))}
                        style={inp(al.below?C.red:C.border)}/>
                    </div>
                  </div>
                  <div style={{display:"flex", gap:6}}>
                    <button onClick={()=>setAlert(sym)}
                      style={{flex:1, padding:"7px", background:"#0f2a40", color:C.blue, border:"1px solid "+C.blue+"44", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"inherit"}}>
                      🔔 Set Alert
                    </button>
                    {hasAlert && (
                      <button onClick={()=>setAlerts(a=>({...a,[sym]:{}}))}
                        style={{padding:"7px 10px", background:"#1a2535", color:C.muted, border:"1px solid "+C.border, borderRadius:6, cursor:"pointer", fontSize:9, fontFamily:"inherit"}}>
                        Clear
                      </button>
                    )}
                    <button onClick={()=>setWatchlist(w=>w.filter(s=>s!==sym))}
                      style={{padding:"7px 10px", background:"#3b0000", color:C.red, border:"none", borderRadius:6, cursor:"pointer", fontSize:10, fontFamily:"inherit"}}>
                      ✕
                    </button>
                  </div>
                  <button onClick={()=>onSelectTicker(sym)}
                    style={{width:"100%", padding:"7px", background:"rgba(56,189,248,0.1)", color:C.blue, border:"1px solid "+C.blue+"33", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, fontFamily:"inherit"}}>
                    View Options →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SCANNER PAGE ──────────────────────────────────────────────────────────────
function ScannerPage({quotes,vix,onSelectTicker}){
  const [filter,setFilter]=useState("ALL");const [minIVRank,setMinIVRank]=useState(0);
  const results=useMemo(()=>generateScanResults(quotes,vix),[quotes,vix]);
  const signals=["ALL","BUY CALLS","BUY PUTS","SELL PREMIUM","IRON CONDOR","NEUTRAL"];
  const filtered=results.filter(r=>{if(filter!=="ALL"&&r.signal!==filter)return false;if(+r.ivRank<minIVRank)return false;return true;});
  const sigCol={"BUY CALLS":C.green,"BUY PUTS":C.red,"SELL PREMIUM":C.purple,"IRON CONDOR":C.teal,"NEUTRAL":C.muted};
  const sigBg={"BUY CALLS":"#052e16","BUY PUTS":"#3b0000","SELL PREMIUM":"#1a0f2e","IRON CONDOR":"#0a1f1e","NEUTRAL":"#1a2535"};
  const card={background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:16};
  return(<div><div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Options Scanner</div><div style={{fontSize:12,color:C.dim,marginBottom:16}}>Signals based on IV rank, momentum & volatility regime</div><div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>{signals.map(s=>(<button key={s} onClick={()=>setFilter(s)} style={{padding:"6px 12px",background:filter===s?"rgba(56,189,248,0.15)":C.card,border:"1px solid "+(filter===s?C.blue:C.border),borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,color:filter===s?C.blue:C.dim,fontFamily:"inherit"}}>{s}</button>))}<div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,fontSize:11,color:C.dim}}>IV Rank ≥<input type="number" value={minIVRank} onChange={e=>setMinIVRank(+e.target.value)} style={{width:50,background:"#080c14",border:"1px solid "+C.border,borderRadius:5,padding:"4px 8px",color:C.text,fontSize:11,outline:"none",fontFamily:"inherit"}}/>%</div></div><div style={card}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ticker","Price","Day %","IV Est","IV Rank","Signal","Volume",""].map((h,i)=>(<th key={i} style={{padding:"8px 10px",color:C.dim,textAlign:i===0?"left":"right",fontSize:9,fontWeight:700,letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead><tbody>{filtered.length===0&&<tr><td colSpan={8} style={{padding:"28px",textAlign:"center",color:C.muted,fontSize:12}}>No results match current filters</td></tr>}{filtered.map((r,i)=>(<tr key={i} style={{borderBottom:"1px solid "+C.border+"18",cursor:"pointer"}} onClick={()=>onSelectTicker(r.sym)}><td style={{padding:"8px 10px",fontWeight:700,color:C.blue}}>{r.sym}</td><td style={{padding:"8px 10px",textAlign:"right",fontWeight:700}}>${r.price}</td><td style={{padding:"8px 10px",textAlign:"right",color:r.pct>=0?C.green:C.red,fontWeight:700}}>{r.pct>=0?"+":""}{r.pct}%</td><td style={{padding:"8px 10px",textAlign:"right",color:C.yellow}}>{r.iv}%</td><td style={{padding:"8px 10px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}><div style={{width:50,height:5,background:"#1a2535",borderRadius:3}}><div style={{width:r.ivRank+"%",height:5,background:+r.ivRank>70?C.red:+r.ivRank>40?C.yellow:C.green,borderRadius:3}}/></div><span style={{color:+r.ivRank>70?C.red:+r.ivRank>40?C.yellow:C.green}}>{r.ivRank}%</span></div></td><td style={{padding:"8px 10px",textAlign:"right"}}><Badge bg={sigBg[r.signal]||"#1a2535"} color={sigCol[r.signal]||C.muted} size={9}>{r.signal}</Badge></td><td style={{padding:"8px 10px",textAlign:"right",color:C.dim}}>{r.vol}</td><td style={{padding:"8px 10px",textAlign:"right"}}><button onClick={e=>{e.stopPropagation();onSelectTicker(r.sym);}} style={{padding:"3px 10px",background:"#0f2a40",color:C.blue,border:"1px solid "+C.blue+"44",borderRadius:5,cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>Trade →</button></td></tr>))}</tbody></table></div><div style={{fontSize:9,color:C.muted,marginTop:10}}>Prices are simulated for educational/paper trading purposes. Not financial advice.</div></div></div>);
}

// ── GREEKS DASHBOARD ──────────────────────────────────────────────────────────
function GreeksDashboard({spot,iv,vix,ticker}){
  const [dte,setDte]=useState(30);
  const atkGreeks=useMemo(()=>{if(!spot||!iv)return null;const T=dte/365,sig=iv;return{call:BS(spot,spot,T,0.05,sig,"call"),put:BS(spot,spot,T,0.05,sig,"put")};},[spot,iv,dte]);
  const dvData=useMemo(()=>{const rows=[];for(let s=spot*0.8;s<=spot*1.2;s+=spot*0.01){const T=dte/365;const c=BS(s,spot,T,0.05,iv,"call");const p=BS(s,spot,T,0.05,iv,"put");rows.push({price:+s.toFixed(0),callDelta:+c.delta.toFixed(3),putDelta:+p.delta.toFixed(3)});}return rows;},[spot,iv,dte]);
  const thetaData=useMemo(()=>{const rows=[];for(let d=1;d<=90;d+=2){const T=d/365;const c=BS(spot,spot,T,0.05,iv,"call");rows.push({days:d,theta:+c.theta.toFixed(3),vega:+c.vega.toFixed(3)});}return rows;},[spot,iv]);
  const card={background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:16};
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:18,fontWeight:700}}>Greeks Dashboard</div><div style={{fontSize:12,color:C.dim}}>{ticker} · Spot ${spot} · IV {(iv*100).toFixed(1)}%</div></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,color:C.dim}}>DTE:</span>{[7,14,30,45,60,90].map(d=>(<button key={d} onClick={()=>setDte(d)} style={{padding:"4px 10px",background:dte===d?"rgba(56,189,248,0.15)":C.card,border:"1px solid "+(dte===d?C.blue:C.border),borderRadius:5,cursor:"pointer",fontSize:10,color:dte===d?C.blue:C.dim,fontFamily:"inherit"}}>{d}d</button>))}</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>{[["Delta",atkGreeks?.call.delta.toFixed(3),C.blue,"Price sensitivity per $1 move"],["Gamma",atkGreeks?.call.gamma.toFixed(5),C.purple,"Delta change per $1 move"],["Theta",atkGreeks?.call.theta.toFixed(3),C.orange,"Daily time decay (ATM call)"],["Vega",atkGreeks?.call.vega.toFixed(3),C.teal,"P&L per 1% IV move"]].map(([label,val,col,desc])=>(<div key={label} style={Object.assign({},card,{textAlign:"center"})}><div style={{fontSize:24,fontWeight:700,color:col}}>{val||"—"}</div><div style={{fontSize:11,fontWeight:700,color:C.text,marginTop:4}}>{label}</div><div style={{fontSize:9,color:C.dim,marginTop:2}}>{desc}</div></div>))}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><div style={card}><div style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",marginBottom:8}}>DELTA vs SPOT PRICE</div><ResponsiveContainer width="100%" height={180}><LineChart data={dvData} margin={{top:4,right:10,left:0,bottom:4}}><CartesianGrid strokeDasharray="2 4" stroke={C.border}/><XAxis dataKey="price" stroke={C.border} tick={{fontSize:8,fill:C.muted}} tickFormatter={v=>"$"+v}/><YAxis stroke={C.border} tick={{fontSize:8,fill:C.muted}} domain={[-1,1]}/><Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:6,fontSize:10}}/><ReferenceLine x={spot} stroke={C.blue} strokeDasharray="3 3"/><ReferenceLine y={0} stroke={C.border} strokeDasharray="2 2"/><Line type="monotone" dataKey="callDelta" stroke={C.green} strokeWidth={2} dot={false} name="Call Δ"/><Line type="monotone" dataKey="putDelta" stroke={C.red} strokeWidth={2} dot={false} name="Put Δ"/></LineChart></ResponsiveContainer></div><div style={card}><div style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",marginBottom:8}}>THETA DECAY vs TIME</div><ResponsiveContainer width="100%" height={180}><LineChart data={thetaData} margin={{top:4,right:10,left:0,bottom:4}}><CartesianGrid strokeDasharray="2 4" stroke={C.border}/><XAxis dataKey="days" stroke={C.border} tick={{fontSize:8,fill:C.muted}} tickFormatter={v=>v+"d"}/><YAxis stroke={C.border} tick={{fontSize:8,fill:C.muted}}/><Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:6,fontSize:10}}/><Line type="monotone" dataKey="theta" stroke={C.orange} strokeWidth={2} dot={false} name="Theta"/><Line type="monotone" dataKey="vega" stroke={C.teal} strokeWidth={2} dot={false} name="Vega"/></LineChart></ResponsiveContainer></div></div><div style={card}><div style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",marginBottom:12}}>ATM OPTIONS GREEKS — CALLS vs PUTS</div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Type","Price","Delta","Gamma","Theta/day","Vega/1%IV"].map((h,i)=>(<th key={i} style={{padding:"6px 10px",color:C.dim,textAlign:i===0?"left":"right",fontSize:9,fontWeight:700,letterSpacing:"0.06em"}}>{h}</th>))}</tr></thead><tbody>{atkGreeks&&[["CALL",atkGreeks.call,C.green],["PUT",atkGreeks.put,C.red]].map(([type,g,col])=>(<tr key={type} style={{borderBottom:"1px solid "+C.border+"22"}}><td style={{padding:"8px 10px",fontWeight:700,color:col}}>{type}</td><td style={{padding:"8px 10px",textAlign:"right"}}>${g.price.toFixed(2)}</td><td style={{padding:"8px 10px",textAlign:"right",color:C.blue}}>{g.delta.toFixed(3)}</td><td style={{padding:"8px 10px",textAlign:"right",color:C.purple}}>{g.gamma.toFixed(5)}</td><td style={{padding:"8px 10px",textAlign:"right",color:C.orange}}>${g.theta.toFixed(3)}</td><td style={{padding:"8px 10px",textAlign:"right",color:C.teal}}>${g.vega.toFixed(3)}</td></tr>))}</tbody></table></div></div></div>);
}

// ── AI ANALYSIS HUB ──────────────────────────────────────────────────────────
function AIAnalysisHub({quotes,vix,ticker,spot,ivPct,history,up}){
  const [aiTicker,setAiTicker]=useState(ticker);
  const [analysisType,setAnalysisType]=useState("full");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [chatHistory,setChatHistory]=useState([]);
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [activeTab,setActiveTab]=useState("analysis");
  const card={background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:16};

  const ANALYSIS_TYPES=[
    {id:"full",label:"Full Analysis",icon:"🔬",desc:"Deep dive: technicals, sentiment, risk, entry points"},
    {id:"bullbear",label:"Bull vs Bear",icon:"⚖️",desc:"Balanced case for both sides of the trade"},
    {id:"entry",label:"Entry Signals",icon:"🎯",desc:"Specific price levels, triggers and timing"},
    {id:"risk",label:"Risk Assessment",icon:"🛡️",desc:"Key risks, black swans, position sizing"},
    {id:"compare",label:"Sector Compare",icon:"📊",desc:"How this stock compares to peers"},
  ];

  const runAnalysis=async()=>{
    setLoading(true);setResult(null);
    const q=quotes[aiTicker];
    const price=q?q.price:spot;
    const pct=q?q.pct:0;
    const prompts={
      full:`You are a senior equity analyst. Analyze ${aiTicker} at $${price} (${pct>0?"+":""}${pct}% today). IV=${ivPct}%, VIX=${vix}. Provide a professional analysis. Respond ONLY in valid JSON: {"verdict":"STRONG BUY|BUY|HOLD|SELL|STRONG SELL","confidence":0-100,"priceTarget":number,"targetTimeframe":"string","summary":"2-3 sentence overview","technicalSignal":"1 sentence on price action","catalysts":["catalyst1","catalyst2","catalyst3"],"risks":["risk1","risk2","risk3"],"supportLevel":number,"resistanceLevel":number,"keyInsight":"1 bold contrarian or key insight","optionsActivity":"1 sentence on options flow implication","positionSizing":"small|medium|full","tradePlan":"1-2 sentence actionable plan"}`,
      bullbear:`Analyze ${aiTicker} at $${price}. Give both bull and bear cases. Respond ONLY in valid JSON: {"verdict":"BULL|BEAR|NEUTRAL","confidence":0-100,"bullCase":{"title":"string","points":["p1","p2","p3"],"priceTarget":number,"probability":number},"bearCase":{"title":"string","points":["p1","p2","p3"],"priceTarget":number,"probability":number},"keySwing":"what would make you change your view","verdict_summary":"1 sentence"}`,
      entry:`Analyze entry signals for ${aiTicker} at $${price}, IV=${ivPct}%, VIX=${vix}. Respond ONLY in valid JSON: {"currentSignal":"BUY|SELL|WAIT","confidence":0-100,"idealEntry":number,"stopLoss":number,"target1":number,"target2":number,"riskReward":number,"entryTriggers":["trigger1","trigger2"],"avoidIf":["condition1","condition2"],"bestTimeframe":"string","signalStrength":"Weak|Moderate|Strong","commentary":"2 sentence tactical view"}`,
      risk:`Risk assessment for ${aiTicker} at $${price}. VIX=${vix}, IV=${ivPct}%. Respond ONLY in valid JSON: {"overallRisk":"Low|Medium|High|Extreme","riskScore":0-100,"mainRisks":[{"name":"string","severity":"Low|Medium|High","description":"string"}],"blackSwans":["scenario1","scenario2"],"correlationRisk":"string","liquidityRisk":"Low|Medium|High","earningsRisk":"string","maxDrawdown":number,"hedgingSuggestion":"string","positionLimit":"% of portfolio as number"}`,
      compare:`Compare ${aiTicker} at $${price} to its sector peers. Respond ONLY in valid JSON: {"relativeStrength":"Outperformer|In-line|Underperformer","sectorRank":number,"sectorSize":number,"valuationVsPeers":"Cheap|Fair|Expensive","momentumVsPeers":"Leading|Middle|Lagging","keyDifferentiators":["d1","d2"],"peerTickers":["p1","p2","p3"],"recommendation":"string","sectorOutlook":"Bullish|Neutral|Bearish","summary":"2 sentences"}`
    };
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:"You are a professional financial analyst. Always respond ONLY with valid JSON, no markdown, no extra text.",messages:[{role:"user",content:prompts[analysisType]}]})});
      const d=await res.json();
      const text=(d.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim();
      setResult({type:analysisType,data:JSON.parse(text)});
    }catch(e){setResult({type:"error",data:{message:"Analysis failed. Check API key in app."}});}
    setLoading(false);
  };

  const sendChat=async()=>{
    if(!chatInput.trim())return;
    const userMsg={role:"user",content:chatInput};
    const newHistory=[...chatHistory,userMsg];
    setChatHistory(newHistory);setChatInput("");setChatLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:`You are an expert trading mentor and financial analyst. The user is viewing ${aiTicker} at $${quotes[aiTicker]?.price||spot}. VIX=${vix}, IV=${ivPct}%. Give concise, actionable answers. Be direct. Format responses clearly with bullet points where helpful.`,messages:newHistory})});
      const d=await res.json();
      const reply=(d.content?.[0]?.text||"Sorry, could not get a response.");
      setChatHistory(h=>[...h,{role:"assistant",content:reply}]);
    }catch(e){setChatHistory(h=>[...h,{role:"assistant",content:"Error connecting to AI. Please try again."}]);}
    setChatLoading(false);
  };

  const QUICK_QUESTIONS=["Should I buy this dip?","What's the options strategy for earnings?","Is the IV too high to buy calls?","What's the biggest risk here?","Compare to the sector","Where's the next support level?"];

  const VerdictColors={"STRONG BUY":{bg:"#052e16",col:C.green},"BUY":{bg:"#0a2e1a",col:"#86efac"},"HOLD":{bg:"#1c1a0a",col:C.yellow},"BULL":{bg:"#052e16",col:C.green},"BEAR":{bg:"#3b0000",col:C.red},"NEUTRAL":{bg:"#1c1a0a",col:C.yellow},"SELL":{bg:"#2a0f0f",col:"#fca5a5"},"STRONG SELL":{bg:"#3b0000",col:C.red},"WAIT":{bg:"#1c1a0a",col:C.yellow}};
  const vc=v=>VerdictColors[v]||{bg:"#1a2535",col:C.dim};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>🤖 AI Analysis Hub</div>
          <div style={{fontSize:12,color:C.dim}}>Claude-powered deep market analysis & trading assistant</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select value={aiTicker} onChange={e=>setAiTicker(e.target.value)} style={{background:"#080c14",border:"1px solid "+C.border,borderRadius:7,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",cursor:"pointer",fontWeight:700}}>
            {[ticker,...QUICK.filter(s=>s!==ticker)].map(s=><option key={s}>{s}</option>)}
          </select>
          <div style={{display:"flex",gap:6}}>
            {[["analysis","Analysis"],["chat","AI Chat"]].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={{padding:"8px 16px",background:activeTab===id?"rgba(56,189,248,0.15)":C.card,border:"1px solid "+(activeTab===id?C.blue:C.border),borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,color:activeTab===id?C.blue:C.dim,fontFamily:"inherit"}}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {activeTab==="analysis" && (
        <div>
          {/* Analysis type selector */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}} className="main-grid-4">
            {ANALYSIS_TYPES.map(a=>(
              <div key={a.id} onClick={()=>setAnalysisType(a.id)} style={{...card,cursor:"pointer",border:"1px solid "+(analysisType===a.id?C.blue:C.border),background:analysisType===a.id?"rgba(56,189,248,0.06)":C.card,transition:"all .15s"}}>
                <div style={{fontSize:20,marginBottom:4}}>{a.icon}</div>
                <div style={{fontSize:11,fontWeight:700,color:analysisType===a.id?C.blue:C.text,marginBottom:3}}>{a.label}</div>
                <div style={{fontSize:9,color:C.dim,lineHeight:1.4}}>{a.desc}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <button onClick={runAnalysis} disabled={loading} style={{padding:"11px 28px",background:loading?"#1a2535":"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:8,cursor:loading?"not-allowed":"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,boxShadow:loading?"none":"0 4px 14px rgba(168,85,247,0.3)"}}>
              {loading?<><span style={{width:14,height:14,border:"2px solid #fff3",borderTop:"2px solid #fff",borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Analyzing…</>:<>🔬 Run {ANALYSIS_TYPES.find(a=>a.id===analysisType)?.label}</>}
            </button>
            {result&&<button onClick={()=>setResult(null)} style={{padding:"11px 18px",background:"#1a2535",color:C.dim,border:"1px solid "+C.border,borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Clear</button>}
          </div>

          {/* Results */}
          {result&&result.type!=="error"&&(()=>{
            const {type,data}=result;
            if(type==="full") return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="main-grid-2">
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{...card,border:"1px solid "+(vc(data.verdict).col+"44")}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <div style={{fontSize:9,color:C.dim,marginBottom:4}}>AI VERDICT — {aiTicker}</div>
                        <div style={{display:"inline-flex",padding:"4px 14px",borderRadius:6,background:vc(data.verdict).bg,color:vc(data.verdict).col,fontWeight:700,fontSize:16}}>{data.verdict}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:9,color:C.dim}}>CONFIDENCE</div>
                        <div style={{fontSize:28,fontWeight:700,color:data.confidence>70?C.green:data.confidence>40?C.yellow:C.red}}>{data.confidence}%</div>
                      </div>
                    </div>
                    <div style={{height:6,background:"#1a2535",borderRadius:3,marginBottom:12}}>
                      <div style={{height:6,borderRadius:3,width:data.confidence+"%",background:data.confidence>70?C.green:data.confidence>40?C.yellow:C.red,transition:"width 1s ease"}}/>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,marginBottom:12}}>{data.summary}</div>
                    <div style={{background:"#080c14",borderRadius:8,padding:"10px 12px",border:"1px solid "+C.border}}>
                      <div style={{fontSize:9,color:C.purple,fontWeight:700,marginBottom:4}}>💡 KEY INSIGHT</div>
                      <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>{data.keyInsight}</div>
                    </div>
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>PRICE LEVELS</div>
                    {[["Price Target",data.priceTarget,"$",C.green],["Support",data.supportLevel,"$",C.teal],["Resistance",data.resistanceLevel,"$",C.red]].map(([label,val,pre,col])=>(
                      <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border+"22"}}>
                        <div style={{fontSize:11,color:C.dim}}>{label}</div>
                        <div style={{fontSize:14,fontWeight:700,color:col}}>{pre}{val}</div>
                      </div>
                    ))}
                    <div style={{marginTop:8,fontSize:10,color:C.dim}}>⏱ {data.targetTimeframe}</div>
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>TRADE PLAN</div>
                    <div style={{fontSize:12,color:C.text,lineHeight:1.6,marginBottom:8}}>{data.tradePlan}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <Badge bg="#0f2340" color={C.blue}>Position: {data.positionSizing}</Badge>
                      <Badge bg="#1a2535" color={C.muted}>Options: {data.optionsActivity?.slice(0,40)}…</Badge>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.green,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>✅ CATALYSTS</div>
                    {(data.catalysts||[]).map((c,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}><span style={{color:C.green,fontSize:14,marginTop:1}}>↑</span><div style={{fontSize:12,color:"#94a3b8",lineHeight:1.5}}>{c}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.red,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>⚠️ RISKS</div>
                    {(data.risks||[]).map((r,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}><span style={{color:C.red,fontSize:14,marginTop:1}}>↓</span><div style={{fontSize:12,color:"#94a3b8",lineHeight:1.5}}>{r}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>TECHNICAL SIGNAL</div>
                    <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{data.technicalSignal}</div>
                  </div>
                </div>
              </div>
            );
            if(type==="bullbear") return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="main-grid-2">
                {[["BULL",data.bullCase,C.green,"#052e16"],["BEAR",data.bearCase,C.red,"#3b0000"]].map(([side,caseData,col,bg])=>(
                  <div key={side} style={{...card,border:"1px solid "+col+"44"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div style={{fontSize:16,fontWeight:700,color:col}}>{side==="BULL"?"📈":"📉"} {caseData?.title||side+" Case"}</div>
                      <Badge bg={bg} color={col}>P: {caseData?.probability}%</Badge>
                    </div>
                    <div style={{marginBottom:10,padding:8,background:bg,borderRadius:6,textAlign:"center"}}>
                      <div style={{fontSize:9,color:col,opacity:0.7}}>PRICE TARGET</div>
                      <div style={{fontSize:22,fontWeight:700,color:col}}>${caseData?.priceTarget}</div>
                    </div>
                    {(caseData?.points||[]).map((p,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}><span style={{color:col,flexShrink:0}}>{side==="BULL"?"✓":"✗"}</span><div style={{fontSize:12,color:"#94a3b8",lineHeight:1.5}}>{p}</div></div>)}
                  </div>
                ))}
                <div style={{...card,gridColumn:"1/-1",background:"#0a0e18",border:"1px solid "+C.purple+"44"}}>
                  <div style={{fontSize:9,color:C.purple,fontWeight:700,marginBottom:6}}>🔄 KEY SWING FACTOR</div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{data.keySwing}</div>
                </div>
              </div>
            );
            if(type==="entry") return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="main-grid-2">
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{...card,border:"1px solid "+(vc(data.currentSignal).col+"44")}}>
                    <div style={{fontSize:9,color:C.dim,marginBottom:6}}>CURRENT SIGNAL</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:22,fontWeight:700,color:vc(data.currentSignal).col}}>{data.currentSignal}</div>
                      <div><div style={{fontSize:9,color:C.dim}}>Strength</div><div style={{fontSize:14,fontWeight:700,color:data.signalStrength==="Strong"?C.green:data.signalStrength==="Moderate"?C.yellow:C.red}}>{data.signalStrength}</div></div>
                    </div>
                    <div style={{marginTop:8,fontSize:12,color:"#94a3b8"}}>{data.commentary}</div>
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>KEY LEVELS</div>
                    {[["Ideal Entry",data.idealEntry,"$",C.blue],["Stop Loss",data.stopLoss,"$",C.red],["Target 1",data.target1,"$",C.green],["Target 2",data.target2,"$",C.teal],["Risk/Reward","1:"+data.riskReward,"",C.yellow]].map(([label,val,pre,col])=>(
                      <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+C.border+"22"}}>
                        <div style={{fontSize:11,color:C.dim}}>{label}</div>
                        <div style={{fontSize:13,fontWeight:700,color:col}}>{pre}{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.green,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>ENTRY TRIGGERS</div>
                    {(data.entryTriggers||[]).map((t,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8}}><span style={{color:C.green}}>▶</span><div style={{fontSize:12,color:"#94a3b8"}}>{t}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.red,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>AVOID IF…</div>
                    {(data.avoidIf||[]).map((t,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8}}><span style={{color:C.red}}>✗</span><div style={{fontSize:12,color:"#94a3b8"}}>{t}</div></div>)}
                  </div>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.dim,fontWeight:700,marginBottom:6}}>BEST TIMEFRAME</div>
                    <div style={{fontSize:14,fontWeight:700,color:C.text}}>{data.bestTimeframe}</div>
                  </div>
                </div>
              </div>
            );
            if(type==="risk") return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="main-grid-2">
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{...card,border:"1px solid "+(data.overallRisk==="High"||data.overallRisk==="Extreme"?C.red:data.overallRisk==="Medium"?C.yellow:C.green)+"44"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div><div style={{fontSize:9,color:C.dim,marginBottom:4}}>OVERALL RISK</div><div style={{fontSize:20,fontWeight:700,color:data.overallRisk==="High"||data.overallRisk==="Extreme"?C.red:data.overallRisk==="Medium"?C.yellow:C.green}}>{data.overallRisk}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.dim}}>RISK SCORE</div><div style={{fontSize:28,fontWeight:700,color:data.riskScore>70?C.red:data.riskScore>40?C.yellow:C.green}}>{data.riskScore}</div></div>
                    </div>
                    <div style={{height:6,background:"#1a2535",borderRadius:3}}><div style={{height:6,borderRadius:3,width:data.riskScore+"%",background:data.riskScore>70?C.red:data.riskScore>40?C.yellow:C.green}}/></div>
                  </div>
                  {(data.mainRisks||[]).map((r,i)=>(
                    <div key={i} style={{...card,borderLeft:"3px solid "+(r.severity==="High"?C.red:r.severity==="Medium"?C.yellow:C.green)}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{fontSize:12,fontWeight:700}}>{r.name}</div><Badge bg={r.severity==="High"?"#3b0000":r.severity==="Medium"?"#1c1a0a":"#052e16"} color={r.severity==="High"?C.red:r.severity==="Medium"?C.yellow:C.green}>{r.severity}</Badge></div>
                      <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{r.description}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={card}><div style={{fontSize:9,color:C.orange,fontWeight:700,marginBottom:8}}>⚡ BLACK SWAN SCENARIOS</div>{(data.blackSwans||[]).map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8}}><span style={{color:C.orange}}>!</span><div style={{fontSize:12,color:"#94a3b8"}}>{s}</div></div>)}</div>
                  <div style={card}>{[["Max Drawdown","-"+data.maxDrawdown+"%",C.red],["Position Limit",data.positionLimit+"%",C.yellow],["Liquidity Risk",data.liquidityRisk,C.blue]].map(([label,val,col])=>(<div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+C.border+"22"}}><div style={{fontSize:11,color:C.dim}}>{label}</div><div style={{fontSize:13,fontWeight:700,color:col}}>{val}</div></div>))}</div>
                  <div style={{...card,background:"#0a1220",border:"1px solid "+C.teal+"44"}}><div style={{fontSize:9,color:C.teal,fontWeight:700,marginBottom:6}}>🛡️ HEDGING SUGGESTION</div><div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{data.hedgingSuggestion}</div></div>
                </div>
              </div>
            );
            if(type==="compare") return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="main-grid-2">
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={card}>
                    <div style={{fontSize:9,color:C.dim,marginBottom:10}}>RELATIVE PERFORMANCE</div>
                    {[["Relative Strength",data.relativeStrength,data.relativeStrength==="Outperformer"?C.green:data.relativeStrength==="Underperformer"?C.red:C.yellow],["Momentum",data.momentumVsPeers,data.momentumVsPeers==="Leading"?C.green:data.momentumVsPeers==="Lagging"?C.red:C.yellow],["Valuation",data.valuationVsPeers,data.valuationVsPeers==="Cheap"?C.green:data.valuationVsPeers==="Expensive"?C.red:C.yellow],["Sector Outlook",data.sectorOutlook,data.sectorOutlook==="Bullish"?C.green:data.sectorOutlook==="Bearish"?C.red:C.yellow]].map(([label,val,col])=>(<div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+C.border+"22"}}><div style={{fontSize:11,color:C.dim}}>{label}</div><div style={{fontSize:13,fontWeight:700,color:col}}>{val}</div></div>))}
                    <div style={{marginTop:8,fontSize:9,color:C.dim}}>Rank #{data.sectorRank} of {data.sectorSize} in sector</div>
                  </div>
                  <div style={card}><div style={{fontSize:9,color:C.blue,fontWeight:700,marginBottom:8}}>PEER TICKERS</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(data.peerTickers||[]).map(p=><Badge key={p} bg="#0f2340" color={C.blue}>{p}</Badge>)}</div></div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={card}><div style={{fontSize:9,color:C.green,fontWeight:700,marginBottom:8}}>KEY DIFFERENTIATORS</div>{(data.keyDifferentiators||[]).map((d,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8}}><span style={{color:C.green}}>★</span><div style={{fontSize:12,color:"#94a3b8"}}>{d}</div></div>)}</div>
                  <div style={card}><div style={{fontSize:9,color:C.dim,fontWeight:700,marginBottom:6}}>RECOMMENDATION</div><div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:8}}>{data.recommendation}</div><div style={{fontSize:12,color:"#94a3b8"}}>{data.summary}</div></div>
                </div>
              </div>
            );
            return null;
          })()}
          {result&&result.type==="error"&&<div style={{...card,border:"1px solid "+C.red+"44",color:C.red,fontSize:13}}>{result.data.message}</div>}
          {!result&&!loading&&(
            <div style={{...card,display:"flex",alignItems:"center",justifyContent:"center",minHeight:200,flexDirection:"column",gap:12}}>
              <div style={{fontSize:48}}>🤖</div>
              <div style={{fontSize:14,fontWeight:700,color:C.dim}}>Select analysis type and click Run</div>
              <div style={{fontSize:11,color:C.muted}}>Powered by Claude AI</div>
            </div>
          )}
        </div>
      )}

      {activeTab==="chat" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16}} className="main-grid-2">
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            <div style={{...card,display:"flex",flexDirection:"column",minHeight:420,maxHeight:500,overflow:"hidden"}}>
              <div style={{fontSize:9,color:C.blue,fontWeight:700,letterSpacing:"0.1em",marginBottom:12,paddingBottom:10,borderBottom:"1px solid "+C.border}}>🤖 AI TRADING ASSISTANT — {aiTicker}</div>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingRight:4}}>
                {chatHistory.length===0&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,gap:8,color:C.muted}}>
                    <div style={{fontSize:32}}>💬</div>
                    <div style={{fontSize:12,textAlign:"center"}}>Ask me anything about {aiTicker} or trading in general</div>
                  </div>
                )}
                {chatHistory.map((m,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:2}}>
                    <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{m.role==="user"?"You":"Claude AI"}</div>
                    <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.role==="user"?"rgba(56,189,248,0.15)":C.card2,border:"1px solid "+(m.role==="user"?C.blue+"44":C.border),fontSize:12,color:m.role==="user"?C.blue:C.text,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{m.content}</div>
                  </div>
                ))}
                {chatLoading&&<div style={{display:"flex",gap:6,alignItems:"center",color:C.muted,fontSize:12}}><span style={{width:8,height:8,borderRadius:"50%",background:C.blue,animation:"pulse 1s infinite"}}/>Claude is thinking…</div>}
              </div>
              <div style={{display:"flex",gap:8,marginTop:12,paddingTop:10,borderTop:"1px solid "+C.border}}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} placeholder={`Ask about ${aiTicker}…`} style={{flex:1,background:"#080c14",border:"1px solid "+C.border,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{padding:"10px 16px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",opacity:chatLoading||!chatInput.trim()?0.5:1}}>Send</button>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={card}>
              <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>QUICK QUESTIONS</div>
              {QUICK_QUESTIONS.map(q=>(
                <button key={q} onClick={()=>{setChatInput(q);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",background:"#080c14",border:"1px solid "+C.border,borderRadius:6,cursor:"pointer",fontSize:11,color:C.dim,fontFamily:"inherit",marginBottom:6,transition:"all .15s"}} onMouseEnter={e=>{e.target.style.borderColor=C.purple;e.target.style.color=C.text;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.dim;}}>
                  💬 {q}
                </button>
              ))}
            </div>
            <div style={card}>
              <div style={{fontSize:9,color:C.dim,fontWeight:700,marginBottom:8}}>CONTEXT</div>
              {[["Ticker",aiTicker],[`Price`,"$"+(quotes[aiTicker]?.price||spot)],["IV",ivPct+"%"],["VIX",vix]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+C.border+"22",fontSize:11}}>
                  <span style={{color:C.dim}}>{k}</span><span style={{fontWeight:700}}>{v}</span>
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
    id:"stock_basics", title:"Stock Market Basics", emoji:"📈", color:"#4ade80", darkBg:"#052e16",
    level:"Beginner", totalLessons:6, xp:300,
    desc:"Everything you need to know before your first trade.",
    lessons:[
      { id:"what_stocks", title:"What Are Stocks?", duration:"8 min", videoId:"p7HKvqRI_Bo",
        summary:"Stocks represent ownership in a company. When you buy a share, you become a part-owner and benefit as the company grows.",
        keyPoints:["A share = fractional ownership of a company","Stock price moves with supply & demand","Companies list on exchanges (NSE, BSE, NYSE) to raise capital","You profit via price appreciation or dividends"],
        analogy:"Think of a company like a pizza. Stocks are slices — when the pizza grows, every slice is worth more.",
        quiz:{q:"What does owning a stock represent?",opts:["A loan to a company","Ownership in a company","A bond contract","A futures contract"],ans:1,exp:"A stock represents fractional ownership. You are a part-owner of the business and share in its profits and losses."}
      },
      { id:"how_markets_work", title:"How Markets Work", duration:"10 min", videoId:"F3QpgXBtDeo",
        summary:"Stock exchanges connect buyers and sellers. Prices move when the balance of buyers and sellers shifts.",
        keyPoints:["Stock exchanges: NSE, BSE, NYSE, NASDAQ","Market hours: 9:15 AM – 3:30 PM IST","Bid = buyers offer, Ask = sellers want","Price discovery happens in real time via order matching"],
        analogy:"A stock exchange is like a massive auction house — millions of auctions happening every second.",
        quiz:{q:"What does the 'Bid' price represent?",opts:["The price sellers want","The price buyers are willing to pay","The last traded price","The exchange fee"],ans:1,exp:"Bid is the highest price a buyer is currently willing to pay. Ask is the lowest a seller will accept. Trades happen when they meet."}
      },
      { id:"reading_charts", title:"Reading Candlestick Charts", duration:"12 min", videoId:"C3rjXXhsp4E",
        summary:"Candlestick charts are the universal language of trading. Each candle tells the story of one time period.",
        keyPoints:["Green candle = price closed HIGHER than open (bullish)","Red candle = price closed LOWER than open (bearish)","Body = range between open and close","Wick/Shadow = high and low extremes","Longer wicks = more indecision or rejection"],
        analogy:"A candle is like a daily news report — it tells you where the stock started, where it went, and where it ended up.",
        quiz:{q:"What does a long upper wick on a candlestick mean?",opts:["Strong buying pressure","Price attempted highs but was rejected","The stock hit its 52-week high","Low trading volume"],ans:1,exp:"A long upper wick means buyers pushed price up, but sellers drove it back down — showing rejection at higher prices."}
      },
      { id:"support_resistance", title:"Support & Resistance", duration:"9 min", videoId:"1b2Bxc5VL6A",
        summary:"Support and resistance are price floors and ceilings — the most fundamental concepts in technical analysis.",
        keyPoints:["Support = price floor where buyers tend to step in","Resistance = price ceiling where sellers dominate","Once broken, support becomes resistance (and vice versa)","More tests of a level = stronger the level","Round numbers often act as psychological levels"],
        analogy:"Support is the floor of a room — price bounces off it. Resistance is the ceiling — price struggles to break through.",
        quiz:{q:"When a resistance level is broken, what often happens?",opts:["It disappears","It becomes a new support level","Price immediately reverses","Volume drops to zero"],ans:1,exp:"When resistance is broken, buyers overcome sellers. The former resistance often flips to a support zone — key for finding re-entry points."}
      },
      { id:"bull_bear", title:"Bull & Bear Markets", duration:"7 min", videoId:"pax3MGXAJSE",
        summary:"Understanding market cycles helps you position on the right side of the trend.",
        keyPoints:["Bull Market: 20%+ rise from recent lows — optimism, rising economy","Bear Market: 20%+ decline from recent highs — fear, recession","Correction: 10-20% pullback (normal, temporary)","Cycle: Accumulation → Markup → Distribution → Markdown"],
        analogy:"A bull thrusts horns upward = rising prices. A bear swipes paws downward = falling prices.",
        quiz:{q:"A 'correction' is defined as a decline of:",opts:["5-10%","10-20%","20-30%","More than 40%"],ans:1,exp:"A correction is a 10-20% decline from recent highs. It's normal and healthy. Below 20% sustained = bear market."}
      },
      { id:"fundamental_analysis", title:"Fundamental Analysis", duration:"11 min", videoId:"cjuAIl5cGHU",
        summary:"Fundamental analysis values a company based on its actual financial health, not just price movements.",
        keyPoints:["P/E Ratio = Price ÷ Earnings (higher = more expensive)","EPS = Earnings Per Share (profitability)","Revenue growth = how fast the company expands","Debt-to-Equity = financial leverage (lower = safer)","Free Cash Flow = actual cash generated by the business"],
        analogy:"Buying a stock without fundamentals is like buying a house without checking if it has a foundation.",
        quiz:{q:"A low P/E ratio generally suggests a stock is:",opts:["Overvalued","Undervalued or cheap","High-risk","About to crash"],ans:1,exp:"A low P/E means you're paying less per dollar of earnings. Always compare within the same sector — P/E varies by industry."}
      },
    ]
  },
  {
    id:"options_fundamentals", title:"Options Fundamentals", emoji:"⚙️", color:"#38bdf8", darkBg:"#0c2a47",
    level:"Beginner", totalLessons:7, xp:450,
    desc:"Calls, puts, strikes, premiums — completely demystified.",
    lessons:[
      { id:"what_options", title:"What Are Options?", duration:"10 min", videoId:"0GSB5YZx9ZE",
        summary:"Options give you the RIGHT but not OBLIGATION to buy or sell at a set price. That flexibility is what makes them powerful.",
        keyPoints:["Options are contracts, not ownership","Call = right to BUY at strike price","Put = right to SELL at strike price","Premium = the price you pay for this right","Max loss for buyers = premium paid only"],
        analogy:"Buying an option is like paying a deposit to reserve a house at today's price. If prices rise, you profit. If not, you only lose the small deposit.",
        quiz:{q:"What is the maximum loss when you BUY a call option?",opts:["Unlimited","The stock price","The premium paid","The strike price"],ans:2,exp:"When buying options, your maximum loss is always limited to the premium paid — a key advantage over other leveraged instruments."}
      },
      { id:"calls_deep", title:"Call Options Deep Dive", duration:"12 min", videoId:"fUZHmJAvN30",
        summary:"Calls give you the right to BUY shares at the strike price. You profit when the stock rises above your breakeven.",
        keyPoints:["Breakeven = Strike Price + Premium Paid","Max profit: unlimited (stock can rise infinitely)","Max loss: premium paid (if stock stays below strike)","ITM call: stock price > strike","OTM call: stock price < strike"],
        analogy:"A call option is like a coupon that lets you buy Apple at $200 no matter what the current market price is.",
        quiz:{q:"If you buy a $150 call for $5 premium, your breakeven is:",opts:["$145","$150","$155","$160"],ans:2,exp:"Breakeven = Strike ($150) + Premium ($5) = $155. Below $155 at expiry you lose. Above $155 you profit."}
      },
      { id:"puts_deep", title:"Put Options Deep Dive", duration:"12 min", videoId:"oXQ1b0rA0r4",
        summary:"Puts give you the right to SELL shares at the strike price — the cleanest way to profit from falling prices with limited risk.",
        keyPoints:["Breakeven = Strike Price - Premium Paid","Max profit: strike - premium (if stock goes to zero)","Max loss: premium paid (if stock rises above strike)","ITM put: stock price < strike","Common use: portfolio insurance / hedging"],
        analogy:"A put option is like insurance on your car — pay a small premium so if something bad happens, your downside is protected.",
        quiz:{q:"When does a put option become profitable?",opts:["When stock rises above the strike","When stock falls below the breakeven","When volatility decreases","When time passes"],ans:1,exp:"A put profits when the stock falls below breakeven (Strike - Premium). The further the stock falls, the more you profit."}
      },
      { id:"options_pricing", title:"How Options Are Priced", duration:"14 min", videoId:"H-NHZq-skFo",
        summary:"Option pricing combines intrinsic value (real worth now) and time value (hope premium) to make the total premium.",
        keyPoints:["Premium = Intrinsic Value + Time Value","Intrinsic Value: how much the option is worth if exercised now","Time Value: premium for the possibility of moving your way","Time value → zero as expiry approaches","Higher volatility = higher premiums"],
        analogy:"An option price is like a concert ticket. Face value (intrinsic) + scalper premium (time value). As the date approaches, the scalper premium drops.",
        quiz:{q:"What is Intrinsic Value of a $100 call when stock is at $110?",opts:["$0","$5","$10","$110"],ans:2,exp:"Intrinsic Value = Stock Price - Strike = $110 - $100 = $10. The option is $10 'in the money'."}
      },
      { id:"expiry_dte", title:"Expiration & DTE", duration:"8 min", videoId:"bSCUzOlbzx0",
        summary:"Every option has an expiry. As that date approaches, time value melts away — this is called Theta decay.",
        keyPoints:["DTE = Days To Expiration","As DTE → 0, time value → 0 (theta decay accelerates)","0DTE options: highest risk/reward, expire same day","LEAPS: options with 1-2+ year expiry","ATM options lose time value fastest near expiry"],
        analogy:"A melting ice cube — it melts slowly at first, then faster and faster as it gets smaller. That's theta decay.",
        quiz:{q:"Which option loses time value the FASTEST?",opts:["A 6-month option","A 3-month option","A 7-day option","A 2-year LEAP"],ans:2,exp:"Theta decay accelerates exponentially near expiry. A 7-day option loses value much faster per day than a 6-month option."}
      },
      { id:"itm_atm_otm", title:"ITM, ATM & OTM Explained", duration:"9 min", videoId:"RS3A3pDGg5w",
        summary:"The relationship between strike price and current stock price determines whether an option is In, At, or Out of the money.",
        keyPoints:["ITM Call: Stock > Strike → has intrinsic value","ATM: Stock ≈ Strike → highest time value, most liquid","OTM Call: Stock < Strike → pure time value, cheap but risky","Delta approximates probability of expiring ITM","ATM options have ≈ 0.50 delta"],
        analogy:"ITM = you're winning the bet. ATM = even odds. OTM = you need a big move to win.",
        quiz:{q:"An ATM call option has approximately what delta?",opts:["0.10","0.25","0.50","0.90"],ans:2,exp:"ATM options have ≈ 0.50 delta — roughly 50/50 chance of expiring in the money. Delta also measures how much the option moves per $1 stock move."}
      },
      { id:"options_chain", title:"Reading an Options Chain", duration:"11 min", videoId:"B5J8A9bNL9Y",
        summary:"The options chain is your command center — all available strikes, expirations, and Greeks in one view.",
        keyPoints:["Calls on left, Puts on right (typically)","Columns: Bid, Ask, Last, IV, Delta, Gamma, Theta, Vega, OI, Volume","Open Interest (OI) = total outstanding contracts","High OI = liquid strike, easy to enter/exit","Green highlight = ITM, no highlight = OTM"],
        analogy:"An options chain is like a restaurant menu — all your choices with prices, but you need to know what you're ordering.",
        quiz:{q:"What does high Open Interest (OI) tell you about a strike?",opts:["It will definitely go up","It is very liquid and easy to trade","It is overpriced","It expires soon"],ans:1,exp:"High OI means many contracts are open at that strike — more buyers and sellers = tighter bid-ask spread = easier and cheaper to trade."}
      },
    ]
  },
  {
    id:"greeks_mastery", title:"Mastering the Greeks", emoji:"🇬🇷", color:"#a78bfa", darkBg:"#1a0f2e",
    level:"Intermediate", totalLessons:5, xp:500,
    desc:"Delta, Theta, Vega, Gamma — the four forces that move option prices.",
    lessons:[
      { id:"delta", title:"Delta — The Direction Greek", duration:"11 min", videoId:"GrlTqhHU8eU",
        summary:"Delta measures how much an option's price changes for every $1 move in the underlying stock.",
        keyPoints:["Call delta: 0 to +1 (moves with stock)","Put delta: -1 to 0 (moves against stock)","ATM ≈ 0.50 | Deep ITM ≈ 0.90-1.0 | Far OTM ≈ 0.05-0.15","Delta as probability: 0.70 delta ≈ 70% chance of expiring ITM","Delta neutral: combine positions to have net zero directional exposure"],
        analogy:"Delta is like a gear ratio. Low delta (OTM) = pedaling hard, moving slowly. High delta (ITM) = every pedal stroke moves you fully.",
        quiz:{q:"If you own a call with 0.60 delta and stock rises $2, the option gains approximately:",opts:["$0.60","$1.20","$2.00","$0.30"],ans:1,exp:"Delta × Stock Move = Option Move. 0.60 × $2 = $1.20 per share. For one contract (100 shares) = $120 total gain."}
      },
      { id:"theta", title:"Theta — Time is Your Enemy", duration:"10 min", videoId:"yr7S4iyEmcg",
        summary:"Theta is the daily cost of holding an option. Every day that passes, your option loses value even if the stock doesn't move.",
        keyPoints:["Theta = daily time decay (always negative for buyers)","Theta accelerates exponentially near expiry","ATM options have the highest theta decay","Theta benefits SELLERS — they collect decay daily","Rule: theta doubles in the last 30 days before expiry"],
        analogy:"Theta is like an ice cream melting on a hot day. It melts slowly at first, then faster and faster. That's your option's time value disappearing.",
        quiz:{q:"If your option has -$0.05 theta, what happens overnight?",opts:["Gains $5","Loses $5","Stays the same","Expires"],ans:1,exp:"Theta = -$0.05 per share per day. On a standard 100-share contract = $5 lost per night from time decay alone, regardless of stock movement."}
      },
      { id:"vega", title:"Vega — Volatility is Power", duration:"10 min", videoId:"7s3EM_Hlm0U",
        summary:"Vega measures how much an option's price changes when implied volatility (IV) changes by 1%.",
        keyPoints:["Long options have POSITIVE vega (benefit from rising IV)","Short options have NEGATIVE vega (hurt by rising IV)","ATM options have highest vega exposure","IV crush: after earnings, IV collapses, destroying option premiums","Buy options before expected IV expansion, sell before IV crush"],
        analogy:"Vega is like a weather forecast premium. Storm coming = umbrella prices rise. Storm passes = umbrella prices crash. That's IV crush.",
        quiz:{q:"You buy a call before earnings. Earnings are great, stock rises 5%, but your call LOSES value. Why?",opts:["Wrong strike bought","IV crush — implied volatility collapsed after earnings","Broker error","The call expired"],ans:1,exp:"IV crush is the most common beginner trap. Before earnings, IV is inflated. After (good or bad), IV collapses, wiping out the fear premium in your option."}
      },
      { id:"gamma", title:"Gamma — The Accelerator", duration:"9 min", videoId:"rD3rQAME1bI",
        summary:"Gamma is the rate of change of Delta. It tells you how fast your delta — and therefore profits — will accelerate.",
        keyPoints:["Gamma = how fast delta changes per $1 stock move","High gamma near expiry ATM options","Long options = positive gamma (delta accelerates your way)","Short options = negative gamma (delta accelerates against you)","0DTE options have explosive gamma — small moves = big P&L swings"],
        analogy:"If delta is speed, gamma is acceleration. High-gamma positions can go from 0 to 100 very quickly — in both directions.",
        quiz:{q:"Where is Gamma highest?",opts:["Deep ITM options","Far OTM options","ATM options close to expiry","LEAPS (long-dated options)"],ans:2,exp:"Gamma peaks at ATM options with little time left. This is why 0DTE trading is so explosive — small stock moves create massive delta shifts."}
      },
      { id:"rho_combined", title:"Putting the Greeks Together", duration:"12 min", videoId:"pTBFe7DIXjE",
        summary:"Combine all four Greeks to read a position holistically and manage risk like a professional.",
        keyPoints:["Rho = interest rate sensitivity (less important for short-dated options)","Read a position: check delta (direction), theta (daily cost), vega (IV risk), gamma (acceleration)","Net Greeks show your total risk profile across all positions","Short Iron Condor = negative delta, positive theta, negative vega, negative gamma"],
        analogy:"Greeks are like a car dashboard — delta is steering, theta is fuel consumption, vega is weather sensitivity, gamma is acceleration.",
        quiz:{q:"A position with positive theta and negative vega benefits from:",opts:["Big stock moves and rising IV","Time passing and falling IV","Rising stock prices only","High volume trading days"],ans:1,exp:"Positive theta = you earn money as time passes. Negative vega = you profit when IV drops. This is the profile of short premium strategies like Iron Condors."}
      },
    ]
  },
  {
    id:"strategies_course", title:"Options Strategies A-Z", emoji:"♟️", color:"#fbbf24", darkBg:"#1c1a0a",
    level:"Intermediate", totalLessons:8, xp:600,
    desc:"From simple calls to iron condors — when and how to use each strategy.",
    lessons:[
      { id:"covered_call", title:"Covered Call — Income Strategy", duration:"11 min", videoId:"oZH9THRQGog",
        summary:"Own 100 shares and sell a call against them. Collect premium every month as income.",
        keyPoints:["Requirements: own 100 shares","Sell OTM call above current price to collect premium","Max profit: premium + stock gains up to strike","Max loss: stock drops (premium provides small buffer)","Typical return: 1-3% per month in premium income"],
        analogy:"Like renting out a room in your house. You still own the house (stock) but collect rent (premium) every month.",
        quiz:{q:"In a covered call, you sell a call when you:",opts:["Expect a massive rally","Already own 100 shares","Are bearish","Want unlimited profit potential"],ans:1,exp:"Covered call requires owning 100 shares. You sell a call against that position to generate monthly income, capping your upside at the strike."}
      },
      { id:"protective_put", title:"Protective Put — Portfolio Insurance", duration:"9 min", videoId:"3CFQjB89hIo",
        summary:"Buy a put option against shares you own. Guarantees a minimum selling price — perfect for uncertain markets.",
        keyPoints:["Buy a put below current price as insurance","Max loss: limited to (entry price - strike) + premium","Max profit: unlimited upside from stock rising","Cost: ongoing premium (like insurance premium)","Best before major events: elections, earnings, economic data"],
        analogy:"Car insurance for your stocks. Pay a small premium so if the market crashes, your losses are capped.",
        quiz:{q:"What does a Protective Put guarantee?",opts:["A profit on your stock","A maximum selling price for your stock","A minimum selling price for your stock","A fixed dividend"],ans:2,exp:"A protective put guarantees you can sell your stock at the strike price, even if it crashes to zero — setting a floor on your losses."}
      },
      { id:"bull_call_spread", title:"Bull Call Spread — Cheap Bullish Bet", duration:"12 min", videoId:"mwttDWfDQ9c",
        summary:"Buy a lower-strike call, sell a higher-strike call. Reduces cost vs naked call, but caps your upside.",
        keyPoints:["Structure: Buy Call (lower strike) + Sell Call (higher strike)","Max profit: spread width - net debit paid","Max loss: net debit paid","Breakeven: lower strike + net debit","Best for: moderately bullish, want to reduce cost"],
        analogy:"Like a round-trip flight within a city range — you're bullish but within limits, making the ticket cheaper.",
        quiz:{q:"A Bull Call Spread reduces cost compared to a naked call because:",opts:["You buy fewer contracts","The sold call's premium offsets the bought call cost","You use less margin","The spread expires faster"],ans:1,exp:"Selling the upper call collects premium that partially funds the lower call purchase, reducing net cost but capping maximum profit at the spread width."}
      },
      { id:"bear_put_spread", title:"Bear Put Spread — Cheap Bearish Bet", duration:"10 min", videoId:"lH5GToIwBzE",
        summary:"Buy a higher-strike put, sell a lower-strike put. Cost-effective way to bet on a stock decline.",
        keyPoints:["Structure: Buy Put (higher strike) + Sell Put (lower strike)","Max profit: spread width - net debit","Max loss: net debit paid","Breakeven: higher strike - net debit","Lower cost than buying a naked put"],
        analogy:"The bear version of a bull call spread — you define both profit and loss before entering.",
        quiz:{q:"In a Bear Put Spread, you BUY the:",opts:["Lower strike put","Higher strike put","Call option","ATM put"],ans:1,exp:"You buy the higher strike put (closer to ATM, more delta) and sell the lower strike put to reduce cost."}
      },
      { id:"straddle_strangle", title:"Straddle & Strangle — Volatility Plays", duration:"13 min", videoId:"D9MpNLBpvq0",
        summary:"When you don't know direction but know a big move is coming — buy both a call and put.",
        keyPoints:["Straddle: buy ATM call + ATM put (same strike)","Strangle: buy OTM call + OTM put (cheaper, needs bigger move)","Profit when stock moves big in EITHER direction","Risk: stock stays flat → lose both premiums","Best before major catalysts (earnings, FDA, elections)","IV crush danger: buy BEFORE IV expansion, not after"],
        analogy:"Straddle = betting both teams will score heavily. Strangle = same bet but at more extreme scores at a lower ticket price.",
        quiz:{q:"A Straddle loses maximum value when:",opts:["The stock makes a huge move up","The stock makes a huge move down","The stock stays near the strike at expiry","IV spikes dramatically"],ans:2,exp:"Maximum loss occurs when the stock closes exactly at the strike at expiry — both call and put expire worthless."}
      },
      { id:"iron_condor", title:"Iron Condor — Range-Bound Income", duration:"14 min", videoId:"7PM4rNDr4oI",
        summary:"Sell a call spread + sell a put spread. Collect premium when you expect the stock to stay in a defined range.",
        keyPoints:["Structure: Sell OTM call spread + Sell OTM put spread (4 legs)","Max profit: net credit received (stock stays between short strikes)","Max loss: spread width - credit (stock breaks out of range)","Best for: low volatility, range-bound stocks","Net theta positive, vega negative, near-zero delta"],
        analogy:"Iron Condor is like renting a property within town limits — you profit as long as the tenant (stock) stays within city limits.",
        quiz:{q:"An Iron Condor profits when:",opts:["The stock makes a massive move","The stock stays within the range of short strikes","IV increases dramatically","A dividend is paid"],ans:1,exp:"Max profit when the stock closes between the two short strikes at expiry — all four legs expire worthless and you keep the credit."}
      },
      { id:"butterfly", title:"Butterfly — Pinpoint Precision", duration:"11 min", videoId:"LXMSJewcDig",
        summary:"Maximum profit when the stock lands exactly at your target strike. Very cheap, very precise.",
        keyPoints:["Structure: Buy 1 low strike + Sell 2 ATM + Buy 1 high strike call","Max profit: at center strike at expiry","Max loss: net debit (wings protect you)","Very low cost, high reward-to-risk ratio","Best when you have a strong price target"],
        analogy:"A butterfly is an archer's strategy — aiming for a bullseye. Huge payoff if right, small loss if off target.",
        quiz:{q:"A Butterfly Spread's maximum profit occurs when:",opts:["Far above the center strike","Far below the center strike","At the center strike at expiry","Stock is highly volatile"],ans:2,exp:"Maximum profit when the stock closes at the center (middle) strike at expiry. The further away, the less you profit."}
      },
      { id:"calendar_spread", title:"Calendar Spread — Time Arbitrage", duration:"12 min", videoId:"3Jb5pBuEG-M",
        summary:"Sell a near-term option, buy a longer-term option at the same strike. Profit from the difference in time decay rates.",
        keyPoints:["Structure: Sell near-term ATM option + Buy same-strike further-dated option","Profit from faster theta decay on the short option","Max profit: near-term expires worthless, back-month retains value","Risk: big move in either direction hurts the trade","Can roll the short option month after month for recurring income"],
        analogy:"Like leasing your car month-by-month (short option) while owning it long-term (long option). The monthly lease pays your ownership costs.",
        quiz:{q:"A calendar spread benefits from which phenomenon?",opts:["Large stock moves","Faster time decay on near-term options","Rising implied volatility","Higher stock prices"],ans:1,exp:"Near-term options decay faster than longer-dated options. You sell that faster decay while holding the slower-decaying longer option."}
      },
    ]
  },
  {
    id:"risk_psychology", title:"Risk & Trading Psychology", emoji:"🧠", color:"#fb923c", darkBg:"#1c0a00",
    level:"Beginner", totalLessons:5, xp:350,
    desc:"The mental game — why most traders fail and how to stay disciplined.",
    lessons:[
      { id:"position_sizing", title:"Position Sizing — The #1 Rule", duration:"9 min", videoId:"TpNDHKnGHgo",
        summary:"How much you put in each trade determines whether you survive long enough to profit.",
        keyPoints:["The 2% Rule: never risk more than 2% of total capital per trade","With ₹1,00,000: max risk per trade = ₹2,000","Position size = Risk Amount ÷ (Entry - Stop Loss)","Professionals risk 0.5-1% per trade","Consistent sizing = consistent results"],
        analogy:"Your capital is like oxygen tanks for deep-sea diving. Risk too much per dive and you run out before surfacing.",
        quiz:{q:"Using the 2% rule with ₹5,00,000 capital, your max risk per trade is:",opts:["₹500","₹1,000","₹10,000","₹50,000"],ans:2,exp:"2% of ₹5,00,000 = ₹10,000. This is the maximum you should be willing to lose on any single trade."}
      },
      { id:"stop_losses", title:"Stop Losses — Protecting Capital", duration:"8 min", videoId:"4FTdyp93Y7g",
        summary:"A stop loss is a pre-planned exit when a trade goes wrong. Never enter without knowing exactly where you'll exit.",
        keyPoints:["Set stop BEFORE entering, not after","Technical stop: below support / above resistance","Percentage stop: 5-8% below entry for stocks","Options stop: close if option loses 50% of value","Trailing stop: moves with price to lock in profits","Mental stops almost never work — use hard stops"],
        analogy:"A stop loss is a seat belt. You don't put it on during the crash — you wear it before you start driving.",
        quiz:{q:"When should you set your stop loss?",opts:["After the trade starts losing","When you feel nervous","Before you enter the trade","When you're profitable"],ans:2,exp:"Always set your stop loss BEFORE entering. This removes emotion from the exit decision and ensures you know your maximum loss upfront."}
      },
      { id:"trading_psychology", title:"Trading Psychology & Biases", duration:"13 min", videoId:"x9P2buGlp2k",
        summary:"Your biggest enemy in trading is not the market — it's yourself. Understanding cognitive biases is as important as technical analysis.",
        keyPoints:["Loss Aversion: losses feel 2× worse than equal gains feel good","Overconfidence: after wins, traders take excessive risk","FOMO: fear of missing out causes chasing highs","Revenge Trading: trying to make back losses quickly","Confirmation Bias: only seeing data that supports your view","Solution: journaling, rules-based trading, position limits"],
        analogy:"Trading without psychology awareness is like driving with your eyes closed — you might get lucky briefly, but eventually you crash.",
        quiz:{q:"Loss aversion means traders typically feel losses:",opts:["The same as gains","Half as bad as gains feel good","Twice as bad as equal gains feel good","Only if they are large losses"],ans:2,exp:"Research shows losses feel approximately 2× as painful as equivalent gains feel pleasurable — causing traders to hold losers too long and cut winners too early."}
      },
      { id:"trading_journal", title:"The Trading Journal", duration:"7 min", videoId:"a7xcPCMD0H4",
        summary:"Professional traders journal every trade. It's the single best tool for improving performance over time.",
        keyPoints:["Record: date, ticker, setup reason, entry/exit, P&L, emotions","Review weekly: find patterns in wins AND losses","Track win rate, average win vs average loss","Identify your best setups and worst habits","Paper trade first: journal without real money"],
        analogy:"A trading journal is like a flight recorder — it captures everything so you can review after a crash and improve next time.",
        quiz:{q:"The most important benefit of a trading journal is:",opts:["Impressing other traders","Finding patterns in your behavior to improve","Tax documentation","Showing brokers your history"],ans:1,exp:"Journaling reveals patterns — your best setups, worst emotional mistakes, best times to trade. Without one, you repeat mistakes without knowing it."}
      },
      { id:"building_system", title:"Building a Trading System", duration:"11 min", videoId:"rJ8yo4ybJ7c",
        summary:"Successful trading is systematic, not intuitive. A trading system removes emotion and gives you a testable edge.",
        keyPoints:["Define your setup: exact conditions that trigger a trade","Entry rules: price, indicator, volume confirmation","Exit rules: target, stop loss, time-based exit","Position sizing rules: fixed % or Kelly Criterion","Backtest before going live: does this system have edge?"],
        analogy:"A trading system is like a recipe — follow it consistently and get predictable results. Improvise every time and you'll never know why something worked.",
        quiz:{q:"The most critical component of a trading system is:",opts:["Predicting market direction","Having clear entry AND exit rules defined in advance","Using the most indicators","Trading the most volatile stocks"],ans:1,exp:"Without pre-defined exit rules (profit target and stop loss), emotional decisions take over. A complete system must have rules for entry, exit, and sizing before any money goes in."}
      },
    ]
  },
  {
    id:"technical_analysis", title:"Technical Analysis", emoji:"📐", color:"#2dd4bf", darkBg:"#0a1f1e",
    level:"Intermediate", totalLessons:6, xp:500,
    desc:"Chart patterns, indicators, and setups that professional traders use.",
    lessons:[
      { id:"trend_lines", title:"Trend Lines & Channels", duration:"10 min", videoId:"W87BO6q7_wg",
        summary:"Trend lines connect price pivots to show direction and structure of a market move.",
        keyPoints:["Uptrend line: connect higher lows","Downtrend line: connect lower highs","Channel: parallel trend lines (buy support, sell resistance)","Break of trendline = potential reversal signal","Retest after break = high-probability trade entry"],
        analogy:"A trend line is like a highway guardrail — as long as price stays between the rails, you know the direction. When it breaks through, something has changed.",
        quiz:{q:"In an uptrend, you draw a trend line connecting:",opts:["Lower highs","Higher lows","All price points","Horizontal levels only"],ans:1,exp:"An uptrend line connects a series of higher lows. Each time price dips, it makes a higher low than the previous dip — this defines an uptrend."}
      },
      { id:"chart_patterns", title:"Chart Patterns That Work", duration:"14 min", videoId:"eynxyoKgpng",
        summary:"Chart patterns are recurring formations that signal a likely next move — the psychology of buyers and sellers made visual.",
        keyPoints:["Head & Shoulders: classic reversal pattern (bearish)","Inverse H&S: bullish reversal","Double Top/Bottom: strong reversal signals","Triangle (ascending, descending, symmetrical): continuation","Cup & Handle: bullish continuation, breakout pattern","Flag & Pennant: short-term consolidation before continuation"],
        analogy:"Chart patterns are like body language — they reveal what the crowd is thinking before it acts.",
        quiz:{q:"A Head & Shoulders pattern is typically a signal of:",opts:["Bullish continuation","Bearish reversal","Sideways consolidation","Volume spike"],ans:1,exp:"Head & Shoulders is one of the most reliable bearish reversal patterns — three peaks followed by a neckline break, signaling that buyers are exhausted."}
      },
      { id:"moving_averages", title:"Moving Averages", duration:"11 min", videoId:"4R2CDbw4g88",
        summary:"Moving averages smooth out price noise and reveal the underlying trend — the most widely watched indicator.",
        keyPoints:["SMA = Simple Moving Average (equal weight to all days)","EMA = Exponential Moving Average (more weight to recent days)","20 EMA = short-term trend | 50 EMA = medium-term | 200 EMA = long-term","Price above 200 EMA = bull market; below = bear market","Golden Cross: 50 EMA crosses above 200 EMA (bullish)","Death Cross: 50 EMA crosses below 200 EMA (bearish)"],
        analogy:"A moving average is like looking at the 7-day average temperature — it smooths out hot and cold days to show the actual seasonal trend.",
        quiz:{q:"The 'Golden Cross' occurs when:",opts:["Price crosses above the 200 EMA","The 50 EMA crosses above the 200 EMA","Volume doubles in one day","RSI crosses 50"],ans:1,exp:"Golden Cross = 50 EMA crossing above 200 EMA. It signals that medium-term momentum is stronger than long-term — historically a bullish signal."}
      },
      { id:"rsi_macd", title:"RSI & MACD", duration:"12 min", videoId:"PceBCGGKwGM",
        summary:"RSI measures momentum (overbought/oversold). MACD measures trend direction and momentum together.",
        keyPoints:["RSI > 70 = Overbought (potential reversal down)","RSI < 30 = Oversold (potential reversal up)","RSI divergence = powerful signal (price and RSI disagree)","MACD = 12 EMA - 26 EMA","MACD histogram above zero = bullish momentum","MACD crossover = entry signal"],
        analogy:"RSI is like a rubber band — stretch it too far and it snaps back. MACD is a radar gun measuring the speed of the move.",
        quiz:{q:"RSI divergence occurs when:",opts:["RSI and price both make new highs","RSI moves in the opposite direction to price","Volume and price diverge","MACD crosses zero"],ans:1,exp:"Divergence = price makes a new high but RSI makes a lower high (or vice versa). This mismatch often predicts reversals before they happen."}
      },
      { id:"bollinger_bands", title:"Bollinger Bands", duration:"10 min", videoId:"pkFNYFPRQlA",
        summary:"Bollinger Bands adapt to volatility automatically. When bands squeeze, a big move is coming.",
        keyPoints:["3 lines: 20 SMA ± 2 standard deviations","Band width = current volatility measure","Bollinger Squeeze: bands narrow = low volatility = breakout coming","Price touching upper band = relatively expensive","Price touching lower band = relatively cheap"],
        analogy:"Bollinger Bands are like a river with flood banks. Calm water (squeeze) before a flood (breakout). When river touches its banks, it usually reverses.",
        quiz:{q:"A Bollinger Squeeze (bands narrowing) signals:",opts:["The stock is overvalued","Volatility is likely to expand soon — breakout coming","The stock is about to crash","Low volume trading"],ans:1,exp:"A squeeze means volatility has compressed. Like a coiled spring — the longer the squeeze, the bigger the eventual breakout. Direction, however, is not predicted by the squeeze alone."}
      },
      { id:"volume_analysis", title:"Volume Analysis", duration:"9 min", videoId:"fYbzElCXk5c",
        summary:"Volume confirms price moves. A breakout on high volume is real. A breakout on low volume often fails.",
        keyPoints:["Volume = conviction behind price moves","High volume up move = strong buying interest","High volume down move = strong selling pressure","Low volume rally = weak, likely to fail","Volume spike on breakout = confirms the move","OBV (On Balance Volume): running total confirming trend"],
        analogy:"Volume is like a crowd cheering at a sports event. A goal scored with 50,000 fans cheering is significant. With 200 fans, it's much less meaningful.",
        quiz:{q:"A stock breaks resistance on LOW volume. This suggests:",opts:["A very strong breakout","The breakout may fail or be a false move","Volume doesn't matter for breakouts","The stock will definitely rally 20%"],ans:1,exp:"Low-volume breakouts lack conviction. Without buyers rushing in to confirm the move, it often fails and price returns below resistance."}
      },
    ]
  }
];

const ALL_QUIZ_QUESTIONS = ACADEMY_COURSES.flatMap(course =>
  course.lessons.map(l => ({ ...l.quiz, courseTitle: course.title, lessonTitle: l.title, courseColor: course.color }))
).filter(q => q && q.q);

const ALL_GLOSSARY = [
  {term:"Ask",def:"The lowest price a seller will accept for a security",cat:"Basics"},
  {term:"Bid",def:"The highest price a buyer will pay for a security",cat:"Basics"},
  {term:"Bull Market",def:"Extended period of rising stock prices (generally 20%+ rise)",cat:"Markets"},
  {term:"Bear Market",def:"Extended period of falling stock prices (generally 20%+ fall)",cat:"Markets"},
  {term:"Call Option",def:"Right to BUY shares at the strike price before expiration",cat:"Options"},
  {term:"Put Option",def:"Right to SELL shares at the strike price before expiration",cat:"Options"},
  {term:"Delta",def:"Option's price sensitivity to a $1 change in the underlying stock",cat:"Greeks"},
  {term:"Theta",def:"Rate of time decay — how much option value is lost per day",cat:"Greeks"},
  {term:"Vega",def:"Option's sensitivity to changes in implied volatility",cat:"Greeks"},
  {term:"Gamma",def:"Rate of change of Delta per $1 stock move",cat:"Greeks"},
  {term:"DTE",def:"Days To Expiration — time remaining until an option expires",cat:"Options"},
  {term:"Premium",def:"The price paid to buy an options contract",cat:"Options"},
  {term:"Strike Price",def:"The price at which an option can be exercised",cat:"Options"},
  {term:"ITM",def:"In The Money — call: stock > strike; put: stock < strike (has intrinsic value)",cat:"Options"},
  {term:"ATM",def:"At The Money — strike price equals current stock price",cat:"Options"},
  {term:"OTM",def:"Out of The Money — option has no intrinsic value yet",cat:"Options"},
  {term:"Implied Volatility",def:"Market's forecast of likely price movement, expressed as annualized %",cat:"Options"},
  {term:"IV Rank",def:"Compares current IV to its 52-week range (0-100 scale)",cat:"Options"},
  {term:"IV Crush",def:"Sharp drop in implied volatility after a major event, destroying option premiums",cat:"Options"},
  {term:"Iron Condor",def:"Sell OTM call spread + OTM put spread; profits in range-bound markets",cat:"Strategies"},
  {term:"Bull Call Spread",def:"Buy lower call + sell higher call; bullish, limited risk and reward",cat:"Strategies"},
  {term:"Bear Put Spread",def:"Buy higher put + sell lower put; bearish, limited risk and reward",cat:"Strategies"},
  {term:"Straddle",def:"Buy ATM call + ATM put; profits from big moves in either direction",cat:"Strategies"},
  {term:"Strangle",def:"Buy OTM call + OTM put; cheaper than straddle, needs bigger move",cat:"Strategies"},
  {term:"Butterfly",def:"3-strike spread; max profit when stock pins at center strike at expiry",cat:"Strategies"},
  {term:"Covered Call",def:"Own 100 shares and sell a call to generate monthly income",cat:"Strategies"},
  {term:"Protective Put",def:"Own 100 shares and buy a put for downside protection",cat:"Strategies"},
  {term:"Calendar Spread",def:"Sell near-term option + buy same-strike further-dated option",cat:"Strategies"},
  {term:"P/E Ratio",def:"Price-to-Earnings — stock price ÷ earnings per share",cat:"Fundamentals"},
  {term:"EPS",def:"Earnings Per Share — company profit ÷ shares outstanding",cat:"Fundamentals"},
  {term:"Market Cap",def:"Total company value = share price × total shares outstanding",cat:"Basics"},
  {term:"Dividend",def:"Cash payment made to shareholders from company profits",cat:"Basics"},
  {term:"Volume",def:"Number of shares or contracts traded in a given period",cat:"Technical"},
  {term:"Support",def:"Price level where buying interest typically stops a price decline",cat:"Technical"},
  {term:"Resistance",def:"Price level where selling interest typically caps a price rise",cat:"Technical"},
  {term:"RSI",def:"Relative Strength Index — momentum indicator; >70 overbought, <30 oversold",cat:"Technical"},
  {term:"MACD",def:"Moving Average Convergence Divergence — trend and momentum indicator",cat:"Technical"},
  {term:"EMA",def:"Exponential Moving Average — more weight to recent prices",cat:"Technical"},
  {term:"Bollinger Bands",def:"3 lines: 20 SMA ± 2 standard deviations; adapts to volatility",cat:"Technical"},
  {term:"Open Interest",def:"Total number of outstanding options contracts not yet settled",cat:"Options"},
  {term:"SPAN Margin",def:"Standard Portfolio Analysis of Risk — margin based on worst-case scenario",cat:"Basics"},
  {term:"Stop Loss",def:"Pre-set price where a trade is auto-closed to limit losses",cat:"Risk"},
  {term:"Position Sizing",def:"Deciding how much capital to allocate to each trade",cat:"Risk"},
  {term:"Risk/Reward Ratio",def:"Potential profit vs potential loss; aim for at least 1:2",cat:"Risk"},
  {term:"Paper Trading",def:"Simulated trading with virtual money to practice without real risk",cat:"Basics"},
  {term:"VIX",def:"CBOE Volatility Index — measures expected S&P 500 volatility",cat:"Markets"},
  {term:"LEAPS",def:"Long-term equity anticipation securities — options expiring 1-2+ years out",cat:"Options"},
  {term:"Head & Shoulders",def:"Classic bearish reversal chart pattern showing buyer exhaustion",cat:"Technical"},
  {term:"Golden Cross",def:"50 EMA crosses above 200 EMA — bullish long-term signal",cat:"Technical"},
  {term:"Death Cross",def:"50 EMA crosses below 200 EMA — bearish long-term signal",cat:"Technical"},
].sort((a,b)=>a.term.localeCompare(b.term));


// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  INTERACTIVE LESSON ANIMATIONS — OptiFlow Trading Academy               ║
// ║  Each lesson has a rich animated visual + step-through slides            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── LESSON ANIMATION REGISTRY ────────────────────────────────────────────────
// Maps lesson IDs to their interactive component

function LessonAnimation({ lessonId, courseColor }) {
  const comps = {
    what_stocks:          <StocksAnimation color={courseColor} />,
    how_markets_work:     <MarketsAnimation color={courseColor} />,
    reading_charts:       <CandlestickAnimation color={courseColor} />,
    support_resistance:   <SupportResistanceAnimation color={courseColor} />,
    bull_bear:            <BullBearAnimation color={courseColor} />,
    fundamental_analysis: <FundamentalsAnimation color={courseColor} />,
    what_options:         <OptionsIntroAnimation color={courseColor} />,
    calls_deep:           <CallOptionAnimation color={courseColor} />,
    puts_deep:            <PutOptionAnimation color={courseColor} />,
    options_pricing:      <OptionsPricingAnimation color={courseColor} />,
    expiry_dte:           <ThetaDecayAnimation color={courseColor} />,
    itm_atm_otm:          <MoneyAnimation color={courseColor} />,
    options_chain:        <ChainAnimation color={courseColor} />,
    delta:                <DeltaAnimation color={courseColor} />,
    theta:                <ThetaAnimation color={courseColor} />,
    vega:                 <VegaAnimation color={courseColor} />,
    gamma:                <GammaAnimation color={courseColor} />,
    rho_combined:         <GreeksCombinedAnimation color={courseColor} />,
    covered_call:         <CoveredCallAnimation color={courseColor} />,
    protective_put:       <ProtectivePutAnimation color={courseColor} />,
    bull_call_spread:     <BullSpreadAnimation color={courseColor} />,
    bear_put_spread:      <BearSpreadAnimation color={courseColor} />,
    straddle_strangle:    <StraddleAnimation color={courseColor} />,
    iron_condor:          <IronCondorAnimation color={courseColor} />,
    butterfly:            <ButterflyAnimation color={courseColor} />,
    calendar_spread:      <CalendarAnimation color={courseColor} />,
    position_sizing:      <PositionSizingAnimation color={courseColor} />,
    stop_losses:          <StopLossAnimation color={courseColor} />,
    trading_psychology:   <PsychologyAnimation color={courseColor} />,
    trading_journal:      <JournalAnimation color={courseColor} />,
    building_system:      <TradingSystemAnimation color={courseColor} />,
    trend_lines:          <TrendLineAnimation color={courseColor} />,
    chart_patterns:       <ChartPatternsAnimation color={courseColor} />,
    moving_averages:      <MovingAverageAnimation color={courseColor} />,
    rsi_macd:             <RSIMACDAnimation color={courseColor} />,
    bollinger_bands:      <BollingerAnimation color={courseColor} />,
    volume_analysis:      <VolumeAnimation color={courseColor} />,
  };
  return comps[lessonId] || <DefaultLessonAnimation lessonId={lessonId} color={courseColor} />;
}

// ── SHARED LESSON PLAYER SHELL ────────────────────────────────────────────────
function LessonPlayer({ lesson, courseColor, onComplete, isDone }) {
  const [tab, setTab]           = useState("animation"); // "animation" | "video"
  const [slide, setSlide]       = useState(0);
  const [aiSummary, setAiSummary]   = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [tutorOpen, setTutorOpen]   = useState(false);
  const [tutorMsgs, setTutorMsgs]   = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const tutorEndRef = useRef(null);

  const slides      = lesson.slides || [];
  const totalSlides = slides.length;
  const isLast      = slide === totalSlides - 1 || totalSlides === 0;

  useEffect(() => { setSlide(0); setAiSummary(""); setTutorMsgs([]); setTutorOpen(false); }, [lesson.id]);
  useEffect(() => { tutorEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [tutorMsgs]);

  // ── AI Summary ──
  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: `You are an expert trading educator. The student just watched a lesson titled "${lesson.title}". 
Write a concise, beginner-friendly summary of this trading concept. Structure it as:
1. **What it is** (1-2 sentences, plain English)
2. **Why it matters** (why traders care about this)
3. **Key rule** (one memorable rule of thumb)
4. **Watch out for** (one common mistake)
Keep it under 200 words. Use simple language — avoid jargon without explanation.`,
          messages: [{ role:"user", content:`Please summarize the trading lesson: "${lesson.title}". Context from lesson: ${lesson.summary}` }]
        })
      });
      const d = await res.json();
      setAiSummary(d.content?.[0]?.text || "Could not generate summary.");
    } catch(e) { setAiSummary("Error generating summary. Please try again."); }
    setSummaryLoading(false);
  };

  // ── AI Tutor chat ──
  const sendTutorMsg = async () => {
    if (!tutorInput.trim() || tutorLoading) return;
    const userMsg = tutorInput.trim();
    setTutorInput("");
    const newMsgs = [...tutorMsgs, { role:"user", content:userMsg }];
    setTutorMsgs(newMsgs);
    setTutorLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: `You are a friendly, patient trading tutor helping a student learn about "${lesson.title}".
The lesson covers: ${lesson.summary}
Key points: ${lesson.keyPoints?.join(", ")}

Rules:
- Always use simple, beginner-friendly language
- Use analogies and real examples
- If asked about something unrelated to trading, gently redirect
- Keep answers concise (under 150 words)
- Be encouraging and positive
- If the student seems confused, break it down further`,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "Sorry, I couldn't process that. Please try again.";
      setTutorMsgs(prev => [...prev, { role:"assistant", content:reply }]);
    } catch(e) { setTutorMsgs(prev => [...prev, { role:"assistant", content:"Connection error. Please try again." }]); }
    setTutorLoading(false);
  };

  const STARTER_QUESTIONS = [
    "Explain this in simple terms",
    "Give me a real example",
    "What's the biggest mistake beginners make?",
    "How does this apply to Indian markets?",
  ];

  return (
    <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, overflow:"hidden", marginBottom:14 }}>

      {/* ── TAB BAR ── */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid "+C.border, background:"#06090f" }}>
        {[["animation","🎯 Interactive"],["video","▶ Watch Video"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ padding:"11px 20px", background:tab===id?"#0b0f1a":"transparent", borderBottom:tab===id?"2px solid "+courseColor:"2px solid transparent", color:tab===id?courseColor:C.dim, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit", transition:"all .15s" }}>
            {label}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <button onClick={()=>setTutorOpen(o=>!o)}
          style={{ padding:"10px 18px", background:tutorOpen?"rgba(167,139,250,0.15)":"transparent", color:tutorOpen?C.purple:C.dim, border:"none", borderLeft:"1px solid "+C.border, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
          🤖 AI Tutor {tutorOpen ? "▲":"▼"}
        </button>
      </div>

      {/* ── MAIN PANEL ── */}
      <div style={{ display:"flex", flexDirection:"column" }}>

        {/* Content area */}
        <div style={{ background:"#030508", position:"relative" }}>
          {tab === "animation" ? (
            <div style={{ minHeight:320, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <LessonAnimation lessonId={lesson.id} courseColor={courseColor} />
            </div>
          ) : (
            <div style={{ position:"relative", background:"#000" }}>
              <div style={{ position:"relative", paddingBottom:"56.25%", height:0 }}>
                <iframe
                  key={lesson.videoId}
                  src={`https://www.youtube.com/embed/${lesson.videoId}?rel=0&modestbranding=1&color=white&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                  style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen title={lesson.title}
                />
              </div>
              {/* Attribution + fallback link */}
              <div style={{ padding:"8px 14px", background:"#06090f", borderTop:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:9, color:C.dim }}>Source:</span>
                  <span style={{ fontSize:9, color:C.muted }}>projectfinance / InTheMoney / Investopedia via YouTube</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <a href={`https://www.youtube.com/watch?v=${lesson.videoId}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:9, padding:"3px 10px", background:"rgba(248,113,113,0.12)", color:"#f87171", borderRadius:5, border:"1px solid rgba(248,113,113,0.25)", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
                    ▶ Open on YouTube
                  </a>
                  <button onClick={()=>setTab("animation")}
                    style={{ fontSize:9, padding:"3px 10px", background:"rgba(56,189,248,0.1)", color:C.blue, borderRadius:5, border:"1px solid "+C.blue+"33", cursor:"pointer", fontFamily:"inherit" }}>
                    Use Interactive Instead
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AI TUTOR PANEL ── */}
        {tutorOpen && (
          <div style={{ borderTop:"1px solid "+C.border, background:"#070a12", display:"flex", flexDirection:"column", height:340 }}>
            <div style={{ padding:"10px 16px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:16 }}>🤖</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.purple }}>AI Tutor</div>
                  <div style={{ fontSize:9, color:C.dim }}>Ask anything about "{lesson.title}"</div>
                </div>
              </div>
              {/* AI Summary button */}
              {!aiSummary && (
                <button onClick={fetchSummary} disabled={summaryLoading}
                  style={{ padding:"6px 14px", background:"rgba(167,139,250,0.15)", color:C.purple, border:"1px solid "+C.purple+"44", borderRadius:7, cursor:summaryLoading?"default":"pointer", fontWeight:700, fontSize:10, fontFamily:"inherit" }}>
                  {summaryLoading ? "⏳ Generating…" : "✨ Get AI Summary"}
                </button>
              )}
            </div>

            {/* Messages area */}
            <div style={{ flex:1, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
              {/* AI Summary if fetched */}
              {aiSummary && (
                <div style={{ background:"rgba(167,139,250,0.08)", border:"1px solid "+C.purple+"33", borderRadius:10, padding:"12px 14px", marginBottom:4 }}>
                  <div style={{ fontSize:9, color:C.purple, fontWeight:700, marginBottom:6 }}>✨ AI LESSON SUMMARY</div>
                  <div style={{ fontSize:11, color:"#c4b5fd", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{aiSummary}</div>
                </div>
              )}
              {/* Welcome message */}
              {tutorMsgs.length === 0 && !aiSummary && (
                <div style={{ background:"#0b0f1a", borderRadius:10, padding:"12px 14px", borderLeft:"3px solid "+C.purple }}>
                  <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, marginBottom:10 }}>
                    👋 Hi! I'm your AI tutor for this lesson on <strong style={{ color:C.purple }}>{lesson.title}</strong>. I can explain concepts, answer questions, give examples, or summarize what you just watched. What would you like to know?
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {STARTER_QUESTIONS.map(q=>(
                      <button key={q} onClick={()=>{ setTutorInput(q); }}
                        style={{ padding:"5px 12px", background:"rgba(167,139,250,0.1)", color:C.purple, border:"1px solid "+C.purple+"33", borderRadius:20, cursor:"pointer", fontSize:10, fontFamily:"inherit" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Chat messages */}
              {tutorMsgs.map((msg, i) => (
                <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{
                    maxWidth:"82%", padding:"10px 14px", borderRadius:10,
                    background: msg.role==="user" ? "rgba(56,189,248,0.15)" : "#0f1422",
                    border: "1px solid "+(msg.role==="user" ? C.blue+"33" : C.border),
                    fontSize:12, color: msg.role==="user" ? C.blue : "#94a3b8",
                    lineHeight:1.7,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {tutorLoading && (
                <div style={{ display:"flex", gap:4, padding:"8px 14px" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.purple, animation:`pulse ${0.6+i*0.2}s ease infinite alternate` }}/>)}
                </div>
              )}
              <div ref={tutorEndRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:"10px 12px", borderTop:"1px solid "+C.border, display:"flex", gap:8 }}>
              <input
                value={tutorInput}
                onChange={e=>setTutorInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendTutorMsg()}
                placeholder={`Ask anything about ${lesson.title}…`}
                style={{ flex:1, background:"#0b0f1a", border:"1px solid "+C.border, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:12, outline:"none", fontFamily:"inherit" }}
              />
              <button onClick={sendTutorMsg} disabled={!tutorInput.trim()||tutorLoading}
                style={{ padding:"9px 16px", background:tutorInput.trim()?"linear-gradient(135deg,#7c3aed,#a855f7)":"#1a2535", color:tutorInput.trim()?"#fff":C.dim, border:"none", borderRadius:8, cursor:tutorInput.trim()?"pointer":"default", fontWeight:700, fontSize:12, fontFamily:"inherit" }}>
                Send
              </button>
            </div>
          </div>
        )}

        {/* ── SLIDE CONTENT ── */}
        {totalSlides > 0 && (
          <div style={{ padding:"14px 18px", borderTop:"1px solid "+C.border }}>
            <div style={{ display:"flex", gap:6, marginBottom:12, alignItems:"center" }}>
              {slides.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  style={{ width:i===slide?20:8, height:8, borderRadius:4, background:i===slide?courseColor:C.border, border:"none", cursor:"pointer", transition:"all .2s", padding:0 }}/>
              ))}
              <span style={{ fontSize:9, color:C.dim, marginLeft:6 }}>{slide+1} / {totalSlides}</span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:6 }}>{slides[slide]?.title}</div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.8 }}>{slides[slide]?.body}</div>
          </div>
        )}

        {/* ── CONTROLS ── */}
        <div style={{ padding:"10px 18px", borderTop:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center", background:"#06090f" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:10, color:C.dim }}>{lesson.title}</span>
            <span style={{ fontSize:9, color:C.muted }}>{lesson.duration}</span>
            {lesson.videoId && (
              <a href={`https://www.youtube.com/watch?v=${lesson.videoId}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:9, color:C.red, textDecoration:"none", padding:"2px 8px", background:"rgba(248,113,113,0.1)", borderRadius:4, border:"1px solid rgba(248,113,113,0.2)" }}>
                ▶ YouTube
              </a>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {totalSlides > 0 && slide > 0 && (
              <button onClick={()=>setSlide(s=>s-1)}
                style={{ padding:"6px 14px", background:"#1a2535", color:C.dim, border:"1px solid "+C.border, borderRadius:7, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>← Back</button>
            )}
            {totalSlides > 0 && !isLast ? (
              <button onClick={()=>setSlide(s=>s+1)}
                style={{ padding:"6px 16px", background:courseColor+"22", color:courseColor, border:"1px solid "+courseColor+"44", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:11, fontFamily:"inherit" }}>
                Next →
              </button>
            ) : !isDone ? (
              <button onClick={onComplete}
                style={{ padding:"6px 18px", background:"linear-gradient(135deg,#14532d,#166534)", color:C.green, border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:11, fontFamily:"inherit" }}>
                ✓ Mark Complete
              </button>
            ) : (
              <div style={{ padding:"6px 14px", background:"#052e16", color:C.green, borderRadius:7, fontSize:11, fontWeight:700 }}>✓ Completed</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ANIMATION HELPERS ─────────────────────────────────────────────────────────
function useAnimTick(fps = 30) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(n => n + 1), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);
  return t;
}

// Animated price line on SVG
function PriceLine({ data, color, x0, y0, w, h, animate = true }) {
  const t = useAnimTick(20);
  const pts = data.map((v, i) => {
    const mn = Math.min(...data), mx = Math.max(...data);
    const px = x0 + (i / (data.length - 1)) * w;
    const py = y0 + h - ((v - mn) / (mx - mn + 0.001)) * h;
    return `${px},${py}`;
  });
  return <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
}

// Animated number counter
function AnimCounter({ target, prefix = "", suffix = "", color, style = {} }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 25);
    return () => clearInterval(id);
  }, [target]);
  return <span style={{ color, fontWeight: 700, ...style }}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── 1. STOCKS ANIMATION ───────────────────────────────────────────────────────
function StocksAnimation({ color }) {
  const t = useAnimTick(15);
  const prices = [100, 104, 102, 108, 106, 112, 110, 116, 119, 115, 121, 124, 122, 128];
  const w = 560, h = 180;
  const mn = 95, mx = 135;
  const pts = prices.map((v, i) => `${40 + i * (w - 60) / (prices.length - 1)},${h - 20 - ((v - mn) / (mx - mn)) * (h - 40)}`).join(" ");

  const pulse = 0.8 + 0.2 * Math.sin(t * 0.2);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 80}`} style={{ maxHeight: 320 }}>
      {/* Grid */}
      {[100, 110, 120, 130].map(v => {
        const y = h - 20 - ((v - mn) / (mx - mn)) * (h - 40);
        return <g key={v}><line x1={40} y1={y} x2={w - 20} y2={y} stroke="#1c2838" strokeDasharray="4 6" strokeWidth={0.8} /><text x={30} y={y + 4} textAnchor="end" fontSize={9} fill="#475569">${v}</text></g>;
      })}
      {/* Area fill */}
      <defs>
        <linearGradient id="saGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${w - 20},${h - 20} 40,${h - 20}`} fill="url(#saGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {/* Live dot */}
      <circle cx={w - 20} cy={h - 20 - ((prices[prices.length - 1] - mn) / (mx - mn)) * (h - 40)} r={5 * pulse} fill={color} opacity={0.9} />

      {/* Labels */}
      <text x={w / 2} y={h + 24} textAnchor="middle" fontSize={11} fill="#4ade80" fontWeight="700">AAPL +24% this year</text>

      {/* Company boxes */}
      {[["AAPL", "$213", "+1.2%", "#4ade80"], ["MSFT", "$415", "+0.8%", "#4ade80"], ["TSLA", "$177", "-2.1%", "#f87171"]].map(([sym, price, pct, col], i) => (
        <g key={sym} transform={`translate(${40 + i * 170}, ${h + 38})`}>
          <rect width={150} height={36} rx={7} fill="#0b0f1a" stroke="#1c2838" />
          <text x={8} y={14} fontSize={11} fontWeight="700" fill="#e2eaf4">{sym}</text>
          <text x={8} y={28} fontSize={10} fill={col}>{price} <tspan>{pct}</tspan></text>
        </g>
      ))}
    </svg>
  );
}

// ── 2. MARKETS ANIMATION ──────────────────────────────────────────────────────
function MarketsAnimation({ color }) {
  const t = useAnimTick(10);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      const isBuy = Math.random() > 0.5;
      setOrders(prev => [...prev.slice(-12), {
        id: Date.now(),
        type: isBuy ? "BUY" : "SELL",
        price: +(210 + (Math.random() - 0.5) * 4).toFixed(2),
        qty: Math.round(10 + Math.random() * 90),
        color: isBuy ? "#4ade80" : "#f87171",
        age: 0,
      }]);
    }, 600);
    return () => clearInterval(id);
  }, []);

  return (
    <svg width="100%" viewBox="0 0 560 300" style={{ maxHeight: 300 }}>
      {/* Title */}
      <text x={280} y={22} textAnchor="middle" fontSize={12} fill="#64748b">Live Order Book — AAPL</text>

      {/* Columns */}
      <rect x={20} y={32} width={240} height={250} rx={8} fill="#030712" stroke="#1c2838" />
      <rect x={300} y={32} width={240} height={250} rx={8} fill="#030712" stroke="#1c2838" />

      <text x={140} y={50} textAnchor="middle" fontSize={10} fontWeight="700" fill="#f87171">SELL ORDERS (ASK)</text>
      <text x={420} y={50} textAnchor="middle" fontSize={10} fontWeight="700" fill="#4ade80">BUY ORDERS (BID)</text>

      {/* Order rows */}
      {orders.slice(-8).map((o, i) => (
        <g key={o.id} transform={`translate(${o.type === "SELL" ? 30 : 310}, ${58 + i * 26})`}>
          <rect width={220} height={22} rx={4} fill={o.color + "15"} stroke={o.color + "33"} />
          <text x={8} y={15} fontSize={10} fill={o.color} fontWeight="700">{o.type}</text>
          <text x={65} y={15} fontSize={10} fill="#e2eaf4">${o.price}</text>
          <text x={140} y={15} fontSize={10} fill="#64748b">{o.qty} shares</text>
        </g>
      ))}

      {/* Mid price */}
      <text x={280} y={170} textAnchor="middle" fontSize={16} fontWeight="700" fill={color}>$213.50</text>
      <text x={280} y={185} textAnchor="middle" fontSize={9} fill="#475569">LAST TRADE</text>
    </svg>
  );
}

// ── 3. CANDLESTICK ANIMATION ──────────────────────────────────────────────────
function CandlestickAnimation({ color }) {
  const [hover, setHover] = useState(null);
  const candles = [
    { o: 100, h: 108, l: 98, c: 106, bull: true },
    { o: 106, h: 110, l: 103, c: 104, bull: false },
    { o: 104, h: 114, l: 102, c: 112, bull: true },
    { o: 112, h: 115, l: 107, c: 109, bull: false },
    { o: 109, h: 120, l: 108, c: 118, bull: true },
    { o: 118, h: 122, l: 113, c: 115, bull: false },
    { o: 115, h: 126, l: 113, c: 124, bull: true },
  ];
  const mn = 96, mx = 128;
  const sc = (v) => 40 + (1 - (v - mn) / (mx - mn)) * 180;

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={11} fill="#64748b">Candlestick Chart — Hover each candle</text>
      {[100, 110, 120].map(v => (
        <g key={v}>
          <line x1={50} y1={sc(v)} x2={510} y2={sc(v)} stroke="#1c2838" strokeDasharray="3 5" strokeWidth={0.7} />
          <text x={44} y={sc(v) + 4} textAnchor="end" fontSize={9} fill="#475569">${v}</text>
        </g>
      ))}
      {candles.map((c, i) => {
        const cx = 90 + i * 60;
        const col = c.bull ? "#4ade80" : "#f87171";
        const bodyTop = sc(Math.max(c.o, c.c));
        const bodyH = Math.max(4, Math.abs(sc(c.o) - sc(c.c)));
        const isHov = hover === i;
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <line x1={cx} y1={sc(c.h)} x2={cx} y2={bodyTop} stroke={col} strokeWidth={isHov ? 2 : 1.5} />
            <line x1={cx} y1={bodyTop + bodyH} x2={cx} y2={sc(c.l)} stroke={col} strokeWidth={isHov ? 2 : 1.5} />
            <rect x={cx - (isHov ? 14 : 10)} y={bodyTop} width={isHov ? 28 : 20} height={bodyH}
              fill={col} fillOpacity={c.bull ? 0.8 : 0.9} stroke={col} rx={1}
              style={{ transition: "all .15s" }} />
            {isHov && (
              <g>
                <rect x={cx - 45} y={sc(c.h) - 70} width={90} height={68} rx={6} fill="#0b0f1a" stroke="#1c2838" />
                {[["O", c.o], ["H", c.h], ["L", c.l], ["C", c.c]].map(([k, v], j) => (
                  <g key={k}>
                    <text x={cx - 36} y={sc(c.h) - 52 + j * 14} fontSize={10} fill="#64748b">{k}</text>
                    <text x={cx + 36} y={sc(c.h) - 52 + j * 14} textAnchor="end" fontSize={10} fill={k === "C" ? col : "#e2eaf4"} fontWeight={k === "C" ? "700" : "400"}>${v}</text>
                  </g>
                ))}
              </g>
            )}
          </g>
        );
      })}
      {/* Legend */}
      <g transform="translate(80, 248)">
        <rect width={14} height={14} rx={2} fill="#4ade80" />
        <text x={18} y={11} fontSize={10} fill="#94a3b8">Bullish (Close &gt; Open)</text>
        <rect x={180} width={14} height={14} rx={2} fill="#f87171" />
        <text x={198} y={11} fontSize={10} fill="#94a3b8">Bearish (Close &lt; Open)</text>
      </g>
    </svg>
  );
}

// ── 4. SUPPORT & RESISTANCE ───────────────────────────────────────────────────
function SupportResistanceAnimation({ color }) {
  const t = useAnimTick(12);
  const prices = [108, 112, 118, 115, 120, 117, 122, 119, 124, 121, 120, 123, 125, 122, 128, 125, 130, 126];
  const w = 520, h = 200;
  const mn = 104, mx = 134;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * (h - 20);
  const sx = i => 30 + i * (w - 40) / (prices.length - 1);
  const pts = prices.map((v, i) => `${sx(i)},${sc(v)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w + 40} ${h + 60}`} style={{ maxHeight: 300 }}>
      {/* Resistance line */}
      <line x1={30} y1={sc(128)} x2={w} y2={sc(128)} stroke="#f87171" strokeDasharray="6 4" strokeWidth={2} />
      <text x={w + 2} y={sc(128) + 4} fontSize={9} fill="#f87171" fontWeight="700">RESISTANCE $128</text>
      {/* Support line */}
      <line x1={30} y1={sc(115)} x2={w} y2={sc(115)} stroke="#4ade80" strokeDasharray="6 4" strokeWidth={2} />
      <text x={w + 2} y={sc(115) + 4} fontSize={9} fill="#4ade80" fontWeight="700">SUPPORT $115</text>

      {/* Price */}
      <defs>
        <linearGradient id="srGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${sx(prices.length - 1)},${h + 10} 30,${h + 10}`} fill="url(#srGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />

      {/* Bounce arrows at support */}
      {[3, 9, 15].map(i => (
        <text key={i} x={sx(i)} y={sc(prices[i]) + 18} textAnchor="middle" fontSize={14} fill="#4ade80">↑</text>
      ))}
      {/* Rejection arrows at resistance */}
      {[8, 14].map(i => (
        <text key={i} x={sx(i)} y={sc(prices[i]) - 10} textAnchor="middle" fontSize={14} fill="#f87171">↓</text>
      ))}

      <text x={270} y={h + 45} textAnchor="middle" fontSize={11} fill="#64748b">Price bounces between Support and Resistance zones</text>
    </svg>
  );
}

// ── 5. BULL & BEAR ANIMATION ──────────────────────────────────────────────────
function BullBearAnimation({ color }) {
  const t = useAnimTick(8);
  const phase = Math.floor(t / 80) % 2; // alternates bull/bear
  const progress = (t % 80) / 80;
  const bull = [100, 104, 108, 106, 112, 116, 113, 120, 118, 125, 122, 130];
  const bear = [130, 126, 128, 122, 119, 124, 117, 113, 115, 108, 104, 100];
  const data = phase === 0 ? bull : bear;
  const mn = 96, mx = 134;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * 150;
  const visible = data.slice(0, Math.max(2, Math.floor(progress * data.length)));
  const pts = visible.map((v, i) => `${40 + i * 440 / (data.length - 1)},${sc(v)}`).join(" ");

  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fontWeight="700" fill={phase === 0 ? "#4ade80" : "#f87171"}>
        {phase === 0 ? "🐂 BULL MARKET — Prices Rising" : "🐻 BEAR MARKET — Prices Falling"}
      </text>
      {/* Background zone */}
      <rect x={40} y={28} width={480} height={162} rx={6} fill={phase === 0 ? "#052e1622" : "#3b000022"} />
      {visible.length > 1 && (
        <>
          <defs>
            <linearGradient id="bbG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={phase === 0 ? "#4ade80" : "#f87171"} stopOpacity={0.25} />
              <stop offset="100%" stopColor={phase === 0 ? "#4ade80" : "#f87171"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`${pts} ${40 + (visible.length - 1) * 440 / (data.length - 1)},190 40,190`} fill="url(#bbG)" />
          <polyline points={pts} fill="none" stroke={phase === 0 ? "#4ade80" : "#f87171"} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      <text x={280} y={220} textAnchor="middle" fontSize={10} fill="#475569">
        {phase === 0
          ? "Higher highs + higher lows = Bull market (20%+ gain from lows)"
          : "Lower highs + lower lows = Bear market (20%+ fall from highs)"}
      </text>
      <text x={280} y={240} textAnchor="middle" fontSize={9} fill="#334155">Cycle repeats every ~4 years on average</text>
    </svg>
  );
}

// ── 6. FUNDAMENTALS ANIMATION ─────────────────────────────────────────────────
function FundamentalsAnimation({ color }) {
  const metrics = [
    { label: "P/E Ratio", val: "28×", desc: "Paying $28 per $1 of earnings", color: "#fbbf24", bar: 60 },
    { label: "EPS", val: "$6.43", desc: "Earnings per share", color: "#4ade80", bar: 75 },
    { label: "Revenue Growth", val: "+12%", desc: "YoY revenue increase", color: "#38bdf8", bar: 55 },
    { label: "Debt / Equity", val: "0.31×", desc: "Low leverage — safer", color: "#4ade80", bar: 25 },
    { label: "Free Cash Flow", val: "$98B", desc: "Cash generated by business", color: "#a78bfa", bar: 80 },
  ];
  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={11} fill="#64748b">Fundamental Analysis — What makes a stock valuable?</text>
      {metrics.map((m, i) => (
        <g key={m.label} transform={`translate(30, ${38 + i * 46})`}>
          <text x={0} y={14} fontSize={11} fontWeight="700" fill="#e2eaf4">{m.label}</text>
          <text x={130} y={14} fontSize={13} fontWeight="700" fill={m.color}>{m.val}</text>
          <rect x={210} y={4} width={270} height={12} rx={6} fill="#1a2535" />
          <rect x={210} y={4} width={m.bar / 100 * 270} height={12} rx={6} fill={m.color} fillOpacity={0.7} />
          <text x={490} y={14} fontSize={9} fill="#475569">{m.desc}</text>
        </g>
      ))}
    </svg>
  );
}

// ── 7. OPTIONS INTRO ──────────────────────────────────────────────────────────
function OptionsIntroAnimation({ color }) {
  const [mode, setMode] = useState("call");
  const stockPrice = 210;
  const strike = 220;
  const premium = 5;
  const t = useAnimTick(8);
  const liveStock = stockPrice + 10 * Math.sin(t * 0.05);

  const callProfit = Math.max(0, liveStock - strike) - premium;
  const putProfit  = Math.max(0, strike - liveStock) - premium;
  const profit = mode === "call" ? callProfit : putProfit;
  const profitColor = profit >= 0 ? "#4ade80" : "#f87171";

  return (
    <svg width="100%" viewBox="0 0 560 300" style={{ maxHeight: 300 }}>
      {/* Toggle */}
      <g onClick={() => setMode("call")} style={{ cursor: "pointer" }}>
        <rect x={60} y={10} width={110} height={28} rx={7} fill={mode === "call" ? "#052e16" : "#0b0f1a"} stroke={mode === "call" ? "#4ade80" : "#1c2838"} />
        <text x={115} y={29} textAnchor="middle" fontSize={12} fontWeight="700" fill={mode === "call" ? "#4ade80" : "#475569"}>📈 CALL</text>
      </g>
      <g onClick={() => setMode("put")} style={{ cursor: "pointer" }}>
        <rect x={195} y={10} width={110} height={28} rx={7} fill={mode === "put" ? "#3b0000" : "#0b0f1a"} stroke={mode === "put" ? "#f87171" : "#1c2838"} />
        <text x={250} y={29} textAnchor="middle" fontSize={12} fontWeight="700" fill={mode === "put" ? "#f87171" : "#475569"}>📉 PUT</text>
      </g>

      {/* Labels */}
      {[
        [30, 60, "STOCK PRICE", `$${liveStock.toFixed(2)}`, "#e2eaf4"],
        [30, 110, "STRIKE PRICE", `$${strike}`, "#38bdf8"],
        [30, 160, "PREMIUM PAID", `$${premium}`, "#fbbf24"],
        [30, 210, "BREAKEVEN", `$${mode === "call" ? strike + premium : strike - premium}`, "#a78bfa"],
        [30, 260, "LIVE P&L", `${profit >= 0 ? "+" : ""}$${profit.toFixed(2)}`, profitColor],
      ].map(([x, y, label, val, col]) => (
        <g key={label}>
          <text x={x} y={y} fontSize={9} fill="#64748b" fontWeight="700">{label}</text>
          <text x={x} y={y + 18} fontSize={16} fill={col} fontWeight="700">{val}</text>
        </g>
      ))}

      {/* Payoff diagram */}
      {(() => {
        const pts = [];
        for (let s = 180; s <= 260; s += 5) {
          const x = 300 + (s - 180) * 3.7;
          const rawP = mode === "call" ? Math.max(0, s - strike) - premium : Math.max(0, strike - s) - premium;
          const y = 190 - rawP * 5;
          pts.push(`${x},${y}`);
        }
        const zeroY = 190;
        return (
          <>
            <line x1={300} y1={80} x2={300} y2={270} stroke="#1c2838" strokeWidth={1} />
            <line x1={295} y1={zeroY} x2={505} y2={zeroY} stroke="#1c2838" strokeWidth={1} />
            <text x={295} y={zeroY - 4} fontSize={8} fill="#475569" textAnchor="end">$0</text>
            <text x={400} y={76} textAnchor="middle" fontSize={9} fill="#64748b">PAYOFF DIAGRAM</text>
            <polyline points={pts.join(" ")} fill="none" stroke={mode === "call" ? "#4ade80" : "#f87171"} strokeWidth={3} strokeLinecap="round" />
            <line x1={300 + (liveStock - 180) * 3.7} y1={80} x2={300 + (liveStock - 180) * 3.7} y2={270} stroke="#38bdf8" strokeDasharray="4 3" strokeWidth={1.5} />
          </>
        );
      })()}
    </svg>
  );
}

// ── 8. CALL OPTION ────────────────────────────────────────────────────────────
function CallOptionAnimation({ color }) {
  const [stockNow, setStock] = useState(210);
  const strike = 215, premium = 5;
  const pnl = Math.max(0, stockNow - strike) - premium;
  const be = strike + premium;
  const col = pnl >= 0 ? "#4ade80" : "#f87171";

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Call Option — Drag stock price</text>
      {/* Slider label */}
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock Price: <tspan fontWeight="700" fill="#38bdf8">${stockNow}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={30}>
        <input type="range" min={180} max={260} value={stockNow} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* Visual levels */}
      {[[strike, "#38bdf8", "Strike $215"], [be, "#fbbf24", `Breakeven $${be}`]].map(([v, c, label]) => {
        const x = 30 + (v - 180) * (500 / 80);
        return (
          <g key={label}>
            <line x1={x} y1={100} x2={x} y2={230} stroke={c} strokeDasharray="5 3" strokeWidth={1.5} />
            <text x={x} y={96} textAnchor="middle" fontSize={9} fill={c}>{label}</text>
          </g>
        );
      })}

      {/* Stock position */}
      {(() => {
        const x = 30 + (stockNow - 180) * (500 / 80);
        return <circle cx={x} cy={165} r={8} fill="#38bdf8" />;
      })()}

      {/* Results */}
      <rect x={150} y={240} width={260} height={28} rx={7} fill={pnl >= 0 ? "#052e16" : "#3b0000"} />
      <text x={280} y={259} textAnchor="middle" fontSize={13} fontWeight="700" fill={col}>
        P&L: {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} per share | {pnl >= 0 ? "Profitable ✓" : "Loss ✗"}
      </text>

      {/* Zone labels */}
      <text x={80} y={200} fontSize={10} fill="#f87171">LOSS ZONE</text>
      <text x={430} y={200} fontSize={10} fill="#4ade80">PROFIT ZONE</text>
      <line x1={30} y1={165} x2={530} y2={165} stroke="#1c2838" strokeWidth={1} />
    </svg>
  );
}

// ── 9. PUT OPTION ─────────────────────────────────────────────────────────────
function PutOptionAnimation({ color }) {
  const [stockNow, setStock] = useState(210);
  const strike = 205, premium = 4;
  const pnl = Math.max(0, strike - stockNow) - premium;
  const be = strike - premium;
  const col = pnl >= 0 ? "#4ade80" : "#f87171";

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Put Option — Profits when stock falls</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock Price: <tspan fontWeight="700" fill="#f87171">${stockNow}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={30}>
        <input type="range" min={160} max={240} value={stockNow} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {[[strike, "#f87171", "Strike $205"], [be, "#fbbf24", `Breakeven $${be}`]].map(([v, c, label]) => {
        const x = 30 + (v - 160) * (500 / 80);
        return (
          <g key={label}>
            <line x1={x} y1={100} x2={x} y2={230} stroke={c} strokeDasharray="5 3" strokeWidth={1.5} />
            <text x={x} y={96} textAnchor="middle" fontSize={9} fill={c}>{label}</text>
          </g>
        );
      })}
      {(() => {
        const x = 30 + (stockNow - 160) * (500 / 80);
        return <circle cx={x} cy={165} r={8} fill="#f87171" />;
      })()}

      <rect x={150} y={240} width={260} height={28} rx={7} fill={pnl >= 0 ? "#052e16" : "#3b0000"} />
      <text x={280} y={259} textAnchor="middle" fontSize={13} fontWeight="700" fill={col}>
        P&L: {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} | {pnl >= 0 ? "Profitable ✓" : "Loss ✗"}
      </text>
      <text x={430} y={200} fontSize={10} fill="#f87171">LOSS ZONE →</text>
      <text x={70} y={200} fontSize={10} fill="#4ade80">← PROFIT ZONE</text>
      <line x1={30} y1={165} x2={530} y2={165} stroke="#1c2838" strokeWidth={1} />
    </svg>
  );
}

// ── 10. OPTIONS PRICING ───────────────────────────────────────────────────────
function OptionsPricingAnimation({ color }) {
  const [iv, setIv] = useState(25);
  const [dte, setDte] = useState(30);
  const S = 210, K = 210, r = 0.05;
  // Simplified BS approximation for display
  const T = dte / 365;
  const sig = iv / 100;
  const d1 = (Math.log(S / K) + (r + 0.5 * sig * sig) * T) / (sig * Math.sqrt(T) + 0.001);
  const N = x => 0.5 * (1 + Math.tanh(x * 0.7978845608));
  const callPrice = +(S * N(d1) - K * Math.exp(-r * T) * N(d1 - sig * Math.sqrt(T))).toFixed(2);
  const intrinsic = Math.max(0, S - K);
  const timeVal = +(callPrice - intrinsic).toFixed(2);

  return (
    <svg width="100%" viewBox="0 0 560 300" style={{ maxHeight: 300 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Option Pricing — Adjust IV and DTE</text>

      {/* IV slider */}
      <text x={30} y={48} fontSize={10} fill="#94a3b8">Implied Volatility: <tspan fontWeight="700" fill="#a78bfa">{iv}%</tspan></text>
      <foreignObject x={30} y={52} width={240} height={28}>
        <input type="range" min={5} max={80} value={iv} onChange={e => setIv(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* DTE slider */}
      <text x={300} y={48} fontSize={10} fill="#94a3b8">Days to Expiry: <tspan fontWeight="700" fill="#fbbf24">{dte}d</tspan></text>
      <foreignObject x={300} y={52} width={240} height={28}>
        <input type="range" min={1} max={90} value={dte} onChange={e => setDte(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* Premium breakdown */}
      <text x={280} y={110} textAnchor="middle" fontSize={20} fontWeight="700" fill={color}>Option Price: ${callPrice}</text>

      {/* Stacked bar */}
      <text x={100} y={140} fontSize={9} fill="#475569">Intrinsic</text>
      <text x={340} y={140} fontSize={9} fill="#475569">Time Value</text>
      <rect x={60} y={146} width={440} height={28} rx={6} fill="#1a2535" />
      <rect x={60} y={146} width={callPrice > 0 ? (intrinsic / callPrice) * 440 : 0} height={28} rx={6} fill="#38bdf8" fillOpacity={0.8} />
      <rect x={60 + (callPrice > 0 ? (intrinsic / callPrice) * 440 : 0)} y={146}
        width={callPrice > 0 ? (timeVal / callPrice) * 440 : 440} height={28} rx={6} fill="#fbbf24" fillOpacity={0.8} />
      <text x={280} y={166} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="700">
        ${intrinsic} intrinsic + ${timeVal} time value
      </text>

      {/* Insights */}
      {[
        `📌 Higher IV (${iv}%) = more expensive options`,
        `📌 More time (${dte} days) = higher time value`,
        `📌 Time value → $0 at expiry (theta decay)`,
      ].map((txt, i) => (
        <text key={i} x={30} y={210 + i * 22} fontSize={11} fill={i === 0 && iv > 50 ? "#f87171" : "#94a3b8"}>{txt}</text>
      ))}
    </svg>
  );
}

// ── 11. THETA DECAY ANIMATION ─────────────────────────────────────────────────
function ThetaDecayAnimation({ color }) {
  const t = useAnimTick(6);
  const days = Array.from({ length: 60 }, (_, i) => 60 - i);
  const premiums = days.map(d => +(5 * Math.sqrt(d / 60)).toFixed(2));
  const current = t % 60;
  const currentPrem = +(5 * Math.sqrt((60 - current) / 60)).toFixed(2);
  const sc = v => 40 + (1 - v / 5) * 160;
  const sx = d => 30 + (60 - d) * (500 / 59);
  const pts = premiums.map((v, i) => `${sx(days[i])},${sc(v)}`).join(" ");

  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Theta Decay — Option loses value every day</text>
      {[1, 2, 3, 4, 5].map(v => (
        <g key={v}>
          <line x1={30} y1={sc(v)} x2={530} y2={sc(v)} stroke="#1c2838" strokeDasharray="3 5" strokeWidth={0.7} />
          <text x={24} y={sc(v) + 4} textAnchor="end" fontSize={9} fill="#475569">${v}</text>
        </g>
      ))}
      <line x1={30} y1={200} x2={530} y2={200} stroke="#1c2838" strokeWidth={1} />
      <text x={280} y={215} textAnchor="middle" fontSize={9} fill="#475569">← Days Remaining →</text>
      {[60, 45, 30, 15, 0].map(d => (
        <text key={d} x={sx(d)} y={212} textAnchor="middle" fontSize={9} fill="#475569">{d}d</text>
      ))}
      <defs>
        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 530,200 30,200`} fill="url(#tGrad)" />
      <polyline points={pts} fill="none" stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
      {/* Moving dot */}
      <circle cx={sx(60 - current)} cy={sc(currentPrem)} r={7} fill="#f87171" />
      <text x={sx(60 - current)} y={sc(currentPrem) - 12} textAnchor="middle" fontSize={9} fill="#f87171" fontWeight="700">${currentPrem}</text>
      <text x={280} y={240} textAnchor="middle" fontSize={10} fill="#94a3b8">
        Decay accelerates as expiry approaches — avoid holding options too long!
      </text>
    </svg>
  );
}

// ── 12. ITM/ATM/OTM ──────────────────────────────────────────────────────────
function MoneyAnimation({ color }) {
  const [stock, setStock] = useState(210);
  const strike = 210;
  const getStatus = s => s > strike + 2 ? "ITM" : s < strike - 2 ? "OTM" : "ATM";
  const status = getStatus(stock);
  const statusColor = status === "ITM" ? "#4ade80" : status === "ATM" ? "#fbbf24" : "#f87171";

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">ITM / ATM / OTM — Slide the stock price</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock Price: <tspan fontWeight="700" fill="#38bdf8">${stock}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={180} max={240} value={stock} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* Zone visualization */}
      <rect x={30} y={95} width={166} height={90} rx={8} fill="#3b000044" stroke="#f87171" />
      <rect x={197} y={95} width={166} height={90} rx={8} fill="#1c1a0a44" stroke="#fbbf24" />
      <rect x={364} y={95} width={166} height={90} rx={8} fill="#052e1644" stroke="#4ade80" />
      <text x={113} y={120} textAnchor="middle" fontSize={11} fontWeight="700" fill="#f87171">OTM</text>
      <text x={113} y={136} textAnchor="middle" fontSize={9} fill="#94a3b8">Stock &lt; Strike</text>
      <text x={113} y={150} textAnchor="middle" fontSize={9} fill="#f87171">No intrinsic value</text>
      <text x={113} y={166} textAnchor="middle" fontSize={9} fill="#475569">(≤$207 for this call)</text>
      <text x={280} y={120} textAnchor="middle" fontSize={11} fontWeight="700" fill="#fbbf24">ATM</text>
      <text x={280} y={136} textAnchor="middle" fontSize={9} fill="#94a3b8">Stock ≈ Strike</text>
      <text x={280} y={150} textAnchor="middle" fontSize={9} fill="#fbbf24">50/50 chance</text>
      <text x={280} y={166} textAnchor="middle" fontSize={9} fill="#475569">(≈$210 for this call)</text>
      <text x={447} y={120} textAnchor="middle" fontSize={11} fontWeight="700" fill="#4ade80">ITM</text>
      <text x={447} y={136} textAnchor="middle" fontSize={9} fill="#94a3b8">Stock &gt; Strike</text>
      <text x={447} y={150} textAnchor="middle" fontSize={9} fill="#4ade80">Has intrinsic value</text>
      <text x={447} y={166} textAnchor="middle" fontSize={9} fill="#475569">(≥$213 for this call)</text>

      {/* Current position marker */}
      {(() => {
        const x = 30 + (stock - 180) * (500 / 60);
        return (
          <>
            <line x1={x} y1={88} x2={x} y2={192} stroke="#38bdf8" strokeWidth={2} />
            <circle cx={x} cy={83} r={8} fill="#38bdf8" />
            <text x={x} y={87} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">${stock}</text>
          </>
        );
      })()}

      <rect x={180} y={210} width={200} height={34} rx={8} fill={statusColor + "33"} stroke={statusColor + "88"} />
      <text x={280} y={232} textAnchor="middle" fontSize={15} fontWeight="700" fill={statusColor}>
        This call is {status}
      </text>
    </svg>
  );
}

// ── 13. DELTA ANIMATION ───────────────────────────────────────────────────────
function DeltaAnimation({ color }) {
  const [stockMove, setStockMove] = useState(0);
  const delta = 0.60;
  const optionMove = +(delta * stockMove).toFixed(2);

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Delta — How much does your option move?</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock moves: <tspan fontWeight="700" fill={stockMove >= 0 ? "#4ade80" : "#f87171"}>{stockMove >= 0 ? "+" : ""}${stockMove}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={-10} max={10} value={stockMove} onChange={e => setStockMove(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* Equation */}
      <text x={280} y={112} textAnchor="middle" fontSize={13} fill="#94a3b8">
        Delta ({delta}) × Stock Move (${stockMove >= 0 ? "+" : ""}{stockMove})
      </text>
      <text x={280} y={136} textAnchor="middle" fontSize={20} fontWeight="700" fill={optionMove >= 0 ? "#4ade80" : "#f87171"}>
        = Option moves {optionMove >= 0 ? "+" : ""}${optionMove}
      </text>

      {/* Delta scale */}
      <rect x={30} y={158} width={500} height={18} rx={9} fill="#1a2535" />
      {[0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0].map(d => {
        const x = 30 + d * 500;
        return (
          <g key={d}>
            <line x1={x} y1={155} x2={x} y2={179} stroke="#1c2838" strokeWidth={1} />
            <text x={x} y={192} textAnchor="middle" fontSize={8} fill="#475569">{d}</text>
          </g>
        );
      })}
      <circle cx={30 + delta * 500} cy={167} r={9} fill="#38bdf8" />
      <text x={30 + delta * 500} y={171} textAnchor="middle" fontSize={8} fill="#000" fontWeight="700">Δ{delta}</text>

      {[
        ["Deep OTM", "Δ≈0.10", "#f87171", 0.10],
        ["ATM", "Δ≈0.50", "#fbbf24", 0.50],
        ["Deep ITM", "Δ≈0.90", "#4ade80", 0.90],
      ].map(([label, val, col, pos]) => (
        <g key={label}>
          <text x={30 + pos * 500} y={210} textAnchor="middle" fontSize={9} fill={col} fontWeight="700">{label}</text>
          <text x={30 + pos * 500} y={224} textAnchor="middle" fontSize={9} fill={col}>{val}</text>
        </g>
      ))}

      <text x={280} y={256} textAnchor="middle" fontSize={10} fill="#475569">Delta also ≈ probability of expiring ITM</text>
    </svg>
  );
}

// ── 14. THETA ANIMATION ───────────────────────────────────────────────────────
function ThetaAnimation({ color }) {
  const t = useAnimTick(4);
  const day = t % 31;
  const premium = +(8 * Math.sqrt(Math.max(0, 30 - day) / 30)).toFixed(2);
  const theta = +(8 * 0.5 / (2 * Math.sqrt(Math.max(0.1, 30 - day) / 30) * 30)).toFixed(3);

  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={12} fill="#64748b">Theta — Time Decay (animating)</text>
      <text x={280} y={50} textAnchor="middle" fontSize={18} fontWeight="700" fill="#f87171">Day {day}/30</text>
      <text x={280} y={75} textAnchor="middle" fontSize={14} fill="#94a3b8">
        Option Premium: <tspan fontWeight="700" fill={premium > 2 ? "#fbbf24" : "#f87171"}>${premium}</tspan>
      </text>
      <text x={280} y={96} textAnchor="middle" fontSize={11} fill="#475569">
        Daily Theta decay: -${theta}/day
      </text>

      {/* Ice melting visual */}
      <rect x={200} y={114} width={160} height={Math.max(4, premium / 8 * 100)} rx={4} fill="#38bdf850" stroke="#38bdf8" />
      <text x={280} y={114 + Math.max(4, premium / 8 * 100) / 2 + 5} textAnchor="middle" fontSize={11} fill="#38bdf8" fontWeight="700">${premium}</text>
      <text x={280} y={225} textAnchor="middle" fontSize={10} fill="#94a3b8">Premium melts away like ice — fastest near expiry</text>
      <line x1={200} y1={218} x2={360} y2={218} stroke="#1c2838" strokeWidth={1} />
      <text x={200} y={236} textAnchor="middle" fontSize={9} fill="#475569">$0</text>
      <text x={360} y={236} textAnchor="middle" fontSize={9} fill="#475569">$8 (start)</text>
    </svg>
  );
}

// ── 15. VEGA ANIMATION ────────────────────────────────────────────────────────
function VegaAnimation({ color }) {
  const [iv, setIv] = useState(30);
  const base = 5;
  const optPrice = +(base * (iv / 30)).toFixed(2);
  const ivCrush = +(base * (20 / 30)).toFixed(2);

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Vega — Sensitivity to Volatility Changes</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Implied Volatility: <tspan fontWeight="700" fill="#a78bfa">{iv}%</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={5} max={80} value={iv} onChange={e => setIv(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      <text x={280} y={110} textAnchor="middle" fontSize={22} fontWeight="700" fill="#a78bfa">Option: ${optPrice}</text>
      <text x={280} y={132} textAnchor="middle" fontSize={11} fill="#64748b">
        {iv > 50 ? "⚠️ Very high IV — options are expensive" : iv < 15 ? "Low IV — options are cheap to buy" : "Normal IV range"}
      </text>

      {/* IV bar */}
      <rect x={30} y={150} width={500} height={20} rx={10} fill="#1a2535" />
      <rect x={30} y={150} width={iv / 80 * 500} height={20} rx={10}
        fill={iv > 50 ? "#f87171" : iv < 15 ? "#4ade80" : "#a78bfa"} fillOpacity={0.7} />
      <text x={30 + iv / 80 * 500 / 2} y={165} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="700">{iv}%</text>

      {/* IV Crush scenario */}
      <rect x={30} y={188} width={500} height={60} rx={8} fill="#1c0a0a44" stroke="#f87171" />
      <text x={45} y={208} fontSize={10} fontWeight="700" fill="#f87171">⚡ IV CRUSH EXAMPLE (after earnings):</text>
      <text x={45} y={226} fontSize={10} fill="#94a3b8">Before earnings: IV = {iv}% → Option = ${optPrice}</text>
      <text x={45} y={242} fontSize={10} fill="#f87171">After earnings: IV crashes to 20% → Option = ${ivCrush}</text>
      <text x={45} y={258} fontSize={9} fill="#475569">Even if stock moved correctly, you could still lose money!</text>
    </svg>
  );
}

// ── 16. GAMMA ANIMATION ───────────────────────────────────────────────────────
function GammaAnimation({ color }) {
  const [stock, setStock] = useState(0);
  // Delta changes with stock move (gamma effect)
  const baseDelta = 0.50;
  const gamma = 0.04;
  const newDelta = Math.min(1, Math.max(0, baseDelta + gamma * stock)).toFixed(3);

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Gamma — Rate of Delta Change</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock moves: <tspan fontWeight="700" fill={stock >= 0 ? "#4ade80" : "#f87171"}>{stock >= 0 ? "+" : ""}${stock}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={-10} max={10} value={stock} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* Delta visual */}
      <text x={280} y={115} textAnchor="middle" fontSize={13} fill="#94a3b8">
        Delta started at <tspan fontWeight="700" fill="#38bdf8">0.50</tspan>
      </text>
      <text x={280} y={138} textAnchor="middle" fontSize={22} fontWeight="700" fill="#a78bfa">
        Delta is now: {newDelta}
      </text>
      <text x={280} y={160} textAnchor="middle" fontSize={11} fill="#64748b">
        Gamma ({gamma}) × stock move ({stock}) = Δdelta ({(gamma * stock).toFixed(3)})
      </text>

      {/* Delta bar */}
      <text x={24} y={192} textAnchor="end" fontSize={9} fill="#475569">Δ 0</text>
      <rect x={30} y={180} width={500} height={18} rx={9} fill="#1a2535" />
      <rect x={30} y={180} width={Math.min(1, Math.max(0, baseDelta + gamma * stock)) * 500} height={18} rx={9} fill="#a78bfa" fillOpacity={0.75} />
      <text x={536} y={192} fontSize={9} fill="#475569">1.0</text>

      <rect x={30} y={218} width={500} height={40} rx={8} fill="#0a0d1a" stroke="#1c2838" />
      <text x={45} y={234} fontSize={10} fill="#94a3b8">⚡ Gamma is highest for ATM options near expiry (0DTE)</text>
      <text x={45} y={250} fontSize={10} fill="#fbbf24">A $1 stock move can shift delta by 0.05-0.15 for high-gamma options</text>
    </svg>
  );
}

// ── 17. GREEKS COMBINED ───────────────────────────────────────────────────────
function GreeksCombinedAnimation({ color }) {
  const t = useAnimTick(10);
  const pulse = 0.85 + 0.15 * Math.sin(t * 0.15);

  const greeks = [
    { name: "Δ Delta",  val: "0.58", desc: "Direction",   col: "#38bdf8", detail: "Price moves $0.58 per $1 stock move", angle: -90 },
    { name: "Θ Theta",  val: "-0.04",desc: "Time Decay",  col: "#fb923c", detail: "Loses $4/day (100 shares × $0.04)", angle: 0 },
    { name: "ν Vega",   val: "0.23", desc: "Volatility",  col: "#a78bfa", detail: "Gains $23 per 1% IV increase", angle: 90 },
    { name: "Γ Gamma",  val: "0.032",desc: "Acceleration", col: "#4ade80", detail: "Delta changes 0.032 per $1 move", angle: 180 },
  ];

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={12} fill="#64748b">The Greeks — Your option's risk dashboard</text>

      {/* Center */}
      <circle cx={280} cy={148} r={40 * pulse} fill="#0b0f1a" stroke={color} strokeWidth={2} />
      <text x={280} y={144} textAnchor="middle" fontSize={10} fill="#64748b">ATM</text>
      <text x={280} y={160} textAnchor="middle" fontSize={9} fill="#475569">Call Option</text>

      {greeks.map((g, i) => {
        const rad = (g.angle - 90) * Math.PI / 180;
        const cx = 280 + 120 * Math.cos(rad);
        const cy = 148 + 120 * Math.sin(rad);
        const lx1 = 280 + 46 * Math.cos(rad), ly1 = 148 + 46 * Math.sin(rad);
        const lx2 = 280 + 100 * Math.cos(rad), ly2 = 148 + 100 * Math.sin(rad);
        return (
          <g key={g.name}>
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={g.col} strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={cx} cy={cy} r={32} fill={g.col + "22"} stroke={g.col} strokeWidth={1.5} />
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={10} fontWeight="700" fill={g.col}>{g.name}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fontWeight="700" fill="#fff">{g.val}</text>
            <text x={cx} y={cy + 20} textAnchor="middle" fontSize={8} fill="#475569">{g.desc}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 18. COVERED CALL ─────────────────────────────────────────────────────────
function CoveredCallAnimation({ color }) {
  const [stock, setStock] = useState(210);
  const entry = 200, strike = 220, premium = 6;
  const stockPnl = stock - entry;
  const callPnl = -Math.max(0, stock - strike);
  const total = stockPnl + callPnl + premium;

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Covered Call — Income from your stock</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock at expiry: <tspan fontWeight="700" fill="#38bdf8">${stock}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={160} max={260} value={stock} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>

      {/* P&L breakdown */}
      {[
        ["100 shares × (Stock − Entry)", `${stockPnl >= 0 ? "+" : ""}$${(stockPnl * 100).toFixed(0)}`, stockPnl >= 0 ? "#4ade80" : "#f87171"],
        ["Short call P&L", `${callPnl >= 0 ? "+" : ""}$${(callPnl * 100).toFixed(0)}`, callPnl >= 0 ? "#4ade80" : "#f87171"],
        ["Premium collected", `+$${(premium * 100).toFixed(0)}`, "#fbbf24"],
        ["Total P&L", `${total >= 0 ? "+" : ""}$${(total * 100).toFixed(0)}`, total >= 0 ? "#4ade80" : "#f87171"],
      ].map(([label, val, col], i) => (
        <g key={label}>
          <text x={30} y={110 + i * 30} fontSize={11} fill="#94a3b8">{label}</text>
          <text x={530} y={110 + i * 30} textAnchor="end" fontSize={12} fontWeight="700" fill={col}>{val}</text>
          {i === 2 && <line x1={30} y1={120 + i * 30 - 5} x2={530} y2={120 + i * 30 - 5} stroke="#1c2838" strokeWidth={1} />}
        </g>
      ))}

      <rect x={30} y={238} width={500} height={28} rx={7} fill={total >= 0 ? "#052e16" : "#3b0000"} />
      <text x={280} y={257} textAnchor="middle" fontSize={12} fontWeight="700" fill={total >= 0 ? "#4ade80" : "#f87171"}>
        {stock >= strike ? `Capped at $${(((strike - entry) + premium) * 100).toFixed(0)} — call assigned` : `Keeping premium + stock gain`}
      </text>
    </svg>
  );
}

// ── 19. PROTECTIVE PUT ────────────────────────────────────────────────────────
function ProtectivePutAnimation({ color }) {
  const [stock, setStock] = useState(210);
  const entry = 210, strike = 200, premium = 5;
  const stockPnl = stock - entry;
  const putPnl = Math.max(0, strike - stock) - premium;
  const total = stockPnl + putPnl;

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Protective Put — Insurance for your stock</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock at expiry: <tspan fontWeight="700" fill="#38bdf8">${stock}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={160} max={260} value={stock} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>
      {[
        ["Stock P&L (100 shares)", `${stockPnl >= 0 ? "+" : ""}$${(stockPnl * 100).toFixed(0)}`, stockPnl >= 0 ? "#4ade80" : "#f87171"],
        ["Put option P&L", `${putPnl >= 0 ? "+" : ""}$${(putPnl * 100).toFixed(0)}`, putPnl >= 0 ? "#4ade80" : "#f87171"],
        ["Total P&L", `${total >= 0 ? "+" : ""}$${(total * 100).toFixed(0)}`, total >= 0 ? "#4ade80" : "#f87171"],
      ].map(([label, val, col], i) => (
        <g key={label}>
          <text x={30} y={115 + i * 34} fontSize={11} fill="#94a3b8">{label}</text>
          <text x={530} y={115 + i * 34} textAnchor="end" fontSize={13} fontWeight="700" fill={col}>{val}</text>
          {i === 1 && <line x1={30} y1={128 + i * 34} x2={530} y2={128 + i * 34} stroke="#1c2838" strokeWidth={1} />}
        </g>
      ))}
      <rect x={30} y={225} width={500} height={36} rx={8} fill={stock < strike ? "#052e1688" : "#0a0d1a"} stroke={stock < strike ? "#4ade80" : "#1c2838"} />
      <text x={280} y={241} textAnchor="middle" fontSize={11} fill={stock < strike ? "#4ade80" : "#94a3b8"} fontWeight="700">
        {stock < strike ? `✓ Put protecting you! Floor loss = $${((-(strike - entry) - premium) * 100).toFixed(0)}` : `Put expires worthless — cost was $${premium * 100} insurance`}
      </text>
      <text x={280} y={256} textAnchor="middle" fontSize={9} fill="#475569">Maximum loss is limited no matter how far stock falls</text>
    </svg>
  );
}

// ── 20. BULL CALL SPREAD ──────────────────────────────────────────────────────
function BullSpreadAnimation({ color }) {
  const [stock, setStock] = useState(210);
  const buyStrike = 205, sellStrike = 220, netDebit = 8;
  const buyPnl = Math.max(0, stock - buyStrike);
  const sellPnl = -Math.max(0, stock - sellStrike);
  const total = buyPnl + sellPnl - netDebit;
  const maxProfit = sellStrike - buyStrike - netDebit;

  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Bull Call Spread — Capped bullish bet</text>
      <text x={30} y={50} fontSize={10} fill="#94a3b8">Stock at expiry: <tspan fontWeight="700" fill="#38bdf8">${stock}</tspan></text>
      <foreignObject x={30} y={55} width={500} height={28}>
        <input type="range" min={180} max={250} value={stock} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>
      {/* Payoff diagram */}
      {(() => {
        const pts = [];
        for (let s = 185; s <= 245; s += 2) {
          const x = 30 + (s - 185) * (500 / 60);
          const p = Math.min(maxProfit, Math.max(-netDebit, Math.max(0, s - buyStrike) - Math.max(0, s - sellStrike) - netDebit));
          const y = 165 - p * 7;
          pts.push(`${x},${y}`);
        }
        const curX = 30 + (stock - 185) * (500 / 60);
        const curP = Math.min(maxProfit, Math.max(-netDebit, buyPnl + sellPnl - netDebit));
        const curY = 165 - curP * 7;
        return (
          <>
            <line x1={30} y1={165} x2={530} y2={165} stroke="#1c2838" strokeWidth={1} />
            <text x={24} y={168} textAnchor="end" fontSize={8} fill="#475569">$0</text>
            <line x1={30 + (buyStrike + netDebit - 185) * (500 / 60)} y1={100} x2={30 + (buyStrike + netDebit - 185) * (500 / 60)} y2={220} stroke="#fbbf24" strokeDasharray="4 3" strokeWidth={1.5} />
            <text x={30 + (buyStrike + netDebit - 185) * (500 / 60)} y={96} textAnchor="middle" fontSize={8} fill="#fbbf24">BE ${buyStrike + netDebit}</text>
            <polyline points={pts.join(" ")} fill="none" stroke="#4ade80" strokeWidth={3} strokeLinecap="round" />
            <circle cx={curX} cy={curY} r={7} fill="#38bdf8" />
            <text x={curX} y={curY - 12} textAnchor="middle" fontSize={9} fill="#38bdf8" fontWeight="700">${curP.toFixed(0)}</text>
          </>
        );
      })()}
      <text x={280} y={240} textAnchor="middle" fontSize={11} fill={total >= 0 ? "#4ade80" : "#f87171"} fontWeight="700">
        P&L: {total >= 0 ? "+" : ""}${total.toFixed(0)} | Max profit: ${maxProfit} | Max loss: ${netDebit}
      </text>
    </svg>
  );
}

// ── 21-36. REMAINING ANIMATIONS (compact) ────────────────────────────────────

function BearSpreadAnimation({ color }) {
  return <SpreadPayoffChart title="Bear Put Spread" type="bearput" color={color} />;
}
function StraddleAnimation({ color }) {
  return <SpreadPayoffChart title="Straddle — Profits from big moves" type="straddle" color={color} />;
}
function IronCondorAnimation({ color }) {
  return <SpreadPayoffChart title="Iron Condor — Range-bound profit" type="ironcondor" color={color} />;
}
function ButterflyAnimation({ color }) {
  return <SpreadPayoffChart title="Butterfly — Pin-point precision" type="butterfly" color={color} />;
}
function CalendarAnimation({ color }) {
  return <TimeDecayComparison color={color} />;
}

// Generic payoff chart for multiple strategies
function SpreadPayoffChart({ title, type, color }) {
  const [stock, setStock] = useState(210);
  const spot = 210;

  const calcPnl = (s) => {
    if (type === "bearput") return Math.min(12, Math.max(-8, Math.max(0, 225 - s) - Math.max(0, 215 - s) - 8));
    if (type === "straddle") return Math.abs(s - spot) - 14;
    if (type === "ironcondor") return Math.min(8, -Math.max(0, s - 225) - Math.max(0, 195 - s) + 8);
    if (type === "butterfly") return Math.max(-5, 10 - Math.abs(s - spot) * 1.2);
    return 0;
  };

  const pts = [];
  for (let s = 175; s <= 245; s += 2) {
    const x = 30 + (s - 175) * (500 / 70);
    const y = 145 - calcPnl(s) * 8;
    pts.push(`${x},${y}`);
  }
  const curX = 30 + (stock - 175) * (500 / 70);
  const curPnl = calcPnl(stock);

  return (
    <svg width="100%" viewBox="0 0 560 250" style={{ maxHeight: 250 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">{title}</text>
      <text x={30} y={45} fontSize={10} fill="#94a3b8">Stock: <tspan fontWeight="700" fill="#38bdf8">${stock}</tspan></text>
      <foreignObject x={30} y={50} width={500} height={28}>
        <input type="range" min={175} max={245} value={stock} onChange={e => setStock(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>
      <line x1={30} y1={145} x2={530} y2={145} stroke="#1c2838" strokeWidth={1} />
      <text x={24} y={148} textAnchor="end" fontSize={8} fill="#475569">$0</text>
      <line x1={30 + (spot - 175) * (500 / 70)} y1={85} x2={30 + (spot - 175) * (500 / 70)} y2={215} stroke="#38bdf8" strokeDasharray="4 3" strokeWidth={1.5} />
      <polyline points={pts.join(" ")} fill="none" stroke={curPnl >= 0 ? "#4ade80" : "#f87171"} strokeWidth={3} strokeLinecap="round" />
      <circle cx={curX} cy={145 - curPnl * 8} r={7} fill="#38bdf8" />
      <text x={curX} y={145 - curPnl * 8 - 12} textAnchor="middle" fontSize={10} fill="#38bdf8" fontWeight="700">${curPnl.toFixed(1)}</text>
      <text x={280} y={235} textAnchor="middle" fontSize={11} fill={curPnl >= 0 ? "#4ade80" : "#f87171"} fontWeight="700">
        Current P&L: {curPnl >= 0 ? "+" : ""}${curPnl.toFixed(1)} per share
      </text>
    </svg>
  );
}

function TimeDecayComparison({ color }) {
  const t = useAnimTick(8);
  const day = t % 31;
  const nearPrem = +(3 * Math.sqrt(Math.max(0, 30 - day) / 30)).toFixed(2);
  const farPrem  = +(8 * Math.sqrt(Math.max(0, 60 - day) / 60)).toFixed(2);
  const profit   = +(farPrem - nearPrem - 2).toFixed(2);

  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={12} fill="#64748b">Calendar Spread — Time Decay Arbitrage</text>
      <text x={280} y={45} textAnchor="middle" fontSize={13} fontWeight="700" fill="#94a3b8">Day {day} / 30</text>
      {[
        ["SELL near-term (30d)", nearPrem, "#f87171", 80],
        ["BUY far-term (60d)", farPrem, "#4ade80", 160],
        ["Net P&L", profit, profit >= 0 ? "#fbbf24" : "#f87171", 240],
      ].map(([label, val, col, y]) => (
        <g key={label}>
          <text x={30} y={y - 5} fontSize={10} fill="#64748b">{label}</text>
          <rect x={30} y={y} width={Math.max(4, val / 8 * 450)} height={22} rx={6} fill={col} fillOpacity={0.7} />
          <text x={30 + Math.max(4, val / 8 * 450) + 8} y={y + 15} fontSize={12} fontWeight="700" fill={col}>${val}</text>
        </g>
      ))}
      <text x={280} y={246} textAnchor="middle" fontSize={10} fill="#475569">Near-term decays faster — that difference is your profit</text>
    </svg>
  );
}

// Remaining stubs — rich enough to be educational
function PositionSizingAnimation({ color }) {
  const [risk, setRisk] = useState(2);
  const capital = 100000;
  const riskAmt = capital * risk / 100;
  const shares = Math.floor(riskAmt / 5); // $5 stop loss per share
  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fill="#64748b">Position Sizing — Never risk more than you should</text>
      <text x={30} y={55} fontSize={10} fill="#94a3b8">Risk per trade: <tspan fontWeight="700" fill={risk > 3 ? "#f87171" : "#4ade80"}>{risk}%</tspan></text>
      <foreignObject x={30} y={60} width={500} height={28}>
        <input type="range" min={0.5} max={10} step={0.5} value={risk} onChange={e => setRisk(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>
      {[
        ["Account Size", "$100,000", "#e2eaf4"],
        ["Risk %", `${risk}%`, risk > 3 ? "#f87171" : "#4ade80"],
        ["Max Risk per Trade", `$${riskAmt.toLocaleString()}`, risk > 3 ? "#f87171" : "#fbbf24"],
        ["Shares (at $5 stop)", shares, "#38bdf8"],
        ["Survive 20 bad trades?", risk <= 2 ? "Yes ✓" : "Risky ⚠️", risk <= 2 ? "#4ade80" : "#f87171"],
      ].map(([l, v, c], i) => (
        <g key={l}>
          <text x={30} y={120 + i * 28} fontSize={11} fill="#64748b">{l}</text>
          <text x={530} y={120 + i * 28} textAnchor="end" fontSize={13} fontWeight="700" fill={c}>{v}</text>
        </g>
      ))}
      <text x={280} y={260} textAnchor="middle" fontSize={10} fill="#475569">Professional traders risk 0.5-2% per trade. Never more than 5%.</text>
    </svg>
  );
}

function StopLossAnimation({ color }) {
  const t = useAnimTick(6);
  const entry = 100, stop = 94, target = 115;
  const stock = entry + 15 * Math.sin(t * 0.05);
  const hit = stock <= stop;
  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fill="#64748b">Stop Loss — Define your exit BEFORE you enter</text>
      {[[target, "#4ade80", "TARGET $115"], [entry, "#38bdf8", "ENTRY $100"], [stop, "#f87171", "STOP LOSS $94"]].map(([v, c, label]) => {
        const y = 60 + (1 - (v - 88) / 34) * 150;
        return (
          <g key={label}>
            <line x1={30} y1={y} x2={530} y2={y} stroke={c} strokeDasharray="6 4" strokeWidth={1.8} />
            <text x={536} y={y + 4} fontSize={9} fill={c} fontWeight="700">{label}</text>
          </g>
        );
      })}
      {/* Moving stock price */}
      {(() => {
        const y = 60 + (1 - (stock - 88) / 34) * 150;
        return (
          <g>
            <circle cx={280} cy={y} r={10} fill={hit ? "#f87171" : "#38bdf8"} />
            <text x={280} y={y + 4} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="700">${stock.toFixed(1)}</text>
          </g>
        );
      })()}
      {hit && <text x={280} y={230} textAnchor="middle" fontSize={14} fontWeight="700" fill="#f87171">🛑 STOP LOSS HIT — Position closed automatically</text>}
      {!hit && <text x={280} y={230} textAnchor="middle" fontSize={11} fill="#94a3b8">R:R Ratio = 1:{((target - entry) / (entry - stop)).toFixed(1)} — always know this before entering</text>}
    </svg>
  );
}

function PsychologyAnimation({ color }) {
  const biases = [
    { name: "Loss Aversion", desc: "Losses feel 2× worse than equal gains feel good", icon: "😰", col: "#f87171" },
    { name: "FOMO", desc: "Fear of missing out — chasing pumped stocks", icon: "🏃", col: "#fb923c" },
    { name: "Overconfidence", desc: "After wins, taking on too much risk", icon: "🤑", col: "#fbbf24" },
    { name: "Confirmation Bias", desc: "Only seeing data that supports your view", icon: "🙈", col: "#a78bfa" },
    { name: "Revenge Trading", desc: "Trying to make back losses immediately", icon: "😤", col: "#f87171" },
  ];
  return (
    <svg width="100%" viewBox="0 0 560 280" style={{ maxHeight: 280 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fill="#64748b">Trading Psychology — Your biggest enemy</text>
      {biases.map((b, i) => (
        <g key={b.name} transform={`translate(20, ${40 + i * 46})`}>
          <rect width={520} height={40} rx={8} fill={b.col + "15"} stroke={b.col + "44"} />
          <text x={16} y={26} fontSize={18}>{b.icon}</text>
          <text x={44} y={16} fontSize={11} fontWeight="700" fill={b.col}>{b.name}</text>
          <text x={44} y={30} fontSize={10} fill="#94a3b8">{b.desc}</text>
        </g>
      ))}
      <text x={280} y={275} textAnchor="middle" fontSize={9} fill="#475569">Solution: journal, rules-based trading, hard stops</text>
    </svg>
  );
}

function JournalAnimation({ color }) {
  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fill="#64748b">Trading Journal — The #1 improvement tool</text>
      <rect x={30} y={38} width={500} height={200} rx={10} fill="#080c14" stroke="#1c2838" />
      {[
        ["📅 Date:", "Jan 15, 2025"],
        ["📈 Ticker:", "AAPL — Bull Call Spread"],
        ["💰 Entry:", "$213.50 | Exit: $221.30"],
        ["🧠 Emotion:", "Calm — Followed my plan"],
        ["⭐ Rating:", "★★★★☆ (4/5)"],
        ["📝 Lesson:", "Entered on RSI pullback, held through dip — works"],
      ].map(([k, v], i) => (
        <g key={k}>
          <text x={50} y={65 + i * 28} fontSize={10} fill="#475569">{k}</text>
          <text x={160} y={65 + i * 28} fontSize={11} fill="#e2eaf4" fontWeight="700">{v}</text>
        </g>
      ))}
      <text x={280} y={252} textAnchor="middle" fontSize={10} fill="#475569">Log every trade → Find patterns → Improve → Repeat</text>
    </svg>
  );
}

function TradingSystemAnimation({ color }) {
  const steps = [
    { label: "SETUP", desc: "RSI < 35 on daily chart", col: "#38bdf8" },
    { label: "ENTRY", desc: "Buy on next green candle open", col: "#4ade80" },
    { label: "TARGET", desc: "Previous resistance level", col: "#fbbf24" },
    { label: "STOP", desc: "Below recent swing low", col: "#f87171" },
    { label: "SIZE", desc: "2% risk rule always", col: "#a78bfa" },
  ];
  return (
    <svg width="100%" viewBox="0 0 560 250" style={{ maxHeight: 250 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fill="#64748b">A Complete Trading System — Rules remove emotion</text>
      {steps.map((s, i) => (
        <g key={s.label} transform={`translate(${30 + i * 102}, 45)`}>
          <rect width={96} height={80} rx={8} fill={s.col + "22"} stroke={s.col + "66"} />
          <text x={48} y={24} textAnchor="middle" fontSize={10} fontWeight="700" fill={s.col}>{s.label}</text>
          <text x={48} y={44} textAnchor="middle" fontSize={9} fill="#94a3b8">{s.desc.split(" ").slice(0, 3).join(" ")}</text>
          <text x={48} y={58} textAnchor="middle" fontSize={9} fill="#94a3b8">{s.desc.split(" ").slice(3).join(" ")}</text>
          {i < steps.length - 1 && <text x={104} y={46} fontSize={16} fill="#475569">→</text>}
        </g>
      ))}
      <text x={280} y={150} textAnchor="middle" fontSize={11} fill="#38bdf8">Backtest this system → Does it have edge? → Go live</text>
      {[
        "✓ Entry defined before market opens",
        "✓ Exit (profit + stop) set before entry",
        "✓ Position size calculated from risk % rule",
      ].map((t, i) => (
        <text key={i} x={30} y={175 + i * 22} fontSize={11} fill="#4ade80">{t}</text>
      ))}
    </svg>
  );
}

function TrendLineAnimation({ color }) {
  const prices = [100, 104, 102, 108, 106, 112, 110, 116, 114, 120, 118, 124, 122, 128];
  const w = 500, h = 160;
  const mn = 97, mx = 132;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * h;
  const sx = i => 30 + i * w / (prices.length - 1);
  const pts = prices.map((v, i) => `${sx(i)},${sc(v)}`).join(" ");
  // Trend line from first low to last low
  const tl1 = sc(100), tl2 = sc(122);
  return (
    <svg width="100%" viewBox="0 0 560 230" style={{ maxHeight: 230 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={13} fill="#64748b">Trend Lines — Connect the lows in an uptrend</text>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={sx(0)} y1={tl1} x2={sx(prices.length - 1)} y2={tl2} stroke="#fbbf24" strokeWidth={2} strokeDasharray="6 4" />
      <text x={sx(prices.length - 1) + 4} y={tl2 + 4} fontSize={9} fill="#fbbf24">Uptrend line</text>
      {[0, 4, 8, 12].map(i => (
        <circle key={i} cx={sx(i)} cy={sc(prices[i])} r={4} fill="#fbbf24" />
      ))}
      <text x={280} y={210} textAnchor="middle" fontSize={10} fill="#94a3b8">Connect higher lows → valid uptrend line. Break below = warning!</text>
    </svg>
  );
}

function ChartPatternsAnimation({ color }) {
  const [pattern, setPattern] = useState("headshoulders");
  const patterns = {
    headshoulders: { label: "Head & Shoulders (Bearish)", prices: [100, 105, 103, 108, 104, 115, 106, 109, 104, 99, 96, 93] },
    doubletop: { label: "Double Top (Bearish)", prices: [100, 108, 112, 108, 100, 108, 112, 107, 100, 95, 90] },
    cuphandle: { label: "Cup & Handle (Bullish)", prices: [110, 105, 100, 97, 95, 97, 101, 105, 110, 107, 108, 109, 112, 116] },
  };
  const p = patterns[pattern];
  const mn = Math.min(...p.prices) - 3, mx = Math.max(...p.prices) + 3;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * 160;
  const sx = i => 30 + i * 500 / (p.prices.length - 1);
  const pts = p.prices.map((v, i) => `${sx(i)},${sc(v)}`).join(" ");

  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={22} textAnchor="middle" fontSize={11} fill="#64748b">{p.label}</text>
      <g transform="translate(0, 8)">
        {["headshoulders", "doubletop", "cuphandle"].map((k, i) => (
          <g key={k} onClick={() => setPattern(k)} style={{ cursor: "pointer" }}>
            <rect x={20 + i * 175} y={28} width={162} height={22} rx={6} fill={pattern === k ? color + "33" : "#0b0f1a"} stroke={pattern === k ? color : "#1c2838"} />
            <text x={101 + i * 175} y={43} textAnchor="middle" fontSize={9} fontWeight={pattern === k ? "700" : "400"} fill={pattern === k ? color : "#475569"}>
              {k === "headshoulders" ? "H&S" : k === "doubletop" ? "Double Top" : "Cup & Handle"}
            </text>
          </g>
        ))}
      </g>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" transform="translate(0, 20)" />
      <text x={280} y={245} textAnchor="middle" fontSize={9} fill="#475569">
        {pattern === "headshoulders" ? "Neckline break = sell signal" : pattern === "doubletop" ? "Failed second high = reversal" : "Handle breakout = buy signal"}
      </text>
    </svg>
  );
}

function MovingAverageAnimation({ color }) {
  const t = useAnimTick(8);
  const base = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5 + Math.sin(i * 0.8) * 5);
  const sma20 = base.map((_, i) => i < 19 ? null : base.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20);
  const mn = 95, mx = 125;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * 160;
  const sx = i => 30 + i * 500 / 29;
  const pricePts = base.map((v, i) => `${sx(i)},${sc(v)}`).join(" ");
  const smaPts = sma20.map((v, i) => v ? `${sx(i)},${sc(v)}` : null).filter(Boolean).join(" ");
  return (
    <svg width="100%" viewBox="0 0 560 240" style={{ maxHeight: 240 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={13} fill="#64748b">Moving Averages — Smooth out the noise</text>
      <polyline points={pricePts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <polyline points={smaPts} fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={530} y1={140} x2={540} y2={140} stroke={color} strokeWidth={2} />
      <text x={542} y={144} fontSize={9} fill={color}>Price</text>
      <line x1={530} y1={156} x2={540} y2={156} stroke="#fbbf24" strokeWidth={2} />
      <text x={542} y={160} fontSize={9} fill="#fbbf24">SMA 20</text>
      <text x={280} y={220} textAnchor="middle" fontSize={10} fill="#94a3b8">When price crosses above SMA → bullish. Below → bearish.</text>
    </svg>
  );
}

function RSIMACDAnimation({ color }) {
  const [indicator, setIndicator] = useState("rsi");
  const rsiVals = [28, 35, 42, 38, 55, 62, 71, 65, 58, 52, 45, 40, 32, 29, 35, 48, 56, 65, 72, 68];
  const macdVals = [-0.5, -0.3, 0.1, 0.4, 0.8, 0.6, 0.3, -0.1, -0.4, -0.6, -0.3, 0.1, 0.5, 0.9, 0.7, 0.4, 0.1, -0.2, -0.5, -0.3];
  const vals = indicator === "rsi" ? rsiVals : macdVals;
  const mn = Math.min(...vals) - 5, mx = Math.max(...vals) + 5;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * 160;
  const sx = i => 30 + i * 500 / (vals.length - 1);
  const pts = vals.map((v, i) => `${sx(i)},${sc(v)}`).join(" ");
  const mid = indicator === "rsi" ? 50 : 0;
  const ob  = indicator === "rsi" ? 70 : null;
  const os  = indicator === "rsi" ? 30 : null;

  return (
    <svg width="100%" viewBox="0 0 560 250" style={{ maxHeight: 250 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={11} fill="#64748b">{indicator === "rsi" ? "RSI — Momentum Oscillator (0-100)" : "MACD — Trend + Momentum"}</text>
      {[["rsi", "RSI"], ["macd", "MACD"]].map(([k, l], i) => (
        <g key={k} onClick={() => setIndicator(k)} style={{ cursor: "pointer" }}>
          <rect x={180 + i * 110} y={28} width={100} height={22} rx={6} fill={indicator === k ? color + "33" : "#0b0f1a"} stroke={indicator === k ? color : "#1c2838"} />
          <text x={230 + i * 110} y={43} textAnchor="middle" fontSize={11} fontWeight={indicator === k ? "700" : "400"} fill={indicator === k ? color : "#475569"}>{l}</text>
        </g>
      ))}
      <line x1={30} y1={sc(mid)} x2={530} y2={sc(mid)} stroke="#1c2838" strokeWidth={1.5} />
      {ob && <line x1={30} y1={sc(ob)} x2={530} y2={sc(ob)} stroke="#f87171" strokeDasharray="5 4" strokeWidth={1} />}
      {os && <line x1={30} y1={sc(os)} x2={530} y2={sc(os)} stroke="#4ade80" strokeDasharray="5 4" strokeWidth={1} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {ob && <text x={536} y={sc(ob) + 4} fontSize={8} fill="#f87171">OB {ob}</text>}
      {os && <text x={536} y={sc(os) + 4} fontSize={8} fill="#4ade80">OS {os}</text>}
      <text x={280} y={238} textAnchor="middle" fontSize={10} fill="#94a3b8">
        {indicator === "rsi" ? "Above 70 = overbought, below 30 = oversold — look for reversals" : "MACD cross above signal line = bullish momentum"}
      </text>
    </svg>
  );
}

function BollingerAnimation({ color }) {
  const [iv2, setIv2] = useState(2);
  const base = Array.from({ length: 25 }, (_, i) => 100 + Math.sin(i * 0.4) * 8 + Math.sin(i * 0.8) * 4);
  const sma = base.map((_, i) => i < 19 ? null : base.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20);
  const bands = sma.map((m, i) => {
    if (!m) return null;
    const sl = base.slice(Math.max(0, i - 19), i + 1);
    const std = Math.sqrt(sl.reduce((s, v) => s + Math.pow(v - m, 2), 0) / sl.length);
    return { upper: m + iv2 * std, lower: m - iv2 * std, mid: m };
  });
  const mn = 85, mx = 120;
  const sc = v => 30 + (1 - (v - mn) / (mx - mn)) * 160;
  const sx = i => 30 + i * 500 / 24;
  const pPts = base.map((v, i) => `${sx(i)},${sc(v)}`).join(" ");
  const uPts = bands.map((b, i) => b ? `${sx(i)},${sc(b.upper)}` : null).filter(Boolean).join(" ");
  const lPts = bands.map((b, i) => b ? `${sx(i)},${sc(b.lower)}` : null).filter(Boolean).join(" ");
  const mPts = bands.map((b, i) => b ? `${sx(i)},${sc(b.mid)}` : null).filter(Boolean).join(" ");

  return (
    <svg width="100%" viewBox="0 0 560 250" style={{ maxHeight: 250 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={13} fill="#64748b">Bollinger Bands — Volatility Envelope</text>
      <text x={30} y={45} fontSize={10} fill="#94a3b8">Band width: <tspan fontWeight="700" fill={color}>{iv2}σ</tspan></text>
      <foreignObject x={30} y={50} width={500} height={28}>
        <input type="range" min={1} max={3} step={0.5} value={iv2} onChange={e => setIv2(+e.target.value)} style={{ width: "100%" }} />
      </foreignObject>
      <polyline points={uPts} fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="5 3" />
      <polyline points={lPts} fill="none" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="5 3" />
      <polyline points={mPts} fill="none" stroke="#a78bfa" strokeWidth={2} />
      <polyline points={pPts} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <text x={280} y={235} textAnchor="middle" fontSize={10} fill="#94a3b8">
        Squeeze = low volatility → breakout coming. Touch lower band = potential buy.
      </text>
    </svg>
  );
}

function VolumeAnimation({ color }) {
  const t = useAnimTick(6);
  const bars = [
    { p: 100, v: 2, bull: true }, { p: 103, v: 3, bull: true }, { p: 101, v: 1.5, bull: false },
    { p: 105, v: 8, bull: true }, { p: 108, v: 6, bull: true }, { p: 106, v: 2, bull: false },
    { p: 112, v: 11, bull: true }, { p: 110, v: 3, bull: false }, { p: 115, v: 9, bull: true },
  ];
  const maxVol = 12;
  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={13} fill="#64748b">Volume Analysis — Conviction behind price</text>
      {bars.map((b, i) => {
        const cx = 50 + i * 54;
        const ph = (1 - (b.p - 95) / 25) * 140;
        const vh = (b.v / maxVol) * 60;
        return (
          <g key={i}>
            {/* Price bar */}
            <rect x={cx - 18} y={30 + ph - 12} width={36} height={16} rx={3} fill={b.bull ? "#4ade80" : "#f87171"} fillOpacity={0.8} />
            <text x={cx} y={30 + ph - 1} textAnchor="middle" fontSize={8} fill="#fff">${b.p}</text>
            {/* Volume bar */}
            <rect x={cx - 16} y={210 - vh} width={32} height={vh} rx={3} fill={b.bull ? "#4ade80" : "#f87171"} fillOpacity={0.5} />
            <text x={cx} y={218} textAnchor="middle" fontSize={8} fill="#475569">{b.v}M</text>
            {/* High volume highlight */}
            {b.v >= 8 && <text x={cx} y={202 - vh} textAnchor="middle" fontSize={10}>⬆️</text>}
          </g>
        );
      })}
      <line x1={30} y1={205} x2={530} y2={205} stroke="#1c2838" strokeWidth={1} />
      <text x={280} y={255} textAnchor="middle" fontSize={10} fill="#94a3b8">
        High volume on breakout = real move ✓ | Low volume = potentially fake ⚠️
      </text>
    </svg>
  );
}

function ChainAnimation({ color }) {
  const rows = [
    { strike: 200, bid: 14.2, ask: 14.8, iv: 28, delta: 0.82, itm: true },
    { strike: 205, bid: 10.1, ask: 10.5, iv: 26, delta: 0.70, itm: true },
    { strike: 210, bid: 6.8,  ask: 7.1,  iv: 25, delta: 0.52, itm: false, atm: true },
    { strike: 215, bid: 4.0,  ask: 4.2,  iv: 26, delta: 0.35, itm: false },
    { strike: 220, bid: 2.1,  ask: 2.3,  iv: 28, delta: 0.20, itm: false },
    { strike: 225, bid: 1.0,  ask: 1.1,  iv: 31, delta: 0.10, itm: false },
  ];
  return (
    <svg width="100%" viewBox="0 0 560 270" style={{ maxHeight: 270 }}>
      <text x={280} y={20} textAnchor="middle" fontSize={13} fill="#64748b">Options Chain — Your trading command center</text>
      <rect x={20} y={30} width={520} height={22} rx={4} fill="#0b0f1a" />
      {["Strike", "Bid", "Ask", "IV%", "Delta", "Status"].map((h, i) => (
        <text key={h} x={40 + i * 86} y={45} fontSize={9} fill="#64748b" fontWeight="700">{h}</text>
      ))}
      {rows.map((r, i) => (
        <g key={r.strike}>
          <rect x={20} y={56 + i * 30} width={520} height={28} rx={4}
            fill={r.atm ? "#0f2a4022" : r.itm ? "#052e1622" : "transparent"}
            stroke={r.atm ? "#38bdf8" : "transparent"} />
          <text x={40} y={75 + i * 30} fontSize={10} fontWeight={r.atm ? "700" : "400"} fill={r.atm ? "#38bdf8" : "#e2eaf4"}>${r.strike}</text>
          <text x={126} y={75 + i * 30} fontSize={10} fill="#f87171">{r.bid}</text>
          <text x={212} y={75 + i * 30} fontSize={10} fill="#4ade80">{r.ask}</text>
          <text x={298} y={75 + i * 30} fontSize={10} fill="#fbbf24">{r.iv}%</text>
          <text x={384} y={75 + i * 30} fontSize={10} fill="#a78bfa">{r.delta}</text>
          <text x={470} y={75 + i * 30} fontSize={9} fontWeight="700"
            fill={r.atm ? "#38bdf8" : r.itm ? "#4ade80" : "#475569"}>
            {r.atm ? "ATM" : r.itm ? "ITM" : "OTM"}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Default fallback
function DefaultLessonAnimation({ lessonId, color }) {
  return (
    <svg width="100%" viewBox="0 0 560 260" style={{ maxHeight: 260 }}>
      <text x={280} y={140} textAnchor="middle" fontSize={14} fill="#475569">Interactive lesson: {lessonId}</text>
    </svg>
  );
}
// ── LEARN PAGE (Full Academy) ─────────────────────────────────────────────────
function LearnPage({ userProfile }){
  const profile = userProfile ? (PROFILES[userProfile.profile] || PROFILES.intermediate) : PROFILES.intermediate;
  const [view, setView] = useState("home");
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completed, setCompleted] = useState({});
  const [xp, setXp] = useState(0);
  const [quizState, setQuizState] = useState({active:false,qIdx:0,score:0,answered:null,done:false,questions:[]});
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCat, setGlossaryCat] = useState("All");
  const [aiExplain, setAiExplain] = useState({loading:false,topic:"",result:""});
  const [streak] = useState(3);
  const card = {background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:16};

  const totalLessons = ACADEMY_COURSES.reduce((a,c)=>a+c.totalLessons,0);
  const completedCount = Object.keys(completed).length;
  const totalXP = ACADEMY_COURSES.reduce((a,c)=>a+c.xp,0);

  const markComplete = (lessonId, courseXp) => {
    if(!completed[lessonId]){
      setCompleted(p=>({...p,[lessonId]:true}));
      const earnedXP = Math.round(courseXp / ACADEMY_COURSES.find(c=>c.lessons.some(l=>l.id===lessonId))?.totalLessons || 50);
      setXp(p=>p+earnedXP);
    }
  };

  const explainWithAI = async(topic) => {
    setAiExplain({loading:true,topic,result:""});
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:"You are a friendly, encouraging trading tutor for complete beginners. Explain concepts simply, use relatable analogies, avoid jargon. Keep responses under 200 words. Use plain text with line breaks. End with one Key Takeaway.",messages:[{role:"user",content:`Explain "${topic}" in simple terms for a complete beginner to trading. Use a real-world analogy if possible.`}]})});
      const d=await res.json();
      setAiExplain({loading:false,topic,result:d.content?.[0]?.text||"Could not get explanation."});
    }catch(e){setAiExplain({loading:false,topic,result:"AI explanation unavailable."});}
  };

  const startQuiz = (questions) => {
    const shuffled = [...questions].sort(()=>Math.random()-0.5).slice(0,10);
    setQuizState({active:true,qIdx:0,score:0,answered:null,done:false,questions:shuffled});
  };
  const answerQuiz = (idx) => {
    if(quizState.answered!==null) return;
    const correct = idx===quizState.questions[quizState.qIdx].ans;
    setQuizState(s=>({...s,answered:idx,score:s.score+(correct?1:0)}));
  };
  const nextQuiz = () => {
    const next=quizState.qIdx+1;
    if(next>=quizState.questions.length) setQuizState(s=>({...s,done:true}));
    else setQuizState(s=>({...s,qIdx:next,answered:null}));
  };

  const glossaryCats = ["All",...[...new Set(ALL_GLOSSARY.map(g=>g.cat))]];
  const filteredGlossary = ALL_GLOSSARY.filter(g=>
    (glossaryCat==="All"||g.cat===glossaryCat) &&
    (g.term.toLowerCase().includes(glossarySearch.toLowerCase())||g.def.toLowerCase().includes(glossarySearch.toLowerCase()))
  );

  const NAV_ITEMS = [
    {id:"home",label:"Home",emoji:"🏠"},
    {id:"courses",label:"Courses",emoji:"📚"},
    {id:"quiz",label:"Quiz",emoji:"🧠"},
    {id:"glossary",label:"Glossary",emoji:"📖"},
    {id:"ai_tutor",label:"AI Tutor",emoji:"🤖"},
  ];

  // ── LESSON VIEW ──
  if(view==="lesson" && activeCourse && activeLesson){
    const course = ACADEMY_COURSES.find(c=>c.id===activeCourse);
    const lesson = course?.lessons.find(l=>l.id===activeLesson);
    if(!lesson||!course) return null;
    const lessonIdx = course.lessons.indexOf(lesson);
    const nextLesson = course.lessons[lessonIdx+1];
    const prevLesson = course.lessons[lessonIdx-1];
    const isDone = completed[lesson.id];

    return(
      <div>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>setView("home")} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0}}>🎓 Academy</button>
          <span style={{color:C.border}}>›</span>
          <button onClick={()=>{setView("course");}} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0}}>{course.emoji} {course.title}</button>
          <span style={{color:C.border}}>›</span>
          <span style={{color:C.text,fontSize:12}}>{lesson.title}</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,alignItems:"start"}} className="main-grid-2">
          <div>
            {/* Interactive Lesson Player */}
            <LessonPlayer
              lesson={lesson}
              courseColor={course.color}
              isDone={isDone}
              onComplete={()=>markComplete(lesson.id, course.xp)}
            />

            {/* Key Takeaways */}
            <div style={{...card,marginBottom:12}}>
              <div style={{fontSize:9,color:course.color,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>📝 LESSON SUMMARY</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7,marginBottom:14}}>{lesson.summary}</div>
              <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:8}}>KEY POINTS</div>
              {lesson.keyPoints.map((pt,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                  <span style={{color:course.color,flexShrink:0,fontSize:14,marginTop:1}}>→</span>
                  <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{pt}</div>
                </div>
              ))}
            </div>

            {/* Analogy */}
            <div style={{...card,background:"#0a0d1a",border:"1px solid "+course.color+"33",marginBottom:12}}>
              <div style={{fontSize:9,color:course.color,fontWeight:700,letterSpacing:"0.1em",marginBottom:6}}>💡 ANALOGY</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7,fontStyle:"italic"}}>"{lesson.analogy}"</div>
            </div>

            {/* Lesson Quiz */}
            <div style={{...card,border:"1px solid "+C.purple+"44",marginBottom:12}}>
              <div style={{fontSize:9,color:C.purple,fontWeight:700,letterSpacing:"0.1em",marginBottom:12}}>🧠 KNOWLEDGE CHECK</div>
              <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>{lesson.quiz.q}</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {lesson.quiz.opts.map((opt,i)=>{
                  const isCorrect=i===lesson.quiz.ans;
                  const isSelected=quizState.answered===i&&quizState.questions.length===0;
                  return(
                    <button key={i} style={{padding:"10px 14px",background:C.card2,border:"1px solid "+C.border,borderRadius:8,cursor:"pointer",fontSize:12,color:C.dim,fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}
                      onMouseEnter={e=>{e.target.style.borderColor=C.purple;e.target.style.color=C.text;}}
                      onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.dim;}}
                      onClick={()=>{
                        if(!completed["quiz_"+lesson.id]){
                          setCompleted(p=>({...p,["quiz_"+lesson.id]:isCorrect}));
                        }
                      }}>
                      {String.fromCharCode(65+i)}. {opt}
                    </button>
                  );
                })}
              </div>
              {completed["quiz_"+lesson.id]!==undefined&&(
                <div style={{marginTop:10,padding:"10px 12px",background:completed["quiz_"+lesson.id]?"#052e16":"#1c0a0a",borderRadius:8,border:"1px solid "+(completed["quiz_"+lesson.id]?C.green:C.red)+"44"}}>
                  <div style={{fontSize:11,fontWeight:700,color:completed["quiz_"+lesson.id]?C.green:C.red,marginBottom:4}}>{completed["quiz_"+lesson.id]?"✅ Correct!":"Review the answer:"}</div>
                  <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{lesson.quiz.exp}</div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{display:"flex",gap:10}}>
              {prevLesson&&<button onClick={()=>setActiveLesson(prevLesson.id)} style={{flex:1,padding:"11px",background:"#1a2535",color:C.dim,border:"1px solid "+C.border,borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>← {prevLesson.title}</button>}
              {!isDone&&<button onClick={()=>{markComplete(lesson.id,course.xp);}} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#14532d,#166534)",color:C.green,border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit"}}>✓ Mark Complete & Earn XP</button>}
              {isDone&&<div style={{flex:1,padding:"11px",background:"#052e16",color:C.green,borderRadius:8,textAlign:"center",fontSize:12,fontWeight:700}}>✓ Completed</div>}
              {nextLesson&&<button onClick={()=>{setActiveLesson(nextLesson.id);}} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#0369a1,#0ea5e9)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>Next: {nextLesson.title} →</button>}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Course progress */}
            <div style={card}>
              <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>COURSE PROGRESS</div>
              {course.lessons.map((l,i)=>{
                const isDoneL=completed[l.id];
                const isActive=l.id===activeLesson;
                return(
                  <div key={l.id} onClick={()=>setActiveLesson(l.id)} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 10px",borderRadius:8,cursor:"pointer",background:isActive?"rgba(56,189,248,0.08)":"transparent",border:"1px solid "+(isActive?C.blue+"44":"transparent"),marginBottom:4,transition:"all .15s"}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:isDoneL?course.color:"#1a2535",border:"2px solid "+(isDoneL?course.color:isActive?C.blue:C.border),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {isDoneL?<span style={{fontSize:10,color:"#000"}}>✓</span>:<span style={{fontSize:9,color:isActive?C.blue:C.dim}}>{i+1}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:isActive?700:400,color:isActive?C.blue:isDoneL?C.green:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</div>
                      <div style={{fontSize:9,color:C.dim}}>{l.duration}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* AI Explain */}
            <div style={card}>
              <div style={{fontSize:9,color:C.purple,fontWeight:700,letterSpacing:"0.1em",marginBottom:8}}>🤖 AI TUTOR</div>
              <button onClick={()=>explainWithAI(lesson.title)} disabled={aiExplain.loading} style={{width:"100%",padding:"10px",background:"rgba(168,85,247,0.15)",color:C.purple,border:"1px solid "+C.purple+"44",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit",marginBottom:aiExplain.result?8:0}}>
                {aiExplain.loading&&aiExplain.topic===lesson.title?"Thinking…":"✨ Explain this lesson"}
              </button>
              {aiExplain.result&&aiExplain.topic===lesson.title&&(
                <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto"}}>{aiExplain.result}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── COURSE VIEW ──
  if(view==="course" && activeCourse){
    const course = ACADEMY_COURSES.find(c=>c.id===activeCourse);
    if(!course) return null;
    const courseDone = course.lessons.filter(l=>completed[l.id]).length;
    const courseProgress = Math.round(courseDone/course.lessons.length*100);
    return(
      <div>
        <button onClick={()=>setView("courses")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0,marginBottom:16}}>
          ← Back to Courses
        </button>
        <div style={{...card,background:course.darkBg,border:"1px solid "+course.color+"44",marginBottom:20,padding:24}}>
          <div style={{fontSize:28,marginBottom:8}}>{course.emoji}</div>
          <div style={{fontSize:22,fontWeight:700,color:course.color,marginBottom:6}}>{course.title}</div>
          <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:14}}>{course.desc}</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:11,color:"#94a3b8",marginBottom:14}}>
            <span>📚 {course.totalLessons} lessons</span>
            <span>⭐ {course.xp} XP</span>
            <span>🎯 {course.level}</span>
            <span>✅ {courseDone}/{course.lessons.length} completed</span>
          </div>
          <div style={{background:"#1a2535",borderRadius:4,height:6,maxWidth:300}}>
            <div style={{height:6,borderRadius:4,background:course.color,width:courseProgress+"%",transition:"width .5s"}}/>
          </div>
          <div style={{fontSize:10,color:course.color,marginTop:4}}>{courseProgress}% complete</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {course.lessons.map((lesson,i)=>{
            const isDone=completed[lesson.id];
            return(
              <div key={lesson.id} onClick={()=>{setActiveLesson(lesson.id);setView("lesson");}} style={{...card,cursor:"pointer",transition:"all .15s",display:"flex",gap:14,alignItems:"center"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=course.color+"66";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:isDone?course.color+"22":"#1a2535",border:"2px solid "+(isDone?course.color:C.border),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {isDone?<span style={{fontSize:16,color:course.color}}>✓</span>:<span style={{fontSize:14,color:C.dim}}>{i+1}</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:3,color:isDone?course.color:C.text}}>{lesson.title}</div>
                  <div style={{fontSize:11,color:C.dim,lineHeight:1.5}}>{lesson.summary.slice(0,80)}…</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:10,color:C.dim,marginBottom:4}}>▶ {lesson.duration}</div>
                  {isDone&&<Badge bg={course.color+"22"} color={course.color} size={9}>Done</Badge>}
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={()=>{setActiveLesson(course.lessons[0].id);setView("lesson");}} style={{width:"100%",marginTop:16,padding:"13px",background:`linear-gradient(135deg,${course.color}33,${course.color}22)`,color:course.color,border:"1px solid "+course.color+"44",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
          {courseDone===0?"Start Course →":courseDone===course.totalLessons?"Review Course →":"Continue Course →"}
        </button>
      </div>
    );
  }

  // ── QUIZ VIEW ──
  if(view==="quiz"){
    return(
      <div>
        <button onClick={()=>setView("home")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0,marginBottom:16}}>← Back</button>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>🧠 Knowledge Quiz</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:16}}>Test everything you've learned — {ALL_QUIZ_QUESTIONS.length} questions across all courses</div>
        {!quizState.active&&!quizState.done&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:16}} className="main-grid-2">
            {[{label:"Quick Quiz",desc:"10 random questions",n:10,icon:"⚡"},{label:"Full Exam",desc:"All "+ALL_QUIZ_QUESTIONS.length+" questions",n:ALL_QUIZ_QUESTIONS.length,icon:"🎓"}].map(opt=>(
              <div key={opt.label} onClick={()=>startQuiz(ALL_QUIZ_QUESTIONS.slice(0,opt.n))} style={{...card,cursor:"pointer",textAlign:"center",padding:24}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                <div style={{fontSize:36,marginBottom:8}}>{opt.icon}</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{opt.label}</div>
                <div style={{fontSize:11,color:C.dim}}>{opt.desc}</div>
              </div>
            ))}
            {ACADEMY_COURSES.map(course=>{
              const courseQ = ALL_QUIZ_QUESTIONS.filter(q=>q.courseTitle===course.title);
              return(
                <div key={course.id} onClick={()=>startQuiz(courseQ)} style={{...card,cursor:"pointer",display:"flex",gap:12,alignItems:"center"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=course.color;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                  <span style={{fontSize:22}}>{course.emoji}</span>
                  <div><div style={{fontSize:12,fontWeight:700,color:course.color}}>{course.title}</div><div style={{fontSize:10,color:C.dim}}>{courseQ.length} questions</div></div>
                </div>
              );
            })}
          </div>
        )}
        {quizState.active&&!quizState.done&&(()=>{
          const q=quizState.questions[quizState.qIdx];
          return(
            <div style={{maxWidth:640,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,alignItems:"center"}}>
                <div style={{fontSize:10,color:C.dim}}>Question {quizState.qIdx+1} / {quizState.questions.length}</div>
                <div style={{fontSize:11,color:C.green}}>Score: {quizState.score}</div>
              </div>
              <div style={{height:4,background:"#1a2535",borderRadius:2,marginBottom:16}}>
                <div style={{height:4,borderRadius:2,background:C.blue,width:(quizState.qIdx/quizState.questions.length*100)+"%",transition:"width .3s"}}/>
              </div>
              <div style={{fontSize:10,color:C.dim,marginBottom:8}}>{q.courseTitle} › {q.lessonTitle}</div>
              <div style={{...card,marginBottom:10}}><div style={{fontSize:14,fontWeight:700,color:C.text,lineHeight:1.6}}>{q.q}</div></div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {q.opts.map((opt,i)=>{
                  const isAnswered=quizState.answered!==null;
                  const isCorrect=i===q.ans;
                  const isSelected=quizState.answered===i;
                  let bg=C.card,border=C.border,col=C.text;
                  if(isAnswered){if(isCorrect){bg="#052e16";border=C.green;col=C.green;}else if(isSelected){bg="#3b0000";border=C.red;col=C.red;}}
                  return(
                    <button key={i} onClick={()=>answerQuiz(i)} style={{padding:"12px 16px",background:bg,border:"1px solid "+border,borderRadius:8,cursor:isAnswered?"default":"pointer",fontSize:12,color:col,fontFamily:"inherit",textAlign:"left",transition:"all .2s"}}>
                      {String.fromCharCode(65+i)}. {opt}
                    </button>
                  );
                })}
              </div>
              {quizState.answered!==null&&(
                <div style={{...card,background:quizState.answered===q.ans?"#052e16":"#1c0a0a",border:"1px solid "+(quizState.answered===q.ans?C.green:C.red)+"44",marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:quizState.answered===q.ans?C.green:C.red,marginBottom:4}}>{quizState.answered===q.ans?"✅ Correct!":"❌ Not quite"}</div>
                  <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{q.exp}</div>
                </div>
              )}
              {quizState.answered!==null&&<button onClick={nextQuiz} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0369a1,#0ea5e9)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit"}}>{quizState.qIdx+1<quizState.questions.length?"Next Question →":"See Results"}</button>}
            </div>
          );
        })()}
        {quizState.done&&(
          <div style={{...card,textAlign:"center",padding:40,maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:48,marginBottom:12}}>{quizState.score>=quizState.questions.length*0.8?"🏆":quizState.score>=quizState.questions.length*0.6?"⭐":"📚"}</div>
            <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>Quiz Complete!</div>
            <div style={{fontSize:36,fontWeight:700,color:quizState.score>=quizState.questions.length*0.8?C.green:quizState.score>=quizState.questions.length*0.6?C.yellow:C.red,marginBottom:8}}>
              {quizState.score}/{quizState.questions.length}
            </div>
            <div style={{fontSize:14,color:C.dim,marginBottom:20}}>
              {quizState.score>=quizState.questions.length*0.8?"Excellent! You've mastered this material.":quizState.score>=quizState.questions.length*0.6?"Good job! A bit more study and you'll ace it.":"Keep learning — the Academy courses will help!"}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>startQuiz(ALL_QUIZ_QUESTIONS)} style={{padding:"11px 24px",background:"linear-gradient(135deg,#0369a1,#0ea5e9)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit"}}>Retry</button>
              <button onClick={()=>setView("courses")} style={{padding:"11px 24px",background:"#1a2535",color:C.blue,border:"1px solid "+C.blue+"44",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit"}}>Study Courses</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── GLOSSARY VIEW ──
  if(view==="glossary"){
    return(
      <div>
        <button onClick={()=>setView("home")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0,marginBottom:16}}>← Back</button>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>📖 Trading Glossary</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:12}}>{ALL_GLOSSARY.length} terms defined in plain English</div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <input value={glossarySearch} onChange={e=>setGlossarySearch(e.target.value)} placeholder="Search terms…" style={{flex:1,background:"#080c14",border:"1px solid "+C.border,borderRadius:8,padding:"9px 13px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit",minWidth:180}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {glossaryCats.map(cat=>(
              <button key={cat} onClick={()=>setGlossaryCat(cat)} style={{padding:"8px 12px",background:glossaryCat===cat?"rgba(56,189,248,0.15)":C.card,border:"1px solid "+(glossaryCat===cat?C.blue:C.border),borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,color:glossaryCat===cat?C.blue:C.dim,fontFamily:"inherit"}}>{cat}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}} className="main-grid-2">
          {filteredGlossary.map(g=>(
            <div key={g.term} style={{...card,display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:700,color:C.blue}}>{g.term}</span>
                  <Badge bg="#0f1422" color={C.dim} size={8}>{g.cat}</Badge>
                </div>
                <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{g.def}</div>
              </div>
              <button onClick={()=>{explainWithAI(g.term);setView("ai_tutor");}} style={{flexShrink:0,padding:"4px 8px",background:"rgba(168,85,247,0.1)",color:C.purple,border:"1px solid "+C.purple+"22",borderRadius:5,cursor:"pointer",fontSize:9,fontFamily:"inherit"}} title="AI Explain">🤖</button>
            </div>
          ))}
          {filteredGlossary.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:C.muted,padding:"32px 0",fontSize:12}}>No terms match "{glossarySearch}"</div>}
        </div>
      </div>
    );
  }

  // ── AI TUTOR VIEW ──
  if(view==="ai_tutor"){
    return(
      <div>
        <button onClick={()=>setView("home")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0,marginBottom:16}}>← Back</button>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>🤖 AI Tutor</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:16}}>Ask anything about trading — explained simply for beginners</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:16,alignItems:"start"}} className="main-grid-2">
          <div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input value={aiExplain.topic} onChange={e=>setAiExplain(s=>({...s,topic:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&explainWithAI(aiExplain.topic)} placeholder="e.g. What is a covered call?" style={{flex:1,background:"#080c14",border:"1px solid "+C.border,borderRadius:8,padding:"11px 14px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={()=>explainWithAI(aiExplain.topic)} disabled={aiExplain.loading||!aiExplain.topic.trim()} style={{padding:"11px 20px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",opacity:aiExplain.loading||!aiExplain.topic.trim()?0.5:1}}>
                {aiExplain.loading?"…":"Ask"}
              </button>
            </div>
            {aiExplain.result?(
              <div style={{...card,border:"1px solid "+C.purple+"44",background:"#0a0d1a"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:18}}>🤖</span>
                  <div style={{fontSize:9,color:C.purple,fontWeight:700}}>CLAUDE EXPLAINS: {aiExplain.topic.toUpperCase()}</div>
                </div>
                <div style={{fontSize:13,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{aiExplain.result}</div>
              </div>
            ):(
              <div style={{...card,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,gap:8}}>
                <div style={{fontSize:40}}>💬</div>
                <div style={{fontSize:13,color:C.dim}}>Type a question or pick a topic →</div>
              </div>
            )}
          </div>
          <div style={card}>
            <div style={{fontSize:9,color:C.dim,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>POPULAR TOPICS</div>
            {["What is a stock?","How do options work?","What is IV crush?","Explain Delta simply","What is the VIX?","How to read candlesticks?","What is paper trading?","Explain Bull Call Spread","When to use Iron Condor?","What is a stop loss?","How does theta decay work?","What is the risk/reward ratio?"].map(topic=>(
              <button key={topic} onClick={()=>explainWithAI(topic)} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",background:"#080c14",border:"1px solid "+C.border,borderRadius:6,cursor:"pointer",fontSize:11,color:C.dim,fontFamily:"inherit",marginBottom:5,transition:"all .15s"}} onMouseEnter={e=>{e.target.style.borderColor=C.purple;e.target.style.color=C.text;}} onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.dim;}}>
                💡 {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── COURSES VIEW ──
  if(view==="courses"){
    return(
      <div>
        <button onClick={()=>setView("home")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:12,fontFamily:"inherit",padding:0,marginBottom:16}}>← Back</button>
        <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>📚 All Courses</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:16}}>{ACADEMY_COURSES.length} courses · {totalLessons} lessons · {totalXP} XP</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}} className="main-grid-2">
          {ACADEMY_COURSES.map(course=>{
            const done=course.lessons.filter(l=>completed[l.id]).length;
            const pct=Math.round(done/course.lessons.length*100);
            return(
              <div key={course.id} onClick={()=>{setActiveCourse(course.id);setView("course");}} style={{...card,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=course.color+"66";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{fontSize:28}}>{course.emoji}</div>
                  <Badge bg={course.level==="Beginner"?"#052e16":"#1c1a0a"} color={course.level==="Beginner"?C.green:C.yellow}>{course.level}</Badge>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:course.color,marginBottom:4}}>{course.title}</div>
                <div style={{fontSize:11,color:C.dim,lineHeight:1.5,marginBottom:12}}>{course.desc}</div>
                <div style={{display:"flex",gap:12,fontSize:10,color:C.muted,marginBottom:10}}>
                  <span>📖 {course.totalLessons} lessons</span>
                  <span>⭐ {course.xp} XP</span>
                </div>
                <div style={{background:"#1a2535",borderRadius:3,height:4,marginBottom:4}}>
                  <div style={{height:4,borderRadius:3,background:course.color,width:pct+"%",transition:"width .5s"}}/>
                </div>
                <div style={{fontSize:10,color:pct===100?course.color:C.dim}}>{pct===100?"✓ Completed":pct>0?`${pct}% — ${done}/${course.lessons.length} lessons`:"Not started"}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── HOME VIEW ──
  return(
    <div>
      {/* ── Profile-Based Recommendation Banner ── */}
      {userProfile && (()=>{
        const profileKey = userProfile.profile || "intermediate";
        const recCourseId = profile.academyStart;
        const recCourse = ACADEMY_COURSES.find(c => c.id === recCourseId) || ACADEMY_COURSES[0];
        const doneCount = recCourse.lessons.filter(l => completed[l.id]).length;
        const pct = Math.round(doneCount / recCourse.totalLessons * 100);
        return (
          <div style={{ background:`linear-gradient(135deg,${profile.darkBg},#060a14)`, border:`1px solid ${profile.color}44`, borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ fontSize:32 }}>{profile.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, color:profile.color, fontWeight:700, letterSpacing:"0.1em", marginBottom:4 }}>
                RECOMMENDED FOR YOU · {profile.label.toUpperCase()}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>
                {recCourse.emoji} {recCourse.title}
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>{recCourse.description}</div>
              <div style={{ background:"#1a2535", borderRadius:4, height:5, width:"100%", maxWidth:300 }}>
                <div style={{ height:5, borderRadius:4, background:profile.color, width:pct+"%", transition:"width 1s" }}/>
              </div>
              <div style={{ fontSize:9, color:C.dim, marginTop:4 }}>{doneCount}/{recCourse.totalLessons} lessons complete</div>
            </div>
            <button onClick={()=>{ setActiveCourse(recCourse.id); setView("course"); }}
              style={{ padding:"10px 20px", background:profile.color, color: profileKey==="beginner"?"#052e16":profileKey==="intermediate"?"#001a26":"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit", flexShrink:0 }}>
              {doneCount===0 ? "Start Course →" : "Continue →"}
            </button>
          </div>
        );
      })()}

      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1a3a)",border:"1px solid "+C.purple+"44",borderRadius:14,padding:"24px 28px",marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,fontSize:80,opacity:0.06}}>🎓</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:6}}>OptiFlow Trading Academy</div>
        <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7,marginBottom:16,maxWidth:560}}>
          From absolute beginner to confident options trader. {ACADEMY_COURSES.length} structured courses, {totalLessons} video lessons, interactive quizzes, and an AI tutor available 24/7.
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>setView("courses")} style={{padding:"11px 22px",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",boxShadow:"0 4px 14px rgba(168,85,247,0.3)"}}>Browse All Courses →</button>
          <button onClick={()=>setView("quiz")} style={{padding:"11px 22px",background:"#1a2535",color:C.blue,border:"1px solid "+C.blue+"44",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Take the Quiz</button>
        </div>
      </div>

      {/* Progress stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}} className="main-grid-4">
        {[
          {label:"Lessons Done",val:`${completedCount}/${totalLessons}`,color:C.green,emoji:"✅"},
          {label:"XP Earned",val:xp+" XP",color:C.yellow,emoji:"⭐"},
          {label:"Day Streak",val:streak+" days",color:C.orange,emoji:"🔥"},
          {label:"Courses",val:`${ACADEMY_COURSES.filter(c=>c.lessons.some(l=>completed[l.id])).length}/${ACADEMY_COURSES.length}`,color:C.blue,emoji:"📚"},
        ].map(stat=>(
          <div key={stat.label} style={{...card,textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{stat.emoji}</div>
            <div style={{fontSize:16,fontWeight:700,color:stat.color,marginBottom:2}}>{stat.val}</div>
            <div style={{fontSize:9,color:C.dim}}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Nav shortcuts */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {NAV_ITEMS.filter(n=>n.id!=="home").map(item=>(
          <button key={item.id} onClick={()=>setView(item.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",background:C.card,border:"1px solid "+C.border,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,color:C.dim,fontFamily:"inherit",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.color=C.text;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.dim;}}>
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div style={{fontSize:13,fontWeight:700,marginBottom:12,color:C.text}}>All Courses</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}} className="main-grid-3">
        {ACADEMY_COURSES.map(course=>{
          const done=course.lessons.filter(l=>completed[l.id]).length;
          const pct=Math.round(done/course.lessons.length*100);
          const isRecommended = userProfile && course.id === profile.academyStart;
          return(
            <div key={course.id} onClick={()=>{setActiveCourse(course.id);setView("course");}} style={{...card,cursor:"pointer",transition:"all .2s",border:"1px solid "+(isRecommended?profile.color+"66":C.border)}} onMouseEnter={e=>{e.currentTarget.style.borderColor=course.color+"66";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=isRecommended?profile.color+"66":C.border;e.currentTarget.style.transform="none";}}>
              {isRecommended && (
                <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",background:profile.color+"22",border:"1px solid "+profile.color+"44",borderRadius:20,fontSize:8,fontWeight:700,color:profile.color,marginBottom:8}}>
                  {profile.emoji} RECOMMENDED FOR YOU
                </div>
              )}
              <div style={{fontSize:24,marginBottom:8}}>{course.emoji}</div>
              <div style={{fontSize:13,fontWeight:700,color:course.color,marginBottom:4}}>{course.title}</div>
              <div style={{fontSize:10,color:C.dim,lineHeight:1.5,marginBottom:10}}>{course.desc}</div>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <Badge bg={course.level==="Beginner"?"#052e16":"#1c1a0a"} color={course.level==="Beginner"?C.green:C.yellow}>{course.level}</Badge>
                <Badge bg="#0f1422" color={C.dim}>{course.totalLessons} lessons</Badge>
                <Badge bg="#0f1422" color={C.yellow}>{course.xp} XP</Badge>
              </div>
              <div style={{background:"#1a2535",borderRadius:3,height:4}}>
                <div style={{height:4,borderRadius:3,background:course.color,width:pct+"%",transition:"width .5s"}}/>
              </div>
              <div style={{fontSize:9,color:pct===100?course.color:C.dim,marginTop:4}}>{pct===100?"✓ Complete":pct>0?`${pct}% done`:"Not started"}</div>
            </div>
          );
        })}
      </div>

      {/* Tips & mistakes */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="main-grid-2">
        <div style={card}>
          <div style={{fontSize:9,color:C.yellow,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>
            {userProfile ? profile.emoji+" TIPS FOR "+profile.label.toUpperCase()+"S" : "💡 PRO TIPS"}
          </div>
          {(userProfile && userProfile.profile === "beginner" ? [
            "Start with the Stock Basics course before anything else",
            "Use Paper Trading — practice with virtual money, zero risk",
            "Never invest more than you can afford to lose",
            "The Academy AI Tutor can explain any concept simply",
            "Read the Glossary when you encounter unfamiliar terms",
          ] : userProfile && userProfile.profile === "advanced" ? [
            "Sell premium in high IV environments — collect theta",
            "Use the SPAN Margin Calculator to size positions correctly",
            "Backtest your strategies before trading real capital",
            "IV Rank > 50 is a good threshold for selling options",
            "Hedge portfolio with puts before earnings season",
          ] : [
            "Never risk more than 2% of capital on one trade",
            "High IV = expensive options. Sell high IV, buy low IV",
            "Paper trade first — practice before using real money",
            "IV crush kills options after earnings — be careful",
            "The trend is your friend — don't fight the market",
          ]).map((tip,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{color:C.yellow,flexShrink:0}}>★</span>
              <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{tip}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{fontSize:9,color:C.red,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>⚠️ BEGINNER MISTAKES</div>
          {["Buying OTM calls and ignoring time decay (theta)","Over-leveraging — too much capital per trade","Not having a stop loss before entering a trade","Chasing stocks after they already moved 20%","Ignoring earnings dates when trading options"].map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{color:C.red,flexShrink:0}}>✗</span>
              <div style={{fontSize:11,color:"#94a3b8",lineHeight:1.5}}>{m}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── RECOMMENDER PAGE ──────────────────────────────────────────────────────────
function RecommenderPage({onSelectStrategy}){
  const [view,setView]=useState("Bullish");const [vol,setVol]=useState("Neutral");const [horizon,setHorizon]=useState("1-3 months");const [result,setResult]=useState(null);
  const recommend=()=>{const key=`${view}-${vol}-${horizon}`;const found=STRAT_REC_MAP[key]||["Bull Call Spread","Bear Put Spread","Butterfly"];setResult(found);};
  const card={background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:16};
  return(<div><div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Strategy Recommender</div><div style={{fontSize:12,color:C.dim,marginBottom:16}}>Tell us your market view and we'll suggest the right strategies.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={card}><div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:C.blue,marginBottom:16}}>YOUR MARKET VIEW</div><div style={{marginBottom:16}}><div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>DIRECTIONAL VIEW</div><div style={{display:"flex",gap:8}}>{["Bullish","Bearish","Neutral"].map(v=>(<button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"10px 8px",background:view===v?"rgba(56,189,248,0.15)":"#0f1422",border:"1px solid "+(view===v?C.blue:C.border),borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,color:view===v?C.blue:C.dim,fontFamily:"inherit"}}>{v==="Bullish"?"📈":v==="Bearish"?"📉":"↔"} {v}</button>))}</div></div><div style={{marginBottom:16}}><div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>VOLATILITY VIEW</div><div style={{display:"flex",gap:8}}>{["High","Low","Neutral"].map(v=>(<button key={v} onClick={()=>setVol(v)} style={{flex:1,padding:"10px",background:vol===v?"rgba(56,189,248,0.15)":"#0f1422",border:"1px solid "+(vol===v?C.blue:C.border),borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,color:vol===v?C.blue:C.dim,fontFamily:"inherit"}}>{v}</button>))}</div></div><div style={{marginBottom:20}}><div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>TIME HORIZON</div><select value={horizon} onChange={e=>setHorizon(e.target.value)} style={{width:"100%",background:"#080c14",border:"1px solid "+C.border,borderRadius:7,padding:"9px 12px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit",cursor:"pointer"}}><option>Short (&lt;1 month)</option><option>1-3 months</option><option>3-6 months</option><option>6+ months</option></select></div><button onClick={recommend} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0369a1,#0ea5e9)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Get Recommendations →</button></div><div>{result?(<div style={card}><div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:C.blue,marginBottom:12}}>RECOMMENDED STRATEGIES</div><div style={{fontSize:11,color:C.dim,marginBottom:16}}>For a <strong style={{color:C.blue}}>{view}</strong> view with <strong style={{color:C.purple}}>{vol} vol</strong>, {horizon}:</div>{result.map((name,i)=>{const s=STRATS[name];return s?(<div key={name} style={{background:"#0f1422",border:"1px solid "+C.border,borderRadius:8,padding:14,marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontWeight:700,fontSize:13}}>#{i+1} {name}</span><Badge bg={s.risk==="Low"?"#052e16":s.risk==="Medium"?"#1c1a0a":"#3b0000"} color={s.risk==="Low"?C.green:s.risk==="Medium"?C.yellow:C.red}>{s.risk} Risk</Badge></div><div style={{fontSize:11,color:C.dim,marginBottom:8}}>{s.desc}</div><button onClick={()=>onSelectStrategy(name)} style={{padding:"5px 14px",background:"#0f2a40",color:C.blue,border:"1px solid "+C.blue+"44",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>Build Strategy →</button></div>):null;})}</div>):(<div style={Object.assign({},card,{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300})}><div style={{textAlign:"center",color:"#334155"}}><div style={{fontSize:48,marginBottom:12}}>🎯</div><div style={{fontWeight:600,color:C.dim}}>Set your view & get recommendations</div></div></div>)}</div></div></div>);
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
    { price: spot,        vol: sigma * 0.75 },
    { price: spot,        vol: sigma * 1.25 },
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
    const newVal = BS(sc.price, K, Math.max(0.001, T - 1/365), 0.05, sc.vol, orderType === "put" ? "put" : "call").price;
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
  const [targetPrice, setTargetPrice]   = useState(+(item.price * (item.side === "buy" ? 1.15 : 0.85)).toFixed(2));
  const [stopPrice, setStopPrice]       = useState(+(item.price * (item.side === "buy" ? 0.93 : 1.07)).toFixed(2));
  const [gttExpiry, setGttExpiry]       = useState("");
  const [validity, setValidity]         = useState("DAY");
  const [showMargin, setShowMargin]     = useState(false);

  const margin = useMemo(() => calcSPANMargin(item.type, spot, item.strike, parseFloat(item.iv) || 25, item.expDays, item.qty * (item.lotSize || 1), item.side), [item, spot]);
  const execPrice = orderType === "market" ? item.price : limitPrice;
  const totalCost = execPrice * item.qty * (item.lotSize || 1) * 100;
  const isBuy = item.side === "buy";

  const ORDER_TYPES = [
    { id: "market", label: "Market", desc: "Execute immediately at best price" },
    { id: "limit",  label: "Limit",  desc: "Execute only at your specified price or better" },
    { id: "sl",     label: "SL",     desc: "Stop Loss — triggers at SL price, executes at market" },
    { id: "sl_m",   label: "SL-M",   desc: "Stop Loss Market — triggers at SL, executes at market instantly" },
    { id: "bracket",label: "Bracket",desc: "Entry + Target + Stop Loss in one order" },
    { id: "cover",  label: "Cover",  desc: "Market order with compulsory stop loss" },
    { id: "gtt",    label: "GTT",    desc: "Good Till Triggered — stays active till price hit" },
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

// ── INDIAN MARKET DATA ────────────────────────────────────────────────────────
const NSE_STOCKS = {
  "RELIANCE":2456.80,"TCS":3890.45,"INFY":1678.30,"HDFCBANK":1723.60,"ICICIBANK":1198.40,
  "HINDUNILVR":2356.70,"SBIN":812.35,"BAJFINANCE":6934.20,"BHARTIARTL":1567.80,"KOTAKBANK":1834.50,
  "ITC":478.90,"LT":3567.40,"AXISBANK":1234.60,"ASIANPAINT":2789.30,"MARUTI":12456.70,
  "SUNPHARMA":1678.40,"WIPRO":456.70,"ULTRACEMCO":9876.50,"TITAN":3456.80,"NESTLEIND":23456.70,
  "TECHM":1567.30,"POWERGRID":312.45,"NTPC":389.60,"ONGC":278.40,"COALINDIA":456.70,
  "HCLTECH":1456.80,"ADANIPORTS":1234.50,"ADANIENT":2890.40,"JSWSTEEL":978.60,"TATASTEEL":167.80,
  "BAJAJFINSV":1678.40,"DIVISLAB":5678.90,"CIPLA":1345.60,"DRREDDY":6789.40,"EICHERMOT":4567.80,
  "HEROMOTOCO":4234.50,"HINDALCO":678.90,"BRITANNIA":5678.40,"GRASIM":2345.60,"M&M":2567.80,
  "TATAMOTORS":1023.40,"VEDL":467.80,"BPCL":345.60,"APOLLOHOSP":6789.40,"INDUSINDBK":1456.70,
};
const NSE_BETA = {
  RELIANCE:0.9,TCS:0.8,INFY:0.9,HDFCBANK:0.8,ICICIBANK:1.1,SBIN:1.2,BAJFINANCE:1.3,
  BHARTIARTL:0.7,TATAMOTORS:1.4,ADANIENT:1.6,JSWSTEEL:1.3,TATASTEEL:1.3,TITAN:1.1,
};

Object.entries(NSE_STOCKS).forEach(([sym,price])=>{
  if(!priceState[sym]){
    const beta = NSE_BETA[sym]||1.0;
    const drift = (Math.random()-0.48)*0.03*beta;
    priceState[sym]={price:price*(1+drift),base:price,beta,trend:(Math.random()-0.5)*0.001};
  }
});

// ── MARKET HEATMAP ────────────────────────────────────────────────────────────
function HeatmapPage({ quotes, onSelectTicker, vix }) {
  const [marketFilter, setMarketFilter] = useState("us");
  const [sortBy, setSortBy] = useState("pct");
  const [sizeBy, setSizeBy] = useState("marketcap");
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };

  const SECTORS = {
    "Technology":  ["AAPL","MSFT","NVDA","AMD","INTC","AVGO","QCOM","TXN","ADBE","CRM","ORCL","CSCO","IBM","PANW","CRWD"],
    "Consumer":    ["AMZN","TSLA","META","GOOGL","NFLX","MCD","NKE","COST","WMT","HD"],
    "Finance":     ["JPM","BAC","GS","MS","V","MA","AXP","SPGI","BLK","USB"],
    "Healthcare":  ["LLY","JNJ","UNH","ABBV","MRK","TMO","AMGN","GILD","VRTX","REGN","MDT"],
    "Energy":      ["XOM","CVX","COP","SLB","EOG","BKNG","FCX"],
    "Industrials": ["CAT","DE","HON","RTX","EMR","GE","ETN","ITW","NOC"],
  };

  const NSE_SECTORS = {
    "Banking":   ["HDFCBANK","ICICIBANK","SBIN","KOTAKBANK","AXISBANK","INDUSINDBK"],
    "IT":        ["TCS","INFY","WIPRO","HCLTECH","TECHM"],
    "Energy":    ["RELIANCE","ONGC","BPCL","COALINDIA","VEDL","ADANIENT"],
    "Consumer":  ["HINDUNILVR","ITC","NESTLEIND","BRITANNIA","TITAN","MARUTI"],
    "Pharma":    ["SUNPHARMA","CIPLA","DRREDDY","DIVISLAB","APOLLOHOSP"],
    "Industry":  ["LT","ADANIPORTS","JSWSTEEL","TATASTEEL","HINDALCO","GRASIM"],
  };

  const activeSectors = marketFilter === "us" ? SECTORS : NSE_SECTORS;

  const getColor = (pct) => {
    if (pct > 3)  return { bg: "#14532d", text: C.green };
    if (pct > 1)  return { bg: "#052e16", text: "#86efac" };
    if (pct > 0)  return { bg: "#042010", text: "#4ade80aa" };
    if (pct > -1) return { bg: "#1f0808", text: "#f87171aa" };
    if (pct > -3) return { bg: "#3b0000", text: C.red };
    return        { bg: "#5b0000", text: "#fca5a5" };
  };

  const allSyms = Object.values(activeSectors).flat();
  const gainers = allSyms.map(s => {
    const q = quotes[s];
    return q ? { sym: s, pct: q.pct, price: q.price } : null;
  }).filter(Boolean).sort((a,b)=>b.pct-a.pct);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>🗺 Market Heatmap</div>
          <div style={{ fontSize: 12, color: C.dim }}>Live sector heat by % change. Click any tile to open options.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 3, background: C.card2, borderRadius: 7, padding: 3 }}>
            {[["us","🇺🇸 US"], ["in","🇮🇳 India"]].map(([id,label])=>(
              <button key={id} onClick={()=>setMarketFilter(id)} style={{ padding:"6px 14px", borderRadius:5, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit", background: marketFilter===id ? C.blue+"22" : "transparent", color: marketFilter===id ? C.blue : C.dim }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:6, marginBottom:14, alignItems:"center", fontSize:10, flexWrap:"wrap" }}>
        <span style={{color:C.dim}}>Scale:</span>
        {[["Gain >3%","#14532d",C.green],["+1–3%","#052e16","#86efac"],["0–1%","#042010","#4ade80aa"],["-1–0%","#1f0808","#f87171aa"],["-1–3%","#3b0000",C.red],["Drop >3%","#5b0000","#fca5a5"]].map(([l,bg,col])=>(
          <span key={l} style={{padding:"2px 10px",background:bg,color:col,borderRadius:4,fontSize:9,fontWeight:700}}>{l}</span>
        ))}
      </div>

      {/* Sector blocks */}
      {Object.entries(activeSectors).map(([sector, syms])=>(
        <div key={sector} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing:"0.1em", marginBottom: 6 }}>{sector.toUpperCase()}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))", gap:4 }}>
            {syms.map(sym=>{
              const q = quotes[sym];
              const pct = q ? q.pct : 0;
              const { bg, text } = getColor(pct);
              return (
                <div key={sym} onClick={()=>onSelectTicker(sym)} style={{ background:bg, borderRadius:7, padding:"10px 8px", cursor:"pointer", transition:"transform .1s, filter .1s", border:"1px solid "+bg }} onMouseEnter={e=>{e.currentTarget.style.filter="brightness(1.3)";e.currentTarget.style.transform="scale(1.04)";}} onMouseLeave={e=>{e.currentTarget.style.filter="none";e.currentTarget.style.transform="none";}}>
                  <div style={{ fontSize:10, fontWeight:700, color:text, marginBottom:2 }}>{sym}</div>
                  {q ? (
                    <>
                      <div style={{ fontSize:11, color:text, fontWeight:700 }}>{pct>=0?"+":""}{pct}%</div>
                      <div style={{ fontSize:9, color:text+"99" }}>${q.price}</div>
                    </>
                  ) : <div style={{ fontSize:9, color:text+"66" }}>—</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Top movers */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:8 }} className="main-grid-2">
        {[["🚀 Top Gainers", gainers.slice(0,5), true],["📉 Top Losers", gainers.slice(-5).reverse(), false]].map(([title, list, isGain])=>(
          <div key={title} style={card}>
            <div style={{ fontSize:9, fontWeight:700, color: isGain ? C.green : C.red, letterSpacing:"0.1em", marginBottom:10 }}>{title}</div>
            {list.map(item=>(
              <div key={item.sym} onClick={()=>onSelectTicker(item.sym)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid "+C.border+"22", cursor:"pointer" }}>
                <span style={{ fontWeight:700, fontSize:12 }}>{item.sym}</span>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color: isGain ? C.green : C.red }}>{item.pct>=0?"+":""}{item.pct}%</div>
                  <div style={{ fontSize:9, color:C.dim }}>${item.price}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EARNINGS CALENDAR ─────────────────────────────────────────────────────────
function EarningsCalendar({ quotes, onSelectTicker }) {
  const [aiEarnings, setAiEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };

  // Generate simulated upcoming earnings
  const UPCOMING = useMemo(() => {
    const tickers = ["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AMD","NFLX","JPM","BAC","GS","V","MA","AVGO","QCOM","INTC","CRM","ADBE","ORCL","WMT","COST","HD","MCD","NKE"];
    const days = [];
    const now = new Date();
    for (let w = 0; w < 3; w++) {
      const weekDays = [];
      for (let d = 0; d < 5; d++) {
        const date = new Date(now);
        date.setDate(now.getDate() + w * 7 + d + 1);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const dayTickers = tickers.splice(0, Math.floor(Math.random() * 4) + 1);
        if (dayTickers.length) weekDays.push({
          date: date.toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}),
          dateObj: date,
          companies: dayTickers.map(sym => {
            const q = quotes[sym];
            const base = BASE_PRICES[sym] || 100;
            const ivBump = 0.15 + Math.random() * 0.25;
            const epsEst = +(base * 0.02 + Math.random() * base * 0.01).toFixed(2);
            const revEst = +(base * 8 + Math.random() * base * 4).toFixed(0);
            const surprise = (Math.random() - 0.45) * 15;
            return { sym, price: q?.price || base, pct: q?.pct || 0, ivBump, epsEst, revEst, surprise: +surprise.toFixed(1), time: Math.random()>0.5?"AMC":"BMO" };
          })
        });
      }
      days.push({ week: w===0?"This Week":w===1?"Next Week":"Week After", days: weekDays });
    }
    return days;
  }, []);

  const fetchAIInsights = async () => {
    setLoading(true);
    const upcomingList = UPCOMING[0].days.flatMap(d => d.companies.map(c => c.sym)).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: "You are a Wall Street earnings analyst. Respond ONLY with valid JSON array, no markdown.",
          messages: [{ role: "user", content: `For these upcoming earnings: ${upcomingList}. Give brief AI insights. Return JSON array: [{"sym":"AAPL","outlook":"Bullish|Neutral|Bearish","keyFocus":"1 sentence on what to watch","riskReward":"string","optionPlay":"e.g. Buy straddle before earnings"}]` }]
        })
      });
      const d = await res.json();
      const text = (d.content?.[0]?.text || "[]").replace(/```json|```/g,"").trim();
      setAiEarnings(JSON.parse(text));
      setFetched(true);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const week = UPCOMING[activeWeek];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:2 }}>📅 Earnings Calendar</div>
          <div style={{ fontSize:12, color:C.dim }}>Upcoming earnings with IV analysis and AI insights</div>
        </div>
        <button onClick={fetchAIInsights} disabled={loading} style={{ padding:"9px 18px", background: loading ? "#1a2535" : "linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", border:"none", borderRadius:8, cursor:loading?"default":"pointer", fontWeight:700, fontSize:11, fontFamily:"inherit" }}>
          {loading ? "Loading AI…" : "🤖 Get AI Insights"}
        </button>
      </div>

      {/* Week tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {UPCOMING.map((w,i)=>(
          <button key={i} onClick={()=>setActiveWeek(i)} style={{ padding:"8px 18px", background: activeWeek===i ? "rgba(56,189,248,0.15)" : C.card, border:"1px solid "+(activeWeek===i?C.blue:C.border), borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700, color: activeWeek===i?C.blue:C.dim, fontFamily:"inherit" }}>
            {w.week}
          </button>
        ))}
      </div>

      {week.days.map(day=>(
        <div key={day.date} style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.text, fontWeight:700, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ padding:"3px 10px", background:"#0f1422", border:"1px solid "+C.border, borderRadius:6, fontSize:10 }}>{day.date}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
            {day.companies.map(co=>{
              const aiData = aiEarnings.find(a=>a.sym===co.sym);
              const outlookColor = aiData?.outlook==="Bullish" ? C.green : aiData?.outlook==="Bearish" ? C.red : C.yellow;
              return (
                <div key={co.sym} style={{ ...card, cursor:"pointer" }} onClick={()=>onSelectTicker(co.sym)} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:15, fontWeight:700 }}>{co.sym}</span>
                      <Badge bg={co.time==="AMC"?"#1c0a00":"#0c2a47"} color={co.time==="AMC"?C.orange:C.blue} size={8}>{co.time}</Badge>
                    </div>
                    <span style={{ fontSize:11, color:co.pct>=0?C.green:C.red, fontWeight:700 }}>{co.pct>=0?"+":""}{co.pct}%</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
                    {[["EPS Est","$"+co.epsEst,C.text],["IV Bump","+"+Math.round(co.ivBump*100)+"%",C.yellow],["Hist Surprise",(co.surprise>=0?"+":"")+co.surprise+"%",co.surprise>=0?C.green:C.red]].map(([l,v,c])=>(
                      <div key={l} style={{ background:"#080c14", borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:8, color:C.muted, marginBottom:2 }}>{l}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {aiData && (
                    <div style={{ borderTop:"1px solid "+C.border, paddingTop:8 }}>
                      <div style={{ display:"flex", gap:6, marginBottom:4, alignItems:"center" }}>
                        <span style={{ fontSize:9, color:C.purple }}>🤖 AI</span>
                        <Badge bg={outlookColor+"22"} color={outlookColor} size={8}>{aiData.outlook}</Badge>
                      </div>
                      <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.5, marginBottom:4 }}>{aiData.keyFocus}</div>
                      <div style={{ fontSize:10, color:C.purple, fontStyle:"italic" }}>Option play: {aiData.optionPlay}</div>
                    </div>
                  )}
                  {!aiData && fetched && (
                    <div style={{ borderTop:"1px solid "+C.border, paddingTop:8, fontSize:10, color:C.dim }}>No AI data for this stock</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PORTFOLIO ANALYTICS ───────────────────────────────────────────────────────
function PortfolioAnalytics({ trades, quotes, cash }) {
  const [aiReport, setAiReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const card = { background: C.card, border: "1px solid " + C.border, borderRadius: 10, padding: 16 };

  const openTrades   = trades.filter(t=>t.status==="open");
  const closedTrades = trades.filter(t=>t.status==="closed");
  const totalPnl     = closedTrades.reduce((a,t)=>a+t.pnl, 0);
  const wins         = closedTrades.filter(t=>t.pnl>0);
  const losses       = closedTrades.filter(t=>t.pnl<=0);
  const winRate      = closedTrades.length ? (wins.length/closedTrades.length*100) : 0;
  const avgWin       = wins.length ? wins.reduce((a,t)=>a+t.pnl,0)/wins.length : 0;
  const avgLoss      = losses.length ? losses.reduce((a,t)=>a+t.pnl,0)/losses.length : 0;
  const profitFactor = losses.length && Math.abs(avgLoss) > 0 ? Math.abs(avgWin/avgLoss) : 0;
  const portfolioValue = cash + openTrades.reduce((a,t)=>a+t.cost,0) + totalPnl;
  const totalInvested = 50000;
  const totalReturn  = ((portfolioValue - totalInvested) / totalInvested * 100);

  // Risk distribution
  const tickerExposure = {};
  openTrades.forEach(t => {
    tickerExposure[t.ticker] = (tickerExposure[t.ticker]||0) + t.cost;
  });
  const totalExposure = Object.values(tickerExposure).reduce((a,b)=>a+b,0)||1;

  const generateReport = async () => {
    setReportLoading(true);
    const summary = `Portfolio: $${portfolioValue.toFixed(0)} | Win Rate: ${winRate.toFixed(0)}% | Profit Factor: ${profitFactor.toFixed(2)} | Avg Win: $${avgWin.toFixed(0)} | Avg Loss: $${avgLoss.toFixed(0)} | Open Positions: ${openTrades.length} | Closed Trades: ${closedTrades.length} | Total P&L: ${totalPnl>=0?"+":""}$${totalPnl.toFixed(0)}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600,
          system:"You are a professional portfolio manager reviewing a paper trading account. Be direct, specific, and actionable. 150 words max.",
          messages:[{role:"user",content:`Review this paper trading portfolio and give 3-4 specific, actionable improvements: ${summary}`}] })
      });
      const d = await res.json();
      setAiReport(d.content?.[0]?.text || "Could not generate report.");
    } catch(e) { setAiReport("Error generating report."); }
    setReportLoading(false);
  };

  // Monthly P&L simulation
  const monthlyData = useMemo(()=>{
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.slice(0,new Date().getMonth()+1).map(m=>({
      month:m, pnl: +(Math.random()-0.4)*800
    }));
  },[]);

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>📊 Portfolio Analytics</div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>Deep performance insights for your paper trading account</div>

      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }} className="main-grid-4">
        {[
          { label:"Portfolio Value", value:"$"+portfolioValue.toFixed(0), color:C.green, sub:"Starting: $50,000" },
          { label:"Total Return",    value:(totalReturn>=0?"+":"")+totalReturn.toFixed(1)+"%", color:totalReturn>=0?C.green:C.red, sub:"Since inception" },
          { label:"Win Rate",        value:winRate.toFixed(0)+"%", color:winRate>=50?C.green:C.red, sub:`${wins.length}W / ${losses.length}L` },
          { label:"Profit Factor",   value:profitFactor.toFixed(2)+"×", color:profitFactor>=1.5?C.green:profitFactor>=1?C.yellow:C.red, sub:"Avg win / avg loss" },
        ].map(kpi=>(
          <div key={kpi.label} style={card}>
            <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{kpi.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:kpi.color, marginBottom:2 }}>{kpi.value}</div>
            <div style={{ fontSize:9, color:C.dim }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }} className="main-grid-2">
        {/* Trade stats */}
        <div style={card}>
          <div style={{ fontSize:9, color:C.blue, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>TRADE STATISTICS</div>
          {[
            ["Total Trades",    trades.length,              C.text],
            ["Open Positions",  openTrades.length,          C.blue],
            ["Avg Win",         "$"+avgWin.toFixed(0),      C.green],
            ["Avg Loss",        "$"+avgLoss.toFixed(0),     C.red],
            ["Best Trade",      "$"+(wins[0]?.pnl||0).toFixed(0), C.green],
            ["Worst Trade",     "$"+(losses[0]?.pnl||0).toFixed(0),C.red],
            ["Cash Available",  "$"+cash.toLocaleString(),  C.yellow],
          ].map(([label,val,col])=>(
            <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid "+C.border+"22" }}>
              <span style={{ fontSize:11, color:C.dim }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:col }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Exposure breakdown */}
        <div style={card}>
          <div style={{ fontSize:9, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>POSITION EXPOSURE</div>
          {Object.keys(tickerExposure).length === 0 ? (
            <div style={{ color:C.muted, fontSize:12, textAlign:"center", padding:"32px 0" }}>No open positions yet</div>
          ) : Object.entries(tickerExposure).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([sym,val])=>{
            const pct = val/totalExposure*100;
            const q = quotes[sym];
            return (
              <div key={sym} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:700 }}>{sym}</span>
                  <span style={{ fontSize:11, color:C.yellow }}>${val.toFixed(0)} · {pct.toFixed(0)}%</span>
                </div>
                <div style={{ background:"#1a2535", borderRadius:3, height:5 }}>
                  <div style={{ height:5, borderRadius:3, background: pct>30?C.red:pct>15?C.yellow:C.green, width:pct+"%" }}/>
                </div>
              </div>
            );
          })}
          {Object.keys(tickerExposure).length > 0 && (
            <div style={{ marginTop:10, fontSize:9, color:C.dim }}>
              {Object.keys(tickerExposure).some(s=>tickerExposure[s]/totalExposure>0.3) && (
                <div style={{ color:C.red }}>⚠️ Over-concentration detected (&gt;30% in one position)</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monthly P&L bar chart */}
      <div style={{ ...card, marginBottom:14 }}>
        <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", marginBottom:12 }}>MONTHLY P&L (SIMULATED)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} margin={{ top:4, right:10, left:0, bottom:4 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={C.border} />
            <XAxis dataKey="month" stroke={C.border} tick={{ fontSize:9, fill:C.muted }} />
            <YAxis stroke={C.border} tick={{ fontSize:9, fill:C.muted }} tickFormatter={v=>"$"+v} />
            <Tooltip contentStyle={{ background:C.card, border:"1px solid "+C.border, borderRadius:6, fontSize:10 }} formatter={v=>["$"+v.toFixed(0),"P&L"]} />
            <ReferenceLine y={0} stroke={C.border} strokeDasharray="3 3" />
            <Bar dataKey="pnl" radius={[3,3,0,0]}>
              {monthlyData.map((entry,i)=>(
                <Cell key={i} fill={entry.pnl>=0?C.green:C.red} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Report */}
      <div style={{ ...card, border:"1px solid "+C.purple+"44" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:9, color:C.purple, fontWeight:700, letterSpacing:"0.1em" }}>🤖 AI PORTFOLIO REVIEW</div>
          <button onClick={generateReport} disabled={reportLoading} style={{ padding:"7px 16px", background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", border:"none", borderRadius:7, cursor:reportLoading?"default":"pointer", fontWeight:700, fontSize:10, fontFamily:"inherit", opacity:reportLoading?0.6:1 }}>
            {reportLoading ? "Analyzing…" : "Generate Report"}
          </button>
        </div>
        {aiReport ? (
          <div style={{ fontSize:12, color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{aiReport}</div>
        ) : (
          <div style={{ color:C.muted, fontSize:12, textAlign:"center", padding:"20px 0" }}>Click Generate Report to get AI-powered analysis of your trading performance</div>
        )}
      </div>
    </div>
  );
}

// ── ONBOARDING MODAL ──────────────────────────────────────────────────────────
// ── USER PROFILE SYSTEM ───────────────────────────────────────────────────────
const PROFILES = {
  beginner: {
    label:       "Beginner",
    emoji:       "🌱",
    color:       "#4ade80",
    darkBg:      "#052e16",
    description: "New to trading — building foundations",
    startPage:   "learn",
    cashAmount:  10000,
    navPriority: ["market","learn","heatmap","watchlist","portfolio","journal","settings"],
    hiddenPages: ["trade","greeks","backtester","margin","risk_calc"],
    tips: [
      "Start with the 📚 Academy — complete the Stock Basics course first",
      "Use Paper Trading to practice with $10,000 virtual money — no real money at risk",
      "Check the 🤖 AI Tutor anytime you don't understand a concept",
      "Visit the 📖 Glossary to look up terms you don't know",
    ],
    academyStart: "stock_basics",
    simplifiedMode: true,
    features: {
      showOptionsChain: false,
      showGreeks:       false,
      showBacktester:   false,
      showMargin:       false,
      showStrategies:   false,
      showCrypto:       true,
      showJournal:      true,
      showHeatmap:      true,
    },
  },
  intermediate: {
    label:       "Intermediate",
    emoji:       "📈",
    color:       "#38bdf8",
    darkBg:      "#0c2a47",
    description: "Knows stocks — learning options",
    startPage:   "market",
    cashAmount:  25000,
    navPriority: ["market","options","heatmap","earnings","watchlist","scanner","portfolio","analytics","learn","ai_hub","journal","settings"],
    hiddenPages: ["backtester","margin"],
    tips: [
      "Start with the ⚙️ Options Fundamentals course in the Academy",
      "Try the Options Chain — buy a call on a stock you're bullish on",
      "Use the 🤖 AI Hub to get analysis before trading",
      "Set up Watchlist alerts for your favourite stocks",
    ],
    academyStart: "options_fundamentals",
    simplifiedMode: false,
    features: {
      showOptionsChain: true,
      showGreeks:       false,
      showBacktester:   false,
      showMargin:       false,
      showStrategies:   true,
      showCrypto:       true,
      showJournal:      true,
      showHeatmap:      true,
    },
  },
  advanced: {
    label:       "Advanced",
    emoji:       "🔥",
    color:       "#a78bfa",
    darkBg:      "#1a0f2e",
    description: "Experienced options trader",
    startPage:   "market",
    cashAmount:  50000,
    navPriority: null, // show all
    hiddenPages: [],
    tips: [
      "Use the Backtester to validate your strategies before going live",
      "The SPAN Margin Calculator shows real margin requirements per position",
      "AI Analysis Hub has 5 modes — try the Bull vs Bear for earnings plays",
      "Chain the AI Chat with the Strategy Builder for optimal entry timing",
    ],
    academyStart: "greeks_mastery",
    simplifiedMode: false,
    features: {
      showOptionsChain: true,
      showGreeks:       true,
      showBacktester:   true,
      showMargin:       true,
      showStrategies:   true,
      showCrypto:       true,
      showJournal:      true,
      showHeatmap:      true,
    },
  },
};

function deriveProfile(answers) {
  let score = 0;
  // Q1: experience
  if (answers.experience === "none")          score += 0;
  else if (answers.experience === "stocks")   score += 2;
  else if (answers.experience === "options")  score += 4;
  else if (answers.experience === "active")   score += 6;
  // Q2: options knowledge
  if (answers.optionsKnowledge === "none")    score += 0;
  else if (answers.optionsKnowledge === "basics") score += 2;
  else if (answers.optionsKnowledge === "spreads") score += 4;
  else if (answers.optionsKnowledge === "advanced") score += 6;
  // Q3: goal
  if (answers.goal === "learn")              score += 0;
  else if (answers.goal === "income")        score += 1;
  else if (answers.goal === "growth")        score += 2;
  else if (answers.goal === "hedge")         score += 3;
  // Q4: risk
  if (answers.risk === "very_low")           score += 0;
  else if (answers.risk === "low")           score += 1;
  else if (answers.risk === "medium")        score += 2;
  else if (answers.risk === "high")          score += 3;

  if (score <= 4)  return "beginner";
  if (score <= 9)  return "intermediate";
  return "advanced";
}

// ── PERSONALIZATION ONBOARDING ────────────────────────────────────────────────
function PersonalizationOnboarding({ onComplete }) {
  const [step, setStep] = useState(0); // -1=intro, 0-N=questions, N+1=result
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [animIn, setAnimIn] = useState(true);

  const QUESTIONS = [
    {
      id: "experience",
      emoji: "📊",
      question: "How much trading experience do you have?",
      subtitle: "Be honest — we'll tailor everything to your level",
      options: [
        { value:"none",    label:"Complete beginner",     desc:"I've never bought a stock or option",           emoji:"🐣" },
        { value:"stocks",  label:"I trade stocks",         desc:"I buy/sell stocks but haven't tried options",   emoji:"📈" },
        { value:"options", label:"I've tried options",     desc:"I've bought calls or puts a few times",         emoji:"⚙️" },
        { value:"active",  label:"Active options trader",  desc:"I trade options regularly and know the Greeks", emoji:"🔥" },
      ],
    },
    {
      id: "optionsKnowledge",
      emoji: "🧠",
      question: "How well do you understand options?",
      subtitle: "This helps us set the right complexity level",
      options: [
        { value:"none",     label:"What's an option?",       desc:"I don't know what calls and puts are",           emoji:"❓" },
        { value:"basics",   label:"I know calls and puts",   desc:"I understand buying calls/puts and strike prices", emoji:"💡" },
        { value:"spreads",  label:"I know spreads",          desc:"I understand bull call spreads, covered calls etc.", emoji:"📐" },
        { value:"advanced", label:"Greeks and complex strats",desc:"I understand delta, theta, iron condors, etc.",  emoji:"🎓" },
      ],
    },
    {
      id: "goal",
      emoji: "🎯",
      question: "What's your primary goal with OptiFlow?",
      subtitle: "We'll prioritize the tools that matter most to you",
      options: [
        { value:"learn",   label:"Learn to trade",          desc:"I want to understand markets and options from scratch", emoji:"📚" },
        { value:"income",  label:"Generate income",         desc:"Covered calls, selling premium for monthly income",     emoji:"💰" },
        { value:"growth",  label:"Grow my portfolio",       desc:"Directional plays, earnings trades, momentum",          emoji:"🚀" },
        { value:"hedge",   label:"Protect my investments",  desc:"Protective puts, portfolio hedging strategies",          emoji:"🛡️" },
      ],
    },
    {
      id: "risk",
      emoji: "⚖️",
      question: "How would you describe your risk appetite?",
      subtitle: "Helps us recommend appropriate strategies",
      options: [
        { value:"very_low", label:"Very conservative",  desc:"I want to protect my capital above all else",        emoji:"🏦" },
        { value:"low",      label:"Conservative",       desc:"Small, calculated risks with defined max loss",       emoji:"🔒" },
        { value:"medium",   label:"Balanced",           desc:"Comfortable with moderate risk for better returns",   emoji:"⚖️" },
        { value:"high",     label:"Aggressive",         desc:"High risk tolerance, seeking outsized returns",       emoji:"🎰" },
      ],
    },
    {
      id: "market",
      emoji: "🌍",
      question: "Which markets do you want to trade?",
      subtitle: "We support both US and Indian markets",
      options: [
        { value:"us",    label:"US Markets only",    desc:"S&P 500, NASDAQ — NYSE/NASDAQ listed stocks",      emoji:"🇺🇸" },
        { value:"india", label:"Indian Markets only", desc:"NSE/BSE — Nifty, Bank Nifty, Indian stocks",       emoji:"🇮🇳" },
        { value:"both",  label:"Both US & India",     desc:"Full access to all markets on the platform",       emoji:"🌍" },
        { value:"crypto",label:"Crypto too",          desc:"US + India + Bitcoin, Ethereum and altcoins",      emoji:"₿" },
      ],
    },
  ];

  const totalSteps = QUESTIONS.length;
  const isIntro = step === -1;
  const isDone  = step >= totalSteps;
  const q       = !isIntro && !isDone ? QUESTIONS[step] : null;
  const progress = Math.max(0, step) / totalSteps;

  const transitionNext = (newStep) => {
    setAnimIn(false);
    setTimeout(() => { setStep(newStep); setAnimIn(true); }, 200);
  };

  const selectAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (step === totalSteps - 1) {
      const p = deriveProfile(newAnswers);
      setProfile(p);
      transitionNext(totalSteps);
    } else {
      transitionNext(step + 1);
    }
  };

  const handleComplete = () => {
    const p = profile || "beginner";
    const prof = PROFILES[p];
    try {
      localStorage.setItem("optiflow_profile", JSON.stringify({ profile: p, answers, name, ts: Date.now() }));
      localStorage.setItem("optiflow_visited", "1");
    } catch(e) {}
    onComplete({ profile: p, answers, name, cash: prof.cashAmount });
  };

  const slideStyle = {
    transition: "opacity 0.2s, transform 0.2s",
    opacity: animIn ? 1 : 0,
    transform: animIn ? "translateY(0)" : "translateY(12px)",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#03050a", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16, overflow:"auto" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .onb-card { transition: all .18s; }
        .onb-card:hover { transform: translateY(-3px); }
      `}</style>

      <div style={{ width:"100%", maxWidth:640, ...slideStyle }}>

        {/* ── INTRO SCREEN ── */}
        {isIntro && (
          <div style={{ textAlign:"center", animation:"fadeUp .5s ease" }}>
            {/* Logo */}
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:"0.2em", color:C.blue, marginBottom:32 }}>OPTIFLOW</div>

            {/* Hero */}
            <div style={{ fontSize:64, marginBottom:16, lineHeight:1 }}>📊</div>
            <h1 style={{ fontSize:28, fontWeight:700, color:C.text, marginBottom:8, lineHeight:1.2 }}>
              Your Personal<br/>
              <span style={{ background:"linear-gradient(135deg,#38bdf8,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Trading Platform
              </span>
            </h1>
            <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.8, marginBottom:32, maxWidth:440, margin:"0 auto 32px" }}>
              OptiFlow adapts to your experience level — from complete beginner to professional options trader. Answer 5 quick questions and we'll personalise everything for you.
            </p>

            {/* Feature pills */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:36 }}>
              {["🎓 37 Interactive Lessons","📈 Live Markets","🤖 AI Analysis","⚙️ Options Trading","📉 Backtesting","₿ Crypto","🇮🇳 NSE/BSE"].map(f=>(
                <span key={f} style={{ padding:"6px 14px", background:"#0b0f1a", border:"1px solid #1c2838", borderRadius:20, fontSize:11, color:"#94a3b8" }}>{f}</span>
              ))}
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>What should we call you? (optional)</div>
              <input
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Your name or nickname…"
                style={{ background:"#0b0f1a", border:"1px solid #1c2838", borderRadius:10, padding:"12px 16px", color:C.text, fontSize:14, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box", textAlign:"center", marginBottom:16 }}
                onKeyDown={e=>e.key==="Enter"&&transitionNext(0)}
              />
            </div>

            <button onClick={()=>transitionNext(0)} style={{ padding:"14px 40px", background:"linear-gradient(135deg,#0369a1,#0ea5e9)", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:16, fontFamily:"inherit", boxShadow:"0 8px 32px rgba(14,165,233,0.3)", display:"block", width:"100%" }}>
              Personalise My Experience →
            </button>
            <button onClick={()=>{ setProfile("intermediate"); handleComplete(); }} style={{ marginTop:12, background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:12, fontFamily:"inherit" }}>
              Skip — I'll configure it myself
            </button>
          </div>
        )}

        {/* ── QUESTION SCREENS ── */}
        {q && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            {/* Progress bar */}
            <div style={{ marginBottom:28 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, color:C.muted }}>Question {step + 1} of {totalSteps}</span>
                <span style={{ fontSize:11, color:C.dim }}>{Math.round(progress * 100)}% complete</span>
              </div>
              <div style={{ height:3, background:"#1a2535", borderRadius:2 }}>
                <div style={{ height:3, borderRadius:2, background:"linear-gradient(90deg,#0ea5e9,#a78bfa)", width:((step + 1) / totalSteps * 100)+"%", transition:"width .4s ease" }}/>
              </div>
            </div>

            {/* Question */}
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>{q.emoji}</div>
              <h2 style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:6 }}>{q.question}</h2>
              <p style={{ fontSize:12, color:C.dim }}>{q.subtitle}</p>
            </div>

            {/* Options */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {q.options.map(opt => (
                <button key={opt.value} className="onb-card" onClick={()=>selectAnswer(q.id, opt.value)}
                  style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", background: answers[q.id]===opt.value?"rgba(56,189,248,0.1)":"#0b0f1a", border:"1px solid "+(answers[q.id]===opt.value?C.blue:"#1c2838"), borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit", width:"100%" }}>
                  <span style={{ fontSize:26, flexShrink:0 }}>{opt.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color: answers[q.id]===opt.value?C.blue:C.text, marginBottom:3 }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:C.dim, lineHeight:1.4 }}>{opt.desc}</div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:"50%", border:"2px solid "+(answers[q.id]===opt.value?C.blue:"#1c2838"), background: answers[q.id]===opt.value?C.blue:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {answers[q.id]===opt.value && <span style={{ fontSize:10, color:"#fff" }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Back */}
            {step > 0 && (
              <button onClick={()=>transitionNext(step-1)} style={{ marginTop:16, background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:12, fontFamily:"inherit", display:"block", textAlign:"center", width:"100%" }}>
                ← Go back
              </button>
            )}
          </div>
        )}

        {/* ── RESULT SCREEN ── */}
        {isDone && profile && (
          <div style={{ animation:"fadeUp .5s ease" }}>
            {(() => {
              const prof = PROFILES[profile];
              return (
                <>
                  {/* Header */}
                  <div style={{ textAlign:"center", marginBottom:28 }}>
                    <div style={{ fontSize:56, marginBottom:12 }}>{prof.emoji}</div>
                    <h2 style={{ fontSize:22, fontWeight:700, color:prof.color, marginBottom:6 }}>
                      {name ? `${name}, you're a ` : "You're a "}{prof.label}!
                    </h2>
                    <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6 }}>{prof.description}</p>
                  </div>

                  {/* Profile card */}
                  <div style={{ background: prof.darkBg, border:"1px solid "+prof.color+"44", borderRadius:14, padding:20, marginBottom:16 }}>
                    <div style={{ fontSize:9, color:prof.color, fontWeight:700, letterSpacing:"0.12em", marginBottom:12 }}>YOUR PERSONALISED SETUP</div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                      {[
                        ["Starting Capital",   "$"+PROFILES[profile].cashAmount.toLocaleString(), prof.color],
                        ["Platform Mode",      prof.simplifiedMode?"Simplified":"Full Access", prof.color],
                        ["Starting Point",     profile==="beginner"?"Academy First":"Market Dashboard", C.text],
                        ["Hidden Pages",       prof.hiddenPages.length > 0 ? prof.hiddenPages.length+" advanced pages" : "Nothing hidden", C.text],
                      ].map(([label, val, col]) => (
                        <div key={label} style={{ background:"#06090f", borderRadius:8, padding:"10px 12px" }}>
                          <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:col }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize:9, color:prof.color, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>WHERE TO START</div>
                    {prof.tips.map((tip, i) => (
                      <div key={i} style={{ display:"flex", gap:10, marginBottom:7, alignItems:"flex-start" }}>
                        <span style={{ color:prof.color, flexShrink:0, fontSize:12, marginTop:1 }}>→</span>
                        <span style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>

                  {/* Answer summary */}
                  <div style={{ background:"#0b0f1a", border:"1px solid #1c2838", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
                    <div style={{ fontSize:9, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>YOUR ANSWERS</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {QUESTIONS.map(q => answers[q.id] && (
                        <div key={q.id} style={{ fontSize:10, color:"#94a3b8" }}>
                          <span style={{ color:C.muted }}>{q.emoji} </span>
                          {q.options.find(o=>o.value===answers[q.id])?.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <button onClick={handleComplete}
                    style={{ width:"100%", padding:"16px", background:`linear-gradient(135deg,${prof.color}bb,${prof.color})`, color: profile==="beginner"?"#052e16":profile==="intermediate"?"#001a26":"#2d1b69", border:"none", borderRadius:12, cursor:"pointer", fontWeight:700, fontSize:16, fontFamily:"inherit", boxShadow:`0 8px 32px ${prof.color}44`, marginBottom:10 }}>
                    {profile==="beginner"?"🎓 Start Learning →":profile==="intermediate"?"📈 Enter the Platform →":"🔥 Open Full Platform →"}
                  </button>
                  <button onClick={()=>{ setProfile("intermediate"); handleComplete(); }}
                    style={{ display:"block", width:"100%", textAlign:"center", background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:11, fontFamily:"inherit" }}>
                    Change my profile later in Settings
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}


// ── TRADING JOURNAL ───────────────────────────────────────────────────────────
function TradingJournal({ trades }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ ticker:"", setup:"", entry:"", exit:"", pnl:"", emotion:"Calm", rating:"3", notes:"", result:"Win" });
  const [showForm, setShowForm] = useState(false);
  const [filterEmotion, setFilterEmotion] = useState("All");
  const [aiReview, setAiReview] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const card = { background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:16 };

  const EMOTIONS = ["Calm","Confident","Anxious","FOMO","Greedy","Fearful","Disciplined","Frustrated"];
  const SETUPS   = ["Breakout","Pullback","Reversal","Earnings Play","Momentum","Range Bound","News Catalyst","Technical Pattern"];
  const emotionColor = { Calm:C.blue, Confident:C.green, Anxious:C.yellow, FOMO:C.orange, Greedy:C.orange, Fearful:C.red, Disciplined:C.teal, Frustrated:C.red };

  const addEntry = () => {
    if (!form.ticker.trim()) return;
    setEntries(e => [{ ...form, id:Date.now(), date: new Date().toLocaleDateString() }, ...e]);
    setForm({ ticker:"", setup:"", entry:"", exit:"", pnl:"", emotion:"Calm", rating:"3", notes:"", result:"Win" });
    setShowForm(false);
  };

  const aiAnalyzeJournal = async () => {
    if (!entries.length) return;
    setReviewing(true);
    const summary = entries.slice(0,10).map(e => `${e.date}: ${e.ticker} ${e.result} $${e.pnl} | Emotion: ${e.emotion} | Setup: ${e.setup} | Notes: ${e.notes}`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:"You are a trading coach reviewing a student's journal. Be direct, specific, find patterns in emotions vs results. Under 180 words.",messages:[{role:"user",content:`Analyze these journal entries and find patterns — especially emotional biases leading to losses:\n${summary}`}]})});
      const d = await res.json();
      setAiReview(d.content?.[0]?.text || "");
    } catch(e) { setAiReview("Could not analyze."); }
    setReviewing(false);
  };

  const filtered = filterEmotion === "All" ? entries : entries.filter(e => e.emotion === filterEmotion);
  const inp = { background:"#080c14", border:"1px solid "+C.border, borderRadius:7, padding:"8px 11px", color:C.text, fontSize:12, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:2 }}>📓 Trading Journal</div>
          <div style={{ fontSize:12, color:C.dim }}>Log every trade. Find patterns. Become consistent.</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={aiAnalyzeJournal} disabled={!entries.length||reviewing} style={{ padding:"9px 16px", background:"rgba(167,139,250,0.15)", color:C.purple, border:"1px solid "+C.purple+"44", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11, fontFamily:"inherit" }}>
            {reviewing?"Analyzing…":"🤖 AI Pattern Review"}
          </button>
          <button onClick={()=>setShowForm(s=>!s)} style={{ padding:"9px 18px", background:"linear-gradient(135deg,#0369a1,#0ea5e9)", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit" }}>
            {showForm?"Cancel":"+ Log Trade"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...card, border:"1px solid "+C.blue+"44", marginBottom:16 }}>
          <div style={{ fontSize:9, color:C.blue, fontWeight:700, letterSpacing:"0.1em", marginBottom:14 }}>NEW JOURNAL ENTRY</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }} className="main-grid-3">
            {[["Ticker","ticker","e.g. AAPL"],["Entry Price","entry","e.g. 213.50"],["Exit Price","exit","e.g. 220.00"],["P&L ($)","pnl","e.g. 340"]].map(([label,key,ph])=>(
              <div key={key}>
                <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{label}</div>
                <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph} style={inp}/>
              </div>
            ))}
            <div>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>RESULT</div>
              <select value={form.result} onChange={e=>setForm(f=>({...f,result:e.target.value}))} style={{...inp,cursor:"pointer"}}>
                {["Win","Loss","Break Even"].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>SETUP TYPE</div>
              <select value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))} style={{...inp,cursor:"pointer"}}>
                <option value="">Select…</option>
                {SETUPS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, color:C.muted, marginBottom:6 }}>EMOTION DURING TRADE</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {EMOTIONS.map(em=>(
                <button key={em} onClick={()=>setForm(f=>({...f,emotion:em}))} style={{ padding:"5px 12px", background: form.emotion===em ? (emotionColor[em]||C.blue)+"22":"#0a0e18", border:"1px solid "+(form.emotion===em?(emotionColor[em]||C.blue):C.border), borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, color: form.emotion===em?(emotionColor[em]||C.blue):C.dim, fontFamily:"inherit" }}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>TRADE RATING (1–5 ★)</div>
            <div style={{ display:"flex", gap:4 }}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setForm(f=>({...f,rating:String(n)}))} style={{ width:32,height:32, background: +form.rating>=n?C.yellow+"33":"#0a0e18", border:"1px solid "+(+form.rating>=n?C.yellow:C.border), borderRadius:6, cursor:"pointer", fontSize:14, color:+form.rating>=n?C.yellow:C.dim, fontFamily:"inherit" }}>★</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>NOTES / LESSONS LEARNED</div>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="What went well? What would you do differently? Did emotions affect your decisions?" style={{...inp, height:80, resize:"vertical"}}/>
          </div>
          <button onClick={addEntry} style={{ padding:"10px 24px", background:"linear-gradient(135deg,#14532d,#166534)", color:C.green, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit" }}>Save Entry</button>
        </div>
      )}

      {aiReview && (
        <div style={{ ...card, border:"1px solid "+C.purple+"44", background:"#0a0d1a", marginBottom:14 }}>
          <div style={{ fontSize:9, color:C.purple, fontWeight:700, marginBottom:8 }}>🤖 AI PATTERN ANALYSIS</div>
          <div style={{ fontSize:12, color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{aiReview}</div>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }} className="main-grid-4">
          {[
            ["Total Entries", entries.length, C.blue],
            ["Win Rate", entries.length ? Math.round(entries.filter(e=>e.result==="Win").length/entries.length*100)+"%" : "—", C.green],
            ["Total P&L", "$"+entries.reduce((a,e)=>a+(+e.pnl||0),0).toFixed(0), C.yellow],
            ["Avg Rating", (entries.reduce((a,e)=>a+(+e.rating||3),0)/entries.length).toFixed(1)+"★", C.orange],
          ].map(([label,val,col])=>(
            <div key={label} style={card}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:col }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:9, color:C.muted, alignSelf:"center" }}>Filter by emotion:</span>
        {["All",...EMOTIONS].map(em=>(
          <button key={em} onClick={()=>setFilterEmotion(em)} style={{ padding:"4px 10px", background: filterEmotion===em?"rgba(56,189,248,0.15)":C.card, border:"1px solid "+(filterEmotion===em?C.blue:C.border), borderRadius:5, cursor:"pointer", fontSize:9, fontWeight:700, color: filterEmotion===em?C.blue:C.dim, fontFamily:"inherit" }}>{em}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ ...card, textAlign:"center", padding:"40px 0" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📓</div>
          <div style={{ fontSize:13, color:C.dim }}>No entries yet. Log your first trade above.</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>Professional traders journal every trade — winners and losers alike.</div>
        </div>
      )}
      {filtered.map(e=>(
        <div key={e.id} style={{ ...card, marginBottom:8, borderLeft:"3px solid "+(e.result==="Win"?C.green:e.result==="Loss"?C.red:C.yellow) }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:15 }}>{e.ticker}</span>
              <Badge bg={e.result==="Win"?"#052e16":e.result==="Loss"?"#3b0000":"#1c1a0a"} color={e.result==="Win"?C.green:e.result==="Loss"?C.red:C.yellow}>{e.result}</Badge>
              {e.emotion && <Badge bg={(emotionColor[e.emotion]||C.blue)+"22"} color={emotionColor[e.emotion]||C.blue}>{e.emotion}</Badge>}
              {e.setup && <Badge bg="#0f1422" color={C.dim}>{e.setup}</Badge>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:16, fontWeight:700, color:e.result==="Win"?C.green:e.result==="Loss"?C.red:C.yellow }}>{e.pnl ? (e.result==="Loss"?"-":"+")+e.pnl : "—"}</div>
              <div style={{ fontSize:9, color:C.dim }}>{e.date}</div>
            </div>
          </div>
          {e.notes && <div style={{ fontSize:11, color:"#94a3b8", marginTop:8, lineHeight:1.5, fontStyle:"italic" }}>"{e.notes}"</div>}
          <div style={{ display:"flex", gap:2, marginTop:8 }}>
            {Array.from({length:5}).map((_,i)=><span key={i} style={{ color:i<+e.rating?C.yellow:C.border, fontSize:13 }}>★</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── POSITION SIZER / RISK CALCULATOR ─────────────────────────────────────────
function RiskCalculator() {
  const [capital, setCapital]     = useState(100000);
  const [riskPct, setRiskPct]     = useState(2);
  const [entry, setEntry]         = useState(213.49);
  const [stop, setStop]           = useState(205.00);
  const [target, setTarget]       = useState(230.00);
  const [mode, setMode]           = useState("stocks");
  const [optPremium, setOptPremium] = useState(5.00);
  const card = { background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:16 };

  const riskAmount    = capital * riskPct / 100;
  const riskPerShare  = Math.abs(entry - stop);
  const rewardPerShare = Math.abs(target - entry);
  const rrRatio       = riskPerShare > 0 ? (rewardPerShare / riskPerShare) : 0;
  const shares        = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const positionSize  = shares * entry;
  const pctOfPortfolio = capital > 0 ? (positionSize / capital * 100) : 0;
  const maxProfit     = shares * rewardPerShare;
  const maxLoss       = shares * riskPerShare;
  const optContracts  = optPremium > 0 ? Math.floor(riskAmount / (optPremium * 100)) : 0;
  const optCost       = optContracts * optPremium * 100;
  const kelly         = 0.5 - 0.5 / Math.max(0.01, rrRatio);
  const kellyPct      = Math.max(0, Math.min(25, kelly * 100));

  const inp = { background:"#080c14", border:"1px solid "+C.border, borderRadius:7, padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>🎯 Position Sizer & Risk Calculator</div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>Calculate the exact position size based on your risk tolerance — never risk more than you should</div>

      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["stocks","📈 Stocks"],["options","⚙️ Options"]].map(([id,label])=>(
          <button key={id} onClick={()=>setMode(id)} style={{ padding:"8px 18px", background: mode===id?"rgba(56,189,248,0.15)":C.card, border:"1px solid "+(mode===id?C.blue:C.border), borderRadius:7, cursor:"pointer", fontSize:11, fontWeight:700, color: mode===id?C.blue:C.dim, fontFamily:"inherit" }}>{label}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }} className="main-grid-2">
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={card}>
            <div style={{ fontSize:9, color:C.blue, fontWeight:700, letterSpacing:"0.1em", marginBottom:14 }}>ACCOUNT & RISK</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>ACCOUNT SIZE ($)</div>
                <input type="number" value={capital} onChange={e=>setCapital(+e.target.value)} style={inp}/>
              </div>
              <div>
                <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>RISK PER TRADE (%)</div>
                <input type="number" value={riskPct} onChange={e=>setRiskPct(+e.target.value)} step="0.5" min="0.1" max="10" style={inp}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              {[0.5,1,1.5,2,3,5].map(p=>(
                <button key={p} onClick={()=>setRiskPct(p)} style={{ flex:1, padding:"6px 0", background: riskPct===p?"rgba(56,189,248,0.15)":"#0a0e18", border:"1px solid "+(riskPct===p?C.blue:C.border), borderRadius:5, cursor:"pointer", fontSize:10, fontWeight:700, color: riskPct===p?C.blue:C.dim, fontFamily:"inherit" }}>{p}%</button>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize:9, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:14 }}>TRADE LEVELS</div>
            {[["ENTRY PRICE","entry",entry,C.border],["STOP LOSS","stop",stop,C.red+"66"],["TARGET PRICE","target",target,C.green+"66"]].map(([label,key,val,bc])=>(
              <div key={key} style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{label} ($)</div>
                <input type="number" value={val} step="0.01" onChange={e=>{ if(key==="entry") setEntry(+e.target.value); else if(key==="stop") setStop(+e.target.value); else setTarget(+e.target.value); }} style={{...inp, borderColor:bc}}/>
              </div>
            ))}
            {mode==="options" && (
              <div>
                <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>OPTION PREMIUM ($)</div>
                <input type="number" value={optPremium} step="0.01" onChange={e=>setOptPremium(+e.target.value)} style={inp}/>
              </div>
            )}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...card, border:"1px solid "+C.green+"44", background:"#040e08" }}>
            <div style={{ fontSize:9, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:14 }}>SIZING RESULT</div>
            <div style={{ textAlign:"center", padding:"16px 0", borderBottom:"1px solid "+C.border, marginBottom:14 }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{mode==="options"?"CONTRACTS TO BUY":"SHARES TO BUY"}</div>
              <div style={{ fontSize:48, fontWeight:700, color: mode==="options"?C.blue:C.green, lineHeight:1 }}>{mode==="options"?optContracts:shares.toLocaleString()}</div>
              <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>Position: ${(mode==="options"?optCost:positionSize).toLocaleString(undefined,{maximumFractionDigits:0})}</div>
            </div>
            {(mode==="stocks" ? [
              ["Risk Amount","$"+riskAmount.toFixed(0),C.red],
              ["Max Profit","$"+maxProfit.toFixed(0),C.green],
              ["Max Loss","$"+maxLoss.toFixed(0),C.red],
              ["R:R Ratio","1 : "+rrRatio.toFixed(2),rrRatio>=2?C.green:rrRatio>=1?C.yellow:C.red],
              ["% of Portfolio",pctOfPortfolio.toFixed(1)+"%",pctOfPortfolio>20?C.red:pctOfPortfolio>10?C.yellow:C.green],
            ] : [
              ["Risk Amount","$"+riskAmount.toFixed(0),C.red],
              ["Contracts",optContracts,C.blue],
              ["Total Cost","$"+optCost.toFixed(0),C.yellow],
              ["Max Loss","$"+optCost.toFixed(0),C.red],
            ]).map(([l,v,c])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid "+C.border+"22" }}>
                <span style={{ fontSize:11, color:C.dim }}>{l}</span><span style={{ fontSize:12, fontWeight:700, color:c }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>LEVEL VISUALIZER</div>
            {[["TARGET",target,C.green],["ENTRY",entry,C.blue],["STOP",stop,C.red]].map(([label,price,col])=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:56, fontSize:9, fontWeight:700, color:col, textAlign:"right" }}>{label}</div>
                <div style={{ flex:1, height:2, background:col, opacity:0.4 }}/>
                <div style={{ fontSize:12, fontWeight:700, color:col }}>${price}</div>
              </div>
            ))}
            <div style={{ padding:"8px 12px", background: rrRatio>=2?"#052e16":rrRatio>=1?"#1c1a0a":"#3b0000", borderRadius:6, textAlign:"center", marginTop:8 }}>
              <span style={{ fontSize:11, color: rrRatio>=2?C.green:rrRatio>=1?C.yellow:C.red }}>
                R:R = 1:{rrRatio.toFixed(1)} {rrRatio>=2?"✓ Good":rrRatio>=1?"△ Acceptable":"✗ Poor"}
              </span>
            </div>
          </div>

          <div style={{ ...card, border:"1px solid "+C.teal+"44" }}>
            <div style={{ fontSize:9, color:C.teal, fontWeight:700, letterSpacing:"0.1em", marginBottom:8 }}>KELLY CRITERION</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8, lineHeight:1.5 }}>Based on 50% win rate + {rrRatio.toFixed(1)}:1 R:R</div>
            <div style={{ fontSize:20, fontWeight:700, color:C.teal, marginBottom:4 }}>{kellyPct.toFixed(1)}% of capital</div>
            <div style={{ fontSize:10, color:C.dim }}>= ${(capital*kellyPct/100).toFixed(0)} full Kelly position</div>
            <div style={{ fontSize:10, color:C.yellow, marginTop:6 }}>Half-Kelly (safer): {(kellyPct/2).toFixed(1)}% = ${(capital*kellyPct/200).toFixed(0)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CRYPTO DASHBOARD ──────────────────────────────────────────────────────────
function CryptoDashboard() {
  const [cryptoQuotes, setCryptoQuotes] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [cryptoHistory, setCryptoHistory] = useState([]);
  const card = { background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:16 };

  useEffect(()=>{
    const update = () => {
      const next = {};
      Object.keys(CRYPTO_PRICES).forEach(sym=>{
        const key = "C:"+sym;
        tickPrice(key);
        const s = priceState[key];
        if(!s) return;
        const decimals = ["XRP","ADA","DOGE","MATIC"].includes(sym) ? 4 : 2;
        const price = +s.price.toFixed(decimals);
        const prev  = s.base;
        const change= +(price-prev).toFixed(decimals);
        const pct   = +((change/prev)*100).toFixed(2);
        next[sym]   = { sym, price, prev, change, pct };
      });
      setCryptoQuotes(next);
    };
    update();
    const t = setInterval(update, 3000);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const hist = [];
    const base = CRYPTO_PRICES[selectedCrypto]||1;
    const beta = CRYPTO_BETA[selectedCrypto]||1.4;
    const now  = new Date();
    let price = base * 0.85;
    for(let i=60;i>=0;i--){
      const d = new Date(now); d.setDate(now.getDate()-i);
      if(d.getDay()===0||d.getDay()===6) continue;
      price = price * (1 + (Math.random()-0.47)*0.03*beta);
      const close = +price.toFixed(2);
      hist.push({ date:d.toLocaleDateString([],{month:"short",day:"numeric"}), price:close, close, open:close, high:+(close*1.02).toFixed(2), low:+(close*0.98).toFixed(2), vol:Math.round(1e9+Math.random()*5e9), bullish:true });
    }
    setCryptoHistory(hist);
  },[selectedCrypto]);

  const q = cryptoQuotes[selectedCrypto];
  const up = q ? q.pct >= 0 : true;

  const CRYPTO_INFO = {
    BTC:{ name:"Bitcoin",    desc:"The original cryptocurrency. Digital gold — store of value.",             color:"#f7931a" },
    ETH:{ name:"Ethereum",   desc:"Smart contracts platform powering DeFi, NFTs and Web3.",                 color:"#627eea" },
    SOL:{ name:"Solana",     desc:"High-speed blockchain with low fees and growing ecosystem.",               color:"#9945ff" },
    BNB:{ name:"BNB",        desc:"Binance exchange token used for trading fee discounts.",                   color:"#f3ba2f" },
    XRP:{ name:"XRP",        desc:"Cross-border payment protocol. Fast, cheap international transfers.",     color:"#346aa9" },
    ADA:{ name:"Cardano",    desc:"Research-driven, peer-reviewed proof-of-stake blockchain.",               color:"#0033ad" },
    AVAX:{ name:"Avalanche", desc:"Ultra-fast smart contracts chain. EVM compatible.",                       color:"#e84142" },
    DOGE:{ name:"Dogecoin",  desc:"The original meme coin, now with real merchant adoption.",                color:"#c2a633" },
    LINK:{ name:"Chainlink", desc:"Decentralized oracle network connecting blockchains to real-world data.", color:"#2a5ada" },
    MATIC:{ name:"Polygon",  desc:"Ethereum scaling solution. Processes transactions at a fraction of cost.", color:"#8247e5" },
    DOT:{ name:"Polkadot",   desc:"Interoperability protocol connecting multiple blockchains.",               color:"#e6007a" },
    UNI:{ name:"Uniswap",    desc:"Leading decentralized exchange protocol on Ethereum.",                    color:"#ff007a" },
    ATOM:{ name:"Cosmos",    desc:"Internet of blockchains. Hub for interoperable chains.",                  color:"#2e3148" },
    LTC:{ name:"Litecoin",   desc:"Silver to Bitcoin's gold. Faster, cheaper transactions.",                 color:"#bfbbbb" },
    BCH:{ name:"Bitcoin Cash",desc:"Bitcoin fork focused on peer-to-peer electronic cash.",                  color:"#8dc351" },
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4, flexWrap:"wrap", gap:8 }}>
        <div style={{ fontSize:18, fontWeight:700 }}>₿ Crypto Dashboard</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:9, padding:"3px 8px", background:"#1c1a0a", color:C.yellow, borderRadius:5, border:"1px solid "+C.yellow+"44" }}>
            🟡 Simulated prices — realistic random walk
          </span>
          <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:9, padding:"3px 8px", background:"rgba(56,189,248,0.1)", color:C.blue, borderRadius:5, border:"1px solid "+C.blue+"33", textDecoration:"none" }}>
            Get live prices → CoinGecko API (free)
          </a>
        </div>
      </div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>Live simulated crypto prices — {Object.keys(CRYPTO_PRICES).length} coins tracked</div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:14 }} className="main-grid-2">
        <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:600, overflowY:"auto" }}>
          {Object.keys(CRYPTO_PRICES).map(sym=>{
            const cq = cryptoQuotes[sym];
            const info = CRYPTO_INFO[sym];
            const isSelected = sym===selectedCrypto;
            return (
              <div key={sym} onClick={()=>setSelectedCrypto(sym)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:8, cursor:"pointer", background: isSelected?"rgba(56,189,248,0.08)":C.card, border:"1px solid "+(isSelected?C.blue:C.border), transition:"all .15s" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:info?.color||C.orange, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700 }}>{sym}</div>
                    <div style={{ fontSize:9, color:C.dim }}>{info?.name||sym}</div>
                  </div>
                </div>
                {cq ? (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700 }}>${cq.price.toLocaleString()}</div>
                    <div style={{ fontSize:10, color:cq.pct>=0?C.green:C.red, fontWeight:700 }}>{cq.pct>=0?"+":""}{cq.pct}%</div>
                  </div>
                ) : <div style={{ color:C.muted, fontSize:11 }}>…</div>}
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {q && (
            <div style={{ ...card, border:"1px solid "+(CRYPTO_INFO[selectedCrypto]?.color||C.orange)+"55" }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
                <div style={{ width:16, height:16, borderRadius:"50%", background:CRYPTO_INFO[selectedCrypto]?.color||C.orange }}/>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>{CRYPTO_INFO[selectedCrypto]?.name} ({selectedCrypto})</div>
                </div>
              </div>
              <div style={{ fontSize:32, fontWeight:700, color:up?C.green:C.red, marginBottom:4 }}>${q.price.toLocaleString()}</div>
              <div style={{ fontSize:13, color:up?C.green:C.red, marginBottom:10 }}>{up?"+":""}{q.change} ({up?"+":""}{q.pct}%)</div>
              <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.6 }}>{CRYPTO_INFO[selectedCrypto]?.desc}</div>
            </div>
          )}
          <div style={card}>
            <div style={{ fontSize:9, color:C.muted, marginBottom:8 }}>{selectedCrypto} — 60 DAY PRICE (SIMULATED)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cryptoHistory} margin={{top:4,right:4,left:0,bottom:0}}>
                <defs><linearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={up?C.green:C.red} stopOpacity={0.25}/><stop offset="100%" stopColor={up?C.green:C.red} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="2 4" stroke={C.border}/>
                <XAxis dataKey="date" stroke={C.border} tick={{fontSize:8,fill:C.muted}} interval="preserveStartEnd"/>
                <YAxis stroke={C.border} tick={{fontSize:8,fill:C.muted}} tickFormatter={v=>"$"+v.toLocaleString()}/>
                <Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:6,fontSize:10}} formatter={v=>["$"+Number(v).toLocaleString(),"Price"]}/>
                <Area type="monotone" dataKey="price" stroke={up?C.green:C.red} strokeWidth={2} fill="url(#cryptoGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ ...card, background:"#0a080e", border:"1px solid "+C.purple+"44" }}>
              <div style={{ fontSize:9, color:C.purple, fontWeight:700, marginBottom:8 }}>FEAR & GREED INDEX</div>
              {(()=>{
                const fg = Math.round(35+Math.abs(q?.pct||0)*5+Math.random()*20);
                const capped = Math.min(95, fg);
                const col = capped>70?C.green:capped>50?C.teal:capped>30?C.yellow:C.red;
                const label = capped>70?"Greed":capped>50?"Neutral":capped>30?"Fear":"Extreme Fear";
                return <>
                  <div style={{ fontSize:32, fontWeight:700, color:col }}>{capped}</div>
                  <div style={{ fontSize:12, color:col, marginBottom:6 }}>{label}</div>
                  <div style={{ background:"#1a2535", borderRadius:3, height:6 }}>
                    <div style={{ height:6, borderRadius:3, background:col, width:capped+"%" }}/>
                  </div>
                </>;
              })()}
            </div>
            <div style={{ ...card, background:"#0a0e18" }}>
              <div style={{ fontSize:9, color:C.yellow, fontWeight:700, marginBottom:8 }}>MARKET STATS</div>
              {[["24h Vol","$"+(42+Math.random()*20).toFixed(1)+"B"],["Dominance BTC","52.3%"],["Total Mkt Cap","$2.4T"],["Active Coins","23,000+"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22", fontSize:10 }}>
                  <span style={{ color:C.dim }}>{k}</span><span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage({ cash, setCash, userProfile, onRetakeQuiz }) {
  const [capital, setCapital] = useState(String(cash));
  const [saved, setSaved]     = useState(false);
  const [notifications, setNotifications] = useState({ priceAlerts:true, earnings:true, aiSignals:false, dailyDigest:true });
  const [display, setDisplay] = useState({ showGreeks:true, showVolume:true, animatePrices:true, compactMode:false });
  // Local copies of API config (cosmetic — source change requires code edit)
  const [localConfig, setLocalConfig] = useState({
    useLive:    DATA_CONFIG.USE_LIVE_DATA,
    usProvider: DATA_CONFIG.US_PROVIDER,
    inProvider: DATA_CONFIG.INDIA_PROVIDER,
    finnhubKey: DATA_CONFIG.FINNHUB_KEY === "YOUR_FINNHUB_KEY" ? "" : DATA_CONFIG.FINNHUB_KEY,
    polygonKey: DATA_CONFIG.POLYGON_KEY === "YOUR_POLYGON_KEY" ? "" : DATA_CONFIG.POLYGON_KEY,
    avKey:      DATA_CONFIG.ALPHAVANTAGE_KEY === "YOUR_ALPHAVANTAGE_KEY" ? "" : DATA_CONFIG.ALPHAVANTAGE_KEY,
    upstoxTok:  DATA_CONFIG.UPSTOX_TOKEN === "YOUR_UPSTOX_ACCESS_TOKEN" ? "" : DATA_CONFIG.UPSTOX_TOKEN,
    angelKey:   DATA_CONFIG.ANGEL_KEY === "YOUR_ANGEL_ONE_API_KEY" ? "" : DATA_CONFIG.ANGEL_KEY,
    angelJwt:   DATA_CONFIG.ANGEL_JWT === "YOUR_ANGEL_ONE_JWT_TOKEN" ? "" : DATA_CONFIG.ANGEL_JWT,
  });
  const card = { background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:16 };

  const Toggle = ({ val, onChange }) => (
    <div onClick={onChange} style={{ width:40, height:22, borderRadius:11, background: val?C.blue:"#1a2535", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:3, left: val?21:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
    </div>
  );

  const saveCapital = () => {
    const val = +capital;
    if(val > 0) { setCash(val); setSaved(true); setTimeout(()=>setSaved(false), 2500); }
  };

  const inp = { background:"#080c14", border:"1px solid "+C.border, borderRadius:7, padding:"8px 12px", color:C.text, fontSize:12, outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>⚙️ Settings</div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>Customize your OptiFlow experience</div>

      {/* ── API CONFIGURATION ── */}
      <div style={{ ...card, border:"1px solid "+(DATA_CONFIG.USE_LIVE_DATA ? C.green : C.yellow)+"55", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:9, color: DATA_CONFIG.USE_LIVE_DATA ? C.green : C.yellow, fontWeight:700, letterSpacing:"0.1em", marginBottom:2 }}>
              {DATA_CONFIG.USE_LIVE_DATA ? "🟢 LIVE DATA MODE ACTIVE" : "🟡 SIMULATION MODE — SWITCH TO LIVE DATA"}
            </div>
            <div style={{ fontSize:11, color:C.dim }}>
              {DATA_CONFIG.USE_LIVE_DATA
                ? "Finnhub WebSocket (US real-time) + Alpha Vantage (macro data) · NSE simulation"
                : "All prices are simulated. Set USE_LIVE_DATA = true in the code to go live."}
            </div>
          </div>
          <div style={{ padding:"6px 14px", background: DATA_CONFIG.USE_LIVE_DATA?"#052e16":"#1c1a0a", color: DATA_CONFIG.USE_LIVE_DATA?C.green:C.yellow, borderRadius:8, fontSize:10, fontWeight:700 }}>
            {DATA_CONFIG.USE_LIVE_DATA ? "LIVE" : "SIM"}
          </div>
        </div>

        {/* Active API keys status */}
        {DATA_CONFIG.USE_LIVE_DATA && (
          <div style={{ background:"#060a14", borderRadius:8, padding:12, marginBottom:14, border:"1px solid "+C.border }}>
            <div style={{ fontSize:9, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>CONNECTED APIs</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { name:"Finnhub", key:DATA_CONFIG.FINNHUB_KEY, use:"US real-time WebSocket", color:C.green },
                { name:"Alpha Vantage", key:DATA_CONFIG.ALPHAVANTAGE_KEY, use:"Macro indicators + history", color:C.purple },
                { name:"Upstox (India)", key:DATA_CONFIG.UPSTOX_TOKEN, use:"NSE/BSE — not configured", color:C.muted },
                { name:"Angel One", key:DATA_CONFIG.ANGEL_KEY, use:"NSE — not configured", color:C.muted },
              ].map(api => {
                const configured = api.key && !api.key.startsWith("YOUR_") && api.key.length > 8;
                return (
                  <div key={api.name} style={{ background:configured?"#040e08":"#0a0e18", borderRadius:7, padding:"8px 10px", border:"1px solid "+(configured?C.green+"44":C.border) }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:configured?C.green:C.muted }}>{api.name}</span>
                      <span style={{ fontSize:8, padding:"1px 6px", background:configured?"#052e16":"#1a2535", color:configured?C.green:C.muted, borderRadius:3 }}>
                        {configured ? "✓ Connected" : "Not set"}
                      </span>
                    </div>
                    <div style={{ fontSize:9, color:C.dim }}>{api.use}</div>
                    {configured && <div style={{ fontSize:8, color:C.muted, marginTop:2, fontFamily:"monospace" }}>●●●●●●{api.key.slice(-4)}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:10, fontSize:9, color:C.dim }}>
              To add Upstox or Angel One: sign up at their developer portals, get an access token, and update DATA_CONFIG at the top of the file.
            </div>
          </div>
        )}

        {/* Step-by-step guide */}
        <div style={{ background:"#060a14", borderRadius:8, padding:14, marginBottom:14, border:"1px solid "+C.border }}>
          <div style={{ fontSize:9, color:C.blue, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>HOW TO ENABLE LIVE DATA — 3 STEPS</div>
          {[
            {
              step:"1", title:"Get a free API key",
              desc:"Choose your provider. All have free tiers:",
              links:[
                {label:"Finnhub (US — recommended)", url:"https://finnhub.io", badge:"Free · WebSocket"},
                {label:"Polygon.io (US — best history)", url:"https://polygon.io", badge:"Free delayed / $29 real-time"},
                {label:"Alpha Vantage (US — simple)", url:"https://alphavantage.co", badge:"Free · 25 req/day"},
                {label:"Upstox (India — recommended)", url:"https://upstox.com/developer", badge:"Free with demat"},
                {label:"Angel One SmartAPI (India)", url:"https://smartapi.angelbroking.com", badge:"Free with demat"},
              ]
            },
            {
              step:"2", title:"Edit DATA_CONFIG in the code",
              desc:"At the top of OptiFlow-v9.jsx, find DATA_CONFIG and update:",
              code:`const DATA_CONFIG = {
  USE_LIVE_DATA: true,            // ← Change false → true
  FINNHUB_KEY:  "d1234abcxyz",    // ← Paste your Finnhub key
  US_PROVIDER:  "finnhub",        // finnhub | polygon | alphavantage
  INDIA_PROVIDER: "upstox",       // upstox | angel | simulation
  UPSTOX_TOKEN: "eyJhbGci...",    // ← Paste Upstox access token
};`
            },
            {
              step:"3", title:"Save and reload",
              desc:"The app detects USE_LIVE_DATA and automatically routes all quote and history calls through your chosen provider. Simulation remains as a fallback if the API fails."
            },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", gap:12, marginBottom:14, alignItems:"flex-start" }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:C.blue+"33", border:"1px solid "+C.blue+"66", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.blue, flexShrink:0 }}>{item.step}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:10, color:C.dim, marginBottom:item.links||item.code?8:0, lineHeight:1.5 }}>{item.desc}</div>
                {item.links && item.links.map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.blue, textDecoration:"none" }}>→ {l.label}</a>
                    <span style={{ fontSize:8, padding:"1px 6px", background:"#0f2a40", color:C.teal, borderRadius:4 }}>{l.badge}</span>
                  </div>
                ))}
                {item.code && (
                  <pre style={{ background:"#030508", border:"1px solid "+C.border, borderRadius:6, padding:"10px 12px", fontSize:10, color:C.green, overflowX:"auto", margin:0, lineHeight:1.7 }}>{item.code}</pre>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Current config display */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }} className="main-grid-3">
          {[
            ["USE_LIVE_DATA",  String(DATA_CONFIG.USE_LIVE_DATA),  DATA_CONFIG.USE_LIVE_DATA?C.green:C.yellow],
            ["US_PROVIDER",    DATA_CONFIG.US_PROVIDER,            C.blue],
            ["INDIA_PROVIDER", DATA_CONFIG.INDIA_PROVIDER,         C.orange],
            ["FINNHUB_KEY",    DATA_CONFIG.FINNHUB_KEY.startsWith("YOUR") ? "Not set" : "●●●●●●●●"+DATA_CONFIG.FINNHUB_KEY.slice(-4), DATA_CONFIG.FINNHUB_KEY.startsWith("YOUR")?C.red:C.green],
            ["UPSTOX_TOKEN",   DATA_CONFIG.UPSTOX_TOKEN.startsWith("YOUR") ? "Not set" : "●●●●●●●●"+DATA_CONFIG.UPSTOX_TOKEN.slice(-4), DATA_CONFIG.UPSTOX_TOKEN.startsWith("YOUR")?C.muted:C.green],
            ["POLL_INTERVAL",  (DATA_CONFIG.POLL_INTERVAL_MS/1000)+"s", C.text],
          ].map(([k,v,col])=>(
            <div key={k} style={{ background:"#080c14", borderRadius:7, padding:"8px 10px" }}>
              <div style={{ fontSize:8, color:C.muted, marginBottom:2, fontFamily:"monospace" }}>{k}</div>
              <div style={{ fontSize:11, fontWeight:700, color:col, fontFamily:"monospace" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="main-grid-2">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* ── YOUR PROFILE ── */}
          {userProfile && (()=>{
            const prof = PROFILES[userProfile.profile] || PROFILES.intermediate;
            const QUESTIONS_LABELS = {
              experience:       { label:"Experience",      none:"None",active:"Active trader",stocks:"Stocks only",options:"Tried options" },
              optionsKnowledge: { label:"Options knowledge",none:"None",basics:"Basics",spreads:"Spreads",advanced:"Advanced Greeks" },
              goal:             { label:"Goal",            learn:"Learning",income:"Generate income",growth:"Portfolio growth",hedge:"Hedging" },
              risk:             { label:"Risk appetite",   very_low:"Very conservative",low:"Conservative",medium:"Balanced",high:"Aggressive" },
              market:           { label:"Markets",         us:"US only",india:"India only",both:"US + India",crypto:"All + Crypto" },
            };
            return (
              <div style={{ ...card, border:`1px solid ${prof.color}44`, background: prof.darkBg }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontSize:9, color:prof.color, fontWeight:700, letterSpacing:"0.1em" }}>👤 YOUR PROFILE</div>
                  <button onClick={onRetakeQuiz} style={{ padding:"4px 12px", background:prof.color+"22", color:prof.color, border:`1px solid ${prof.color}44`, borderRadius:6, cursor:"pointer", fontSize:9, fontWeight:700, fontFamily:"inherit" }}>
                    Retake Quiz
                  </button>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                  <span style={{ fontSize:28 }}>{prof.emoji}</span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:prof.color }}>{userProfile.name ? userProfile.name+" · " : ""}{prof.label}</div>
                    <div style={{ fontSize:10, color:C.dim }}>{prof.description}</div>
                  </div>
                </div>
                {/* Answer summary */}
                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
                  {Object.entries(QUESTIONS_LABELS).map(([key, map]) => {
                    const val = userProfile.answers?.[key];
                    if (!val) return null;
                    return (
                      <div key={key} style={{ display:"flex", justifyContent:"space-between", fontSize:10, padding:"4px 0", borderBottom:"1px solid "+C.border+"22" }}>
                        <span style={{ color:C.dim }}>{map.label}</span>
                        <span style={{ color:C.text, fontWeight:700 }}>{map[val] || val}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Switch profile manually */}
                <div style={{ fontSize:9, color:C.muted, marginBottom:6 }}>SWITCH PROFILE</div>
                <div style={{ display:"flex", gap:6 }}>
                  {Object.entries(PROFILES).map(([key, p]) => (
                    <button key={key} onClick={()=>{
                      const updated = { ...userProfile, profile: key };
                      setLocalConfig(c=>({...c}));
                      try { localStorage.setItem("optiflow_profile", JSON.stringify(updated)); } catch{}
                      window.location.reload();
                    }} style={{ flex:1, padding:"7px 4px", background: userProfile.profile===key ? p.color+"22":"#0a0e18", border:`1px solid ${userProfile.profile===key ? p.color : C.border}`, borderRadius:7, cursor:"pointer", fontSize:9, fontWeight:700, color: userProfile.profile===key ? p.color : C.dim, fontFamily:"inherit" }}>
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={card}>
            <div style={{ fontSize:9, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>💰 PAPER TRADING CAPITAL</div>
            <div style={{ fontSize:11, color:C.dim, marginBottom:10, lineHeight:1.5 }}>Set your virtual starting capital. Changes apply immediately to your balance.</div>
            <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
              {[10000,25000,50000,100000,500000].map(v=>(
                <button key={v} onClick={()=>setCapital(String(v))} style={{ flex:1, padding:"7px 4px", background: +capital===v?"rgba(74,222,128,0.15)":"#0a0e18", border:"1px solid "+(+capital===v?C.green:C.border), borderRadius:6, cursor:"pointer", fontSize:9, fontWeight:700, color: +capital===v?C.green:C.dim, fontFamily:"inherit", minWidth:40 }}>
                  ${(v/1000).toFixed(0)}K
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="number" value={capital} onChange={e=>setCapital(e.target.value)} style={{ flex:1, background:"#080c14", border:"1px solid "+C.border, borderRadius:7, padding:"9px 12px", color:C.text, fontSize:13, outline:"none", fontFamily:"inherit" }}/>
              <button onClick={saveCapital} style={{ padding:"9px 18px", background: saved?"#052e16":"linear-gradient(135deg,#14532d,#166534)", color:C.green, border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:11, fontFamily:"inherit" }}>
                {saved?"✓ Saved!":"Apply"}
              </button>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize:9, color:C.purple, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>🔔 NOTIFICATIONS</div>
            {[["priceAlerts","Price Alerts","Notify when watchlist prices hit targets"],["earnings","Earnings Reminders","Alert before earnings reports"],["aiSignals","AI Trade Signals","High-confidence AI signals"],["dailyDigest","Daily Digest","Morning market summary"]].map(([key,label,desc])=>(
              <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid "+C.border+"22" }}>
                <div style={{ flex:1, marginRight:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:10, color:C.dim }}>{desc}</div>
                </div>
                <Toggle val={notifications[key]} onChange={()=>setNotifications(n=>({...n,[key]:!n[key]}))}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={card}>
            <div style={{ fontSize:9, color:C.teal, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>🎨 DISPLAY SETTINGS</div>
            {[["showGreeks","Show Greeks in Chain","Display all Greek columns in options chain"],["showVolume","Show Volume Bars","Volume histogram on price charts"],["animatePrices","Animate Price Ticks","Flash color on price updates"],["compactMode","Compact Mode","Reduce padding for more data density"]].map(([key,label,desc])=>(
              <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid "+C.border+"22" }}>
                <div style={{ flex:1, marginRight:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:10, color:C.dim }}>{desc}</div>
                </div>
                <Toggle val={display[key]} onChange={()=>setDisplay(d=>({...d,[key]:!d[key]}))}/>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize:9, color:C.yellow, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>⌨️ KEYBOARD SHORTCUTS</div>
            {[["M","Market"],["H","Heatmap"],["E","Earnings"],["O","Options"],["T","Trade Builder"],["J","Journal"],["A","Academy"],["C","Crypto"],["?","Tour"]].map(([key,desc])=>(
              <div key={key} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22" }}>
                <span style={{ fontSize:11, color:C.dim }}>{desc}</span>
                <kbd style={{ background:"#1a2535", border:"1px solid "+C.border, borderRadius:4, padding:"2px 8px", fontSize:10, color:C.text, fontFamily:"'Space Mono',monospace" }}>{key}</kbd>
              </div>
            ))}
          </div>

          <div style={{ ...card, background:"linear-gradient(135deg,#0f172a,#1e1a3a)", border:"1px solid "+C.purple+"44" }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.blue, marginBottom:8 }}>OPTIFLOW v14</div>
            {[["Engine","Black-Scholes + SPAN Margin"],["AI Model","Claude claude-sonnet-4-20250514"],["Live Data","Finnhub WS + Alpha Vantage"],["Markets","US (live) · NSE/BSE (sim) · Crypto"],["Courses","6 courses · 37 interactive lessons"],["Pages","19 pages · 8,500+ lines"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22", fontSize:10 }}>
                <span style={{ color:C.muted }}>{k}</span><span style={{ color:C.text }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop:10, fontSize:9, color:C.dim }}>Paper trading only. Not financial advice. For educational use.</div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── STRATEGY BACKTESTER ───────────────────────────────────────────────────────
function BacktesterPage({ quotes }) {
  const [symbol, setSymbol]     = useState("AAPL");
  const [strategy, setStrategy] = useState("SMA_CROSSOVER");
  const [fastPeriod, setFast]   = useState(20);
  const [slowPeriod, setSlow]   = useState(50);
  const [rsiPeriod, setRsiP]    = useState(14);
  const [rsiOB, setRsiOB]       = useState(70);
  const [rsiOS, setRsiOS]       = useState(30);
  const [initCap, setInitCap]   = useState(10000);
  const [posSize, setPosSize]   = useState(10);
  const [running, setRunning]   = useState(false);
  const [result, setResult]     = useState(null);
  const card = { background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:16 };

  const STRATEGIES = [
    { id:"SMA_CROSSOVER",  label:"SMA Crossover",     desc:"Buy when fast SMA crosses above slow SMA. Sell on reverse cross." },
    { id:"RSI",            label:"RSI Mean Reversion", desc:"Buy on oversold (RSI < threshold). Sell on overbought (RSI > threshold)." },
    { id:"BREAKOUT",       label:"20-Day Breakout",    desc:"Buy when price breaks above 20-day high. Exit on 10-day low break." },
    { id:"MACD_CROSS",     label:"MACD Signal Cross",  desc:"Buy when MACD crosses above signal line. Sell on downward cross." },
    { id:"BB_REVERSION",   label:"Bollinger Reversion",desc:"Buy at lower band. Sell at upper band or middle band." },
  ];

  const runBacktest = () => {
    setRunning(true);
    setTimeout(() => {
      // Generate 252 days of price history
      const base = BASE_PRICES[symbol] || 150;
      const beta = BETA[symbol] || 1.0;
      const prices = [base];
      for (let i = 1; i < 252; i++) {
        prices.push(+(prices[prices.length-1] * (1 + (Math.random()-0.48)*0.018*beta)).toFixed(2));
      }

      let cash = initCap, shares = 0, trades = [];
      let equity = [{ day:0, value:initCap, price:prices[0] }];

      // Compute indicators
      const sma = (arr, n, i) => i < n-1 ? null : arr.slice(i-n+1,i+1).reduce((a,b)=>a+b,0)/n;
      const rsiArr = (() => {
        const r = Array(rsiPeriod).fill(null);
        let g=0,l=0;
        for(let i=1;i<=rsiPeriod;i++){const d=prices[i]-prices[i-1];if(d>0)g+=d;else l-=d;}
        let ag=g/rsiPeriod,al=l/rsiPeriod;
        r.push(al===0?100:+(100-100/(1+ag/al)).toFixed(1));
        for(let i=rsiPeriod+1;i<252;i++){const d=prices[i]-prices[i-1];ag=(ag*(rsiPeriod-1)+Math.max(0,d))/rsiPeriod;al=(al*(rsiPeriod-1)+Math.max(0,-d))/rsiPeriod;r.push(al===0?100:+(100-100/(1+ag/al)).toFixed(1));}
        return r;
      })();

      const high20 = i => i < 20 ? null : Math.max(...prices.slice(i-20,i+1));
      const low10  = i => i < 10 ? null : Math.min(...prices.slice(i-10,i+1));

      let inTrade = false;
      let entryPrice = 0;

      for (let i = Math.max(slowPeriod, 50); i < 252; i++) {
        const price = prices[i];
        let signal = null;

        if (strategy === "SMA_CROSSOVER") {
          const fast = sma(prices, fastPeriod, i);
          const fastPrev = sma(prices, fastPeriod, i-1);
          const slow = sma(prices, slowPeriod, i);
          const slowPrev = sma(prices, slowPeriod, i-1);
          if (fast && slow && fastPrev && slowPrev) {
            if (!inTrade && fastPrev <= slowPrev && fast > slow) signal = "buy";
            if (inTrade && fastPrev >= slowPrev && fast < slow) signal = "sell";
          }
        } else if (strategy === "RSI") {
          const rsi = rsiArr[i];
          const rsiPrev = rsiArr[i-1];
          if (rsi && rsiPrev) {
            if (!inTrade && rsiPrev <= rsiOS && rsi > rsiOS) signal = "buy";
            if (inTrade && rsiPrev >= rsiOB && rsi < rsiOB) signal = "sell";
          }
        } else if (strategy === "BREAKOUT") {
          const h20 = high20(i-1);
          const l10 = low10(i-1);
          if (!inTrade && h20 && price > h20) signal = "buy";
          if (inTrade && l10 && price < l10) signal = "sell";
        } else if (strategy === "MACD_CROSS") {
          // simplified: use 12/26 EMA crossover approximation
          const e12 = sma(prices, 12, i);
          const e26 = sma(prices, 26, i);
          const e12p = sma(prices, 12, i-1);
          const e26p = sma(prices, 26, i-1);
          if (e12 && e26 && e12p && e26p) {
            if (!inTrade && (e12p-e26p) <= 0 && (e12-e26) > 0) signal = "buy";
            if (inTrade && (e12p-e26p) >= 0 && (e12-e26) < 0) signal = "sell";
          }
        } else if (strategy === "BB_REVERSION") {
          const mean = sma(prices, 20, i);
          if (mean) {
            const slice = prices.slice(i-20,i+1);
            const std = Math.sqrt(slice.reduce((s,v)=>s+Math.pow(v-mean,2),0)/20);
            const upper = mean + 2*std, lower = mean - 2*std;
            if (!inTrade && price <= lower) signal = "buy";
            if (inTrade && (price >= upper || price >= mean)) signal = "sell";
          }
        }

        if (signal === "buy" && !inTrade) {
          const invest = cash * (posSize / 100);
          shares = Math.floor(invest / price);
          if (shares > 0) {
            cash -= shares * price;
            entryPrice = price;
            inTrade = true;
            trades.push({ type:"BUY", day:i, price, shares });
          }
        } else if (signal === "sell" && inTrade && shares > 0) {
          const proceeds = shares * price;
          const pnl = proceeds - shares * entryPrice;
          cash += proceeds;
          trades.push({ type:"SELL", day:i, price, shares, pnl: +pnl.toFixed(2), pct: +((pnl/(shares*entryPrice))*100).toFixed(1) });
          shares = 0;
          inTrade = false;
        }

        equity.push({ day:i, value:+(cash + shares*price).toFixed(0), price });
      }

      // Close any open position at end
      if (inTrade && shares > 0) {
        const price = prices[251];
        const proceeds = shares * price;
        const pnl = proceeds - shares * entryPrice;
        cash += proceeds;
        trades.push({ type:"SELL", day:251, price, shares, pnl: +pnl.toFixed(2), pct: +((pnl/(shares*entryPrice))*100).toFixed(1), forced:true });
      }

      const finalValue = cash + 0; // all closed
      const totalReturn = +((finalValue - initCap) / initCap * 100).toFixed(2);
      const sellTrades = trades.filter(t=>t.type==="SELL");
      const wins = sellTrades.filter(t=>t.pnl>0);
      const winRate = sellTrades.length ? +(wins.length/sellTrades.length*100).toFixed(0) : 0;
      const avgWin = wins.length ? +(wins.reduce((a,t)=>a+t.pct,0)/wins.length).toFixed(1) : 0;
      const losses = sellTrades.filter(t=>t.pnl<=0);
      const avgLoss = losses.length ? +(losses.reduce((a,t)=>a+t.pct,0)/losses.length).toFixed(1) : 0;
      const buyHold = +((prices[251]-prices[0])/prices[0]*100).toFixed(2);
      const maxDD = (() => {
        let peak = equity[0].value, maxDd = 0;
        for (const e of equity) { if (e.value > peak) peak = e.value; const dd = (peak - e.value) / peak * 100; if (dd > maxDd) maxDd = dd; }
        return +maxDD.toFixed(1);
      })();

      setResult({ totalReturn, winRate, wins:wins.length, losses:losses.length, avgWin, avgLoss, trades:sellTrades.length, buyHold, maxDD, finalValue:+finalValue.toFixed(0), equity, prices, tradeLog:trades.slice(-10).reverse() });
      setRunning(false);
    }, 800);
  };

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>📉 Strategy Backtester</div>
      <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>Test trading strategies on 252 days of simulated historical data</div>

      <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16, alignItems:"start" }} className="main-grid-2">
        {/* Config panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={card}>
            <div style={{ fontSize:9, color:C.blue, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>STRATEGY</div>
            {STRATEGIES.map(s=>(
              <div key={s.id} onClick={()=>setStrategy(s.id)} style={{ padding:"10px 12px", borderRadius:8, cursor:"pointer", background:strategy===s.id?"rgba(56,189,248,0.08)":C.card2, border:"1px solid "+(strategy===s.id?C.blue:C.border), marginBottom:6, transition:"all .15s" }}>
                <div style={{ fontSize:11, fontWeight:700, color:strategy===s.id?C.blue:C.text, marginBottom:2 }}>{s.label}</div>
                <div style={{ fontSize:9, color:C.dim, lineHeight:1.4 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ fontSize:9, color:C.green, fontWeight:700, letterSpacing:"0.1em", marginBottom:12 }}>PARAMETERS</div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>SYMBOL</div>
              <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{ width:"100%", background:"#080c14", border:"1px solid "+C.border, borderRadius:7, padding:"8px 12px", color:C.text, fontSize:12, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                {QUICK.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            {strategy === "SMA_CROSSOVER" && (
              <>
                {[["Fast SMA Period",fastPeriod,setFast,5,50],["Slow SMA Period",slowPeriod,setSlow,10,200]].map(([label,val,set,min,max])=>(
                  <div key={label} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{label}: <strong style={{ color:C.text }}>{val}</strong></div>
                    <input type="range" min={min} max={max} value={val} onChange={e=>set(+e.target.value)} style={{ width:"100%" }}/>
                  </div>
                ))}
              </>
            )}
            {strategy === "RSI" && (
              <>
                {[["RSI Period",rsiPeriod,setRsiP,5,30],["Overbought",rsiOB,setRsiOB,60,90],["Oversold",rsiOS,setRsiOS,10,40]].map(([label,val,set,min,max])=>(
                  <div key={label} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{label}: <strong style={{ color:C.text }}>{val}</strong></div>
                    <input type="range" min={min} max={max} value={val} onChange={e=>set(+e.target.value)} style={{ width:"100%" }}/>
                  </div>
                ))}
              </>
            )}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>INITIAL CAPITAL: <strong style={{ color:C.text }}>${initCap.toLocaleString()}</strong></div>
              <input type="range" min={5000} max={100000} step={5000} value={initCap} onChange={e=>setInitCap(+e.target.value)} style={{ width:"100%" }}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>POSITION SIZE: <strong style={{ color:C.text }}>{posSize}% per trade</strong></div>
              <input type="range" min={5} max={100} step={5} value={posSize} onChange={e=>setPosSize(+e.target.value)} style={{ width:"100%" }}/>
            </div>
            <button onClick={runBacktest} disabled={running} style={{ width:"100%", padding:"12px", background:running?"#1a2535":"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", border:"none", borderRadius:8, cursor:running?"default":"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", boxShadow:running?"none":"0 4px 14px rgba(168,85,247,0.3)" }}>
              {running ? "⏳ Running backtest…" : "▶ Run Backtest"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !running && (
            <div style={{ ...card, textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📉</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.dim, marginBottom:6 }}>Configure and run your backtest</div>
              <div style={{ fontSize:11, color:C.muted }}>252 trading days of simulated data · Multiple strategies</div>
            </div>
          )}
          {running && (
            <div style={{ ...card, textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:36, marginBottom:12, animation:"spin 1s linear infinite", display:"inline-block" }}>⚙️</div>
              <div style={{ fontSize:13, color:C.blue }}>Running backtest on {symbol}…</div>
            </div>
          )}
          {result && !running && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* KPI cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }} className="main-grid-4">
                {[
                  ["Total Return", (result.totalReturn>=0?"+":"")+result.totalReturn+"%", result.totalReturn>=0?C.green:C.red],
                  ["vs Buy & Hold", (result.totalReturn-result.buyHold>=0?"+":"")+(result.totalReturn-result.buyHold).toFixed(1)+"%", result.totalReturn>result.buyHold?C.green:C.red],
                  ["Win Rate",      result.winRate+"%", result.winRate>=50?C.green:C.red],
                  ["Max Drawdown", "-"+result.maxDD+"%", result.maxDD>20?C.red:result.maxDD>10?C.yellow:C.green],
                ].map(([label,val,col])=>(
                  <div key={label} style={card}>
                    <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:col }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Trade stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={card}>
                  <div style={{ fontSize:9, color:C.blue, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>TRADE STATISTICS</div>
                  {[
                    ["Total Trades",    result.trades,            C.text],
                    ["Wins",            result.wins,              C.green],
                    ["Losses",          result.losses,            C.red],
                    ["Avg Win",         "+"+result.avgWin+"%",    C.green],
                    ["Avg Loss",        result.avgLoss+"%",       C.red],
                    ["Final Capital",   "$"+result.finalValue.toLocaleString(), result.totalReturn>=0?C.green:C.red],
                    ["Buy & Hold",      (result.buyHold>=0?"+":"")+result.buyHold+"%", result.buyHold>=0?C.green:C.red],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid "+C.border+"22" }}>
                      <span style={{ fontSize:11, color:C.dim }}>{l}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:c }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>RECENT TRADES</div>
                  {result.tradeLog.filter(t=>t.type==="SELL").slice(0,6).map((t,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid "+C.border+"22" }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700 }}>Day {t.day} · ${t.price}</div>
                        <div style={{ fontSize:9, color:C.dim }}>{t.shares} shares{t.forced?" (forced close)":""}</div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:t.pnl>=0?C.green:C.red }}>
                        {t.pnl>=0?"+":""}${t.pnl?.toFixed(0)} ({t.pct}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity curve */}
              <div style={card}>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", marginBottom:10 }}>EQUITY CURVE — {symbol} · {STRATEGIES.find(s=>s.id===strategy)?.label}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={result.equity.filter((_,i)=>i%5===0)} margin={{top:4,right:8,left:0,bottom:4}}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={result.totalReturn>=0?C.green:C.red} stopOpacity={0.25}/>
                        <stop offset="100%" stopColor={result.totalReturn>=0?C.green:C.red} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke={C.border}/>
                    <XAxis dataKey="day" stroke={C.border} tick={{fontSize:8,fill:C.muted}} tickFormatter={v=>"D"+v}/>
                    <YAxis stroke={C.border} tick={{fontSize:8,fill:C.muted}} tickFormatter={v=>"$"+v.toLocaleString()}/>
                    <Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:6,fontSize:10}} formatter={v=>["$"+Number(v).toLocaleString(),"Portfolio"]}/>
                    <ReferenceLine y={initCap} stroke={C.border} strokeDasharray="4 2" label={{value:"Start",fill:C.dim,fontSize:8,position:"insideLeft"}}/>
                    <Area type="monotone" dataKey="value" stroke={result.totalReturn>=0?C.green:C.red} strokeWidth={2} fill="url(#eqGrad)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:16, fontSize:9, color:C.dim, marginTop:6 }}>
                  <span>Strategy: <strong style={{ color:result.totalReturn>=0?C.green:C.red }}>{result.totalReturn>=0?"+":""}{result.totalReturn}%</strong></span>
                  <span>Buy & Hold: <strong style={{ color:result.buyHold>=0?C.green:C.red }}>{result.buyHold>=0?"+":""}{result.buyHold}%</strong></span>
                  <span>Alpha: <strong style={{ color:(result.totalReturn-result.buyHold)>=0?C.green:C.red }}>{(result.totalReturn-result.buyHold)>=0?"+":""}{(result.totalReturn-result.buyHold).toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── COMMAND PALETTE (Cmd/Ctrl + K) ───────────────────────────────────────────
function CommandPalette({ quotes, onSelectTicker, onNavigate, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const PAGES = [
    { id:"market",     label:"Market Dashboard",    emoji:"📈", desc:"Live prices, sectors, movers" },
    { id:"heatmap",    label:"Market Heatmap",       emoji:"🗺",  desc:"Visual sector heat by % change" },
    { id:"earnings",   label:"Earnings Calendar",    emoji:"📅", desc:"Upcoming earnings + AI insights" },
    { id:"options",    label:"Options Chain",        emoji:"⚙️", desc:"Live options chain + Greeks" },
    { id:"trade",      label:"Strategy Builder",     emoji:"📐", desc:"Build and backtest strategies" },
    { id:"greeks",     label:"Greeks Dashboard",     emoji:"🔢", desc:"Delta, Theta, Vega, Gamma charts" },
    { id:"scanner",    label:"Options Scanner",      emoji:"🔍", desc:"Find high-probability setups" },
    { id:"watchlist",  label:"Watchlist & Alerts",   emoji:"👁",  desc:"Track stocks with price alerts" },
    { id:"portfolio",  label:"Portfolio",            emoji:"💼", desc:"Open positions + P&L" },
    { id:"analytics",  label:"Portfolio Analytics",  emoji:"📊", desc:"Win rate, profit factor, drawdown" },
    { id:"journal",    label:"Trading Journal",      emoji:"📓", desc:"Log trades + AI pattern review" },
    { id:"risk_calc",  label:"Position Sizer",       emoji:"🎯", desc:"Kelly criterion + risk calculator" },
    { id:"backtester", label:"Strategy Backtester",  emoji:"📉", desc:"Test strategies on historical data" },
    { id:"crypto",     label:"Crypto Dashboard",     emoji:"₿",  desc:"15 live crypto prices + Fear index" },
    { id:"ai_hub",     label:"AI Analysis Hub",      emoji:"🤖", desc:"Claude-powered stock analysis" },
    { id:"learn",      label:"Trading Academy",      emoji:"🎓", desc:"37 interactive lessons + AI tutor" },
    { id:"margin",     label:"Margin Calculator",    emoji:"🧮", desc:"SPAN margin + scenario analysis" },
    { id:"settings",   label:"Settings",             emoji:"⚙️", desc:"API keys, profile, preferences" },
  ];

  const q = query.toLowerCase().trim();

  // Match pages
  const matchedPages = q ? PAGES.filter(p =>
    p.label.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    p.id.includes(q)
  ) : PAGES.slice(0, 6);

  // Match tickers
  const matchedTickers = q.length >= 1
    ? [...new Set([...Object.keys(NSE_STOCKS), ...ALL_TICKERS])]
        .filter(s => s.toLowerCase().includes(q))
        .slice(0, 8)
        .map(sym => {
          const qt = quotes[sym];
          return { sym, price: qt?.price, pct: qt?.pct, up: (qt?.pct||0) >= 0, isNSE: sym in NSE_STOCKS };
        })
    : [];

  const [selected, setSelected] = useState(0);
  const totalItems = matchedTickers.length + matchedPages.length;

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s+1, totalItems-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") {
      const t = matchedTickers[selected];
      const p = matchedPages[selected - matchedTickers.length];
      if (t) { onSelectTicker(t.sym); onClose(); }
      else if (p) { onNavigate(p.id); onClose(); }
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:2000, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"12vh" }}
      onClick={onClose}>
      <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:14, width:"100%", maxWidth:580, boxShadow:"0 32px 80px rgba(0,0,0,0.9)", overflow:"hidden" }}
        onClick={e=>e.stopPropagation()}>

        {/* Search input */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderBottom:"1px solid "+C.border }}>
          <span style={{ fontSize:16, color:C.dim }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e=>{ setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Search pages, tickers, commands…"
            style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:16, color:C.text, fontFamily:"inherit" }}
          />
          <kbd style={{ padding:"2px 8px", background:"#1a2535", border:"1px solid "+C.border, borderRadius:5, fontSize:10, color:C.muted }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:400, overflowY:"auto" }}>
          {/* Ticker results */}
          {matchedTickers.length > 0 && (
            <div>
              <div style={{ padding:"8px 18px 4px", fontSize:9, color:C.muted, fontWeight:700, letterSpacing:"0.1em" }}>TICKERS</div>
              {matchedTickers.map((item, i) => (
                <div key={item.sym} onClick={()=>{ onSelectTicker(item.sym); onClose(); }}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 18px", cursor:"pointer", background:selected===i?"rgba(56,189,248,0.1)":"transparent", transition:"background .1s" }}
                  onMouseEnter={()=>setSelected(i)}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:item.isNSE?"rgba(251,146,60,0.15)":"rgba(56,189,248,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:item.isNSE?C.orange:C.blue }}>
                      {item.sym.slice(0,3)}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{item.sym}</div>
                      <div style={{ fontSize:9, color:C.dim }}>{item.isNSE?"NSE":"NYSE/NASDAQ"}</div>
                    </div>
                  </div>
                  {item.price && (
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:item.up?C.green:C.red }}>${item.price}</div>
                      <div style={{ fontSize:10, color:item.up?C.green:C.red }}>{item.up?"+":""}{item.pct}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Page results */}
          {matchedPages.length > 0 && (
            <div>
              <div style={{ padding:"8px 18px 4px", fontSize:9, color:C.muted, fontWeight:700, letterSpacing:"0.1em" }}>
                {q ? "PAGES" : "QUICK NAVIGATION"}
              </div>
              {matchedPages.map((page, i) => {
                const idx = matchedTickers.length + i;
                return (
                  <div key={page.id} onClick={()=>{ onNavigate(page.id); onClose(); }}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px", cursor:"pointer", background:selected===idx?"rgba(56,189,248,0.1)":"transparent", transition:"background .1s" }}
                    onMouseEnter={()=>setSelected(idx)}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"rgba(56,189,248,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                      {page.emoji}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:selected===idx?C.blue:C.text }}>{page.label}</div>
                      <div style={{ fontSize:10, color:C.dim }}>{page.desc}</div>
                    </div>
                    <kbd style={{ padding:"2px 8px", background:"#1a2535", border:"1px solid "+C.border, borderRadius:5, fontSize:9, color:C.muted }}>↵</kbd>
                  </div>
                );
              })}
            </div>
          )}

          {q && matchedTickers.length === 0 && matchedPages.length === 0 && (
            <div style={{ padding:"32px", textAlign:"center", color:C.muted, fontSize:12 }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"8px 18px", borderTop:"1px solid "+C.border, display:"flex", gap:16, fontSize:9, color:C.muted }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
          <span style={{ marginLeft:"auto" }}>⌘K to open anytime</span>
        </div>
      </div>
    </div>
  );
}

// ── LIVE DATA SOURCE BADGE ────────────────────────────────────────────────────
function DataSourceBadge({ quote }) {
  if (!quote) return null;
  const src = quote.source || "";
  if (src.includes("WS")) return <span style={{ fontSize:7, padding:"1px 5px", background:"rgba(74,222,128,0.12)", color:C.green, borderRadius:3, marginLeft:4, fontWeight:700 }}>WS</span>;
  if (src.includes("Finnhub")) return <span style={{ fontSize:7, padding:"1px 5px", background:"rgba(56,189,248,0.1)", color:C.blue, borderRadius:3, marginLeft:4 }}>FH</span>;
  if (src.includes("Alpha")) return <span style={{ fontSize:7, padding:"1px 5px", background:"rgba(167,139,250,0.1)", color:C.purple, borderRadius:3, marginLeft:4 }}>AV</span>;
  return null;
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

  // ── User Profile (from personalization quiz) ──────────────────────────────
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("optiflow_profile");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("optiflow_visited"); } catch { return true; }
  });

  const profile        = userProfile ? (PROFILES[userProfile.profile] || PROFILES.intermediate) : PROFILES.intermediate;
  const profileKey     = userProfile?.profile || "intermediate";
  const userName       = userProfile?.name || "";
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
  const [cash, setCash] = useState(() => {
    try {
      const saved = localStorage.getItem("optiflow_profile");
      if (saved) { const p = JSON.parse(saved); return PROFILES[p.profile]?.cashAmount || 50000; }
    } catch {}
    return 50000;
  });
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);
  const [marketTab, setMarketTab] = useState("sp500");
  const [optTab, setOptTab] = useState("chain");
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [orderTicket, setOrderTicket] = useState(null);
  const [indexHistory, setIndexHistory] = useState({});
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeLotSize, setTradeLotSize] = useState(1);
  const [chainQty, setChainQty] = useState(1);
  const [chainLotSize, setChainLotSize] = useState(1);

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("optiflow_theme") || "dark"; } catch { return "dark"; }
  });
  const T = theme === "light" ? C_LIGHT : C; // active theme colors
  // Note: throughout the app C is used directly; T gives theme-aware access

  // ── Notification center ───────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // ── Economic macro data (Alpha Vantage) ──
  const [econData, setEconData] = useState([
    {label:"Fed Rate",    value:"5.25–5.50%", note:"Check Fed.gov",  color:C.yellow, live:false},
    {label:"CPI (YoY)",   value:"—",          note:"Loading…",       color:C.green,  live:false},
    {label:"GDP Growth",  value:"2.8%",       note:"Q4 2024 est",    color:C.green,  live:false},
    {label:"Unemployment",value:"—",          note:"Loading…",       color:C.teal,   live:false},
    {label:"10Y Treasury",value:"—",          note:"Loading…",       color:C.orange, live:false},
    {label:"USD Index",   value:"~104",       note:"DXY reference",  color:C.blue,   live:false},
  ]);

  const [priceAlerts, setPriceAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("optiflow_alerts") || "{}"); } catch { return {}; }
  });
  const unreadCount = notifications.filter(n => !n.read).length;

  // Save alerts to localStorage when they change
  useEffect(() => {
    try { localStorage.setItem("optiflow_alerts", JSON.stringify(priceAlerts)); } catch {}
  }, [priceAlerts]);

  // Check price alerts every tick
  useEffect(() => {
    Object.entries(priceAlerts).forEach(([sym, alert]) => {
      const q = quotes[sym];
      if (!q) return;
      if (alert.above && q.price >= alert.above && !alert.aboveTriggered) {
        setNotifications(n => [{
          id: Date.now(), type: "alert", sym, msg: `${sym} hit $${q.price} — above alert $${alert.above}`,
          time: new Date().toLocaleTimeString(), read: false
        }, ...n.slice(0, 49)]);
        setPriceAlerts(a => ({ ...a, [sym]: { ...a[sym], aboveTriggered: true } }));
      }
      if (alert.below && q.price <= alert.below && !alert.belowTriggered) {
        setNotifications(n => [{
          id: Date.now(), type: "alert", sym, msg: `${sym} hit $${q.price} — below alert $${alert.below}`,
          time: new Date().toLocaleTimeString(), read: false
        }, ...n.slice(0, 49)]);
        setPriceAlerts(a => ({ ...a, [sym]: { ...a[sym], belowTriggered: true } }));
      }
    });
  }, [quotes]);

  // ── Fetch live macro data from Alpha Vantage (once on mount) ──
  useEffect(() => {
    if (!DATA_CONFIG.USE_LIVE_DATA || !DATA_CONFIG.ALPHAVANTAGE_KEY) return;
    const AV = DATA_CONFIG.ALPHAVANTAGE_KEY;
    const fetchAV = async (fn) => {
      try {
        const r = await fetch(`https://www.alphavantage.co/query?function=${fn}&apikey=${AV}`);
        const d = await r.json();
        return d.data?.[0]?.value || null;
      } catch { return null; }
    };
    const run = async () => {
      // Stagger to respect 5 req/min free limit
      const cpi          = await fetchAV("CPI");
      await new Promise(r => setTimeout(r, 13000));
      const unemployment = await fetchAV("UNEMPLOYMENT");
      await new Promise(r => setTimeout(r, 13000));
      const treasury     = await fetchAV("TREASURY_YIELD&interval=monthly&maturity=10year");
      setEconData(prev => prev.map(e => {
        if (e.label==="CPI (YoY)"    && cpi)          return {...e, value:parseFloat(cpi).toFixed(1)+"%",         note:"Alpha Vantage ●", live:true};
        if (e.label==="Unemployment" && unemployment)  return {...e, value:parseFloat(unemployment).toFixed(1)+"%", note:"Alpha Vantage ●", live:true};
        if (e.label==="10Y Treasury" && treasury)      return {...e, value:parseFloat(treasury).toFixed(2)+"%",     note:"Alpha Vantage ●", live:true};
        return e;
      }));
    };
    run();
  }, []);

  // Seed welcome notification
  useEffect(() => {
    setTimeout(() => {
      setNotifications([{
        id: 1, type:"info",
        msg: DATA_CONFIG.USE_LIVE_DATA
          ? "🟢 Live mode active — Finnhub WS connecting for real-time US prices. Set price alerts on Watchlist."
          : "Welcome to OptiFlow! Set price alerts on the Watchlist page.",
        time: new Date().toLocaleTimeString(), read: false
      }]);
    }, 1500);
  }, []);

  const tickerRef = useRef(ticker);
  tickerRef.current = ticker;

  const showToast = useCallback((msg, type) => { setToast({ msg, type: type || "ok" }); setTimeout(() => setToast(null), 4000); }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const MAP = { m:"market", h:"heatmap", e:"earnings", o:"options", t:"trade", g:"greeks", s:"scanner", w:"watchlist", p:"portfolio", a:"learn", j:"journal", r:"risk_calc", c:"crypto", b:"backtester", "?":"settings" };
    const handle = (ev) => {
      // Cmd+K or Ctrl+K → command palette
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        setCmdOpen(o => !o);
        return;
      }
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (ev.key === "Escape") setCmdOpen(false);
      const key = ev.key.toLowerCase();
      if (MAP[key]) setPage(MAP[key]);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  // ── Seed index sparklines ──
  useEffect(() => {
    const indices = ["SPY", "QQQ", "DIA", "IWM"];
    const h = {};
    const seedSim = () => {
      indices.forEach(s => { initPriceState(s); h[s] = generateHistory(s, "1mo"); });
      setIndexHistory(h);
    };
    if (DATA_CONFIG.USE_LIVE_DATA) {
      // Try live history for sparklines, fall back to sim
      Promise.allSettled(indices.map(s => DataAdapter.fetchHistory(s, "1mo"))).then(results => {
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value) h[indices[i]] = r.value;
          else { initPriceState(indices[i]); h[indices[i]] = generateHistory(indices[i], "1mo"); }
        });
        setIndexHistory(h);
      });
    } else { seedSim(); }
  }, []);

  // ── Initial quote seed + live/sim setup ──
  useEffect(() => {
    // US symbols only — Indian markets stay on simulation (no API key)
    const usSyms   = [...new Set([...QUICK, ...SP500.slice(0, 40), "SPY","QQQ","DIA","IWM"])];
    const nseSyms  = Object.keys(NSE_STOCKS).slice(0, 30);
    const allSyms  = [...usSyms, ...nseSyms];

    if (DATA_CONFIG.USE_LIVE_DATA) {
      // ── Step 1: Seed everything from simulation instantly (no blank screen) ──
      allSyms.forEach(s => initPriceState(s));
      const simSeed = {};
      allSyms.forEach(s => { simSeed[s] = getQuote(s); });
      setQuotes(simSeed);
      setVix(tickVix());

      // ── Step 2: Start WebSocket first (fastest path to live prices) ──
      // Finnhub free tier: subscribe up to 50 symbols on WS
      const wsSymbols = [...new Set([...QUICK, "SPY","QQQ","DIA","IWM","TSLA","NVDA","AMD","GOOGL","META","MSFT","AMZN","AAPL"])].slice(0, 50);
      let ws = null;
      let wsNotified = false;
      try {
        ws = DataAdapter.startStreaming(wsSymbols, (sym, quote) => {
          setQuotes(prev => ({ ...prev, [sym]: quote }));
          if (priceState[sym]) {
            priceState[sym].price = quote.price;
            priceState[sym].base  = quote.prev || quote.price;
          }
          // Notify once when first WS tick arrives
          if (!wsNotified) {
            wsNotified = true;
            setNotifications(n => [{
              id: Date.now(), type:"info",
              msg: `⚡ Finnhub WebSocket connected — real-time trades streaming for ${wsSymbols.length} symbols`,
              time: new Date().toLocaleTimeString(), read: false
            }, ...n.slice(0, 49)]);
          }
        });
      } catch(e) { console.warn("[Live] WS start failed:", e.message); }

      // ── Step 3: Batch-fetch REST quotes for all US symbols ──
      // This gives accurate prev-close for % change calculations
      // Done in background — WS prices take priority once they arrive
      DataAdapter.fetchBatch(usSyms).then(liveQuotes => {
        const count = Object.keys(liveQuotes).length;
        if (count > 0) {
          // Merge: don't overwrite symbols already updated by WS
          setQuotes(prev => {
            const merged = { ...prev };
            Object.entries(liveQuotes).forEach(([sym, q]) => {
              const wsQ = prev[sym];
              const wsIsLive = wsQ?.source?.includes("WS");
              if (!wsIsLive) merged[sym] = q;
              FinnhubAPI._prevClose[sym] = q.prev;
            });
            return merged;
          });
          Object.entries(liveQuotes).forEach(([sym, q]) => {
            if (priceState[sym]) { priceState[sym].price = q.price; priceState[sym].base = q.prev || q.price; }
          });
          // Notify user that live prices loaded
          setNotifications(n => [{
            id: Date.now(), type:"info",
            msg: `✅ Live prices loaded — ${count} US stocks via Finnhub`,
            time: new Date().toLocaleTimeString(), read: false
          }, ...n.slice(0, 49)]);
        } else {
          setNotifications(n => [{
            id: Date.now(), type:"info",
            msg: `⚠️ Finnhub returned no data — using simulated prices. Check your API key.`,
            time: new Date().toLocaleTimeString(), read: false
          }, ...n.slice(0, 49)]);
        }
      });

      // ── Step 4: Polling fallback for symbols not on WS ──
      // Also keeps non-QUICK symbols fresh every 30s
      const pollInterval = setInterval(async () => {
        // Only poll symbols not covered by WS
        const nonWS = usSyms.filter(s => !wsSymbols.includes(s)).slice(0, 10);
        const curTicker = tickerRef.current;
        const toRefresh = [...new Set([curTicker, ...nonWS])].filter(s => !DataAdapter._isIndian(s)).slice(0, 8);
        const fresh = await DataAdapter.fetchBatch(toRefresh);
        if (Object.keys(fresh).length > 0) setQuotes(prev => ({ ...prev, ...fresh }));
        setVix(tickVix()); // VIX: no free real-time API, keep simulated
      }, 30000); // every 30s for non-WS symbols

      // ── Step 5: Simulate NSE symbols (no Indian API) ──
      const nseInterval = setInterval(() => {
        setQuotes(prev => {
          const next = { ...prev };
          nseSyms.forEach(s => { tickPrice(s); next[s] = getQuote(s); });
          return next;
        });
      }, 5000); // NSE ticks every 5s via simulation

      return () => {
        clearInterval(pollInterval);
        clearInterval(nseInterval);
        DataAdapter.stopStreaming();
      };

    } else {
      // ── Pure simulation mode ──
      allSyms.forEach(s => initPriceState(s));
      const initial = {};
      allSyms.forEach(s => { initial[s] = getQuote(s); });
      setQuotes(initial);
      setVix(tickVix());
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
    }
  }, []);

  // ── History fetch for chart (live or sim) ──
  useEffect(() => {
    if (DATA_CONFIG.USE_LIVE_DATA) {
      // Show sim history immediately, replace with live when ready
      initPriceState(ticker);
      setHistory(generateHistory(ticker, histRange));
      DataAdapter.fetchHistory(ticker, histRange).then(liveHistory => {
        if (liveHistory?.length) setHistory(liveHistory);
      });
      // Ensure quote exists
      setQuotes(prev => {
        if (prev[ticker]) return prev;
        initPriceState(ticker);
        return { ...prev, [ticker]: getQuote(ticker) };
      });
      DataAdapter.fetchQuote(ticker).then(q => {
        if (q) setQuotes(prev => ({ ...prev, [ticker]: q }));
      });
    } else {
      initPriceState(ticker);
      setHistory(generateHistory(ticker, histRange));
      setQuotes(prev => { if (prev[ticker]) return prev; return { ...prev, [ticker]: getQuote(ticker) }; });
    }
  }, [ticker, histRange]);

  const getIV = useCallback((sym, vixVal) => {
    const beta = BETA[sym] || 1.2;
    const q = quotes[sym];
    const extra = q ? Math.abs(q.pct / 100) * 0.35 : 0;
    return Math.max(0.08, (vixVal || 20) / 100 * beta * 1.15 + extra);
  }, [quotes]);

  // Fetch live IV from Finnhub for current ticker
  const [liveIVs, setLiveIVs] = useState({});
  useEffect(() => {
    if (!DATA_CONFIG.USE_LIVE_DATA || !DATA_CONFIG.FINNHUB_KEY) return;
    if (liveIVs[ticker]) return; // already fetched
    const fetchIV = async () => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${DATA_CONFIG.FINNHUB_KEY}`);
        if (!r.ok) return;
        const d = await r.json();
        // Finnhub option chain returns atm IV in data array
        const atm = d.data?.find(o => Math.abs(o.strike - (quotes[ticker]?.price || 0)) < 5);
        if (atm?.impliedVolatility) {
          setLiveIVs(prev => ({ ...prev, [ticker]: atm.impliedVolatility }));
        }
      } catch {}
    };
    fetchIV();
  }, [ticker]);

  useEffect(() => {
    const q = quotes[ticker]; if (!q || !vix) return;
    const iv = liveIVs[ticker] || getIV(ticker, vix);
    const T = optExp / 365;
    setCalls(genChain(q.price, iv, T, vix, "call"));
    setPuts(genChain(q.price, iv, T, vix, "put"));
  }, [ticker, quotes, vix, optExp, getIV, liveIVs]);

  const spot = (quotes[ticker]?.price) || BASE_PRICES[ticker] || 150;
  const iv = liveIVs[ticker] || getIV(ticker, vix || 20);
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

  // Live unrealised P&L on open positions
  const liveUnrealPnl = useMemo(() => {
    return +openTrades.reduce((sum, t) => {
      const lp = quotes[t.ticker]?.price || t.spot;
      const move = (lp - t.spot) / t.spot;
      const est = move * t.cost * (t.strategy?.includes("Put") ? -1 : 1) * 2.1;
      return sum + est;
    }, 0).toFixed(0);
  }, [openTrades, quotes]);

  const totalDisplayPnl = totalPnl + liveUnrealPnl;
  const pnlUp = totalDisplayPnl >= 0;

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
    setNotifications(n => [{ id: Date.now(), type:"trade", sym:ticker, msg:`📊 Trade opened: ${ticker} options — $${cartTotal.toFixed(0)} invested`, time:new Date().toLocaleTimeString(), read:false }, ...n.slice(0,49)]);
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
    setNotifications(n => [{ id: Date.now(), type:"trade", sym:t.ticker, msg:`${pnl>=0?"🟢":"🔴"} Position closed: ${t.ticker} — ${pnl>=0?"+":""}$${pnl} P&L`, time:new Date().toLocaleTimeString(), read:false }, ...n.slice(0,49)]);
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

  const ALL_PAGES = [
    ["market","Market"],["heatmap","🗺 Heatmap"],["earnings","📅 Earnings"],
    ["options","Options"],["trade","Builder"],["greeks","Greeks"],
    ["scanner","Scanner"],["watchlist","Watchlist"],
    ["portfolio","Portfolio"],["analytics","📊 Analytics"],
    ["journal","📓 Journal"],["risk_calc","🎯 Sizer"],
    ["crypto","₿ Crypto"],["margin","🧮 Margin"],
    ["ai_hub","🤖 AI Hub"],["learn","🎓 Academy"],
    ["recommender","Recommender"],["settings","⚙️ Settings"],
  ];

  return (
    <div style={{ fontFamily: "'Space Mono',monospace", background: theme==="light"?"#f0f4f8":C.bg, minHeight: "100vh", color: theme==="light"?"#0f172a":C.text, fontSize: 13, transition:"background .3s, color .3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Onboarding */}
      {/* Command Palette */}
      {cmdOpen && (
        <CommandPalette
          quotes={quotes}
          onSelectTicker={(sym) => { selectTicker(sym); setCmdOpen(false); }}
          onNavigate={(pageId) => { setPage(pageId); setCmdOpen(false); }}
          onClose={() => setCmdOpen(false)}
        />
      )}

      {showOnboarding && (
        <PersonalizationOnboarding onComplete={({ profile: p, answers, name, cash: startCash }) => {
          setUserProfile({ profile: p, answers, name, ts: Date.now() });
          setCash(startCash);
          setShowOnboarding(false);
          // Route beginners to Academy, others to Market
          setPage(PROFILES[p]?.startPage || "market");
        }} />
      )}

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
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        *{scrollbar-width:thin;scrollbar-color:#1c2838 transparent}
        *::-webkit-scrollbar{width:4px;height:4px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:#1c2838;border-radius:2px}
        input[type=range]{accent-color:#38bdf8}
        button{transition:opacity .15s,transform .1s}
        button:active:not(:disabled){transform:scale(0.97)}
        .desktop-only{display:inline}
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important}
          .main-grid-2{grid-template-columns:1fr!important}
          .main-grid-3{grid-template-columns:1fr!important}
          .main-grid-4{grid-template-columns:1fr 1fr!important}
          .chain-table{font-size:9px!important}
          .desktop-only{display:none!important}
        }
        @media(min-width:769px){
          .mobile-menu-btn{display:none!important}
          .mobile-nav{display:none!important}
        }
      `}</style>

      {toast && <div style={{ position:"fixed", top:16, right:16, zIndex:999, background:toast.type==="err"?"#450a0a":"#0a2a1a", border:"1px solid "+(toast.type==="err"?C.red:C.green), borderRadius:8, padding:"10px 18px", fontSize:12, fontWeight:700, color:toast.type==="err"?C.red:C.green, boxShadow:"0 8px 32px rgba(0,0,0,0.7)", maxWidth:300, zIndex:1000 }}>{toast.msg}</div>}

      {/* ── TICKER TAPE ── */}
      <div style={{ background:"#060a12", borderBottom:"1px solid "+C.border, overflow:"hidden", height:26, display:"flex", alignItems:"center" }}>
        <style>{`@keyframes tape{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
        <div style={{ display:"flex", gap:0, animation:"tape 55s linear infinite", whiteSpace:"nowrap", willChange:"transform" }}>
          {[...QUICK,...["SPY","QQQ","DIA","IWM","BTC","ETH"],...QUICK,...["SPY","QQQ"]].map((s,i)=>{
            const q = quotes[s];
            const up = q ? q.pct >= 0 : true;
            const isWS = q?.source?.includes("WS");
            return (
              <span key={i} onClick={()=>selectTicker(s)}
                style={{ padding:"0 16px", fontSize:10, color:up?C.green:C.red, borderRight:"1px solid "+C.border+"22", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}>
                {isWS && <span style={{ width:4, height:4, borderRadius:"50%", background:C.green, display:"inline-block" }}/>}
                <span style={{ color:C.dim }}>{s}</span>
                <span style={{ fontWeight:700 }}>{q ? "$"+q.price : "…"}</span>
                {q && <span style={{ fontSize:9 }}>{up?"+":""}{q.pct}%</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderBottom:"1px solid "+C.border, background:"rgba(6,8,15,0.98)", position:"sticky", top:0, zIndex:200, backdropFilter:"blur(20px)" }}>
        {/* Logo */}
        <div onClick={()=>setPage("market")} style={{ fontSize:13, fontWeight:700, color:C.blue, letterSpacing:"0.18em", marginRight:6, cursor:"pointer", flexShrink:0 }}>OPTIFLOW</div>

        {/* Desktop nav — grouped */}
        <div className="desktop-nav" style={{ display:"flex", gap:1, flexWrap:"nowrap", overflowX:"auto", scrollbarWidth:"none", flex:1 }}>
          {/* Markets group — always visible */}
          {[["market","Market"],["heatmap","🗺"],["earnings","📅"],["crypto","₿"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{ ...tabSt(page===id), padding:"5px 9px", fontSize:10 }}>{label}</button>
          ))}
          <div style={{ width:1, height:18, background:C.border, margin:"0 3px", alignSelf:"center" }}/>
          {/* Trading group — hidden for beginners */}
          {!profile.hiddenPages.includes("options") && [["options","Options"],["trade","Builder"],["scanner","Scanner"],["watchlist","Watch"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{ ...tabSt(page===id), padding:"5px 9px", fontSize:10 }}>{label}</button>
          ))}
          {!profile.hiddenPages.includes("options") && <div style={{ width:1, height:18, background:C.border, margin:"0 3px", alignSelf:"center" }}/>}
          {/* Analysis group — hidden for beginners */}
          {[["greeks","Greeks"],["margin","🧮"],["risk_calc","🎯"],["backtester","📉"]].filter(([id])=>!profile.hiddenPages.includes(id)).map(([id,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{ ...tabSt(page===id), padding:"5px 9px", fontSize:10 }}>{label}</button>
          ))}
          {[["greeks","Greeks"],["margin","🧮"],["risk_calc","🎯"],["backtester","📉"]].some(([id])=>!profile.hiddenPages.includes(id)) && <div style={{ width:1, height:18, background:C.border, margin:"0 3px", alignSelf:"center" }}/>}
          {/* Portfolio group */}
          {[["portfolio","Portfolio"],["analytics","📊"],["journal","📓"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{ ...tabSt(page===id), padding:"5px 9px", fontSize:10 }}>{label}</button>
          ))}
          <div style={{ width:1, height:18, background:C.border, margin:"0 3px", alignSelf:"center" }}/>
          {/* AI & Learn */}
          {[["ai_hub","🤖 AI"],["learn","🎓"],["recommender","Recs"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{ ...tabSt(page===id), padding:"5px 9px", fontSize:10 }}>{label}</button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={()=>setMenuOpen(m=>!m)} style={{ padding:"6px 10px", background:"#1a2535", color:C.blue, border:"1px solid "+C.border, borderRadius:6, cursor:"pointer", fontSize:11, fontFamily:"inherit" }}>☰</button>

        {/* Right side */}
        <div style={{ display:"flex", gap:6, alignItems:"center", marginLeft:"auto", flexShrink:0 }}>
          {cart.length>0 && <button style={{ ...btnSt("primary"), padding:"5px 10px", fontSize:9 }} onClick={()=>setPage("options")}>🛒 {cart.length}</button>}

          {/* ── Notification Bell ── */}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setNotifOpen(o=>!o)}
              style={{ padding:"5px 8px", background:notifOpen?"rgba(251,191,36,0.15)":"none", border:"1px solid "+(unreadCount>0?C.yellow:C.border), borderRadius:6, cursor:"pointer", fontSize:13, color:unreadCount>0?C.yellow:C.dim, fontFamily:"inherit", position:"relative" }}
              title={`${unreadCount} notifications`}>
              🔔
              {unreadCount>0 && <span style={{ position:"absolute", top:-4, right:-4, width:16, height:16, borderRadius:"50%", background:C.red, color:"#fff", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadCount}</span>}
            </button>
            {notifOpen && (
              <div style={{ position:"absolute", top:"110%", right:0, width:320, background:C.card, border:"1px solid "+C.border, borderRadius:10, boxShadow:"0 16px 48px rgba(0,0,0,0.8)", zIndex:500 }}>
                <div style={{ padding:"10px 14px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.text }}>Notifications</span>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>setNotifications(n=>n.map(x=>({...x,read:true})))} style={{ fontSize:9, color:C.dim, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Mark all read</button>
                    <button onClick={()=>setNotifOpen(false)} style={{ fontSize:14, color:C.dim, background:"none", border:"none", cursor:"pointer" }}>✕</button>
                  </div>
                </div>
                <div style={{ maxHeight:300, overflowY:"auto" }}>
                  {notifications.length===0 && (
                    <div style={{ padding:"20px", textAlign:"center", color:C.muted, fontSize:11 }}>No notifications yet. Set price alerts on the Watchlist page.</div>
                  )}
                  {notifications.slice(0,20).map(n=>(
                    <div key={n.id} onClick={()=>setNotifications(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x))}
                      style={{ padding:"10px 14px", borderBottom:"1px solid "+C.border+"22", background:n.read?"transparent":"rgba(251,191,36,0.04)", cursor:"pointer", transition:"background .15s" }}>
                      <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{n.type==="alert"?"🔔":n.type==="trade"?"📊":"ℹ️"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:11, color:n.read?C.dim:C.text, lineHeight:1.4 }}>{n.msg}</div>
                          <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{n.time}</div>
                        </div>
                        {!n.read && <div style={{ width:6, height:6, borderRadius:"50%", background:C.yellow, flexShrink:0, marginTop:4 }}/>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"8px 14px", borderTop:"1px solid "+C.border, display:"flex", justifyContent:"space-between" }}>
                  <button onClick={()=>{setPage("watchlist");setNotifOpen(false);}} style={{ fontSize:9, color:C.blue, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Set Price Alerts →</button>
                  <button onClick={()=>setNotifications([])} style={{ fontSize:9, color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Clear all</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Theme toggle ── */}
          <button onClick={()=>{ const next = theme==="dark"?"light":"dark"; setTheme(next); try{localStorage.setItem("optiflow_theme",next);}catch{} }}
            style={{ padding:"5px 8px", background:"none", border:"1px solid "+C.border, borderRadius:6, cursor:"pointer", fontSize:13, color:C.dim, fontFamily:"inherit" }}
            title={theme==="dark"?"Switch to light mode":"Switch to dark mode"}>
            {theme==="dark"?"☀️":"🌙"}
          </button>

          {/* ⌘K Search */}
          <button onClick={()=>setCmdOpen(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:"#0f1422", border:"1px solid "+C.border, borderRadius:6, cursor:"pointer", fontSize:10, color:C.dim, fontFamily:"inherit" }}
            title="Command palette (Cmd+K)">
            <span>🔍</span>
            <span className="desktop-only">Search</span>
            <kbd style={{ padding:"1px 5px", background:"#1a2535", border:"1px solid "+C.border, borderRadius:3, fontSize:8, color:C.muted, fontFamily:"monospace" }}>⌘K</kbd>
          </button>

          <button onClick={()=>setShowOnboarding(true)} style={{ padding:"5px 8px", background:"none", border:"1px solid "+C.border, borderRadius:6, cursor:"pointer", fontSize:11, color:C.dim, fontFamily:"inherit" }} title="Retake quiz">❓</button>

          {userProfile && (
            <div onClick={()=>setPage("settings")} style={{ padding:"4px 10px", background:profile.color+"22", border:"1px solid "+profile.color+"44", borderRadius:6, cursor:"pointer", fontSize:10, fontWeight:700, color:profile.color, display:"flex", alignItems:"center", gap:4 }} title="Your profile">
              {profile.emoji} <span className="desktop-only">{profile.label}</span>
            </div>
          )}

          {/* ── Portfolio P&L ── */}
          {trades.length > 0 && (
            <div onClick={()=>setPage("portfolio")} style={{ borderLeft:"1px solid "+C.border, paddingLeft:8, cursor:"pointer" }} title="Total P&L — click for portfolio">
              <div style={{ fontSize:7, color:C.muted }}>P&L</div>
              <div style={{ fontSize:11, fontWeight:700, color:pnlUp?C.green:C.red }}>{pnlUp?"+":""}${Math.abs(totalDisplayPnl).toLocaleString()}</div>
            </div>
          )}

          <div style={{ borderLeft:"1px solid "+C.border, paddingLeft:8 }}>
            <div style={{ fontSize:7, color:C.muted }}>CASH</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.green }}>${cash.toLocaleString()}</div>
          </div>

          {/* Live data status */}
          {(()=>{
            const wsStatus = DataAdapter._wsStatus;
            const isLive = DATA_CONFIG.USE_LIVE_DATA;
            const dotColor = !isLive ? C.teal : wsStatus==="live" ? C.green : wsStatus==="connecting" ? C.yellow : C.orange;
            const label = !isLive ? "SIM" : wsStatus==="live" ? "LIVE" : wsStatus==="connecting" ? "CONN…" : "POLL";
            const title = !isLive ? "Simulated prices" : wsStatus==="live" ? "Finnhub WebSocket — real-time" : wsStatus==="connecting" ? "Connecting to Finnhub…" : "Polling mode";
            return (
              <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:8, color:dotColor }} title={title}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:dotColor, display:"inline-block", animation:"pulse 2s infinite" }}/>
                <div>
                  <div style={{ fontWeight:700 }}>{label}</div>
                  <div style={{ color:C.dim, fontVariantNumeric:"tabular-nums" }}>{clock.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</div>
                </div>
              </div>
            );
          })()}
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="mobile-nav" style={{ position:"fixed", inset:0, background:"rgba(6,8,15,0.98)", zIndex:300, overflowY:"auto", padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.blue }}>OPTIFLOW</div>
            <button onClick={()=>setMenuOpen(false)} style={{ background:"none", border:"none", color:C.dim, fontSize:24, cursor:"pointer" }}>✕</button>
          </div>
          {/* Profile badge in mobile menu */}
          {userProfile && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:profile.darkBg, border:`1px solid ${profile.color}44`, borderRadius:10, marginBottom:16 }}>
              <span style={{ fontSize:20 }}>{profile.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:profile.color }}>{userName || profile.label}</div>
                <div style={{ fontSize:9, color:C.dim }}>{profile.description}</div>
              </div>
              <button onClick={()=>{setMenuOpen(false);setShowOnboarding(true);}} style={{ padding:"4px 10px", background:profile.color+"22", color:profile.color, border:`1px solid ${profile.color}44`, borderRadius:6, cursor:"pointer", fontSize:9, fontWeight:700, fontFamily:"inherit" }}>
                Change
              </button>
            </div>
          )}
          {[
            ["Markets",   [["market","📈 Market"],["heatmap","🗺 Heatmap"],["earnings","📅 Earnings"],["crypto","₿ Crypto"]]],
            ["Trading",   [["options","⚙️ Options"],["trade","📐 Builder"],["scanner","🔍 Scanner"],["watchlist","👁 Watchlist"]]],
            ["Analysis",  [["greeks","🇬🇷 Greeks"],["margin","🧮 Margin"],["risk_calc","🎯 Risk Calc"],["backtester","📉 Backtest"]]],
            ["Portfolio", [["portfolio","💼 Portfolio"],["analytics","📊 Analytics"],["journal","📓 Journal"]]],
            ["Learn",     [["ai_hub","🤖 AI Hub"],["learn","🎓 Academy"],["recommender","♟ Recommender"]]],
            ["Account",   [["settings","⚙️ Settings"]]],
          ].map(([group, items])=>{
            // Filter hidden pages per profile
            const visible = items.filter(([id]) => !profile.hiddenPages.includes(id));
            if (!visible.length) return null;
            return (
              <div key={group} style={{ marginBottom:16 }}>
                <div style={{ fontSize:8, color:C.muted, fontWeight:700, letterSpacing:"0.12em", marginBottom:8 }}>{group.toUpperCase()}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {visible.map(([id,label])=>(
                    <button key={id} onClick={()=>{setPage(id);setMenuOpen(false);}} style={{ padding:"11px 14px", background:page===id?"rgba(56,189,248,0.15)":"#0f1422", border:"1px solid "+(page===id?C.blue:C.border), borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700, color:page===id?C.blue:C.text, fontFamily:"inherit", textAlign:"left" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "16px 14px" }}>

        {/* ── MARKET ── */}
        {page === "market" && (() => {
          const SECTORS_PERF = [
            {name:"Technology",  syms:["AAPL","MSFT","NVDA","AMD","AVGO"], color:C.blue},
            {name:"Consumer",    syms:["AMZN","TSLA","META","NFLX","MCD"], color:C.green},
            {name:"Finance",     syms:["JPM","BAC","GS","V","MA"],         color:C.yellow},
            {name:"Healthcare",  syms:["LLY","JNJ","UNH","ABBV","MRK"],   color:C.teal},
            {name:"Energy",      syms:["XOM","CVX","COP","SLB","EOG"],     color:C.orange},
            {name:"Industrials", syms:["CAT","DE","HON","RTX","GE"],       color:C.purple},
          ];
          const sectorAvg = (syms) => {
            const vals = syms.map(s => quotes[s]?.pct || 0);
            return +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2);
          };
          const overallSentiment = sortedGain.length ? +(sortedGain.reduce((a,b)=>a+b.pct,0)/sortedGain.length).toFixed(2) : 0;
          const advDecRatio = sortedGain.length ? `${sortedGain.filter(q=>q.pct>=0).length}/${sortedGain.filter(q=>q.pct<0).length}` : "—";

          const econ = econData;

          return (
          <div>
            {/* ── PERSONALIZED WELCOME BANNER ── */}
            {userProfile && (
              <div style={{ background:`linear-gradient(135deg,${profile.darkBg},#06080f)`, border:`1px solid ${profile.color}44`, borderRadius:12, padding:"16px 20px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ fontSize:28 }}>{profile.emoji}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:profile.color, marginBottom:2 }}>
                      {userName ? `Welcome back, ${userName}!` : `Welcome back, ${profile.label}!`}
                    </div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>
                      {profile.tips[0]}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {profile.hiddenPages.length > 0 && (
                    <div style={{ fontSize:10, color:C.muted, padding:"4px 10px", background:"#1a2535", borderRadius:6 }}>
                      🔒 {profile.hiddenPages.length} advanced pages unlocked as you progress
                    </div>
                  )}
                  <button onClick={()=>setPage(profile.startPage === "learn" ? "learn" : "heatmap")}
                    style={{ padding:"6px 14px", background:profile.color+"22", color:profile.color, border:`1px solid ${profile.color}44`, borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
                    {profileKey === "beginner" ? "📚 Go to Academy →" : "🗺 Open Heatmap →"}
                  </button>
                  <button onClick={()=>setShowOnboarding(true)}
                    style={{ padding:"6px 12px", background:"#1a2535", color:C.dim, border:"1px solid "+C.border, borderRadius:8, cursor:"pointer", fontSize:10, fontFamily:"inherit" }}>
                    Change profile
                  </button>
                </div>
              </div>
            )}

            {/* ── BEGINNER QUICK-START ── */}
            {profileKey === "beginner" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }} className="main-grid-3">
                {[
                  { emoji:"📚", title:"Start Learning", desc:"Begin with Stock Market Basics", action:()=>setPage("learn"), color:C.green, bg:"#052e16" },
                  { emoji:"💼", title:"Paper Trade", desc:"Practice with $10,000 virtual cash", action:()=>setPage("portfolio"), color:C.blue, bg:"#0c2a47" },
                  { emoji:"🤖", title:"Ask AI Tutor", desc:"Get any concept explained simply", action:()=>setPage("ai_hub"), color:C.purple, bg:"#1a0f2e" },
                ].map(item => (
                  <div key={item.title} onClick={item.action} style={{ background:item.bg, border:`1px solid ${item.color}44`, borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"all .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=item.color}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=item.color+"44"}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{item.emoji}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:item.color, marginBottom:3 }}>{item.title}</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Live/Sim banner with market hours */}
            {(()=>{
              const now = new Date();
              const etHour = now.getUTCHours() - 4; // EST = UTC-4 (rough, ignores DST)
              const day = now.getUTCDay();
              const marketOpen = day >= 1 && day <= 5 && etHour >= 9.5 && etHour < 16;
              const preMarket  = day >= 1 && day <= 5 && etHour >= 4 && etHour < 9.5;
              const afterHours = day >= 1 && day <= 5 && etHour >= 16 && etHour < 20;
              const sessionLabel = marketOpen ? "🟢 Market Open" : preMarket ? "🟡 Pre-Market" : afterHours ? "🟠 After Hours" : "⚫ Market Closed";
              const sessionColor = marketOpen ? C.green : preMarket ? C.yellow : afterHours ? C.orange : C.muted;
              return (
                <div style={{ background: DATA_CONFIG.USE_LIVE_DATA ? "#071410" : "#0a1220", border:"1px solid "+(DATA_CONFIG.USE_LIVE_DATA ? C.green : C.teal)+"44", borderRadius:8, padding:"8px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10, fontSize:10, flexWrap:"wrap" }}>
                  <span style={{ animation:"pulse 2s infinite", color: DATA_CONFIG.USE_LIVE_DATA ? C.green : C.teal }}>●</span>
                  {DATA_CONFIG.USE_LIVE_DATA ? (
                    <span style={{ color:C.green }}>
                      <strong>LIVE</strong> — Finnhub WebSocket · US stocks real-time · NSE simulation · Black-Scholes options · Paper trading only
                    </span>
                  ) : (
                    <span style={{ color:C.teal }}>Prices <strong>simulated</strong> · Black-Scholes options · Claude AI · Paper trading only · Not financial advice</span>
                  )}
                  <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:9, color:sessionColor, fontWeight:700 }}>{sessionLabel}</span>
                    <button onClick={()=>setPage("heatmap")} style={{ padding:"3px 10px", background:"rgba(45,212,191,0.1)", color:C.teal, border:"1px solid "+C.teal+"44", borderRadius:5, cursor:"pointer", fontSize:9, fontFamily:"inherit" }}>🗺 Heatmap →</button>
                  </div>
                </div>
              );
            })()}

            {/* Market sentiment row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }} className="main-grid-4">
              <div style={{ ...card, gridColumn:"span 1", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <VIXMeter vix={vix} />
              </div>
              <div style={card}>
                <div style={{ fontSize:9, color:C.dim, fontWeight:700, marginBottom:6 }}>MARKET BREADTH</div>
                <div style={{ fontSize:20, fontWeight:700, color:overallSentiment>=0?C.green:C.red, marginBottom:2 }}>{overallSentiment>=0?"+":""}{overallSentiment}%</div>
                <div style={{ fontSize:10, color:C.dim, marginBottom:8 }}>Avg S&P 500 move today</div>
                <div style={{ fontSize:9, color:C.muted }}>Adv/Dec: <span style={{ fontWeight:700, color:C.text }}>{advDecRatio}</span></div>
                <div style={{ background:"#1a2535", borderRadius:3, height:5, marginTop:6 }}>
                  <div style={{ height:5, borderRadius:3, background:overallSentiment>=0?C.green:C.red, width:Math.min(100,Math.abs(overallSentiment)*10+50)+"%" }}/>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize:9, color:C.dim, fontWeight:700, marginBottom:6 }}>FEAR & GREED</div>
                {(()=>{
                  const fg = Math.min(99, Math.max(1, 50 + overallSentiment*8 - (vix-18)*1.5));
                  const col = fg>70?C.green:fg>55?C.teal:fg>45?C.yellow:fg>30?C.orange:C.red;
                  const label = fg>70?"Greed":fg>55?"Mild Greed":fg>45?"Neutral":fg>30?"Mild Fear":"Extreme Fear";
                  return <>
                    <div style={{ fontSize:24, fontWeight:700, color:col, marginBottom:2 }}>{fg.toFixed(0)}</div>
                    <div style={{ fontSize:11, color:col, marginBottom:6 }}>{label}</div>
                    <div style={{ background:"linear-gradient(90deg,#f87171,#fbbf24,#4ade80)", borderRadius:3, height:5, position:"relative" }}>
                      <div style={{ position:"absolute", top:-3, left:Math.max(2,fg-2)+"%", width:8, height:11, background:"#fff", borderRadius:2, border:"1px solid #333" }}/>
                    </div>
                  </>;
                })()}
              </div>
              <div style={card}>
                <div style={{ fontSize:9, color:C.dim, fontWeight:700, marginBottom:8 }}>TODAY'S LEADERS</div>
                {sortedGain.slice(0,3).map(g=>(
                  <div key={g.sym} onClick={()=>selectTicker(g.sym)} style={{ display:"flex", justifyContent:"space-between", marginBottom:5, cursor:"pointer" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.blue }}>{g.sym}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:C.green }}>+{g.pct}%</span>
                  </div>
                ))}
                <div style={{ borderTop:"1px solid "+C.border, paddingTop:5, marginTop:3 }}>
                  {[...sortedGain].reverse().slice(0,2).map(g=>(
                    <div key={g.sym} onClick={()=>selectTicker(g.sym)} style={{ display:"flex", justifyContent:"space-between", marginBottom:3, cursor:"pointer" }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.blue }}>{g.sym}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:C.red }}>{g.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Index cards with sparklines */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }} className="main-grid-4">
              {["SPY","QQQ","DIA","IWM"].map(s => {
                const iq = quotes[s]; const iup = iq ? iq.change>=0 : true;
                return (
                  <div key={s} style={{ ...card, cursor:"pointer", padding:"14px 14px 0", overflow:"hidden", transition:"border-color .15s" }} onClick={()=>selectTicker(s)} onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:9, color:C.dim, fontWeight:700, letterSpacing:"0.08em", marginBottom:2 }}>{INDEX_LABELS[s]}</div>
                        <div style={{ fontSize:10, fontWeight:700, color:C.muted }}>{s}</div>
                      </div>
                      {iq && <div style={{ fontSize:9, fontWeight:700, color:iup?C.green:C.red, background:iup?"#052e16":"#3b0000", padding:"2px 6px", borderRadius:5 }}>{iup?"+":""}{iq.pct}%</div>}
                    </div>
                    {iq ? (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:22, fontWeight:700, color:iup?C.green:C.red }}>${iq.price} <SimTag/><DataSourceBadge quote={iq}/></div>
                        <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{iup?"+":""}{iq.change} · H:${iq.high} · L:${iq.low}</div>
                      </div>
                    ) : <div style={{ color:C.muted, fontSize:11, marginBottom:12 }}>Loading…</div>}
                    <div style={{ margin:"0 -14px" }}><SparklineChart data={indexHistory[s]} color={iup?C.green:C.red} sym={s}/></div>
                  </div>
                );
              })}
            </div>

            {/* Sector performance + search + main grid */}
            <div style={{ ...card, marginBottom:14 }}>
              <div style={{ fontSize:9, color:C.dim, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>SECTOR PERFORMANCE TODAY</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }} className="main-grid-3">
                {SECTORS_PERF.map(sec => {
                  const avg = sectorAvg(sec.syms);
                  const up = avg >= 0;
                  return (
                    <div key={sec.name} onClick={()=>setPage("heatmap")} style={{ padding:"10px 12px", background:C.card2, borderRadius:8, cursor:"pointer", border:"1px solid "+C.border, transition:"border .15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=sec.color} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:sec.color }}>{sec.name}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:up?C.green:C.red }}>{up?"+":""}{avg}%</span>
                      </div>
                      <div style={{ background:"#1a2535", borderRadius:3, height:4 }}>
                        <div style={{ height:4, borderRadius:3, background:up?C.green:C.red, width:Math.min(100, Math.abs(avg)*15+5)+"%" }}/>
                      </div>
                      <div style={{ fontSize:9, color:C.muted, marginTop:4 }}>
                        {sec.syms.slice(0,3).map(s=>{
                          const q = quotes[s]; const up2 = q?.pct>=0;
                          return <span key={s} style={{ marginRight:6, color:up2?C.green:C.red }}>{s} {q?(up2?"+":"")+q.pct+"%":"…"}</span>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Economic Indicators */}
            <div style={{ ...card, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:9, color:C.dim, fontWeight:700, letterSpacing:"0.1em" }}>
                  ECONOMIC INDICATORS
                </div>
                <span style={{ fontSize:8, color: DATA_CONFIG.USE_LIVE_DATA ? C.green : C.muted }}>
                  {DATA_CONFIG.USE_LIVE_DATA ? "●  CPI · Unemployment · 10Y via Alpha Vantage" : "Reference data · enable live API for real values"}
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }} className="main-grid-4">
                {econ.map(e=>(
                  <div key={e.label} style={{ textAlign:"center", padding:"10px 6px", background:C.card2, borderRadius:8, border:"1px solid "+(e.live ? e.color+"44" : C.border) }}>
                    <div style={{ fontSize:9, color:C.muted, marginBottom:4 }}>{e.label}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:e.color, marginBottom:2 }}>{e.value}</div>
                    <div style={{ fontSize:8, color:e.live ? e.color : C.dim }}>{e.note}{e.live ? " ●" : ""}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Search + quick picks + main grid */}
            <div style={{ position:"relative", marginBottom:12 }}>
              <input style={inp} placeholder="🔍  Search ticker (e.g. AAPL, TSLA, RELIANCE)…" value={search} onChange={e=>setSearch(e.target.value)} />
              {searchResults && (
                <div style={{ position:"absolute", top:"100%", left:0, right:0, background:C.card, border:"1px solid "+C.border, borderRadius:8, zIndex:50, maxHeight:220, overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.7)" }}>
                  {searchResults.map(s => {
                    const sq = quotes[s]; if(!sq){initPriceState(s);} const freshQ = sq||getQuote(s); const up2=freshQ.change>=0;
                    return <div key={s} onClick={()=>{setTicker(s);setSearch("");setPage("options");}} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid "+C.border+"22", fontSize:12, fontWeight:700, color:C.blue, display:"flex", justifyContent:"space-between" }}>
                      <span>{s}</span><span style={{ color:up2?C.green:C.red }}>${freshQ.price} {freshQ.pct>=0?"+":""}{freshQ.pct}%</span>
                    </div>;
                  })}
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16, paddingBottom:4, scrollbarWidth:"none" }}>
              {QUICK.map(s => {
                const tq = quotes[s];
                const tup = tq ? tq.change >= 0 : true;
                const isSelected = ticker === s;
                const ivEst = tq ? Math.max(8, (vix||20)/100*(BETA[s]||1.2)*115) : 0;
                return (
                  <div key={s} style={{ position:"relative", flexShrink:0 }}
                    onMouseEnter={e => { const t = e.currentTarget.querySelector(".ticker-detail"); if(t) t.style.display = "block"; }}
                    onMouseLeave={e => { const t = e.currentTarget.querySelector(".ticker-detail"); if(t) t.style.display = "none"; }}>
                    <div onClick={()=>selectTicker(s)}
                      style={{ padding:"8px 12px", background:isSelected?"rgba(56,189,248,0.1)":C.card, border:"1px solid "+(isSelected?C.blue:C.border), borderRadius:7, cursor:"pointer", minWidth:90, transition:"all .15s" }}>
                      <div style={{ fontWeight:700, color:isSelected?C.blue:C.text, fontSize:11 }}>{s}</div>
                      {tq ? (
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:tup?C.green:C.red }}>${tq.price}</div>
                          <div style={{ fontSize:10, color:tup?C.green:C.red }}>{tup?"+":""}{tq.pct}%</div>
                        </div>
                      ) : <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>…</div>}
                    </div>
                    {/* Hover detail popup */}
                    <div className="ticker-detail" style={{ display:"none", position:"absolute", top:"110%", left:"50%", transform:"translateX(-50%)", width:200, background:C.card, border:"1px solid "+C.border, borderRadius:10, padding:12, zIndex:100, boxShadow:"0 16px 48px rgba(0,0,0,0.8)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontWeight:700, fontSize:14, color:C.blue }}>{s}</span>
                        <DataSourceBadge quote={tq}/>
                      </div>
                      {tq && (
                        <>
                          <div style={{ fontSize:20, fontWeight:700, color:tup?C.green:C.red, marginBottom:6 }}>${tq.price}</div>
                          {[
                            ["Change",    (tup?"+":"")+tq.change+" ("+tq.pct+"%)", tup?C.green:C.red],
                            ["Day High",  "$"+tq.high,  C.text],
                            ["Day Low",   "$"+tq.low,   C.text],
                            ["Volume",    (tq.vol/1e6).toFixed(1)+"M", C.dim],
                            ["IV Est",    ivEst.toFixed(0)+"%", C.yellow],
                          ].map(([l,v,c]) => (
                            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid "+C.border+"22" }}>
                              <span style={{ fontSize:10, color:C.dim }}>{l}</span>
                              <span style={{ fontSize:10, fontWeight:700, color:c }}>{v}</span>
                            </div>
                          ))}
                          <div style={{ display:"flex", gap:6, marginTop:10 }}>
                            <button onClick={()=>selectTicker(s)} style={{ flex:1, padding:"6px 4px", background:"rgba(56,189,248,0.15)", color:C.blue, border:"1px solid "+C.blue+"44", borderRadius:6, cursor:"pointer", fontSize:9, fontWeight:700, fontFamily:"inherit" }}>
                              ⚙️ Options
                            </button>
                            <button onClick={()=>{ setCmdOpen(true); }} style={{ flex:1, padding:"6px 4px", background:"rgba(167,139,250,0.1)", color:C.purple, border:"1px solid "+C.purple+"33", borderRadius:6, cursor:"pointer", fontSize:9, fontWeight:700, fontFamily:"inherit" }}>
                              🤖 Analyse
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }} className="main-grid-2">
              <div>
                <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
                  {[["sp500","S&P 500"],["nasdaq","NASDAQ 100"],["nse","NSE India"],["gainers","🚀 Gainers"],["losers","📉 Losers"]].map(([id,label])=>(
                    <button key={id} style={tabSt(marketTab===id)} onClick={()=>setMarketTab(id)}>{label}</button>
                  ))}
                </div>
                {(marketTab==="sp500"||marketTab==="nasdaq") && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))", gap:8 }}>
                    {(marketTab==="sp500"?SP500:NASDAQ_EXTRA).slice(0,80).map(s=>{
                      const sq=quotes[s]; const sup=sq?sq.change>=0:true;
                      return <div key={s} onClick={()=>selectTicker(s)} style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:8, padding:10, cursor:"pointer", transition:"all .15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.background="#0f1730";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card2;}}>
                        <div style={{ fontWeight:700, fontSize:11 }}>{s}</div>
                        {sq?(<div><div style={{ fontSize:12, fontWeight:700, color:sup?C.green:C.red }}>${sq.price}</div><div style={{ fontSize:9, color:sup?C.green:C.red }}>{sup?"+":""}{sq.pct}%</div></div>):<div style={{ fontSize:10, color:C.muted, marginTop:4 }}>—</div>}
                      </div>;
                    })}
                  </div>
                )}
                {marketTab==="nse" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
                    {Object.entries(NSE_STOCKS).map(([sym])=>{
                      const sq=quotes[sym]; const sup=sq?sq.change>=0:true;
                      return <div key={sym} onClick={()=>{setTicker(sym);setPage("options");}} style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:8, padding:10, cursor:"pointer", transition:"all .15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.orange;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                        <div style={{ fontWeight:700, fontSize:10, color:C.orange }}>{sym}</div>
                        {sq?(<div><div style={{ fontSize:11, fontWeight:700, color:sup?C.green:C.red }}>₹{sq.price.toLocaleString("en-IN")}</div><div style={{ fontSize:9, color:sup?C.green:C.red }}>{sup?"+":""}{sq.pct}%</div></div>):<div style={{ fontSize:9, color:C.muted, marginTop:4 }}>—</div>}
                      </div>;
                    })}
                  </div>
                )}
                {(marketTab==="gainers"||marketTab==="losers") && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {(marketTab==="gainers"?sortedGain:[...sortedGain].reverse()).slice(0,10).map(gq=>{
                      const gup=gq.pct>=0;
                      return <div key={gq.sym} onClick={()=>selectTicker(gq.sym)} style={{ ...card, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>{gq.sym} <SimTag/></div>
                          <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>Vol: {(gq.vol/1e6).toFixed(1)}M</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:20, fontWeight:700, color:gup?C.green:C.red }}>${gq.price}</div>
                          <div style={{ color:gup?C.green:C.red, fontWeight:700 }}>{gup?"+":""}{gq.pct}%</div>
                        </div>
                      </div>;
                    })}
                  </div>
                )}
              </div>
              <MarketNews vix={vix} quotes={quotes} />
            </div>
          </div>
          );
        })()}

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
                  {q && <Badge bg={liveIVs[ticker]?"#0a1f1e":"#0f1a2c"} color={liveIVs[ticker]?C.teal:C.blue} size={10}>{liveIVs[ticker]?"LIVE ":""}IV {ivPct}%</Badge>}
                  <SimTag />
                  <DataSourceBadge quote={q} />
                </div>
                {q && <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.dim, flexWrap: "wrap", alignItems: "baseline" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: up ? C.green : C.red }}>${q.price}</span>
                  <span>H: ${q.high}</span><span>L: ${q.low}</span><span>Prev: ${q.prev}</span>
                </div>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select style={Object.assign({}, sel, { width: 80 })} value={histRange} onChange={e => setHistRange(e.target.value)}>
                  {["1mo","3mo","6mo","1y","2y"].map(r => <option key={r}>{r}</option>)}
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
              {[7,14,21,30,45,60,90].map(d => <button key={d} style={tabSt(optExp === d)} onClick={() => setOptExp(d)}>{d}d</button>)}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              {[["chain","Chain"],["smile","IV Smile"]].map(([id, label]) => <button key={id} style={tabSt(optTab === id)} onClick={() => setOptTab(id)}>{label}</button>)}
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
                      <thead><tr style={{ borderBottom: "1px solid " + C.border }}>{["","Strike","Bid","Ask","Last","IV%","Delta","Gamma","Theta","Vega","Vol","OI","Action"].map((h, i) => <th key={i} style={{ padding: "6px 8px", color: C.dim, textAlign: i < 2 ? "left" : "right", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
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
                    <XAxis dataKey="strike" type="number" domain={["auto","auto"]} stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => "$" + v} />
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
              {q && <Badge bg={liveIVs[ticker]?"#0a1f1e":"#0f1a2c"} color={liveIVs[ticker]?C.teal:C.blue} size={10}>{liveIVs[ticker]?"LIVE ":""}IV {ivPct}%</Badge>}
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
                    {[["IV",ivPct+"%",C.yellow],["VIX",vix?vix.toFixed(1):"—",vix&&vix<20?C.green:C.yellow],["Max Profit","$"+payoff.maxProfit.toFixed(0),C.green],["Max Loss","$"+Math.abs(payoff.maxLoss).toFixed(0),C.red],["Net Cost","$"+Math.abs(payoff.cost).toFixed(0),C.text],["BE",payoff.breakevens.length?payoff.breakevens.join(", "):"—",C.teal]].map(([label,val,col]) => (<div key={label} style={{ background: "#080c14", borderRadius: 7, padding: "8px 10px" }}><div style={{ fontSize: 9, color: C.muted }}>{label}</div><div style={{ fontSize: 12, fontWeight: 700, color: col, marginTop: 2 }}>{val}</div></div>))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                    {[["Delta",payoff.greeks.delta,C.blue],["Gamma",payoff.greeks.gamma,C.purple],["Theta",payoff.greeks.theta,C.orange],["Vega",payoff.greeks.vega,C.teal]].map(([label,val,col]) => (<div key={label} style={{ background: "#080c14", borderRadius: 7, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 10, color: C.muted }}>{label}</span><span style={{ fontSize: 12, fontWeight: 700, color: col }}>{val.toFixed(3)}</span></div>))}
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
        {page === "watchlist" && <WatchlistPage quotes={quotes} vix={vix} onSelectTicker={selectTicker} priceAlerts={priceAlerts} setPriceAlerts={setPriceAlerts} />}

        {/* ── PORTFOLIO ── */}
        {page === "portfolio" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Paper Portfolio</div>
              <button onClick={()=>setPage("analytics")} style={{ padding:"8px 16px", background:"rgba(167,139,250,0.15)", color:C.purple, border:"1px solid "+C.purple+"44", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:11, fontFamily:"inherit" }}>
                📊 Full Analytics →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }} className="main-grid-4">
              {[
                {l:"Cash",        v:"$"+cash.toLocaleString(),                                                     c:C.green},
                {l:"Open",        v:openTrades.length,                                                             c:C.blue},
                {l:"Live P&L",    v:(liveUnrealPnl>=0?"+":"")+"$"+Math.abs(liveUnrealPnl).toLocaleString(),       c:liveUnrealPnl>=0?C.green:C.red},
                {l:"Closed P&L",  v:(totalPnl>=0?"+":"")+"$"+totalPnl.toFixed(0),                                c:totalPnl>=0?C.green:C.red},
                {l:"Win Rate",    v:closedTrades.length?Math.round(closedTrades.filter(t=>t.pnl>0).length/closedTrades.length*100)+"%":"—", c:C.yellow},
              ].map(item => (<div key={item.l} style={card}><div style={{ fontSize: 9, color: C.muted }}>{item.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: item.c, marginTop: 4 }}>{item.v}</div></div>))}
            </div>
            {pnlChartData.length > 0 && (<div style={Object.assign({}, card, { marginBottom: 14 })}><div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 8 }}>CUMULATIVE P&L CHART</div><ResponsiveContainer width="100%" height={180}><AreaChart data={pnlChartData} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}><defs><linearGradient id="cpnl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={totalPnl >= 0 ? C.green : C.red} stopOpacity={0.3} /><stop offset="100%" stopColor={totalPnl >= 0 ? C.green : C.red} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="2 4" stroke={C.border} /><XAxis dataKey="name" stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} /><YAxis stroke={C.border} tick={{ fontSize: 9, fill: C.muted }} tickFormatter={v => "$" + v} /><Tooltip contentStyle={{ background: C.card, border: "1px solid " + C.border, borderRadius: 6, fontSize: 11 }} formatter={v => ["$" + v]} /><ReferenceLine y={0} stroke={C.border} strokeDasharray="4 2" /><Area type="monotone" dataKey="cumPnl" stroke={totalPnl >= 0 ? C.green : C.red} strokeWidth={2} fill="url(#cpnl)" dot={false} name="Cumulative P&L" /></AreaChart></ResponsiveContainer></div>)}
            <div style={Object.assign({}, card, { marginBottom: 12 })}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, marginBottom: 12 }}>OPEN POSITIONS ({openTrades.length})</div>
              {!openTrades.length && <div style={{ color: C.muted, textAlign: "center", padding: "28px 0", fontSize: 12 }}>No open positions. Use Options Chain or Strategy Builder to place paper trades.</div>}
              {openTrades.map(t => <TradeRow key={t.id} trade={t} liveQuote={quotes[t.ticker]} onClose={() => handleClose(t.id)} />)}
            </div>
            {closedTrades.length > 0 && (<div style={card}><div style={{ fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 12 }}>CLOSED TRADES ({closedTrades.length})</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}><thead><tr style={{ borderBottom: "1px solid " + C.border }}>{["Date","Ticker","Strategy","Entry","Cost","P&L","Result"].map(h => <th key={h} style={{ padding: "6px 10px", color: C.muted, textAlign: "left", fontSize: 9, letterSpacing: "0.08em" }}>{h}</th>)}</tr></thead><tbody>{closedTrades.map(t => (<tr key={t.id} style={{ borderBottom: "1px solid " + C.border + "22" }}><td style={{ padding: "8px 10px" }}>{t.closeDate}</td><td style={{ padding: "8px 10px", fontWeight: 700 }}>{t.ticker}</td><td style={{ padding: "8px 10px", color: C.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.strategy}</td><td style={{ padding: "8px 10px" }}>${t.spot}</td><td style={{ padding: "8px 10px" }}>${t.cost.toFixed(0)}</td><td style={{ padding: "8px 10px", fontWeight: 700, color: t.pnl >= 0 ? C.green : C.red }}>{t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}</td><td style={{ padding: "8px 10px" }}><Badge bg={t.pnl >= 0 ? "#052e16" : "#3b0000"} color={t.pnl >= 0 ? C.green : C.red}>{t.pnl >= 0 ? "WIN" : "LOSS"}</Badge></td></tr>))}</tbody></table></div></div>)}
          </div>
        )}

        {page === "learn" && <LearnPage userProfile={userProfile} />}
        {page === "ai_hub"     && <AIAnalysisHub quotes={quotes} vix={vix} ticker={ticker} spot={spot} ivPct={ivPct} history={history} up={up} />}
        {page === "margin"     && <MarginCalculatorPage spot={spot} vix={vix} ticker={ticker} iv={iv} chain={chain} />}
        {page === "recommender"&& <RecommenderPage onSelectStrategy={selectStrategy} />}
        {page === "journal"    && <TradingJournal trades={trades} />}
        {page === "backtester" && <BacktesterPage quotes={quotes} />}
        {page === "risk_calc"  && <RiskCalculator />}
        {page === "crypto"     && <CryptoDashboard />}
        {page === "heatmap"    && <HeatmapPage quotes={quotes} onSelectTicker={selectTicker} vix={vix} />}
        {page === "earnings"   && <EarningsCalendar quotes={quotes} onSelectTicker={selectTicker} />}
        {page === "analytics"  && <PortfolioAnalytics trades={trades} quotes={quotes} cash={cash} />}
        {page === "settings"   && <SettingsPage cash={cash} setCash={setCash} userProfile={userProfile} onRetakeQuiz={()=>setShowOnboarding(true)} />}

      </div>
    </div>
  );
}
