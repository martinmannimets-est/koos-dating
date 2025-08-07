import fs from 'fs/promises';

const CAPITAL = 10000;
const MAX_BUY_AMOUNT = 1000;
const TRADE_FEE = 1; // 1€ per trade

const TRADE_LOG_FILE = './data/trades.json';

export async function getPrice() {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
  const data = await res.json();
  return data.bitcoin.eur;
}

export async function loadState() {
  try {
    const content = await fs.readFile(TRADE_LOG_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return {
      balance: CAPITAL,
      btcAmount: 0,
      trades: [],
    };
  }
}

export async function saveState(state) {
  await fs.writeFile(TRADE_LOG_FILE, JSON.stringify(state, null, 2));
}

export async function trade() {
  const state = await loadState();
  const price = await getPrice();

  const lastTrade = state.trades.length ? state.trades[state.trades.length - 1] : null;

  if (state.btcAmount === 0) {
    const amountToBuy = Math.min(MAX_BUY_AMOUNT, state.balance - TRADE_FEE);
    if (amountToBuy > TRADE_FEE) {
      const btcToBuy = amountToBuy / price;
      state.btcAmount += btcToBuy;
      state.balance -= amountToBuy + TRADE_FEE;
      state.trades.push({ type: 'buy', price, amountEUR: amountToBuy, btc: btcToBuy, fee: TRADE_FEE, timestamp: new Date().toISOString() });
    }
  } else {
    if (lastTrade && lastTrade.type === 'buy') {
      const buyPrice = lastTrade.price;
      const profitPercent = (price - buyPrice) / buyPrice;

      if (profitPercent >= 0.01) {
        const amountToSellEUR = state.btcAmount * price;
        const btcToSell = state.btcAmount;
        state.btcAmount = 0;
        state.balance += amountToSellEUR - TRADE_FEE;
        state.trades.push({ type: 'sell', price, amountEUR: amountToSellEUR, btc: btcToSell, fee: TRADE_FEE, timestamp: new Date().toISOString() });
      }
    }
  }

  await saveState(state);

  const totalFees = state.trades.length * TRADE_FEE;
  const netWorth = state.balance + (state.btcAmount * price);
  const profit = netWorth - CAPITAL - totalFees;

  return {
    price,
    balance: state.balance,
    btcAmount: state.btcAmount,
    profit,
    trades: state.trades,
  };
}
