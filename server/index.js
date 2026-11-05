import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { userMessages, characterSystemPrompt, apiKey } = req.body;

  try {
    // Determine API Key
    const resolvedApiKey = apiKey || process.env.OPENROUTER_API_KEY || "dummy_key";

    // Setup OpenAI Client pointing to OpenRouter
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: resolvedApiKey,
    });

    const response = await openai.chat.completions.create({
      model: "Gryphe/Mythalion-13b",
      messages: [
        { role: "system", content: characterSystemPrompt },
        ...userMessages
      ],
      temperature: 0.9,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/plain');

    for await (const chunk of response) {
      res.write(chunk.choices[0]?.delta?.content || "");
    }
    res.end();
  } catch (error) {
    console.error("Error from OpenRouter API:", error);
    res.status(500).json({ error: error.message || "Error communicating with AI API." });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
