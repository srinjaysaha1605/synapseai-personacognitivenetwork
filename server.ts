import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import chatHandler from './api/chat.js';
import healthHandler from './api/health.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Express mounts Vercel serverless handlers locally
app.get('/api/health', healthHandler);
app.post('/api/chat', chatHandler);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Synapse AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

