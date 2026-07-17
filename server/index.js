import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cookieParser from 'cookie-parser';
import { initSchema } from './db.js';
import { createRoutes } from './routes.js';
import { initRealtime } from './realtime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5100);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const server = http.createServer(app);
const realtime = initRealtime(server);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// User-uploaded profile photos (stored on this VPS)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  fallthrough: true,
}));

app.use('/api', createRoutes(realtime));

// Serve built frontend
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'));
});

// Central error handler
app.use((err, _req, res, _next) => {
  console.error('[server]', err);
  res.status(500).json({ error: 'Internal server error' });
});

initSchema()
  .then(() => {
    server.listen(PORT, () => console.log(`NovusWork running on :${PORT}`));
  })
  .catch((e) => {
    console.error('Failed to init database schema:', e);
    process.exit(1);
  });
