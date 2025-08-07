import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState(null);
  const [error, setError] = useState('');

  const fetchSignals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/strategy');
      if (!res.ok) throw new Error('API returned an error');
      const data = await res.json();
      setSignals(data.signals);
    } catch (err) {
      setError('Failed to fetch trading signals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: 'auto' }}>
      <h1>Trading Model Signals</h1>
      <button onClick={fetchSignals} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Signals'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {signals && (
        <table
          style={{
            marginTop: '1rem',
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center'
          }}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Price</th>
              <th>RSI</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s, i) => (
              <tr key={i} style={{ background: s.signal === 'buy' ? '#c8e6c9' : s.signal === 'sell' ? '#ffcdd2' : 'white' }}>
                <td>{s.time}</td>
                <td>{s.price}</td>
                <td>{s.rsi ? s.rsi.toFixed(1) : '-'}</td>
                <td>{s.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
