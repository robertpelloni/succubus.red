# DEPLOYMENT INSTRUCTIONS
## Architecture
Three-tier architecture:
- Frontend: Vite (React, React Three Fiber, Pixiv VRM)
- Backend: Express (Node.js) acting as an API key proxy.

## Development Setup
### Frontend
1. `cd client`
2. `npm install`
3. `npm run dev` (Runs on http://localhost:5173)
### Backend
1. `cd server`
2. `npm install`
3. Create a `.env` file with `OPENROUTER_API_KEY=your_key`
4. `npm start` (Runs on http://localhost:3001)

## Production Build
1. In `client/`, run `npm run build`. Serve `client/dist/` via a static hosting provider (e.g. Nginx, Vercel).
2. Host the `server/` process via PM2 or Docker, ensuring `VITE_BACKEND_URL` is set appropriately during the frontend build step.
