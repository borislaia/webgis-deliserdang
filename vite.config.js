import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://yyagythhwzdncantoszf.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YWd5dGhod3pkbmNhbnRvc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzkzMzcsImV4cCI6MjA3NjE1NTMzN30.R1fbe6pwq6d7ZJ5posqv2m4lhWhdnN9GxeJx-NDv0Yo')
  }
});