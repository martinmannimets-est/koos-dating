import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Home() {
  const [prices, setPrices] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/trade");
    const data = await res.json();
    setPrices(data.prices);
    setHistory(data.history);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartOptions = {
    chart: { type: 'line' },
    xaxis: { categories: prices.map(p => p.symbol) },
    yaxis: { title: { text: "EUR" } }
  };

  const chartSeries = [{
    name: "Current Price",
    data: prices.map(p => p.price)
  }];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Crypto Trading Bot — Top 50 Assets</h1>
      {loading && <p>Loading...</p>}

      <Chart options={chartOptions} series={chartSeries} type="line" height={350} />

      <h2>Current Market</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Coin</th>
            <th>Price (EUR)</th>
            <th>24h %</th>
            <th>Bot Action</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, idx) => (
            <tr key={idx}>
              <td>{p.name} ({p.symbol})</td>
              <td>{p.price.toFixed(2)}</td>
              <td style={{ color: p.change24h >= 0 ? "green" : "red" }}>
                {p.change24h.toFixed(2)}%
              </td>
              <td>{p.action}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Trade History (Last 24h)</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Coin</th>
            <th>Price (EUR)</th>
            <th>24h %</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map((t, idx) => (
            <tr key={idx}>
              <td>{t.time}</td>
              <td>{t.coin}</td>
              <td>{t.price.toFixed(2)}</td>
              <td style={{ color: t.change24h >= 0 ? "green" : "red" }}>
                {t.change24h.toFixed(2)}%
              </td>
              <td>{t.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
