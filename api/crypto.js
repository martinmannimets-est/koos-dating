export default async function handler(req, res) {
  const coins = ["bitcoin", "ethereum", "solana"];
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(",")}&vs_currencies=usd`
    );
    const data = await response.json();

    const recommendations = {
      buy: [],
      sell: [],
      hold: [],
    };

    coins.forEach((coin) => {
      const price = data[coin].usd;
      // Näide lihtsast logikast: kui price on paarisarv -> buy, muidu sell, muidu hold
      if (Math.floor(price) % 2 === 0) {
        recommendations.buy.push({
          symbol: coin.toUpperCase(),
          buyPrice: price,
          sellPrice: price + 5,
        });
      } else {
        recommendations.sell.push({
          symbol: coin.toUpperCase(),
          sellPrice: price,
          buyPrice: price - 5,
        });
      }
    });

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch crypto data" });
  }
}
