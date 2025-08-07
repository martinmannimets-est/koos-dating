export default async function handler(req, res) {
  const symbols = ["bitcoin", "ethereum", "litecoin"]; // Crypto coins CoinGecko API-s

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`
        );
        const data = await response.json();
        return {
          symbol: symbol.toUpperCase(),
          price: data[symbol]?.usd ?? null,
        };
      })
    );

    const recommendations = {
      buy: [],
      sell: [],
      hold: [],
    };

    results.forEach(({ symbol, price }) => {
      if (price === null) return;

      if (Math.floor(price) % 2 === 1) {
        recommendations.buy.push({
          symbol,
          buyPrice: price,
          sellPrice: price + 0.5,
        });
      } else if (Math.floor(price) % 2 === 0) {
        recommendations.sell.push({
          symbol,
          sellPrice: price,
          buyPrice: price - 0.5,
        });
      } else {
        recommendations.hold.push({
          symbol,
          price,
          buyPrice: price - 0.5,
          sellPrice: price + 0.5,
        });
      }
    });

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Failed to fetch data from CoinGecko", error);
    res.status(500).json({ error: "Failed to fetch data from CoinGecko" });
  }
}
