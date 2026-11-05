# DEPLOYMENT INSTRUCTIONS
## Architecture
Three-tier architecture:
- Frontend: Vite (React 19, React Three Fiber, Pixiv VRM, Kokoro WebGPU, Drag-and-Drop HUD)
- Backend: Express (Node.js) acting as an API key proxy, authentication provider, and settings persistence layer with Prisma and SQLite.
- Desktop Control: `tray_app.py` for system tray and CLI lifecycle management.

## Environment Setup
### Prerequisites
- Node.js >= 18
- Python >= 3.10
- SQLite3

### Automated Startup
Run all services from the root directory:
```bash
npm run dev
```
Or manage via system tray / CLI:
```bash
npm run tray -- status
npm run tray -- start
npm run tray -- logs
npm run tray -- stop
```

### Manual Development Setup
#### 1. Backend
```bash
cd server
npm install
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma db push
npm start # Runs on http://localhost:3001
```

#### 2. Frontend
```bash
cd client
npm install
npm run dev # Runs on http://localhost:5173
```

## Production Build
1. In root: `npm run build` (builds `client/dist/`).
2. Serve static files from `client/dist/` via Nginx or CDN.
3. Run backend with PM2 or Docker: `node server/index.js`.
