import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [tradeData, setTradeData] = useState({
    price: 0,
    balance: 10000,
    btcAmount: 0,
    profit: 0,
    trades: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const countdownRef = useRef(null);

  // Simuleeritud fetch API-st (võid asendada enda päringuga)
  async function fetchTradeData() {
    setLoading(true);
    setError(null);
    try {
      // SIIN VAHETA OMA TEGELIK API URL VÕI LOGIKA
      // Näiteks: const res = await fetch('/api/trade');
      // const data = await res.json();

      // Simulatsioon: uuendame hinna suvaliselt ja anname näidisandmed
      const newPrice = 40000 + Math.random() * 2000 - 1000; // umbes 39-41k vahemik
      setTradeData((prev) => ({
        ...prev,
        price: newPrice,
      }));
    } catch (e) {
      setError('Ei saanud andmeid');
    } finally {
      setLoading(false);
      setRefreshCountdown(30);
    }
  }

  useEffect(() => {
    fetchTradeData();

    countdownRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchTradeData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, []);

  function handleManualTrade() {
    // Simuleeritud tehing
    setLoading(true);
    setTimeout(() => {
      setTradeData((prev) => {
        // Kui on vähem kui 1000€ EUR jääki, ostame ainult selle võrra BTC
        const buyAmountEUR = Math.min(1000, prev.balance);
        if (buyAmountEUR < 100) {
          // liiga vähe raha ostmiseks
          alert('Kontol liiga vähe raha ostmiseks');
          return prev;
        }
        // Osta BTC
        const btcBought = buyAmountEUR / prev.price;
        const fee = 1; // tasu ühe tehingu kohta

        // Müüme, kui hind tõusis (lihtne loogika)
        // Võtame viimase tehingu hinda või ostuhinda
        const lastTrade = prev.trades.length > 0 ? prev.trades[prev.trades.length - 1] : null;
        let newBalance = prev.balance - buyAmountEUR - fee;
        let newBtcAmount = prev.btcAmount + btcBought;
        let newProfit = prev.profit - fee;

        // Lihtne näide: kui meil on BTC ja hind on tõusnud 1% võrra, müüme kõik maha
        if (newBtcAmount > 0 && prev.price > (lastTrade?.price || 0) * 1.01) {
          // müüa kogu BTC maha
          const sellProceeds = newBtcAmount * prev.price;
          newBalance += sellProceeds - fee;
          newProfit += sellProceeds - buyAmountEUR - 2 * fee; // kasum - ostu- ja müügitasud
          newBtcAmount = 0;
          // Lisa müügi tehing
          const sellTrade = {
            type: 'sell',
            btc: newBtcAmount,
            price: prev.price,
            amountEUR: sellProceeds,
            fee: fee,
            timestamp: Date.now(),
          };
          return {
            ...prev,
            balance: newBalance,
            btcAmount: newBtcAmount,
            profit: newProfit,
            trades: [...prev.trades, sellTrade],
          };
        }

        // Lisa ostu tehing
        const buyTrade = {
          type: 'buy',
          btc: btcBought,
          price: prev.price,
          amountEUR: buyAmountEUR,
          fee: fee,
          timestamp: Date.now(),
        };

        return {
          ...prev,
          balance: newBalance,
          btcAmount: newBtcAmount,
          profit: newProfit,
          trades: [...prev.trades, buyTrade],
        };
      });
      setLoading(false);
      setRefreshCountdown(30);
    }, 1000);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#121212' : '#f0f0f0',
        color: darkMode ? 'white' : 'black',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: 20,
        maxWidth: 900,
        margin: 'auto',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Krüpto Trading Bot Dashboard</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            backgroundColor: darkMode ? '#333' : '#ddd',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            color: darkMode ? 'white' : 'black',
          }}
          aria-label="Lülita tumedale/reale teemale"
        >
          {darkMode ? 'Hele režiim' : 'Tume režiim'}
        </button>
      </header>

      {loading && <p>Laen andmeid...</p>}
      {error && <p style={{ color: 'red' }}>Tekkis viga: {error}</p>}

      {!loading && (
        <>
          <p>
            <strong>BTC praegune hind:</strong> {tradeData.price.toFixed(2)} EUR
          </p>
          <p>
            <strong>Kontojääk EUR:</strong> {tradeData.balance.toFixed(2)} €
          </p>
          <p>
            <strong>Omaduses BTC:</strong> {tradeData.btcAmount.toFixed(6)} BTC
          </p>
          <p>
            <strong>Kasum:</strong> {tradeData.profit.toFixed(2)} €
          </p>

          <button
            onClick={handleManualTrade}
            disabled={loading}
            style={{
              backgroundColor: darkMode ? '#22c55e' : '#4ade80',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 5,
              color: 'white',
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            Käivita tehing käsitsi
          </button>

          <p>Aeg järgmise uuenduseni: {refreshCountdown} sekundit</p>

          <h2>Tehingute ajalugu</h2>
          {tradeData.trades.length === 0 && <p>Tehinguid veel ei ole.</p>}
          <ul style={{ maxHeight: 250, overflowY: 'auto', paddingLeft: 20 }}>
            {tradeData.trades.map((trade, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 8,
                  borderBottom: '1px solid',
                  borderColor: darkMode ? '#333' : '#ccc',
                  paddingBottom: 6,
                }}
              >
                [{new Date(trade.timestamp).toLocaleString()}] <strong>{trade.type.toUpperCase()}</strong>{' '}
                {trade.btc.toFixed(6)} BTC @ {trade.price.toFixed(2)} EUR (tasud: {trade.fee} €)
              </li>
            ))}
          </ul>
        </>
      )}

      <footer style={{ marginTop: 40, fontSize: 12, textAlign: 'center', color: darkMode ? '#aaa' : '#555' }}>
        <p>Trading bot näidis — 1€ tasu tehingu kohta, maksimaalne ost 1000€, kapital 10000€</p>
      </footer>
    </div>
  );
}
