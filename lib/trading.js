// lib/trading.js
import fs from 'fs/promises';
import { computeSignal } from './ai-signal.js';
import { placeMarketBuy, placeMarketSell } from './exchange-sim.js';

const CAPITAL = 10000;
const MAX_BUY_AMOUNT = 1000;
const TRADE_FEE = 1;
const STATE_FILE = './data/state.json';
const TRADES_FILE = './data/trades.json';

// Hangi BTC price history 24h (CoinGecko market_chart)
export async function fetch24hPrices(id='bitcoin') {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=eur&days=1&interval=hourly`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('CoinGecko error: ' + r.status);
  const data = await r.json();
  // convert to [price1, price2, ...]
  const pts = (data.prices || []).map(p => ({ ts: p[0], price: p[1] }));
  return pts;
}

async function ensureDataFiles() {
  await fs.mkdir('./data', { recursive: true });
  try {
    await fs.access(STATE_FILE);
  } catch {
    const init = { balance: CAPITAL, btcAmount: 0 };
    await fs.writeFile(STATE_FILE, JSON.stringify(init, null, 2));
  }
  try {
    await fs.access(TRADES_FILE);
  } catch {
    await fs.writeFile(TRADES_FILE, JSON.stringify([], null, 2));
  }
}

export async function loadState() {
  await ensureDataFiles();
  const s = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
  const trades = JSON.parse(await fs.readFile(TRADES_FILE, 'utf8'));
  return { ...s, trades };
}

export async function saveState(state) {
  await fs.writeFile(STATE_FILE, JSON.stringify({ balance: state.balance, btcAmount: state.btcAmount }, null, 2));
  await fs.writeFile(TRADES_FILE, JSON.stringify(state.trades, null, 2));
}

// Main trading cycle: universe = array of coin ids (coingecko ids). returns object with executed trades
export async function runCycle(universe=['bitcoin','ethereum','litecoin','ripple','dogecoin']) {
  await ensureDataFiles();
  const state = await loadState(); // has balance, btcAmount, trades
  // For multi-asset, store positions per asset in trades; for simplicity, state holds per-asset positions map:
  if (!state.positions) state.positions = {}; // { id: btcAmountEquivalent, ... }

  const results = { executed: [] };

  // For each asset, fetch 24h prices (but to save API calls, fetch only top N; here sequential)
  for (const id of universe) {
    try {
      const pts = await fetch24hPrices(id);
      const prices = pts.map(p => p.price);
      if (!prices.length) continue;
      const latestPrice = prices[prices.length - 1];

      const score = await computeSignal(prices);
      // Risk rule: max buy per asset = min(MAX_BUY_AMOUNT, 0.02 * balance)
      const riskPerAsset = Math.min(MAX_BUY_AMOUNT, (state.balance || CAPITAL) * 0.02);

      // If no position on this asset -> buy if score > threshold
      const posKey = `pos_${id}`;
      const currentPos = state.positions[posKey] || 0; // in asset units (coins)

      // Simple thresholds
      if (currentPos === 0 && score > 0.2) {
        // buy
        const amountEUR = riskPerAsset;
        // placeMarketBuy sim expects euro amount and price
        const trade = await placeMarketBuy(state, amountEUR, latestPrice);
        // record trade with asset id
        trade.asset = id;
        state.trades.push(trade);
        state.positions[posKey] = (state.positions[posKey] || 0) + trade.btc; // store coin amount
        results.executed.push(trade);
      } else if (currentPos > 0 && score < -0.1) {
        // sell all position
        const btcToSell = state.positions[posKey];
        const trade = await placeMarketSell(state, btcToSell, latestPrice);
        trade.asset = id;
        state.trades.push(trade);
        state.positions[posKey] = 0;
        results.executed.push(trade);
      } else {
        // hold
      }
    } catch (err) {
      console.warn('runCycle asset error', id, err?.message || err);
    }
  }

  // After looping assets, recalc net worth etc
  await saveState(state);
  const totalFees = (state.trades || []).reduce((s,t)=>s+(t.fee||0),0);
  const netWorth = (state.balance || 0) + (Object.keys(state.positions || {}).reduce((acc, k) => acc + 0, 0)); // positions in fiat not computed here
  return { executed: results.executed, trades: state.trades, balance: state.balance, totalFees };
}
