import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function Home() {
  const [balance, setBalance] = useState(10000); // algkapital
  const [portfolio, setPortfolio] = useState({}); // mis mündid käes
  const [tradeLog, setTradeLog] = useState([]); // tehingud koos AI selgitustega
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simuleeritud top 5 krüpto varast (edaspidi saab lisada top 50)
  const assets = ["BTC", "ETH", "BNB", "SOL", "ADA"];

  // Fake hindade generaator 24h jooksul 1min sammuga (1440 min)
  function generateFakePrices() {
    const prices = {};
    assets.forEach((a) => {
      prices[a] = [];
      let base = 100 + Math.random() * 1000;
      for (let i = 0; i < 1440; i++) {
        // Random walk hinnaga
        base += (Math.random() - 0.5) * 5;
        prices[a].push(parseFloat(base.toFixed(2)));
      }
    });
    return prices;
  }

  // AI selgitus päring
  async function getAIExplanation(trade) {
    try {
      const res = await fetch("/api/explainTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade }),
      });
      const data = await res.json();
      return data.explanation || "Selgitust ei saadud";
    } catch {
      return "AI selgitus ebaõnnestus";
    }
  }

  // Lihtne strateegia: kui hind tõuseb viimase 5 min jooksul, müü; kui langeb, osta (lihtne demo)
  function decideAction(prices, asset, minute) {
    if (minute < 5) return "hold";
    const recentPrices = prices[asset].slice(minute - 5, minute);
    const diff = recentPrices[4] - recentPrices[0];
    if (diff > 1) return "sell";
    else if (diff < -1) return "buy";
    else return "hold";
  }

  // Simuleeri ühe minuti kaupa 24h
  async function runSimulation() {
    setRunning(true);
    const prices = generateFakePrices();
    let currentBalance = 10000;
    let currentPortfolio = {};
    let log = [];

    for (let minute = 0; minute < 1440; minute++) {
      for (const asset of assets) {
        const action = decideAction(prices, asset, minute);
        const price = prices[asset][minute];

        if (action === "buy" && currentBalance >= price) {
          // Osta 1 ühik
          currentBalance -= price;
          currentPortfolio[asset] = (currentPortfolio[asset] || 0) + 1;

          const trade = {
            time: minute,
            asset,
            action,
            price,
            balance: currentBalance,
            amount: 1,
          };

          const explanation = await getAIExplanation(trade);

          log.push({ ...trade, explanation });
        } else if (
          action === "sell" &&
          currentPortfolio[asset] &&
          currentPortfolio[asset] > 0
        ) {
          // Müü 1 ühik
          currentBalance += price;
          currentPortfolio[asset] -= 1;

          const trade = {
            time: minute,
            asset,
            action,
            price,
            balance: currentBalance,
            amount: 1,
          };

          const explanation = await getAIExplanation(trade);

          log.push({ ...trade, explanation });
        }
        // kui hold, ei tee midagi
      }
      setProgress(((minute + 1) / 1440) * 100);
    }

    setBalance(currentBalance);
    setPortfolio(currentPortfolio);
    setTradeLog(log);
    setRunning(false);
  }

  // Graafiku andmed: kuvatakse portfelli väärtuse muutus
  const chartData = {
    labels: tradeLog.map((t) => `min ${t.time}`),
    datasets: [
      {
        label: "Balance",
        data: tradeLog.map((t) => t.balance.toFixed(2)),
        fill: false,
        borderColor: "rgb(75,192,192)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h1>AI Crypto Trading Bot Simulator</h1>
      <p>Algkapital: 10 000€ (fake raha)</p>
      <button onClick={runSimulation} disabled={running}>
        {running ? "Simulatsioon käib..." : "Käivita 24h simulatsioon"}
      </button>
      <p>Progress: {progress.toFixed(1)}%</p>

      <h2>Tehingute logi</h2>
      <div
        style={{
          height: 300,
          overflowY: "scroll",
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 20,
        }}
      >
        {tradeLog.length === 0 && <p>Simulatsioonitulemusi pole veel.</p>}
        {tradeLog.map((t, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <b>
              [{t.time} min] {t.action.toUpperCase()} {t.amount} {t.asset} @ {t.price}€
            </b>
            <p>
              <i>Selgitus: {t.explanation}</i>
            </p>
            <hr />
          </div>
        ))}
      </div>

      <h2>Saldo graafikul</h2>
      <Line data={chartData} />
    </div>
  );
}
