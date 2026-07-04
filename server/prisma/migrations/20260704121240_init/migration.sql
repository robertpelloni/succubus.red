-- CreateTable
CREATE TABLE "UserSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "currentAnimation" TEXT NOT NULL DEFAULT 'idle',
    "openrouterApiKey" TEXT,
    "elevenlabsApiKey" TEXT,
    "elevenlabsVoiceId" TEXT,
    "systemPrompt" TEXT,
    "ttsPitch" REAL NOT NULL DEFAULT 1.2,
    "ttsRate" REAL NOT NULL DEFAULT 1.0,
    "ttsVoice" TEXT,
    "chatHistory" TEXT,
    "updatedAt" DATETIME NOT NULL
);
