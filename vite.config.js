import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild'
  },
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY || 'AIzaSyC2r1nUf2eT9GMa2Mb5XOy2MOVFs39Gttk'),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || 'webgis-deliserdang.firebaseapp.com'),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || 'webgis-deliserdang'),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || 'webgis-deliserdang.firebasestorage.app'),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '178538591157'),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID || '1:178538591157:web:08c55fa9443970ed1b5ffc'),
    'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VG6MF0WV9V')
  },
  plugins: [
    {
      name: 'copy-html-files',
      writeBundle() {
        // Copy additional HTML files to dist
        const htmlFiles = ['login.html', 'dashboard.html', 'map.html'];
        htmlFiles.forEach(file => {
          const src = resolve(__dirname, file);
          const dest = resolve(__dirname, 'dist', file);
          if (existsSync(src)) {
            copyFileSync(src, dest);
            console.log(`Copied ${file} to dist/`);
          }
        });
        
        // Copy data folder
        const dataSrc = resolve(__dirname, 'data');
        const dataDest = resolve(__dirname, 'dist', 'data');
        if (existsSync(dataSrc)) {
          if (!existsSync(dataDest)) {
            mkdirSync(dataDest, { recursive: true });
          }
          copyFileSync(resolve(dataSrc, 'batas_kecamatan.json'), resolve(dataDest, 'batas_kecamatan.json'));
          console.log('Copied data folder to dist/');
        }
      }
    }
  ]
});