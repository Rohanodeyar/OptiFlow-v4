# OptiFlow – Options Trading Simulator

![Tests](https://github.com/Rohanodeyar/OptiFlow-v4/actions/workflows/test.yml/badge.svg)

**Live demo:** https://opti-flow-v4.vercel.app

OptiFlow is a browser-based paper-trading platform for US equity options. It prices options with Black-Scholes, shows the Greeks in real time, and lets you build, stress-test and track multi-leg strategies with virtual capital ($50,000 starting cash). A built-in academy of 37 lessons teaches the concepts behind every screen.

> Educational project. Paper trading only. Not investment advice.

## Features

| Area | What it does |
|---|---|
| **Options pricing** | Black-Scholes pricing for calls and puts with delta, gamma, theta and vega; full options chain with implied volatility by strike; implied volatility solver (Newton-Raphson with bisection fallback) with no-arbitrage checks |
| **Strategy Builder** | 12 strategies (long calls/puts, bull and bear spreads, straddle, strangle, covered call, protective put, butterfly, iron condor); payoff diagrams, max profit / max loss, breakevens and scenario P&L; a rule-based trade evaluation (expected value, probability of profit, reward/risk, IV rank, VIX regime) |
| **Greeks Dashboard** | How delta, gamma, theta and vega change with price and time to expiry; implied volatility calculator that backs out IV from a market price and shows the Greeks at that IV |
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

## Tests

```bash
npm test
```

Unit tests for the pricing engine run on Node's built-in test runner (no extra dependencies). They check Black-Scholes against textbook values, put-call parity across strikes and maturities, the signs, ranges and units of the Greeks, implied-volatility round-trips (including deep in- and out-of-the-money options), rejection of prices outside no-arbitrage bounds, and behaviour at expiry.

Strategy payoff tests cover all 12 Strategy Builder strategies: max profit and max loss of bull call and bear put spreads, credit spreads, butterflies and iron condors against the closed-form (width − premium) values, straddle breakevens at strike ± total premium, the capped upside of a covered call and the floored downside of a protective put, the sign of the payoff at extreme prices, and that every strategy returns finite numbers across a range of inputs.

Tests run automatically on every push and pull request to `main` via GitHub Actions, followed by a production build.

## Project structure

```
src/
  main.jsx              entry point
  OptiFlow.jsx          application (data layer, pages and components)
  pricing.js            Black-Scholes pricing, Greeks, implied volatility and put-call parity
  strategies.js         strategy definitions, payoff at expiry, breakevens and scenario P&L
  index.css             global styles
tests/
  pricing.test.js       unit tests for the pricing engine
  strategies.test.js    unit tests for strategy payoffs
.github/workflows/
  test.yml              runs tests and build on every push (GitHub Actions)
```

## Author

Rohan Odeyar · MSc Investments, University of Birmingham
