import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';

// Konfigurasi __dirname untuk ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Serve static files dengan headers yang benar untuk JSON/GeoJSON
app.use(express.static(path.join(__dirname, '..'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.json') || filepath.endsWith('.geojson')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.url} tidak ditemukan`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Serving static files dari: ${path.join(__dirname, '..')}`);
});
