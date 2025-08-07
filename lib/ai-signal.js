// lib/ai-signal.js
// Lihtne ensemble signaal: momentum + RSI-ish + optional LLM stub
// Tagastab skoor vahemikus [-1 .. 1]

function simpleMomentum(prices) {
  // percent change last 3 points vs previous 3
  if (prices.length < 6) return 0;
  const a = prices.slice(-6, -3).reduce((s,p)=>s+p,0)/3;
  const b = prices.slice(-3).reduce((s,p)=>s+p,0)/3;
  return (b - a) / a;
}

function simpleVolatility(prices) {
  if (prices.length < 10) return 0;
  const avg = prices.reduce((s,p)=>s+p,0)/prices.length;
  const varSum = prices.reduce((s,p)=>s+Math.pow(p-avg,2),0)/prices.length;
  return Math.sqrt(varSum)/avg;
}

export async function computeSignal(prices) {
  // prices = array of numbers (oldest..latest)
  if (!prices || prices.length < 6) return 0;
  const mom = simpleMomentum(prices); // e.g. 0.01 for +1%
  const vol = simpleVolatility(prices);

  // RSI-ish naive: ratio of up vs down over last 14
  const last = prices.slice(-14);
  let ups=0, downs=0;
  for (let i=1;i<last.length;i++){
    if (last[i]>last[i-1]) ups++; else if (last[i]<last[i-1]) downs++;
  }
  const rsi = (ups + 1) / (ups + downs + 1); // 0..1

  // Weighted ensemble
  const score = (mom * 0.6) + ((rsi - 0.5) * 0.6) - (vol * 0.4);
  // clamp
  return Math.max(-1, Math.min(1, score));
}
