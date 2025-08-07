import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState({ buy: [], sell: [], hold: [] });
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/stocks");
      const json = await res.json();
      setData(json);
    };

    fetchData();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          fetchData();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Crypto Trading Recommendations (refreshes every 5 seconds)</h1>
      <p>Next refresh in: {countdown} sec</p>

      <h2>BUY</h2>
      {data.buy.length === 0 ? (
        <p>No cryptos</p>
      ) : (
        <ul>
          {data.buy.map(({ symbol, price }) => (
            <li key={symbol}>
              {symbol} - ${price}
            </li>
          ))}
        </ul>
      )}

      <h2>SELL</h2>
      {data.sell.length === 0 ? (
        <p>No cryptos</p>
      ) : (
        <ul>
          {data.sell.map(({ symbol, price }) => (
            <li key={symbol}>
              {symbol} - ${price}
            </li>
          ))}
        </ul>
      )}

      <h2>HOLD</h2>
      {data.hold.length === 0 ? (
        <p>No cryptos</p>
      ) : (
        <ul>
          {data.hold.map(({ symbol, price }) => (
            <li key={symbol}>
              {symbol} - ${price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
