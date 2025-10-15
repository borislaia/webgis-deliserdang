# WebGIS-Deli-Serdang

Basemap telah diperbaiki agar tampil di Vercel dengan sumber tiles yang CORS-friendly dan HTTPS. Sumber saat ini:

- OSM: `https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- CARTO Positron: `https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- ESRI World Imagery

Catatan: Tidak diperlukan API key. Jika mengganti provider, pastikan mendukung CORS dan HTTPS.