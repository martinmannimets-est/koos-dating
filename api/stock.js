import yahooFinance from 'yahoo-finance2';

const STOCKS = ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT'];

export default async function handler(req, res) {
  try {
    const results = [];

    for (const symbol of STOCKS) {
      const quote = await yahooFinance.quoteSummary(symbol, { modules: ['price'] });
      const price = quote.price.regularMarketPrice;
      const previousClose = quote.price.regularMarketPreviousClose;

      results.push({ symbol, price, previousClose });
    }

    // Lihtne analüüs: kui hind tõusis võrreldes eelmise sulgemishinnaga, siis "BUY"
    // Kui langes, siis "SELL", muidu "HOLD"
    const buy = results.filter(stock => stock.price > stock.previousClose);
    const sell = results.filter(stock => stock.price < stock.previousClose);
    const hold = results.filter(stock => stock.price === stock.previousClose);

    res.status(200).json({ buy, sell, hold });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
