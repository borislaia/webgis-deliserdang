import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// Resolve paths relative to the built file location to be robust regardless of CWD
const distDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(distDir, '..', '..');
const staticRoot = projectRoot;

app.use(cors());
app.use(express.json());
app.use(express.static(staticRoot));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// API: serve batas_kecamatan.json via backend to avoid CORS/file origin issues
app.get('/api/batas_kecamatan', async (_req, res) => {
  try {
    const dataPath = path.join(projectRoot, 'data', 'batas_kecamatan.json');
    const file = await fs.readFile(dataPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(file);
  } catch (error) {
    console.error('Failed to read batas_kecamatan.json', error);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// Serve SPA/HTML entry
app.get('/', (_req, res) => {
  res.sendFile(path.join(staticRoot, 'index.html'));
});

app.listen(port, () => {
  console.log(`[backend] server listening on http://localhost:${port}`);
});
