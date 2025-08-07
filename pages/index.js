import { useState } from 'react';

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!res.ok) throw new Error('API call failed');

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Failed to fetch trading strategy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>📈 Trading Strategy App</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <label htmlFor="symbol">Enter Symbol (e.g., BTC, AAPL): </label>
        <input
          type="text"
          id="symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          required
          style={{ margin: '0 1rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Get Strategy'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <pre
          style={{
            background: '#f4f4f4',
            padding: '1rem',
            borderRadius: '5px',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
