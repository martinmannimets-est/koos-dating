import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve("./trade-log.json");

const INITIAL_BALANCE = 10000;
const MAX_TRADE_AMOUNT = 1000;
const TRADE_FEE = 1;

const SYMBOL = "bitcoin"; // CoinGecko id

// Lae log failist või alusta uuest
function loadLog() {
  try {
    const data = fs.readFileSync(LOG_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// Arvuta portfelli väärtus (raha + krüpto väärtus)
function calculatePortfolioValue(log, currentPrice) {
  let cash = INITIAL_BALANCE;
  let cryptoAmount = 0;

  log.forEach((trade) => {
    if (trade.type === "buy") {
      cash -= trade.amount + TRADE_FEE;
      cryptoAmount += trade.amount / trade.price;
    } else if (trade.type === "sell") {
      cash += trade.amount - TRADE_FEE;
      cryptoAmount -= trade.amount / trade.price;
    }
  });

  return cash + cryptoAmount * currentPrice;
}

// Arvuta 24h tagune portfelliväärtus, et näidata kasumit
function portfolioValue24hAgo(log, currentPrice) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const log24h = log.filter((trade) => new Date(trade.date).getTime() <= cutoff);
  
  let cash = INITIAL_BALANCE;
  let cryptoAmount = 0;

  log24h.forEach((trade) => {
    if (trade.type === "buy") {
      cash -= trade.amount + TRADE_FEE;
      cryptoAmount += trade.amount / trade.price;
    } else if (trade.type === "sell") {
      cash += trade.amount - TRADE_FEE;
      cryptoAmount -= trade.amount / trade.price;
    }
  });

  return cash + cryptoAmount * currentPrice;
}

export default async function handler(req, res) {
  const log = loadLog();

  // Lae hind CoinGecko API-st
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${SYMBOL}&vs_currencies=eur`
    );
    const data = await response.json();
    const currentPrice = data[SYMBOL]?.eur;

    if (!currentPrice) {
      throw new Error("Price data not found");
    }

    // Lihtne automaatika: ostame, kui hind on madal (random näide), müüme, kui hind on kõrge
    // Võid asendada enda strateegiaga
    const lastTrade = log.length ? log[log.length - 1] : null;
    const shouldBuy = !lastTrade || currentPrice < (lastTrade.price * 0.98);
    const shouldSell = lastTrade && currentPrice > (lastTrade.price * 1.02);

    // Arvuta praegune portfelliväärtus
    const portfolioValue = calculatePortfolioValue(log, currentPrice);
    const portfolioValue24h = portfolioValue24hAgo(log, currentPrice);
    const profit24h = portfolioValue - portfolioValue24h;

    if (shouldBuy) {
      // Kontrollime, et on piisavalt raha ostmiseks
      // Arvutame ostetava summa (max MAX_TRADE_AMOUNT)
      let cashAvailable = portfolioValue - (log.reduce((acc, t) => {
        if (t.type === "buy") return acc + t.amount + TRADE_FEE;
        else return acc;
      }, 0));

      const buyAmount = Math.min(MAX_TRADE_AMOUNT, cashAvailable);
      if (buyAmount > TRADE_FEE) {
        log.push({
          type: "buy",
          price: currentPrice,
          amount: buyAmount,
          fee: TRADE_FEE,
          date: new Date().toISOString(),
        });
      }
    } else if (shouldSell) {
      // Müük
      // Lihtsuse mõttes müüme MAX_TRADE_AMOUNT, kui portfellis on krüptot
      const cryptoHeld = log.reduce((acc, t) => {
        if (t.type === "buy") return acc + t.amount / t.price;
        else if (t.type === "sell") return acc - t.amount / t.price;
        else return acc;
      }, 0);

      const sellAmount = Math.min(MAX_TRADE_AMOUNT, cryptoHeld * currentPrice);
      if (sellAmount > TRADE_FEE) {
        log.push({
          type: "sell",
          price: currentPrice,
          amount: sellAmount,
          fee: TRADE_FEE,
          date: new Date().toISOString(),
        });
      }
    }

    saveLog(log);

    // Sorteeri viimased tehingud kuupäeva järgi ja võta viimased 20
    const recentTrades = [...log].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

    res.status(200).json({
      portfolioValue: portfolioValue.toFixed(2),
      profit24h: profit24h.toFixed(2),
      recentTrades,
      currentPrice,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch or process data" });
  }
}
