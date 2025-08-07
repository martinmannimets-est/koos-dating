import { useEffect, useState, useRef } from "react";

const symbolsToTrack = ["AAPL", "TSLA", "AMZN", "NFLX", "GOOGL"];

export default function Home() {
  const [stockData, setStockData] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(5);
  const intervalRef = useRef(null);

  // Funktsioon, mis teeb API päringu ühe sümboli kohta
  async function fetchStock(symbol) {
    const res = await fetch(`/api/stock?symbol=${symbol}`);
    if (!res.ok) return null;
    return res.json();
  }

  // Lae kõik sümbolid ja salvesta andmed
  async function fetchAllStocks() {
    const results = await Promise.all(symbolsToTrack.map(fetchStock));
    const data = {};
    symbolsToTrack.forEach((sym, i) => {
      data[sym] = results[i];
    });
    setStockData(data);
    setSecondsLeft(5);
  }

  // Käivita alglaadimisel ja iga 5 sekundi tagant
  useEffect(() => {
    fetchAllStocks();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((sec) => {
        if (sec <= 1) {
          fetchAllStocks();
          return 5;
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Lihtne analüüs: kui hind tõuseb, siis BUY, kui langeb SELL, muidu HOLD
  function categorizeStocks() {
    const buy = [];
    const sell = [];
    const hold = [];

    Object.values(stockData).forEach((stock) => {
      if (!stock) return;
      if (stock.change > 0) buy.push(stock);
      else if (stock.change < 0) sell.push(stock);
      else hold.push(stock);
    });

    return { buy, sell, hold };
  }

  const { buy, sell, hold } = categorizeStocks();

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Trading Recommendations (refreshes every 5 seconds)</h1>
      <p>Next refresh in: {secondsLeft} sec</p>

      <Section title="BUY" stocks={buy} showSellPrice />
      <Section title="SELL" stocks={sell} showBuyPrice />
      <Section title="HOLD" stocks={hold} showBuyPrice showSellPrice />
    </div>
  );
}

function Section({ title, stocks, showBuyPrice, showSellPrice }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2>{title}</h2>
      {stocks.length === 0 && <p>No stocks</p>}
      {stocks.map((stock) => (
        <div
          key={stock.symbol}
          style={{
            border: "1px solid #ddd",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <strong>{stock.symbol}</strong> - Price: {stock.price} {stock.currency}
          <br />
          Change: {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          <br />
          {showBuyPrice && stock.bid !== undefined && (
            <>Buy Price (Bid): {stock.bid} {stock.currency}<br /></>
          )}
          {showSellPrice && stock.ask !== undefined && (
            <>Sell Price (Ask): {stock.ask} {stock.currency}</>
          )}
        </div>
      ))}
    </div>
  );
}
