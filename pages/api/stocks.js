export default async function handler(req, res) {
  const symbols = ["AAPL", "GOOGL", "AMZN"];
  const apiKey = process.env.POLYGON_API_KEY;
  const url = `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${new Date().toISOString().split("T")[0]}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const data = await response.json();

    if (!data.results) {
      return res.status(404).json({ error: "No data found" });
    }

    const stocks = data.results.filter((stock) =>
      symbols.includes(stock.T)
    );

    const recommendations = {
      buy: stocks.filter((stock) => stock.c > stock.o),
      sell: stocks.filter((stock) => stock.c < stock.o),
      hold: stocks.filter((stock) => stock.c === stock.o),
    };

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
}
