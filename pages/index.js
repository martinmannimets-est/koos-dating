import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/crypto");
      const json = await res.json();
      setData(json);
      setCountdown(5);
    };

    fetchData();

    const interval = setInterval(() => {
      setCountdown((c) => (c === 1 ? 5 : c - 1));
      if (countdown === 1) fetchData();
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "auto", fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h1>Crypto Trading Simulator</h1>
      <p>Balance: €{data.balance}</p>

      <h2>Holdings:</h2>
      <ul>
        {Object.entries(data.holdings).map(([symbol, amount]) => (
          <li key={symbol}>
            {symbol.toUpperCase()}: {amount.toFixed(6)}
          </li>
        ))}
      </ul>

      <h2>Current Prices (EUR):</h2>
      <ul>
        {Object.entries(data.prices).map(([symbol, priceObj]) => (
          <li key={symbol}>
            {symbol.toUpperCase()}: €{priceObj.eur}
          </li>
        ))}
      </ul>

      <h2>Trade Log:</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th>Time</th>
            <th>Type</th>
            <th>Symbol</th>
            <th>Amount</th>
            <th>Price (€)</th>
            <th>Fee (€)</th>
          </tr>
        </thead>
        <tbody>
          {data.tradeLog.map((trade, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
              <td>{new Date(trade.timestamp).toLocaleString()}</td>
              <td>{trade.type}</td>
              <td>{trade.symbol.toUpperCase()}</td>
              <td>{trade.amount.toFixed(6)}</td>
              <td>{trade.price.toFixed(2)}</td>
              <td>{trade.fee.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 20, fontStyle: "italic" }}>
        Data refreshes every 5 seconds.
      </p>
    </div>
  );
}
