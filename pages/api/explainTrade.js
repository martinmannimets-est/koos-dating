import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  const { trade } = req.body;

  if (!trade) {
    res.status(400).json({ error: "Missing trade data" });
    return;
  }

  try {
    const prompt = `Sa oled kogenud krüptokaubanduse ekspert. Selgita lühidalt ja arusaadavalt, miks tehing tehti, millist strateegiat kasutati. Tehing: ${JSON.stringify(
      trade
    )}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a crypto trading expert assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    });

    const explanation = completion.data.choices[0].message.content;

    res.status(200).json({ explanation });
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
