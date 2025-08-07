import { useState } from 'react';

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runTrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trade');
      if (!res.ok) throw new Error('API error: ' + res.status);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
      setResult(null);
    }
    setLoading(false);
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Crypto Trading Bot</h1>
      <button onClick={runTrade} disabled={loading} style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
        {loading ? 'Trading...' : 'Run Trade'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <p><b>Current BTC Price:</b> €{result.price.toFixed(2)}</p>
          <p><b>Balance:</b> €{result.balance.toFixed(2)}</p>
          <p><b>BTC Amount:</b> {result.btcAmount.toFixed(6)} BTC</p>
          <p><b>Profit:</b> €{result.profit.toFixed(2)}</p>
          <h2>Trades Log:</h2>
          <ul style={{ maxHeight: '300px', overflowY: 'auto', paddingLeft: '1rem' }}>
            {result.trades.map((trade, i) => (
              <li key={i}>
                [{new Date(trade.timestamp).toLocaleString()}] {trade.type.toUpperCase()} — {trade.btc.toFixed(6)} BTC @ €{trade.price.toFixed(2)} (Fee: €{trade.fee})
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
