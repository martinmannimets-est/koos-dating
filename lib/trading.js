// lib/trading.js
// In-memory state trading logic working on top-50 current prices from CoinGecko

const CAPITAL = 10000;
const MAX_BUY_AMOUNT = 1000;
const TRADE_FEE = 1; // € per trade
const TARGET_MULTIPLIER = 1.70; // 70% target profit

// In-memory state (non-persistent; will reset on cold start / deploy)
let INMEM = {
  balance: CAPITAL,
  positions: {}, // { assetId: { amount: coinAmount, buyPrice: number, investedEUR: number } }
  trades: [],    // list of trade objects
  lastPrices: {}, // { assetId: lastSeenPrice }
  lastRunISO: null,
};

export async function fetchTop50Prices() {
  // CoinGecko markets endpoint: top 50 by market cap, prices in EUR
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=50&page=1&sparkline=false';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('CoinGecko /markets error: ' + res.status);
  const data = await res.json();
  // We map to simplified array of { id, symbol, name, price, market_cap, volume_24h }
  return data.map(d => ({
    id: d.id,
    symbol: d.symbol,
    name: d.name,
    price: typeof d.current_price === 'number' ? d.current_price : Number(d.current_price),
    market_cap: d.market_cap,
    volume_24h: d.total_volume,
    price_change_24h: d.price_change_percentage_24h,
  }));
}

function recordTrade(trade) {
  INMEM.trades.push(trade);
}

export async function tradeCycle() {
  // Main entry: fetch top50 prices, run simple buy/sell logic, return new state + executed trades
  const prices = await fetchTop50Prices();
  const executed = [];

  INMEM.lastRunISO = new Date().toISOString();

  for (const p of prices) {
    const id = p.id;
    const price = p.price;
    const lastPrice = INMEM.lastPrices[id];

    // SELL logic: if we have a position and current price >= buyPrice * TARGET_MULTIPLIER
    const pos = INMEM.positions[id];
    if (pos && pos.amount > 0) {
      const buyPrice = pos.buyPrice;
      if (price >= buyPrice * TARGET_MULTIPLIER) {
        // sell all
        const btcAmount = pos.amount;
        const proceedsEUR = btcAmount * price;
        INMEM.balance = Number((INMEM.balance + proceedsEUR - TRADE_FEE).toFixed(8));
        const trade = {
          type: 'sell',
          asset: id,
          symbol: p.symbol,
          price,
          amountCoin: btcAmount,
          amountEUR: proceedsEUR,
          fee: TRADE_FEE,
          timestamp: new Date().toISOString(),
          info: `Sold because price >= ${TARGET_MULTIPLIER}x buyPrice`,
          buyPrice,
        };
        // clear position
        INMEM.positions[id] = { amount: 0, buyPrice: 0, investedEUR: 0 };
        recordTrade(trade);
        executed.push(trade);
        // update last price
        INMEM.lastPrices[id] = price;
        continue; // go next asset
      }
    }

    // BUY logic: if no position (or zero) and price dropped enough vs last seen price (>=1% drop), buy up to MAX_BUY_AMOUNT or available balance
    const hasPos = pos && pos.amount > 0;
    if (!hasPos && typeof lastPrice === 'number') {
      const dropPercent = (lastPrice - price) / lastPrice;
      if (dropPercent >= 0.01) { // >=1% drop
        const availableForBuy = Math.max(0, INMEM.balance - TRADE_FEE);
        const amountToSpend = Math.min(MAX_BUY_AMOUNT, availableForBuy);
        if (amountToSpend > TRADE_FEE && amountToSpend <= availableForBuy) {
          const coinAmount = amountToSpend / price;
          // Deduct balance and fee
          INMEM.balance = Number((INMEM.balance - amountToSpend - TRADE_FEE).toFixed(8));
          // Set position
          INMEM.positions[id] = {
            amount: coinAmount,
            buyPrice: price,
            investedEUR: amountToSpend,
          };
          const trade = {
            type: 'buy',
            asset: id,
            symbol: p.symbol,
            price,
            amountCoin: coinAmount,
            amountEUR: amountToSpend,
            fee: TRADE_FEE,
            timestamp: new Date().toISOString(),
            info: `Bought on price drop ${ (dropPercent*100).toFixed(2) }% vs last seen`,
          };
          recordTrade(trade);
          executed.push(trade);
          INMEM.lastPrices[id] = price;
          continue;
        }
      }
    }

    // Update last price for assets we didn't trade this cycle
    INMEM.lastPrices[id] = price;
  }

  return {
    executed,
    state: getPublicState(),
  };
}

export function getPublicState() {
  // Return safe copy of state
  return {
    balance: INMEM.balance,
    positions: INMEM.positions,
    trades: INMEM.trades,
    lastPrices: INMEM.lastPrices,
    lastRunISO: INMEM.lastRunISO,
  };
}

// Helper for a manual reset (for debugging)
export function resetState() {
  INMEM = {
    balance: CAPITAL,
    positions: {},
    trades: [],
    lastPrices: {},
    lastRunISO: null,
  };
  return getPublicState();
}
