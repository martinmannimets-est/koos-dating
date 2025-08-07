import { trade } from '../../lib/trading.js';

export default async function handler(req, res) {
  try {
    const result = await trade();
    console.log('Trade executed:', result);
    res.status(200).json(result);
  } catch (e) {
    console.error('Trade error:', e.message);
    console.error(e.stack);
    res.status(500).json({ error: e.message });
  }
}
