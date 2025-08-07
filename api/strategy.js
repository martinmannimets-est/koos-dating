// api/strategy.js
import sampleData from '../public/sample-data.json';

function EMA(data, period) {
  let k = 2 / (period + 1);
  let emaArray = [];
  let emaPrev = data[0];
  emaArray[0] = emaPrev;
  for (let i = 1; i < data.length; i++) {
    emaPrev = data[i] * k + emaPrev * (1 - k);
    emaArray.push(emaPrev);
  }
  return emaArray;
}

function RSI(data, period = 14) {
  let gains = [];
  let losses = [];
  for (let i = 1; i < data.length; i++) {
    let change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a,b) => a+b, 0)/period;
  let avgLoss = losses.slice(0, period).reduce((a,b) => a+b, 0)/period;
  let rsi = [];
  for (let i = period; i < data.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  return Array(period).fill(null).concat(rsi);
}

export default function handler(req, res) {
  const closePrices = sampleData.map(c => c.close);

  const ema20 = EMA(closePrices, 20);
  const ema50 = EMA(closePrices, 50);
  const rsi = RSI(closePrices, 14);

  let signals = [];
  for (let i = 50; i < closePrices.length; i++) {
    let signal = 'hold';
    if (closePrices[i] > ema20[i] && closePrices[i] > ema50[i] && rsi[i] !== null && rsi[i] > 50) {
      signal = 'buy';
    } else if (rsi[i] !== null && rsi[i] > 70) {
      signal = 'sell';
    }
    signals.push({
      time: sampleData[i].time,
      price: closePrices[i],
      signal,
      rsi: rsi[i]
    });
  }

  res.status(200).json({ signals });
}