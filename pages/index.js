import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState({ buy: [], sell: [], hold: [] });
  const [secondsLeft, setSecondsLeft] = useState(5);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/stocks');
      const json = await res.json();
      setData(json);
      setSecondsLeft(5);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === 1) {
          fetchData();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const renderStocks = (stocks) =>
    stocks.length ? (
      <ul>
        {stocks.map(({ symbol, price, previousClose }) => (
          <li key={symbol}>
            {symbol}: Current ${price.toFixed(2)} / Previous Close ${previousClose.toFixed(2)}
          </li>
        ))}
      </ul>
    ) : (
      <p>No stocks</p>
    );

  return (
    <div style={{ maxWidth: 600, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Trading Recommendations (refreshes every 5 seconds)</h1>
      <p>Next refresh in: {secondsLeft} sec</p>

      <section>
        <h2>BUY</h2>
        {renderStocks(data.buy)}
      </section>

      <section>
        <h2>SELL</h2>
        {renderStocks(data.sell)}
      </section>

      <section>
        <h2>HOLD</h2>
        {renderStocks(data.hold)}
      </section>
    </div>
  );
}
