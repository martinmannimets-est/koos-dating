import { useEffect, useState } from 'react';

export default function Home() {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/cryptos')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setCryptos(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Laeb...</p>;
  if (error) return <p>Viga: {error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Top 50 krüptovara hinnad EUR</h1>
      <table border="1" cellPadding="5" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '800px' }}>
        <thead>
          <tr>
            <th>Nr</th>
            <th>Nimi</th>
            <th>Sümbol</th>
            <th>Hind (€)</th>
            <th>Turukapital (€)</th>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((c, i) => (
            <tr key={c.id}>
              <td>{i + 1}</td>
              <td>{c.name}</td>
              <td>{c.symbol.toUpperCase()}</td>
              <td>{c.current_price.toLocaleString('et-EE', { minimumFractionDigits: 2 })}</td>
              <td>{c.market_cap.toLocaleString('et-EE')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
