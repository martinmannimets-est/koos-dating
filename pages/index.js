import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  const [data, setData] = useState({ buy: [], sell: [], hold: [] });
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef(5);

  const loadData = async () => {
    try {
      const res = await fetch("/api/stocks");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setCountdown(5);
      countdownRef.current = 5;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);

    const countdownInterval = setInterval(() => {
      countdownRef.current = countdownRef.current > 0 ? countdownRef.current - 1 : 0;
      setCountdown(countdownRef.current);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Day Trading AI Recommendations</h1>
      <p style={{ textAlign: "center", fontSize: 14, color: "#555" }}>
        Refreshing prices in: {countdown} second{countdown !== 1 ? "s" : ""}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
        <section style={{ flex: 1, border: "2px solid green", padding: 15, borderRadius: 8 }}>
          <h2 style={{ color: "green" }}>BUY</h2>
          {data.buy.length === 0 && <p>No BUY recommendations currently</p>}
          {data.buy.map(({ symbol, buyPrice, sellPrice }) => (
            <div key={symbol} style={{ marginBottom: 10 }}>
              <strong>{symbol}</strong>: Buy Price <b>${buyPrice.toFixed(2)}</b> / Sell Price ${sellPrice.toFixed(2)}
            </div>
          ))}
        </section>

        <section style={{ flex: 1, border: "2px solid red", padding: 15, borderRadius: 8 }}>
          <h2 style={{ color: "red" }}>SELL</h2>
          {data.sell.length === 0 && <p>No SELL recommendations currently</p>}
          {data.sell.map(({ symbol, sellPrice, buyPrice }) => (
            <div key={symbol} style={{ marginBottom: 10 }}>
              <strong>{symbol}</strong>: Sell Price <b>${sellPrice.toFixed(2)}</b> / Buy Price ${buyPrice.toFixed(2)}
            </div>
          ))}
        </section>

        <section style={{ flex: 1, border: "2px solid orange", padding: 15, borderRadius: 8 }}>
          <h2 style={{ color: "orange" }}>HOLD</h2>
          {data.hold.length === 0 && <p>No HOLD recommendations currently</p>}
          {data.hold.map(({ symbol, price, buyPrice, sellPrice }) => (
            <div key={symbol} style={{ marginBottom: 10 }}>
              <strong>{symbol}</strong>: Current Price ${price.toFixed(2)} / Buy ${buyPrice.toFixed(2)} / Sell ${sellPrice.toFixed(2)}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
