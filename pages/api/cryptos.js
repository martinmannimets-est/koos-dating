// pages/api/cryptos.js

export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=50&page=1&sparkline=false');
    if (!response.ok) {
      throw new Error('CoinGecko API error: ' + response.status);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
