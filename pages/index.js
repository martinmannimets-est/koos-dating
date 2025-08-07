import { useState, useEffect } from "react";

export default function Home() {
  const [data, setData] = useState({ buy: [], sell: [], hold: [] });
  const [countdown, setCountdown] = useState(5);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/stocks");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCountdown(5);
    }, 5000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 5));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Trading Recommendations (refreshes every 5 seconds)</h1>
      <p>Next refresh in: {countdown} sec</p>

      <section>
        <h2>BUY</h2>
        {data.buy.length === 0 ? (
          <p>No stocks</p>
        ) : (
          data.buy.map((stock) => (
            <div key={stock.symbol}>
              {stock.symbol}: Buy at {stock.buyPrice.toFixed(2)} — Sell at{" "}
              {stock.sellPrice.toFixed(2)}
            </div>
          ))
        )}
      </section>

      <section>
        <h2>SELL</h2>
        {data.sell.length === 0 ? (
          <p>No stocks</p>
        ) : (
          data.sell.map((stock) => (
            <div key={stock.symbol}>
              {stock.symbol}: Sell at {stock.sellPrice.toFixed(2)} — Buy at{" "}
              {stock.buyPrice.toFixed(2)}
            </div>
          ))
        )}
      </section>

      <section>
        <h2>HOLD</h2>
        {data.hold.length === 0 ? (
          <p>No stocks</p>
        ) : (
          data.hold.map((stock) => (
            <div key={stock.symbol}>
              {stock.symbol}: Hold between {stock.buyPrice.toFixed(2)} and{" "}
              {stock.sellPrice.toFixed(2)}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
