import { useEffect, useState } from 'react';

export default function Home() {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCryptos() {
      try {
        const res = await fetch('/api/cryptos');
        if (!res.ok) {
          throw new Error('Failed to fetch cryptos: ' + res.status);
        }
        const data = await res.json();
        setCryptos(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCryptos();
  }, []);

  if (loading) return <p>Laeb krüptovarasid...</p>;
  if (error) return <p>Viga: {error}</p>;

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Top 50 krüptovara hetkehind EUR</h1>
      <table border="1" cellPadding="5" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '800px' }}>
        <thead>
          <tr>
            <th>№</th>
            <th>Logo</th>
            <th>Nimi</th>
            <th>Symbol</th>
            <th>Hind (EUR)</th>
            <th>24h muutus (%)</th>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((c, i) => (
            <tr key={c.id} style={{ backgroundColor: c.price_change_percentage_24h > 0 ? '#d4ffd4' : '#ffd4d4' }}>
              <td>{i + 1}</td>
              <td><img src={c.image} alt={c.name} width={24} height={24} /></td>
              <td>{c.name}</td>
              <td>{c.symbol.toUpperCase()}</td>
              <td>{c.current_price.toLocaleString('et-EE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td>{c.price_change_percentage_24h?.toFixed(2) ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
