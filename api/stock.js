let cache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30 * 1000; // 30 sekundit

export default async function handler(req, res) {
  const now = Date.now();
  if (cache && now - cacheTimestamp < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  try {
    const coins = ['bitcoin', 'ethereum', 'dogecoin'];
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(',')}&vs_currencies=usd`;

    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const results = coins.map(coin => ({
      symbol: coin.toUpperCase(),
      price: data[coin]?.usd || null,
    }));

    cache = { results };
    cacheTimestamp = now;

    res.status(200).json(cache);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from CoinGecko' });
  }
}
