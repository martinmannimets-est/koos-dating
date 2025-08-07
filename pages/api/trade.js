import { getPrice, loadState, saveState } from '../../lib/trading';

export default async function handler(req, res) {
  try {
    const result = await trade();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
