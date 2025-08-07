import { useState, useEffect, useRef } from "react";

const SYMBOLS = ["AAPL", "MSFT", "TSLA", "BTC-USD", "ETH-USD"];

function calculateMA(prices, period = 5) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function getRecommendation(shortMA, longMA) {
  if (shortMA === null || longMA === null) return "HOLD";
  if (shortMA > longMA) return "BUY";
  if (shortMA < longMA) return "SELL";
  return "HOLD";
}

export default function Home() {
  const [data, setData] = useState({});
  const [countdown, setCountdown] = useState(30);
  const priceHistory = useRef({}); // store historical prices per symbol

  async function fetchPrices() {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS.join(",")}`
      );
      const json = await res.json();
      if (!json.quoteResponse || !json.quoteResponse.result) {
        throw new Error("Invalid data");
      }
      const results = json.quoteResponse.result;

      const newData = {};
      results.forEach((item) => {
        const symbol = item.symbol;
        const price = item.regularMarketPrice;
        const prevClose = item.regularMarketPreviousClose;

        // Update price history
        if (!priceHistory.current[symbol]) priceHistory.current[symbol] = [];
        priceHistory.current[symbol].push(price);
        // Keep last 20 prices max
        if (priceHistory.current[symbol].length > 20)
          priceHistory.current[symbol].shift();

        // Calculate short MA (5) and long MA (10)
        const shortMA = calculateMA(priceHistory.current[symbol], 5);
        const longMA = calculateMA(priceHistory.current[symbol], 10);

        const recommendation = getRecommendation(shortMA, longMA);

        newData[symbol] = {
          price,
          prevClose,
          change: price - prevClose,
          recommendation,
        };
      });
      setData(newData);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  // Fetch prices initially and every 30 seconds
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => {
      fetchPrices();
      setCountdown(30);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer for refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Day Trading Signals</h1>
      <p>Prices update every 30 seconds. Next refresh in: {countdown}s</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Symbol</th>
            <th style={{ textAlign: "right", padding: "8px" }}>Price (USD)</th>
            <th style={{ textAlign: "right", padding: "8px" }}>Change</th>
            <th style={{ textAlign: "center", padding: "8px" }}>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((symbol) => {
            const item = data[symbol];
            if (!item) {
              return (
                <tr key={symbol}>
                  <td>{symbol}</td>
                  <td colSpan={3} style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              );
            }
            return (
              <tr key={symbol} style={{ borderBottom: "1px solid #ccc" }}>
                <td>{symbol}</td>
                <td style={{ textAlign: "right" }}>{item.price.toFixed(2)}</td>
                <td
                  style={{
                    textAlign: "right",
                    color: item.change >= 0 ? "green" : "red",
                  }}
                >
                  {item.change >= 0 ? "▲" : "▼"} {item.change.toFixed(2)}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    color:
                      item.recommendation === "BUY"
                        ? "green"
                        : item.recommendation === "SELL"
                        ? "red"
                        : "gray",
                  }}
                >
                  {item.recommendation}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer style={{ marginTop: 20, fontSize: "0.9em", color: "#555" }}>
        Data from Yahoo Finance unofficial API. Use for educational purposes only.
      </footer>
    </div>
  );
}
