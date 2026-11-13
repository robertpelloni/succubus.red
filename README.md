# succubus.red

An AI companion web app: a 3D VRM avatar in the browser that chats
with the user through an LLM, with lip-sync, gaze tracking, and
interactive viewport controls. The character persona is defined by a
system prompt sent from the client; the model is reached through
OpenRouter.

**Version:** 0.36.0

## What's in it

- **Client** (`client/`, React + Vite, `src/App.jsx` ~55 KB) — VRM
  avatar viewer with drag-and-drop VRM loading and binary validation,
  IndexedDB metadata persistence, cinematic/isometric camera
  perspectives, FFT-based lip-sync, microphone HUD with click-to-test
  and audio-activity waveforms, attentive gaze tracking, avatar hover
  affordances, and touch reactions; Mixamo-to-VRM retargeting
  (`MixamoVRMRetargeting.js`).
- **Server** (`server/`, Express, ~1.7 KB) — two endpoints:
  `/api/health` (uptime/database status) and `/api/chat` (streams a
  chat completion from OpenRouter, model `Gryphe/Mythalion-13b` by
  default, using the client-supplied system prompt and API key or the
  `OPENROUTER_API_KEY` env var).
- **Verification scripts** (`verify_*.py`) — Playwright-style checks
  for the viewport features (camera, mic, FFT, look-at, sliding
  window, drag-and-drop), with reference screenshots committed
  alongside.
- **System tray app** (`tray_app.py`) — desktop tray launcher.

## Run

```bash
cd server && npm install && npm start   # port 3001
cd client && npm install && npm run dev
```

Set `OPENROUTER_API_KEY` for the server, or supply a key from the
client.

## Status

Active development through November 2026 (last commit 2026-11-07;
recent releases v0.30–v0.36 are viewport/avatar interaction features).
A working prototype: the avatar viewer and chat proxy are real, but
there is no deployed site documented in this repo, no user accounts,
and the server is a minimal two-endpoint proxy — not a production
service.
