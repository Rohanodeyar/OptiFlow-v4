// ── Strategy payoff maths ────────────────────────────────────────────────────
// Pure functions with no dependency on the UI, so they can be unit-tested
// directly with `npm test`.
//
// Conventions:
//   legs       – k is the strike as a multiple of spot (1.05 = 5% OTM call),
//                q is the number of contracts (options) or shares (stock)
//   pnl        – dollars at expiry for the whole position; option legs are
//                multiplied by 100 shares per contract, premiums are paid or
//                received up front at Black-Scholes value (r = 5%)
//   points     – 100 prices evenly spaced from 0.55×spot to 1.45×spot
//   breakevens – midpoints of the grid intervals where P&L changes sign
//   cost       – net premium of the option legs (positive = debit), stock excluded
import { BS } from "./pricing.js";

export const STRATS = {
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

// P&L at expiry over a price grid, plus the Greeks of the position today.
export function calcPayoff(stratName,S0,ivPct,days){
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

// P&L at expiry for fixed percentage moves in the underlying.
export function computeScenarios(stratName,S0,ivPct,days){
  const scenarios=[{label:"-20%",mult:0.80},{label:"-10%",mult:0.90},{label:"-5%",mult:0.95},{label:"Flat",mult:1.00},{label:"+5%",mult:1.05},{label:"+10%",mult:1.10},{label:"+20%",mult:1.20}];
  const strat=STRATS[stratName];if(!strat)return[];
  const T=days/365,r=0.05,sig=ivPct/100;
  return scenarios.map(sc=>{const St=S0*sc.mult;let pnl=0;for(const l of strat.legs){if(l.t==="stock"){pnl+=l.side==="buy"?(St-S0)*l.q:(S0-St)*l.q;continue;}const intr=l.t==="call"?Math.max(0,St-S0*l.k):Math.max(0,S0*l.k-St);const opt0=BS(S0,S0*l.k,T,r,sig,l.t);pnl+=(l.side==="buy"?1:-1)*(intr-opt0.price)*l.q*100;}return{...sc,pnl:+pnl.toFixed(0)};});
}
