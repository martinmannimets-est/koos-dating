import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "trades.json");

const MAX_BUY_AMOUNT = 1000; // €
const TRADE_FEE = 1; // €
const symbols = ["bitcoin", "ethereum", "ripple"];

async function fetchPrices() {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=eur`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

async function readData() {
  try {
    const fileData = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(fileData);
  } catch {
    // Kui faili pole, tagasta vaikimisi andmed
    return {
      balance: 10000,
      holdings: {},
      tradeLog: [],
    };
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  try {
    // Loe olemasolev seis
    const data = await readData();

    const prices = await fetchPrices();

    let { balance, holdings, tradeLog } = data;

    // Simuleeri tehinguid iga mündi kohta
    for (const symbol of symbols) {
      const price = prices[symbol].eur;

      // Kui pole hoitud münti, osta
      if (!holdings[symbol] || holdings[symbol] === 0) {
        if (balance > MAX_BUY_AMOUNT + TRADE_FEE) {
          const amountToBuy = MAX_BUY_AMOUNT / price;
          holdings[symbol] = (holdings[symbol] || 0) + amountToBuy;
          balance -= MAX_BUY_AMOUNT + TRADE_FEE;
          tradeLog.push({
            type: 'BUY',
            symbol,
            price,
            amount: amountToBuy,
            fee: TRADE_FEE,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Müü kui hind on tõusnud 1% võrra
        const buys = tradeLog.filter(t => t.type === 'BUY' && t.symbol === symbol);
        const totalAmountBought = buys.reduce((acc, t) => acc + t.amount, 0);
        const totalCost = buys.reduce((acc, t) => acc + t.price * t.amount, 0);
        const avgBuyPrice = totalCost / totalAmountBought;

        if (price > avgBuyPrice * 1.01) {
          const amountToSell = holdings[symbol];
          holdings[symbol] = 0;
          const revenue = amountToSell * price;
          balance += revenue - TRADE_FEE;
          tradeLog.push({
            type: 'SELL',
            symbol,
            price,
            amount: amountToSell,
            fee: TRADE_FEE,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Kirjuta uuendatud seis faili
    await writeData({ balance, holdings, tradeLog });

    res.status(200).json({
      balance: balance.toFixed(2),
      holdings,
      tradeLog,
      prices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch or process data" });
  }
}
