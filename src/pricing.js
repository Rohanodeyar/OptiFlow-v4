// ── Option pricing maths ─────────────────────────────────────────────────────
// Pure functions with no dependency on the rest of the app, so they can be
// unit-tested directly with `npm test`.
//
// Units used by BS():
//   price  – option premium per share
//   delta  – per $1 move in the underlying
//   gamma  – change in delta per $1 move
//   theta  – P&L per calendar day (annual theta / 365)
//   vega   – P&L per 1 volatility point (annual vega / 100)

// Error function (Abramowitz & Stegun 7.1.26, max error ~1.5e-7)
export function erfn(x){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=x<0?-1:1;x=Math.abs(x);const t=1/(1+p*x);return s*(1-(((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t)*Math.exp(-x*x));}
export function Ncdf(x){return 0.5*(1+erfn(x/Math.sqrt(2)));}
export function Npdf(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);}

// Black-Scholes price and Greeks for a European option.
// S spot, K strike, T years to expiry, r risk-free rate (decimal), sig volatility (decimal), type "call" | "put"
export function BS(S,K,T,r,sig,type){
  if(T<=1/365){return{price:Math.max(0,type==="call"?S-K:K-S),delta:0,gamma:0,theta:0,vega:0};}
  const d1=(Math.log(S/K)+(r+0.5*sig*sig)*T)/(sig*Math.sqrt(T)),d2=d1-sig*Math.sqrt(T);
  if(type==="call"){return{price:Math.max(0,S*Ncdf(d1)-K*Math.exp(-r*T)*Ncdf(d2)),delta:Ncdf(d1),gamma:Npdf(d1)/(S*sig*Math.sqrt(T)),theta:(-S*Npdf(d1)*sig/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*Ncdf(d2))/365,vega:S*Npdf(d1)*Math.sqrt(T)/100};}
  return{price:Math.max(0,K*Math.exp(-r*T)*Ncdf(-d2)-S*Ncdf(-d1)),delta:Ncdf(d1)-1,gamma:Npdf(d1)/(S*sig*Math.sqrt(T)),theta:(-S*Npdf(d1)*sig/(2*Math.sqrt(T))+r*K*Math.exp(-r*T)*Ncdf(-d2))/365,vega:S*Npdf(d1)*Math.sqrt(T)/100};
}

export const IV_MIN=0.0001; // 0.01% vol
export const IV_MAX=5;      // 500% vol

// No-arbitrage price bounds for a European option.
export function noArbBounds(S,K,T,r,type){
  const df=Math.exp(-r*T);
  return type==="call"
    ?{lower:Math.max(0,S-K*df),upper:S}
    :{lower:Math.max(0,K*df-S),upper:K*df};
}

// Implied volatility from a market price.
// Newton-Raphson on vega, falling back to bisection whenever a Newton step
// would leave the current bracket or vega is too small to be useful.
// Returns the volatility as a decimal (0.25 = 25%), or null when the price is
// outside the no-arbitrage bounds, the option is at expiry, or no volatility
// in [IV_MIN, IV_MAX] reproduces the price.
export function impliedVol(price,S,K,T,r,type,{tol=1e-8,maxIter=100}={}){
  if(![price,S,K,T,r].every(Number.isFinite)||S<=0||K<=0||price<0)return null;
  if(T<=1/365)return null; // BS() returns intrinsic value only, so vol is undefined
  const {lower,upper}=noArbBounds(S,K,T,r,type);
  const eps=1e-9*Math.max(1,S);
  if(price<lower-eps||price>upper+eps)return null;
  const f=sig=>BS(S,K,T,r,sig,type).price-price;
  let lo=IV_MIN,hi=IV_MAX;
  const fLo=f(lo),fHi=f(hi);
  if(Math.abs(fLo)<tol)return lo;
  if(Math.abs(fHi)<tol)return hi;
  if(fLo>0||fHi<0)return null; // price not reachable inside the vol bounds
  // Brenner-Subrahmanyam style starting guess, clamped into the bracket
  let sig=Math.min(hi,Math.max(lo,Math.sqrt(2*Math.PI/T)*price/S||0.2));
  if(!(sig>lo&&sig<hi))sig=0.2;
  for(let i=0;i<maxIter;i++){
    const g=BS(S,K,T,r,sig,type);
    const diff=g.price-price;
    if(Math.abs(diff)<tol)return sig;
    if(diff>0)hi=sig;else lo=sig;
    const rawVega=g.vega*100; // BS reports vega per 1 vol point; Newton needs dPrice/dSigma
    let next=rawVega>1e-12?sig-diff/rawVega:NaN;
    if(!(next>lo&&next<hi))next=0.5*(lo+hi);
    if(Math.abs(next-sig)<1e-12)return next;
    sig=next;
  }
  return sig;
}

// Put-call parity gap: (C - P) - (S - K·e^(-rT)). Zero for consistent European prices.
export function putCallParityGap(call,put,S,K,T,r){
  return (call-put)-(S-K*Math.exp(-r*T));
}
