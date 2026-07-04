import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { userMessages, characterSystemPrompt, apiKey } = req.body;

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey || process.env.OPENROUTER_API_KEY || "dummy_key",
  });

  try {
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
    res.status(500).send("Error communicating with AI API.");
  }
});

app.post("/api/tts", async (req, res) => {
  const { text, elevenLabsApiKey, elevenLabsVoiceId } = req.body;
  if (!text || !elevenLabsApiKey || !elevenLabsVoiceId) {
    return res.status(400).send("Missing text, api key, or voice id");
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API returned ${response.status}: ${response.statusText}`);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);

  } catch (error) {
    console.error("Error from ElevenLabs API:", error);
    res.status(500).send("Error generating speech.");
  }
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app, server };
