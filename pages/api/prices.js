// pages/api/prices.js
export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const coin = id || 'bitcoin';
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coin)}/market_chart?vs_currency=eur&days=1&interval=hourly`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('CoinGecko error: ' + r.status);
    const data = await r.json();
    res.status(200).json({ prices: data.prices || [] });
  } catch (err) {
    console.error('[api/prices] error', err?.message || err);
    res.status(500).json({ error: err?.message || 'Price fetch failed' });
  }
}
