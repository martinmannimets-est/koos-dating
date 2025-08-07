// pages/api/trades.js
import { loadState, runCycle } from '../../lib/trading.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const s = await loadState();
      return res.status(200).json({ state: s });
    }
    if (req.method === 'POST') {
      // trigger manual cycle (quick)
      const result = await runCycle();
      return res.status(200).json(result);
    }
    res.setHeader('Allow', ['GET','POST']);
    res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[api/trades] error', err?.message || err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}
