// pages/api/stocks.js

let balance = 10000; // algkapital €
let holdings = {};   // hoitud mündid ja kogused, nt { BTC: 0.1, ETH: 2 }
let tradeLog = [];   // tehingute logi, iga element on {type: 'BUY'|'SELL', symbol, price, amount, fee, timestamp}

const MAX_BUY_AMOUNT = 1000; // € ühe tehingu maksimaalne ostusumma
const TRADE_FEE = 1;         // € tehingutasu ostu- ja müügitehingu kohta

const symbols = ["bitcoin", "ethereum", "ripple"];

async function fetchPrices() {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=eur`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prices");
  return res.json();
}

export default async function handler(req, res) {
  try {
    const prices = await fetchPrices();

    // Simuleeri tehinguid iga mündi kohta
    for (const symbol of symbols) {
      const price = prices[symbol].eur;

      // Ostmise loogika: kui me pole münti veel ostnud, osta max 1000€ eest või nii palju kui raha jätkub
      if (!holdings[symbol] || holdings[symbol] === 0) {
        if (balance > MAX_BUY_AMOUNT + TRADE_FEE) {
          const amountToBuy = (MAX_BUY_AMOUNT) / price;
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
        // Müügiloogika: müü kõik kui hind on tõusnud vähemalt 1% ostuhinnast
        const avgBuyPrice = tradeLog
          .filter(t => t.type === 'BUY' && t.symbol === symbol)
          .reduce((acc, t) => acc + t.price * t.amount, 0) /
          tradeLog.filter(t => t.type === 'BUY' && t.symbol === symbol)
            .reduce((acc, t) => acc + t.amount, 0);

        if (price > avgBuyPrice * 1.01) {
          // Müü kõik
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
