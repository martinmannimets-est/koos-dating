import { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// RSI arvutus (lihtsustatud)
function calculateRSI(data, period = 14) {
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// MACD lihtsustatud versioon
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let emaArray = [];
  emaArray[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    emaArray[i] = data[i] * k + emaArray[i - 1] * (1 - k);
  }
  return emaArray;
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  const macdLine = emaFast.map((val, idx) => val - emaSlow[idx]);
  const signalLine = calculateEMA(macdLine.slice(slowPeriod - 1), signalPeriod);
  return { macdLine, signalLine };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [trades, setTrades] = useState([]);
  const [prices, setPrices] = useState([]);
  const [log, setLog] = useState([]);

  useEffect(() => {
    async function fetchAndSimulate() {
      setLoading(true);
      try {
        // Hangi top 50 mündid CoinGecko API-st
        const coinsRes = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "eur",
              order: "market_cap_desc",
              per_page: 50,
              page: 1,
              price_change_percentage: "24h",
            },
          }
        );

        const coins = coinsRes.data;

        // Hangi hinnad viimase 1 päeva kohta (24h intervalliga)
        // Siin võtame ühe mündi 24h hinda demo jaoks (näiteks Bitcoin)
        const coinId = coins[0].id;

        const historyRes = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: "eur",
              days: 1,
              interval: "hourly",
            },
          }
        );

        const pricesData = historyRes.data.prices; // [ [timestamp, price], ... ]

        const priceList = pricesData.map((p) => p[1]);

        // Arvuta indikaatorid
        const rsi = calculateRSI(priceList);
        const macd = calculateMACD(priceList);

        // Simuleeri kauplemist
        let cash = 10000;
        let position = 0;
        let tradeLog = [];

        // Lihtne strateegia: osta, kui RSI < 30 ja macdLine > signalLine (ostusignaal)
        // müü kui RSI > 70 ja macdLine < signalLine (müügiteade)

        for (let i = 26; i < priceList.length; i++) {
          const currentPrice = priceList[i];
          const currentRSI = calculateRSI(priceList.slice(i - 14, i + 1));
          const { macdLine, signalLine } = calculateMACD(priceList.slice(i - 26, i + 1));
          const currentMACD = macdLine[macdLine.length - 1];
          const currentSignal = signalLine[signalLine.length - 1];

          if (
            currentRSI < 30 &&
            currentMACD > currentSignal &&
            cash >= currentPrice
          ) {
            // Osta
            const quantity = Math.floor(cash / currentPrice);
            cash -= quantity * currentPrice;
            position += quantity;
            tradeLog.push({
              time: pricesData[i][0],
              type: "BUY",
              price: currentPrice,
              quantity,
              reason: "RSI < 30 ja MACD ostusignaal",
              strategy: "RSI + MACD",
            });
          } else if (
            currentRSI > 70 &&
            currentMACD < currentSignal &&
            position > 0
          ) {
            // Müü
            cash += position * currentPrice;
            tradeLog.push({
              time: pricesData[i][0],
              type: "SELL",
              price: currentPrice,
              quantity: position,
              reason: "RSI > 70 ja MACD müügisignaal",
              strategy: "RSI + MACD",
            });
            position = 0;
          }
        }

        const finalBalance = cash + position * priceList[priceList.length - 1];

        setBalance(finalBalance.toFixed(2));
        setTrades(tradeLog);
        setPrices(priceList);
        setLog(tradeLog.map(t => `${new Date(t.time).toLocaleString()}: ${t.type} ${t.quantity} @${t.price.toFixed(2)} EUR - ${t.reason}`));
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }

    fetchAndSimulate();
  }, []);

  const data = {
    labels: prices.map((_, i) => `T${i}`),
    datasets: [
      {
        label: "Hind EUR",
        data: prices,
        borderColor: "rgba(75,192,192,1)",
        fill: false,
      },
      ...trades
        .filter((t) => t.type === "BUY")
        .map((t) => ({
          label: "BUY",
          data: prices.map((p, i) =>
            i === prices.findIndex((_, idx) => idx === trades.indexOf(t)) ? t.price : null
          ),
          borderColor: "green",
          pointRadius: 6,
          pointStyle: "triangle",
          fill: false,
          showLine: false,
        })),
      ...trades
        .filter((t) => t.type === "SELL")
        .map((t) => ({
          label: "SELL",
          data: prices.map((p, i) =>
            i === prices.findIndex((_, idx) => idx === trades.indexOf(t)) ? t.price : null
          ),
          borderColor: "red",
          pointRadius: 6,
          pointStyle: "rectRot",
          fill: false,
          showLine: false,
        })),
    ],
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>AI Crypto Trading Bot Demo v1</h1>
      <p>Simuleeritud saldo: {balance} EUR</p>
      {loading && <p>Laen andmeid ja simuleerin kauplemist...</p>}

      <Line data={data} />

      <h2>Tehingute logi</h2>
      <ul>
        {log.map((entry, idx) => (
          <li key={idx}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
