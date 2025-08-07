import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState({ buy: [], sell: [], hold: [] });
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/stocks");
      const json = await res.json();
      setData(json);
    };

    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCountdown(30);
    }, 30000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  const renderSection = (title, stocks, color) => (
    <div className={`bg-${color}-100 border-l-4 border-${color}-500 p-4 rounded shadow`}>
      <h2 className={`text-xl font-bold text-${color}-700 mb-2`}>{title}</h2>
      {stocks.length === 0 ? (
        <p className="text-sm text-gray-600">No stocks</p>
      ) : (
        <ul className="space-y-1">
          {stocks.map((stock) => (
            <li key={stock.symbol}>
              <strong>{stock.symbol}</strong>: ${stock.buyPrice?.toFixed(2) || stock.price?.toFixed(2)} → ${stock.sellPrice?.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">📈 Trading Recommendations</h1>
        <p className="text-center text-gray-600 mb-4">Auto-refreshes every 30 seconds</p>
        <p className="text-center text-sm text-gray-500 mb-6">Next refresh in: {countdown} sec</p>

        <div className="grid md:grid-cols-3 gap-6">
          {renderSection("BUY", data.buy, "green")}
          {renderSection("SELL", data.sell, "red")}
          {renderSection("HOLD", data.hold, "blue")}
        </div>
      </div>
    </div>
  );
}
