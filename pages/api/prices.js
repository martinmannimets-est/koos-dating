// pages/api/prices.js
export default async function handler(req, res) {
  try {
    // CoinGecko market_chart: viimased 1 päev (24h). interval=hourly või minutely
    const url = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=1&interval=hourly';
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('CoinGecko error: ' + r.status);
    const data = await r.json();

    // data.prices = [[timestamp_ms, price], ...]
    res.status(200).json({ prices: data.prices || [] });
  } catch (err) {
    console.error('[api/prices] error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Price fetch failed' });
  }
}
