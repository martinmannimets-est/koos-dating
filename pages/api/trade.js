// pages/api/trade.js
import { tradeCycle, getPublicState, resetState, fetchTop50Prices } from '../../lib/trading.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Return current public state and last fetched top50 prices (if any)
      const state = getPublicState();
      // Also optionally return fresh top50 prices for display
      let top50 = [];
      try {
        top50 = await fetchTop50Prices();
      } catch (e) {
        // ignore price fetch error here; UI can still use state.lastPrices
        console.warn('Could not fetch top50 in GET /api/trade:', e?.message);
      }
      return res.status(200).json({ state, top50 });
    }

    if (req.method === 'POST') {
      // Trigger one trade cycle (simulate buy/sell decisions)
      const result = await tradeCycle();
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      // Reset in-memory state (for debugging)
      const s = resetState();
      return res.status(200).json({ reset: true, state: s });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('/api/trade error:', err?.stack || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
