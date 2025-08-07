import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [recommendations, setRecommendations] = useState({ buy: [], sell: [], hold: [] });
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // Funktsioon andmete laadimiseks API-st
  async function fetchData() {
    try {
      const res = await fetch('/api/stocks');
      const data = await res.json();
      setRecommendations(data);
      setRefreshCountdown(30);
    } catch (err) {
      console.error('Failed to fetch stock data', err);
    }
  }

  useEffect(() => {
    fetchData();

    // Timer uuendamiseks iga sekundi tagant
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev === 1) {
          fetchData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function renderList(items) {
    if (!items.length) {
      return <li>No stocks</li>;
    }
    return items.map(({ symbol, buyPrice, sellPrice, price }) => (
      <li key={symbol} className={styles.stockItem}>
        <span>{symbol}</span>
        <span className={styles.stockPrice}>
          {buyPrice ? `Buy: $${buyPrice.toFixed(2)}` : price ? `$${price.toFixed(2)}` : '-'}{' '}
          / {sellPrice ? `Sell: $${sellPrice.toFixed(2)}` : '-'}
        </span>
      </li>
    ));
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Trading Recommendations</h1>
        <div className={styles.countdown}>Next refresh in: {refreshCountdown} sec</div>
      </header>

      <section className={styles.section}>
        <h2>BUY</h2>
        <ul className={styles.stockList}>{renderList(recommendations.buy)}</ul>
      </section>

      <section className={styles.section}>
        <h2>SELL</h2>
        <ul className={styles.stockList}>{renderList(recommendations.sell)}</ul>
      </section>

      <section className={styles.section}>
        <h2>HOLD</h2>
        <ul className={styles.stockList}>{renderList(recommendations.hold)}</ul>
      </section>
    </div>
  );
}
