import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [prices, setPrices] = useState([]); // [[ts, price], ...]
  const [tradeState, setTradeState] = useState(null); // { state, price } from /api/trades GET
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/prices'),
        fetch('/api/trades')
      ]);
      if (!pRes.ok) throw new Error('/api/prices error: ' + pRes.status);
      if (!tRes.ok) throw new Error('/api/trades error: ' + tRes.status);

      const pjson = await pRes.json();
      const tjson = await tRes.json();

      setPrices(pjson.prices || []);
      setTradeState(tjson);
    } catch (e) {
      console.error('fetchAll error', e);
      setError(e.message || 'Viga andmete toomisel');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30 * 1000); // uuenda 30s järel
    return () => clearInterval(interval);
  }, []);

  // joonista hinnagrafik canvas-il
  useEffect(() => {
    if (!prices || !prices.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = 300;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, width, height);

    // muuda prices kujule {x: Date, y: price}
    const points = prices.map(p => ({ x: new Date(p[0]), y: p[1] }));
    // x ja y skaleerimine
    const padding = 40;
    const xMin = points[0].x.getTime();
    const xMax = points[points.length - 1].x.getTime();
    const yVals = points.map(p => p.y);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);

    function sx(ts) {
      return padding + ((ts - xMin) / (xMax - xMin || 1)) * (width - padding * 2);
    }
    function sy(price) {
      // invert y
      return padding + (1 - (price - yMin) / (yMax - yMin || 1)) * (height - padding * 2);
    }

    // taust
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // joonista grid y-teljel 4 rida
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    for (let i = 0; i <= 4; i++) {
      const y = padding + i * ((height - padding * 2) / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      const val = (yMax - (i * ((yMax - yMin) / 4))).toFixed(2);
      ctx.fillText(val + ' €', 6, y + 4);
    }

    // price line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2b8aef';
    points.forEach((pt, idx) => {
      const x = sx(pt.x.getTime());
      const y = sy(pt.y);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // tooltip-ish: näita viimast punkti ringiga
    const last = points[points.length - 1];
    const lx = sx(last.x.getTime());
    const ly = sy(last.y);
    ctx.beginPath();
    ctx.fillStyle = '#2b8aef';
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();

  }, [prices]);

  // käivita käsitsi trade (POST)
  async function runTrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trades', { method: 'POST' });
      if (!res.ok) throw new Error('Trade failed: ' + res.status);
      const json = await res.json();
      // pärast trade, uuenda andmeid
      await fetchAll();
    } catch (e) {
      console.error('runTrade error', e);
      setError(e.message || 'Trade error');
    } finally {
      setLoading(false);
    }
  }

  // arvuta 24h tulemus (kui trades sisaldavad timestamps ISO string)
  function compute24hSummary() {
    if (!tradeState || !tradeState.state) return null;
    const trades = tradeState.state.trades || [];
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const in24 = trades.filter(t => new Date(t.timestamp).getTime() >= dayAgo);
    const fees = in24.reduce((s, t) => s + (t.fee || 0), 0);
    // lihtne kasum arvutus: koguväärtus (sell protsedid - buy amount) - fees
    // aga kuna meie trade logis on amountEUR for both buy/sell, kasutame seda:
    let buyTotal = 0;
    let sellTotal = 0;
    in24.forEach(t => {
      if (t.type === 'buy') buyTotal += (t.amountEUR || 0);
      if (t.type === 'sell') sellTotal += (t.amountEUR || 0);
    });
    const net = sellTotal - buyTotal - fees;
    return { tradesCount: in24.length, buyTotal, sellTotal, fees, net, items: in24 };
  }

  const summary24 = compute24hSummary();

  return (
    <div style={{ maxWidth: 1000, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Trading Dashboard — 24h graafik & tehingud</h1>
        <div>
          <button onClick={fetchAll} disabled={loading} style={{ marginRight: 8 }}>Uuenda</button>
          <button onClick={runTrade} disabled={loading}>Käivita tehing (POST)</button>
        </div>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>BTC hinnagraafik (24h)</h2>
        <div style={{ border: '1px solid #ddd', padding: 8, borderRadius: 6, background: '#fff' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 300, display: 'block' }} />
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Tehingute tabel (kõik)</h2>
        <div style={{ border: '1px solid #ddd', borderRadius: 6, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f6f6f6' }}>
                <th style={th}>Aeg</th>
                <th style={th}>Tüüp</th>
                <th style={th}>BTC</th>
                <th style={th}>Hind (€)</th>
                <th style={th}>Summa (€)</th>
                <th style={th}>Tasu (€)</th>
              </tr>
            </thead>
            <tbody>
              {tradeState && tradeState.state && tradeState.state.trades.length > 0 ? (
                tradeState.state.trades.slice().reverse().map((t, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                    <td style={td}>{new Date(t.timestamp).toLocaleString()}</td>
                    <td style={td}>{t.type}</td>
                    <td style={td}>{(t.btc || 0).toFixed(6)}</td>
                    <td style={td}>{(t.price || 0).toFixed(2)}</td>
                    <td style={td}>{(t.amountEUR || 0).toFixed(2)}</td>
                    <td style={td}>{(t.fee || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td style={td} colSpan={6}>Tehinguid pole</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>24h kokkuvõte</h2>
        {summary24 ? (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={card}><b>Tehinguid 24h:</b> {summary24.tradesCount}</div>
            <div style={card}><b>Ostud kokku (€):</b> {summary24.buyTotal.toFixed(2)}</div>
            <div style={card}><b>Müügikäive (€):</b> {summary24.sellTotal.toFixed(2)}</div>
            <div style={card}><b>Tasud (€):</b> {summary24.fees.toFixed(2)}</div>
            <div style={card}><b>Netto 24h (€):</b> {summary24.net.toFixed(2)}</div>
          </div>
        ) : (
          <p>Andmed puuduvad</p>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Hetke seis</h2>
        {tradeState && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={card}><b>Balance (€):</b> {(tradeState.state.balance || 0).toFixed(2)}</div>
            <div style={card}><b>BTC:</b> {(tradeState.state.btcAmount || 0).toFixed(6)}</div>
            <div style={card}><b>Hind (viimane):</b> {(tradeState.price || 0).toFixed(2)} €</div>
            <div style={card}><b>Kasum (net):</b> {(() => {
              const price = tradeState.price || 0;
              const totalFees = (tradeState.state.trades || []).reduce((s,t)=>s+(t.fee||0),0);
              const netWorth = (tradeState.state.balance || 0) + (tradeState.state.btcAmount || 0) * price;
              const profit = netWorth - 10000 - totalFees;
              return profit.toFixed(2);
            })()}</div>
          </div>
        )}
      </section>
    </div>
  );
}

const th = { textAlign: 'left', padding: '8px 12px', fontSize: 13 };
const td = { padding: '8px 12px', fontSize: 13 };
const card = { padding: 12, border: '1px solid #eee', borderRadius: 6, background: '#fff' };
