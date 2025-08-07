// pages/api/trades.js
import { loadState, trade, getPrice } from '../../lib/trading.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const state = await loadState();
      // lisa ka hetke hind, et front-end saaks netWorth arvutada
      let price = null;
      try {
        price = await getPrice();
      } catch (e) {
        console.warn('[api/trades] getPrice failed:', e?.message);
      }
      return res.status(200).json({ state, price });
    }

    if (req.method === 'POST') {
      const result = await trade();
      return res.status(200).json(result);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[api/trades] error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
