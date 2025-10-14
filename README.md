# WebGIS-Deli-Serdang

## Notes on basemap not showing

- This app uses OpenLayers loaded from CDN.
- The CSS link must be `https://cdn.jsdelivr.net/npm/ol@v7.4.0/ol.css` (not `ol/ol.css`).
- If the map shows controls but no tiles, ensure:
  - The OpenLayers CSS URL is correct and loads (200 status).
  - `.map-container` has size; in this repo it's fixed to viewport in `css/base.css`.
  - Network access to tile servers is allowed (OSM, Stamen, Esri endpoints).
  - No ad-block or CORS issues in the browser console.

## Local development

Open `index.html` with a static server (avoid `file://`). Any simple server works, for example:

```bash
python3 -m http.server 5173  # or: npx http-server
```

Then navigate to `/login.html` → sign in (any credentials) → `Open Map`.