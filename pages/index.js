// pages/index.js
import { useEffect, useState } from 'react';

export default function Home() {
  const [top50, setTop50] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auto, setAuto] = useState(true);

  async function fetchState() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trade');
      if (!res.ok) throw new Error('API GET /api/trade error: ' + res.status);
      const j = await res.json();
      setState(j.state || null);
      setTop50(j.top50 || []);
    } catch (e) {
      setError(e.message || 'Fetch error');
    } finally {
      setLoading(false);
    }
  }

  async function runCycle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trade', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error('POST /api/trade failed: ' + res.status + ' ' + text);
      }
      const j = await res.json();
      // j has executed and state
      setState(j.state || state);
      // refresh top50 too
      await fetchState();
    } catch (e) {
      setError(e.message || 'Trade error');
    } finally {
      setLoading(false);
    }
  }

  // Reset state (debug)
  async function resetAll() {
    setLoading(true);
    try {
      const res = await fetch('/api/trade', { method: 'DELETE' });
      if (!res.ok) throw new Error('Reset failed: ' + res.status);
      const j = await res.json();
      setState(j.state);
      setTop50([]);
    } catch (e) {
      setError(e.message || 'Reset error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchState();
    let intv;
    if (auto) {
      intv = setInterval(() => {
        fetchState();
      }, 30000); // refresh every 30s
    }
    return () => clearInterval(intv);
  }, [auto]);

  // compute decisions for table: if there's a position on asset => 'HOLD' or 'SELL if meets target', else 'BUY if dropped'
  function getDecisionForAsset(a) {
    if (!state) return '-';
    const lastPrices = state.lastPrices || {};
    const positions = state.positions || {};
    const pos = positions[a.id] || positions[`pos_${a.id}`] || null;
    if (pos && pos.amount && pos.amount > 0) {
      const buyPrice = pos.buyPrice || pos.investedEUR && (pos.investedEUR / pos.amount) || 0;
      if (a.price >= buyPrice * 1.70) return 'SELL (target 70%)';
      return 'HOLD';
    } else {
      const last = lastPrices[a.id];
      if (typeof last === 'number' && last > 0) {
        const drop = (last - a.price) / last;
        if (drop >= 0.01) return 'BUY (price dropped ≥1%)';
      }
      return 'HOLD';
    }
  }

  // 24h summary computed from trades
  function compute24hSummary() {
    if (!state || !state.trades) return null;
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const in24 = state.trades.filter(t => new Date(t.timestamp).getTime() >= dayAgo);
    const fees = in24.reduce((s, t) => s + (t.fee || 0), 0);
    const buySum = in24.filter(t => t.type === 'buy').reduce((s, t) => s + (t.amountEUR || 0), 0);
    const sellSum = in24.filter(t => t.type === 'sell').reduce((s, t) => s + (t.amountEUR || 0), 0);
    const net = sellSum - buySum - fees;
    return { count: in24.length, buySum, sellSum, fees, net, trades: in24 };
  }

  const summary = compute24hSummary();

  return (
    <div style={{ maxWidth: 1100, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Top-50 Crypto Live — Bot Dashboard (70% target)</h1>
        <div>
          <button onClick={fetchState} style={{ marginRight: 8 }} disabled={loading}>Uuenda hinnad</button>
          <button onClick={runCycle} disabled={loading} style={{ marginRight: 8 }}>Käivita trade-tsükkel</button>
          <button onClick={resetAll} disabled={loading} style={{ marginRight: 8 }}>Reset (debug)</button>
          <label style={{ marginLeft: 8 }}>
            <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> Auto refresh
          </label>
        </div>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>Top 50 — hetkehind (EUR) ja bot-otsus</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f6f6f6' }}>
                <th style={th}>#</th>
                <th style={th}>Asset</th>
                <th style={th}>Symbol</th>
                <th style={th}>Hind (€)</th>
                <th style={th}>24h Δ (%)</th>
                <th style={th}>Market cap</th>
                <th style={th}>Otsus</th>
              </tr>
            </thead>
            <tbody>
              {top50.length === 0 ? (
                <tr><td style={td} colSpan={7}>Laadin või andmeid ei leitud</td></tr>
              ) : top50.map((a, i) => (
                <tr key={a.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{a.name}</td>
                  <td style={td}>{a.symbol.toUpperCase()}</td>
                  <td style={td}>{a.price.toFixed(2)}</td>
                  <td style={td}>{typeof a.price_change_24h === 'number' ? a.price_change_24h.toFixed(2) : '-'}</td>
                  <td style={td}>{a.market_cap ? a.market_cap.toLocaleString() : '-'}</td>
                  <td style={td}>{getDecisionForAsset(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Tehingute ajalugu (viimased)</h2>
        <div style={{ border: '1px solid #ddd', borderRadius: 6, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={th}>Aeg</th>
                <th style={th}>Asset</th>
                <th style={th}>Tüüp</th>
                <th style={th}>Hind (€)</th>
                <th style={th}>Kogus (coin)</th>
                <th style={th}>Summa (€)</th>
                <th style={th}>Tasu (€)</th>
                <th style={th}>Info</th>
              </tr>
            </thead>
            <tbody>
              {state && state.trades && state.trades.length > 0 ? state.trades.slice().reverse().map((t, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                  <td style={td}>{new Date(t.timestamp).toLocaleString()}</td>
                  <td style={td}>{t.asset}</td>
                  <td style={td}>{t.type}</td>
                  <td style={td}>{(t.price || 0).toFixed(2)}</td>
                  <td style={td}>{(t.amountCoin || 0).toFixed(6)}</td>
                  <td style={td}>{(t.amountEUR || 0).toFixed(2)}</td>
                  <td style={td}>{(t.fee || 0).toFixed(2)}</td>
                  <td style={td}>{t.info || ''}</td>
                </tr>
              )) : (
                <tr><td style={td} colSpan={8}>Tehinguid ei ole</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>24h kokkuvõte</h2>
        {summary ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={card}><b>Tehinguid 24h:</b> {summary.count}</div>
            <div style={card}><b>Ostud (€):</b> {summary.buySum.toFixed(2)}</div>
            <div style={card}><b>Müük (€):</b> {summary.sellSum.toFixed(2)}</div>
            <div style={card}><b>Tasud (€):</b> {summary.fees.toFixed(2)}</div>
            <div style={card}><b>Net (€):</b> {summary.net.toFixed(2)}</div>
          </div>
        ) : <p>Andmeid pole</p>}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Hetke seis</h2>
        {state ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={card}><b>Balance (€):</b> {state.balance.toFixed(2)}</div>
            <div style={card}><b>Positions:</b> {Object.keys(state.positions || {}).filter(k=>state.positions[k] && state.positions[k].amount>0).length}</div>
            <div style={card}><b>Last run:</b> {state.lastRunISO || '-'}</div>
          </div>
        ) : <p>Laadin...</p>}
      </section>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 12px', fontSize: 13 };
const td = { padding: '8px 12px', fontSize: 13 };
const card = { padding: 12, border: '1px solid #eee', borderRadius: 6, background: '#fff' };
