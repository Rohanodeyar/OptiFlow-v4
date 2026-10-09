# OptiFlow – Options Trading Simulator

**Live demo:** https://opti-flow-v4.vercel.app

OptiFlow is a browser-based paper-trading platform for US equity options. It prices options with Black-Scholes, shows the Greeks in real time, and lets you build, stress-test and track multi-leg strategies with virtual capital ($50,000 starting cash). A built-in academy of 37 lessons teaches the concepts behind every screen.

> Educational project. Paper trading only. Not investment advice.

## Features

| Area | What it does |
|---|---|
| **Options pricing** | Black-Scholes pricing for calls and puts with delta, gamma, theta and vega; full options chain with implied volatility by strike |
| **Strategy Builder** | 12 strategies (long calls/puts, bull and bear spreads, straddle, strangle, covered call, protective put, butterfly, iron condor); payoff diagrams, max profit / max loss, breakevens and scenario P&L; a rule-based trade evaluation (expected value, probability of profit, reward/risk, IV rank, VIX regime) |
| **Greeks Dashboard** | How delta, gamma, theta and vega change with price and time to expiry |
| **Margin Calculator** | SPAN-style margin estimate with scenario analysis |
| **Order ticket** | Market, limit, stop-loss, bracket, cover and GTT orders |
| **Market data** | Market dashboard, sector heatmap, news with sentiment scoring, earnings calendar with implied-move vs historical-volatility comparison, crypto dashboard |
| **Analysis Hub** | Technical, volatility and risk analysis for any ticker: RSI, MACD, moving averages, Bollinger Bands, historical vs implied volatility, drawdown and peer comparison |
| **Scanner & watchlist** | Screens for high/low IV and momentum set-ups; price alerts |
| **Risk & performance** | Portfolio P&L, analytics (win rate, profit factor, expectancy, drawdown), Kelly-criterion position sizer, strategy backtester and a trading journal with pattern review |
| **Trading Academy** | 37 lessons from market basics to the Greeks and multi-leg strategies, quizzes, glossary and a concept explainer |

## Tech stack

React 19 · Vite · Recharts · JavaScript (no backend). Market data from Finnhub (real-time US quotes and news) and Alpha Vantage (daily history), with a built-in price simulator as fallback.

## Run locally

```bash
npm install
cp .env.example .env     # optional: add free API keys for live data
npm run dev
```

### Live vs simulated data

Without API keys the app runs entirely on simulated prices (marked **SIM**). To use live US market data, create free keys at [finnhub.io](https://finnhub.io) and [alphavantage.co](https://www.alphavantage.co) and set them as environment variables (locally in `.env`, or in your hosting provider's project settings):

```
VITE_FINNHUB_KEY=your_key
VITE_ALPHAVANTAGE_KEY=your_key
```

Indian market (NSE) prices are simulated.

## Project structure

```
src/
  main.jsx       entry point
  OptiFlow.jsx   application (pricing engine, data layer, pages and components)
  index.css      global styles
```

## Author

Rohan Odeyar · MSc Investments, University of Birmingham
