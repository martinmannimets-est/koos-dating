export default async function handler(req, res) {
  const symbol = req.query.symbol || "AAPL";

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
    );
    const data = await response.json();

    if (!data.quoteResponse || !data.quoteResponse.result.length) {
      return res.status(404).json({ error: "Symbol not found" });
    }

    const quote = data.quoteResponse.result[0];

    res.status(200).json({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      marketState: quote.marketState,
      currency: quote.currency,
      bid: quote.bid,
      ask: quote.ask,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
