import { useEffect, useState } from 'react';

export default function Home() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchSignals() {
    setLoading(true);
    const res = await fetch('/api/strategy');
    const data = await res.json();
    setSignals(data.signals);
    setLoading(false);
  }

  useEffect(() => {
    fetchSignals();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, fontFamily: 'Arial' }}>
      <h1>Trading Model Signals</h1>
      {loading && <p>Loading...</p>}
      {!loading && signals.length === 0 && <p>No signals yet.</p>}
      <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
            <tr key={i} style={{ backgroundColor: s.signal === 'buy' ? '#b6fcb6' : s.signal === 'sell' ? '#fcb6b6' : '' }}>
              <td>{s.time}</td>
              <td>{s.price}</td>
              <td>{s.rsi ? s.rsi.toFixed(1) : '-'}</td>
              <td>{s.signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}