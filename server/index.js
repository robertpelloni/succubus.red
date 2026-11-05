import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
const port = 3001;
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { userMessages, characterSystemPrompt, apiKey } = req.body;

  if (!userMessages || !Array.isArray(userMessages)) {
    return res.status(400).json({ error: "userMessages array is required" });
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey || process.env.OPENROUTER_API_KEY || "dummy_key",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "Gryphe/Mythalion-13b",
      messages: [
        { role: "system", content: characterSystemPrompt || "" },
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
  if (!text || typeof text !== "string") {
    return res.status(400).send("Missing or invalid text");
  }
  if (!elevenLabsApiKey || typeof elevenLabsApiKey !== "string") {
    return res.status(400).send("Missing or invalid elevenLabsApiKey");
  }
  if (!elevenLabsVoiceId || typeof elevenLabsVoiceId !== "string") {
    return res.status(400).send("Missing or invalid elevenLabsVoiceId");
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

app.post("/api/auth/login", async (req, res) => {
  const { username } = req.body;
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username must be a valid string" });
  }

  try {
    const user = await prisma.user.upsert({
      where: { id: username },
      update: {},
      create: { id: username }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.post("/api/auth/refresh", (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  // Verify ignoring expiration so we can refresh an expired token
  jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }, (err, user) => {
    if (err) return res.sendStatus(403);

    try {
      const userId = user.userId;
      const newToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token: newToken, userId });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  });
});

app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Ensure User exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });

    let settings = await prisma.userSettings.findUnique({
      where: { userId: userId },
    });

    // Create default if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: userId }
      });
    }
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).send("Error fetching settings.");
  }
});

app.post("/api/settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    // Whitelist valid schema keys to prevent P2022 Unknown argument errors
    const validKeys = [
      'systemPrompt', 'openRouterApiKey', 'elevenLabsApiKey',
      'elevenLabsVoiceId', 'ttsPitch', 'ttsRate', 'ttsVoice',
      'environmentFile', 'currentAnimation', 'chatHistory'
    ];

    const safeData = {};
    for (const key of Object.keys(data)) {
      if (!validKeys.includes(key)) {
         return res.status(400).json({ error: `Invalid configuration key: ${key}` });
      }

      // Type validation
      if ((key === 'ttsPitch' || key === 'ttsRate') && data[key] !== null) {
         if (typeof data[key] !== 'number') {
            return res.status(400).json({ error: `${key} must be a number` });
         }
      } else if (data[key] !== null && typeof data[key] !== 'string') {
         return res.status(400).json({ error: `${key} must be a string` });
      }

      safeData[key] = data[key];
    }

    // Ensure User exists before writing settings to fulfill FK constraint
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });

    const settings = await prisma.userSettings.upsert({
      where: { userId: userId },
      update: safeData,
      create: {
        userId: userId,
        ...safeData
      }
    });

    res.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).send("Error updating settings.");
  }
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app, server };
