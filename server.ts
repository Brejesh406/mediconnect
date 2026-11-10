import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './server/db.js';
import { apiRouter } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema and seed tables
initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// High-limit parser for medical PDFs, imaging scans, and documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MediConnect Hospital Management System', timestamp: new Date().toISOString() });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: attach Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production: serve static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediConnect] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MediConnect] Failed to start server:', err);
  process.exit(1);
});
