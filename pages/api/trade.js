// pages/api/trade.js
let tradeHistory = []; // Püsib serverless sessiooni sees, mitte andmebaasis

export default async function handler(req, res) {
  try {
    const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=50&page=1&sparkline=false&locale=en';
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Lihtne AI otsustusloogika
    const decisions = data.map(coin => {
      const priceChange = coin.price_change_percentage_24h;
      let action = 'HOLD';

      if (priceChange > 2) action = 'BUY';
      else if (priceChange < -2) action = 'SELL';

      // Logime tehingu
      tradeHistory.push({
        time: new Date().toISOString(),
        coin: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: priceChange,
        action
      });

      return {
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: priceChange,
        action
      };
    });

    // Hoia ainult viimase 24h tehingud
    const now = Date.now();
    tradeHistory = tradeHistory.filter(t => now - new Date(t.time).getTime() < 24 * 60 * 60 * 1000);

    res.status(200).json({
      prices: decisions,
      history: tradeHistory
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
