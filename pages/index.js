import { useEffect, useState } from 'react';

export default function Home() {
  const [tradeData, setTradeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTradeData() {
      try {
        const res = await fetch('/api/trade');
        if (!res.ok) throw new Error('API error: ' + res.status);
        const data = await res.json();
        setTradeData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTradeData();

    // Soovi korral pane perioodiline uuendamine
    const interval = setInterval(fetchTradeData, 60 * 1000); // iga 1 min

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Laen andmeid...</div>;
  if (error) return <div>Tekkis viga: {error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Krüpto Trading Bot Dashboard</h1>

      <p><strong>BTC praegune hind:</strong> {tradeData.price.toFixed(2)} EUR</p>
      <p><strong>Kontojääk EUR:</strong> {tradeData.balance.toFixed(2)} €</p>
      <p><strong>Omaduses BTC:</strong> {tradeData.btcAmount.toFixed(6)} BTC</p>
      <p><strong>Kasum:</strong> {tradeData.profit.toFixed(2)} €</p>

      <h2>Tehingute ajalugu</h2>
      {tradeData.trades.length === 0 && <p>Tehinguid veel ei ole.</p>}
      <ul>
        {tradeData.trades.map((trade, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            [{new Date(trade.timestamp).toLocaleString()}] <strong>{trade.type.toUpperCase()}</strong> {trade.btc.toFixed(6)} BTC @ {trade.price.toFixed(2)} EUR (tasud: {trade.fee} €)
          </li>
        ))}
      </ul>
    </div>
  );
}
