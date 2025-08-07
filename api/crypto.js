// pages/api/crypto.js

let tradeLog = [];
let portfolio = {};
let startingCapital = 10000;
let balance = startingCapital;

export default async function handler(req, res) {
  const coins = ["bitcoin", "ethereum", "solana"];
  const maxTrade = 1000;
  const fee = 1;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(
        ","
      )}&vs_currencies=eur`
    );
    const prices = await response.json();

    const now = new Date().toISOString();
    const trades = [];

    coins.forEach((coin) => {
      const price = prices[coin].eur;
      const decision = Math.floor(price) % 2 === 1 ? "BUY" : "SELL";

      if (decision === "BUY" && balance >= maxTrade + fee) {
        const amount = maxTrade / price;
        balance -= maxTrade + fee;
        portfolio[coin] = (portfolio[coin] || 0) + amount;
        trades.push({ coin, price, action: "BUY", time: now });
        tradeLog.push({ coin, price, action: "BUY", time: now });
      } else if (
        decision === "SELL" &&
        portfolio[coin] &&
        portfolio[coin] > 0
      ) {
        const amount = portfolio[coin];
        const revenue = amount * price;
        balance += revenue - fee;
        portfolio[coin] = 0;
        trades.push({ coin, price, action: "SELL", time: now });
        tradeLog.push({ coin, price, action: "SELL", time: now });
      }
    });

    const currentValue = Object.entries(portfolio).reduce((total, [coin, amount]) => {
      return total + amount * (prices[coin]?.eur || 0);
    }, 0);

    const profit = balance + currentValue - startingCapital;

    res.status(200).json({
      balance: balance.toFixed(2),
      profit: profit.toFixed(2),
      portfolio,
      tradeLog,
      trades,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch crypto data" });
  }
}
