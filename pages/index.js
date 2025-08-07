// pages/index.js
import { useEffect, useRef, useState } from 'react';

const defaultAssets = ['bitcoin','ethereum','litecoin','ripple','dogecoin'];

export default function Home() {
  const [asset, setAsset] = useState('bitcoin');
  const [prices, setPrices] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  async function fetchAll(a=asset) {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/prices?id=${encodeURIComponent(a)}`),
        fetch('/api/trades')
      ]);
      if (!pRes.ok) throw new Error('/api/prices error');
      if (!sRes.ok) throw new Error('/api/trades error');
      const pj = await pRes.json();
      const sj = await sRes.json();
      setPrices(pj.prices || []);
      setState(sj.state || null);
    } catch (e) {
      setError(e.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll(asset);
    const intv = setInterval(()=>fetchAll(asset), 30*1000);
    return ()=>clearInterval(intv);
  }, [asset]);

  useEffect(()=> {
    if (!prices || prices.length===0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = 320;
    canvas.width = w * DPR; canvas.height = h * DPR;
    ctx.scale(DPR, DPR);
    ctx.clearRect(0,0,w,h);

    const pts = prices.map(p=>({x:new Date(p[0]), y:p[1]}));
    const padding = 40;
    const xMin = pts[0].x.getTime();
    const xMax = pts[pts.length-1].x.getTime();
    const yMin = Math.min(...pts.map(p=>p.y));
    const yMax = Math.max(...pts.map(p=>p.y));
    function sx(ts){ return padding + ((ts - xMin)/(xMax-xMin||1))*(w - padding*2); }
    function sy(v){ return padding + (1 - (v - yMin)/(yMax - yMin || 1))*(h - padding*2); }

    // grid
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#eee'; ctx.lineWidth=1;
    ctx.font='12px Arial'; ctx.fillStyle='#666';
    for(let i=0;i<=4;i++){
      const y = padding + i*((h-padding*2)/4);
      ctx.beginPath(); ctx.moveTo(padding,y); ctx.lineTo(w-padding,y); ctx.stroke();
      const val = (yMax - i*((yMax-yMin)/4)).toFixed(2);
      ctx.fillText(val + ' €', 6, y+4);
    }

    ctx.beginPath(); ctx.lineWidth=2; ctx.strokeStyle='#2b8aef';
    pts.forEach((p,idx)=>{ const x=sx(p.x.getTime()), y=sy(p.y); if(idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
    ctx.stroke();
    const last=pts[pts.length-1]; ctx.beginPath(); ctx.fillStyle='#2b8aef'; ctx.arc(sx(last.x.getTime()), sy(last.y),4,0,Math.PI*2); ctx.fill();

  }, [prices]);

  async function manualTrade() {
    setLoading(true);
    try {
      const r = await fetch('/api/trades', { method: 'POST' });
      if (!r.ok) throw new Error('Trade failed');
      await fetchAll(asset);
    } catch (e) {
      setError(e.message || 'Trade error');
    } finally { setLoading(false); }
  }

  function compute24h() {
    if (!state || !state.trades) return null;
    const dayAgo = Date.now() - 24*60*60*1000;
    const in24 = state.trades.filter(t=>new Date(t.timestamp).getTime() >= dayAgo);
    const fees = in24.reduce((s,t)=>s+(t.fee||0),0);
    let buy=0, sell=0;
    in24.forEach(t=>{ if(t.type==='buy') buy+=t.amountEUR||0; if(t.type==='sell') sell+=t.amountEUR||0; });
    return { count: in24.length, buy, sell, fees, net: sell-buy-fees, items: in24 };
  }

  const summary = compute24h();

  return (
    <div style={{maxWidth:1000, margin:'auto', padding:20, fontFamily:'Arial, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Multi-Crypto Trading Dashboard</h1>
        <div>
          <select value={asset} onChange={(e)=>setAsset(e.target.value)} style={{marginRight:8}}>
            {defaultAssets.map(a=> <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={()=>fetchAll(asset)} disabled={loading} style={{marginRight:8}}>Uuenda</button>
          <button onClick={manualTrade} disabled={loading}>Käivita tehing</button>
        </div>
      </header>

      {error && <p style={{color:'red'}}>{error}</p>}

      <section style={{marginTop:16}}>
        <h2>24h hinnagraafik — {asset}</h2>
        <div style={{border:'1px solid #ddd', padding:8, borderRadius:6, background:'#fff'}}>
          <canvas ref={canvasRef} style={{width:'100%', height:320, display:'block'}} />
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>Tehingute tabel (kõik)</h2>
        <div style={{border:'1px solid #ddd', borderRadius:6, overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#f6f6f6'}}><th style={th}>Aeg</th><th style={th}>Asset</th><th style={th}>Tüüp</th><th style={th}>BTC</th><th style={th}>Hind (€)</th><th style={th}>Summa (€)</th><th style={th}>Tasu</th></tr></thead>
            <tbody>
              {state && state.trades && state.trades.length>0 ? state.trades.slice().reverse().map((t,i)=>(
                <tr key={i} style={{borderTop:'1px solid #eee'}}>
                  <td style={td}>{new Date(t.timestamp).toLocaleString()}</td>
                  <td style={td}>{t.asset||'n/a'}</td>
                  <td style={td}>{t.type}</td>
                  <td style={td}>{(t.btc||0).toFixed(6)}</td>
                  <td style={td}>{(t.price||0).toFixed(2)}</td>
                  <td style={td}>{(t.amountEUR||0).toFixed(2)}</td>
                  <td style={td}>{(t.fee||0).toFixed(2)}</td>
                </tr>
              )) : <tr><td style={td} colSpan={7}>Tehinguid pole</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h2>24h kokkuvõte</h2>
        {summary ? (
          <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
            <div style={card}><b>Tehinguid:</b> {summary.count}</div>
            <div style={card}><b>Ostud (€):</b> {summary.buy.toFixed(2)}</div>
            <div style={card}><b>Müük (€):</b> {summary.sell.toFixed(2)}</div>
            <div style={card}><b>Tasud (€):</b> {summary.fees.toFixed(2)}</div>
            <div style={card}><b>Net (€):</b> {summary.net.toFixed(2)}</div>
          </div>
        ) : <p>Andmed puuduvad</p>}
      </section>
    </div>
  )
}

const th = {textAlign:'left', padding:'8px 12px', fontSize:13};
const td = {padding:'8px 12px', fontSize:13};
const card = {padding:12, border:'1px solid #eee', borderRadius:6, background:'#fff'};
