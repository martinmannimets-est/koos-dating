// lib/exchange-sim.js
// Simuleerib orderi täitmist — täidab kohe market orderi.
// Kõik tehingud logitakse edasi calling code poolt.

export async function placeMarketBuy(state, amountEUR, price) {
  // amountEUR = euros to spend
  const fee = 1;
  if (amountEUR + fee > state.balance) throw new Error('Insufficient balance');
  const btc = amountEUR / price;
  state.balance -= amountEUR + fee;
  state.btcAmount = (state.btcAmount || 0) + btc;
  const trade = {
    type: 'buy',
    price,
    amountEUR,
    btc,
    fee,
    timestamp: new Date().toISOString(),
  };
  state.trades.push(trade);
  return trade;
}

export async function placeMarketSell(state, btcAmount, price) {
  const fee = 1;
  if (btcAmount > state.btcAmount) throw new Error('Insufficient BTC');
  const amountEUR = btcAmount * price;
  state.btcAmount -= btcAmount;
  state.balance += amountEUR - fee;
  const trade = {
    type: 'sell',
    price,
    amountEUR,
    btc: btcAmount,
    fee,
    timestamp: new Date().toISOString(),
  };
  state.trades.push(trade);
  return trade;
}
