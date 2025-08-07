export default function Home() {
  const [recommendations, setRecommendations] = React.useState(null);
  const [seconds, setSeconds] = React.useState(5);

  React.useEffect(() => {
    fetch('/api/stocks')
      .then((res) => res.json())
      .then(setRecommendations);

    const interval = setInterval(() => {
      fetch('/api/stocks')
        .then((res) => res.json())
        .then(setRecommendations);
    }, 5000);

    const countdown = setInterval(() => {
      setSeconds((s) => (s === 0 ? 5 : s - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center mb-6 text-indigo-600">
        Trading Recommendations
      </h1>
      <p className="text-center mb-8 text-gray-700">
        Refreshes every 5 seconds — Next refresh in: {seconds} sec
      </p>

      {recommendations ? (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {['buy', 'sell', 'hold'].map((type) => (
            <section key={type} className="bg-white rounded shadow p-4">
              <h2 className="text-2xl font-semibold capitalize mb-4">{type}</h2>
              {recommendations[type].length === 0 ? (
                <p className="text-gray-500">No stocks</p>
              ) : (
                <ul>
                  {recommendations[type].map((stock) => (
                    <li key={stock.symbol} className="mb-2 border-b border-gray-200 pb-2">
                      <span className="font-medium">{stock.symbol}</span> —{' '}
                      {type === 'hold' ? (
                        <>
                          Price: ${stock.price.toFixed(2)} <br />
                          Buy: ${stock.buyPrice.toFixed(2)}, Sell: ${stock.sellPrice.toFixed(2)}
                        </>
                      ) : type === 'buy' ? (
                        <>
                          Buy at ${stock.buyPrice.toFixed(2)}, Sell at ${stock.sellPrice.toFixed(2)}
                        </>
                      ) : (
                        <>
                          Sell at ${stock.sellPrice.toFixed(2)}, Buy at ${stock.buyPrice.toFixed(2)}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">Loading...</p>
      )}
    </main>
  );
}
