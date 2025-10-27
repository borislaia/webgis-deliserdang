import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
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
        
        // Copy CSS folder
        const cssSrc = resolve(__dirname, 'css');
        const cssDest = resolve(__dirname, 'dist', 'css');
        if (existsSync(cssSrc)) {
          if (!existsSync(cssDest)) {
            mkdirSync(cssDest, { recursive: true });
          }
          copyFileSync(resolve(cssSrc, 'base.css'), resolve(cssDest, 'base.css'));
          console.log('Copied CSS folder to dist/');
        }
        
        // Copy assets folder recursively
        const copyDir = (src, dest) => {
          if (!existsSync(dest)) {
            mkdirSync(dest, { recursive: true });
          }
          const files = readdirSync(src);
          files.forEach(file => {
            const srcFile = resolve(src, file);
            const destFile = resolve(dest, file);
            if (statSync(srcFile).isDirectory()) {
              copyDir(srcFile, destFile);
            } else {
              copyFileSync(srcFile, destFile);
            }
          });
        };
        
        const assetsSrc = resolve(__dirname, 'assets');
        const assetsDest = resolve(__dirname, 'dist', 'assets');
        if (existsSync(assetsSrc)) {
          copyDir(assetsSrc, assetsDest);
          console.log('Copied assets folder to dist/');
        }
        
        // Copy js folder recursively
        const jsSrc = resolve(__dirname, 'js');
        const jsDest = resolve(__dirname, 'dist', 'js');
        if (existsSync(jsSrc)) {
          copyDir(jsSrc, jsDest);
          console.log('Copied js folder to dist/');
        }
      }
    }
  ]
});