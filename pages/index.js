import React, { useState, useEffect } from "react";

const fetchStockData = async () => {
  // Dummy example: Replace this with your real API call (e.g. Yahoo Finance)
  // Simulate some random price data
  return {
    buy: [
      { symbol: "AAPL", price: 170.45, sellPrice: 169.90 },
      { symbol: "TSLA", price: 720.30, sellPrice: 715.00 },
    ],
    sell: [
      { symbol: "AMZN", price: 3200.55, buyPrice: 3210.20 },
      { symbol: "NFLX", price: 480.10, buyPrice: 485.50 },
    ],
    hold: [
      { symbol: "GOOGL", price: 2850.00, buyPrice: 2840.00, sellPrice: 2860.00 },
    ],
  };
};

export default function Home() {
  const [data, setData] = useState({ buy: [], sell: [], hold: [] });
  const [countdown, setCountdown] = useState(5);

  const loadData = async () => {
    const newData = await fetchStockData();
    setData(newData);
    setCountdown(5);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
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
        {/* BUY Section */}
        <section style={{ flex: 1, border: "2px solid green", padding: 15, borderRadius: 8 }}>
          <h2 style={{ color: "green" }}>BUY</h2>
          {data.buy.length === 0 && <p>No BUY recommendations currently</p>}
          {data.buy.map(({ symbol, price, sellPrice }) => (
            <div key={symbol} style={{ marginBottom: 10 }}>
              <strong>{symbol}</strong>: Buy Price ${price.toFixed(2)} / Sell Price ${sellPrice.toFixed(2)}
            </div>
          ))}
        </section>

        {/* SELL Section */}
        <section style={{ flex: 1, border: "2px solid red", padding: 15, borderRadius: 8 }}>
          <h2 style={{ color: "red" }}>SELL</h2>
          {data.sell.length === 0 && <p>No SELL recommendations currently</p>}
          {data.sell.map(({ symbol, price, buyPrice }) => (
            <div key={symbol} style={{ marginBottom: 10 }}>
              <strong>{symbol}</strong>: Sell Price ${price.toFixed(2)} / Buy Price ${buyPrice.toFixed(2)}
            </div>
          ))}
        </section>

        {/* HOLD Section */}
        <section style={{ flex: 1, border: "2px solid orange", padding: 15, borderRadius: 8 }}>
          <h2 style={{ color: "orange" }}>HOLD</h2>
          {data.hold.length === 0 && <p>No HOLD recommendations currently</p>}
          {data.hold.map(({ symbol, price, buyPrice, sellPrice }) => (
            <div key={symbol} style={{ marginBottom: 10 }}>
              <strong>{symbol}</strong>: Price ${price.toFixed(2)} / Buy ${buyPrice.toFixed(2)} / Sell ${sellPrice.toFixed(2)}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
