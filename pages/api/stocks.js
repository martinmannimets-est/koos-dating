import fetch from "node-fetch";

export default async function handler(req, res) {
  const coins = ["bitcoin", "ethereum", "cardano", "dogecoin", "solana"];

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(
        ","
      )}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data from CoinGecko");
    }

    const data = await response.json();

    const recommendations = {
      buy: [],
      sell: [],
      hold: [],
    };

    for (const coin of coins) {
      const price = data[coin]?.usd || 0;

      if (Math.floor(price) % 2 === 0) {
        recommendations.sell.push({
          symbol: coin.toUpperCase(),
          price,
        });
      } else if (Math.floor(price) % 2 === 1) {
        recommendations.buy.push({
          symbol: coin.toUpperCase(),
          price,
        });
      } else {
        recommendations.hold.push({
          symbol: coin.toUpperCase(),
          price,
        });
      }
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch crypto data" });
  }
}
