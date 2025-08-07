import { useEffect, useState } from "react";

export default function Strategy() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/strategy")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <main style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Trading Strategy</h1>
      {data ? (
        <div>
          <h2>{data.name}</h2>
          <p>{data.description}</p>
          <pre>{JSON.stringify(data.signals, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}