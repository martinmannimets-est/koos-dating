export default function handler(req, res) {
  res.status(200).json({
    name: "Simple Moving Average Crossover",
    description: "Buy when short-term MA crosses above long-term MA.",
    signals: [
      { asset: "AAPL", action: "buy", price: 190.1 },
      { asset: "BTC-USD", action: "hold", price: 57000 },
      { asset: "ETH-USD", action: "sell", price: 2900 }
    ]
  });
}