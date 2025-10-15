import { fetchJSON, el } from './utils.js';

// OpenLayers imports via global namespace (loaded from CDN)
const ol = window.ol;
const { Map, View } = ol;
const { OSM, XYZ } = ol.source;
const { Tile: TileLayer, Vector: VectorLayer } = ol.layer;
const { Vector: VectorSource } = ol.source;
const { fromLonLat } = ol.proj;
const { GeoJSON } = ol.format;
const { Fill, Stroke, Style, Circle: CircleStyle, Icon } = ol.style;
// In the UMD build, defaults are nested under `.defaults`
const defaultControls = ol.control.defaults.defaults;
const defaultInteractions = ol.interaction.defaults.defaults;
const { Select } = ol.interaction;
const { Overlay } = ol;

const centerLonLat = [98.8664408999889, 3.550706892846442]; // Requested center [lon, lat]
const center = fromLonLat(centerLonLat);

// (deduplicated basemap layer definitions)

const osm = new TileLayer({ 
  source: new OSM(), 
  visible: false 
});

const cartoDB = new TileLayer({
  source: new XYZ({
    url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attributions: '© OpenStreetMap contributors, © CARTO',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: false
});

const esriSat = new TileLayer({
  source: new XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: '© Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    crossOrigin: 'anonymous'
  }),
  visible: false
});

// Google basemaps
const googleSat = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: false
});

const googleHybrid = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: true // default basemap to match UI
});

const map = new Map({
  target: 'map',
  layers: [googleHybrid, googleSat, osm, cartoDB, esriSat],
  view: new View({ center, zoom: 11 }),
  // Remove default OL UI controls; we provide custom ones in the UI.
  // Also hides basemap attribution text.
  controls: defaultControls({ attribution: false, zoom: false, rotate: false }),
  interactions: defaultInteractions()
});

// Error handling for tile loading
[googleHybrid, googleSat, osm, cartoDB, esriSat].forEach((layer, idx) => {
  const source = layer.getSource();
  source.on('tileloaderror', (event) => {
    console.warn(`Tile loading error for layer ${idx}:`, event);
  });
});

// Vector layers
const pointStyle = new Style({
  image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ef4444' }), stroke: new Stroke({ color: '#b91c1c', width: 1 }) })
});
const lineStyle = new Style({ stroke: new Stroke({ color: '#10b981', width: 3 }) });
const polygonStyle = new Style({
  stroke: new Stroke({ color: '#2563eb', width: 2 }),
  fill: new Fill({ color: 'rgba(59,130,246,0.18)' })
});

// Palette-based styling for NAMOBJ in batas_kecamatan.geojson
const palette = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99',
  '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'
];
const colorByName = new Map();
function getColorForName(name){
  const key = String(name ?? 'Unknown');
  if(!colorByName.has(key)){
    const nextIndex = colorByName.size % palette.length;
    colorByName.set(key, palette[nextIndex]);
  }
  return colorByName.get(key);
}
function hexToRgba(hex, alpha = 0.5){
  const h = String(hex).replace('#','');
  let r, g, b;
  if(h.length === 3){
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else {
    const bigint = parseInt(h, 16);
    r = (bigint >> 16) & 255;
    g = (bigint >> 8) & 255;
    b = bigint & 255;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}
function kecamatanStyle(feature){
  const name = feature.get('NAMOBJ') || 'Unknown';
  const baseHex = getColorForName(name);
  return new Style({
    stroke: new Stroke({ color: '#222', width: 1 }),
    fill: new Fill({ color: hexToRgba(baseHex, 0.45) })
  });
}

const pointsLayer = new VectorLayer({ source: new VectorSource(), style: pointStyle, visible: true });
const linesLayer = new VectorLayer({ source: new VectorSource(), style: lineStyle, visible: true });
const polygonsLayer = new VectorLayer({ source: new VectorSource(), style: polygonStyle, visible: true });
const kecamatanLayer = new VectorLayer({ source: new VectorSource(), style: kecamatanStyle, visible: true });
map.addLayer(polygonsLayer);
map.addLayer(kecamatanLayer); // draw below lines/points
map.addLayer(linesLayer);
map.addLayer(pointsLayer);

// Load data
(async function loadData(){
  const [points, lines, polys, batas] = await Promise.all([
    fetchJSON('./data/points.geojson'),
    fetchJSON('./data/lines.geojson'),
    fetchJSON('./data/polygons.geojson'),
    fetchJSON('./data/batas_kecamatan.geojson')
  ]);
  const fmt = new GeoJSON();
  pointsLayer.getSource().addFeatures(fmt.readFeatures(points, { featureProjection: map.getView().getProjection() }));
  linesLayer.getSource().addFeatures(fmt.readFeatures(lines, { featureProjection: map.getView().getProjection() }));
  polygonsLayer.getSource().addFeatures(fmt.readFeatures(polys, { featureProjection: map.getView().getProjection() }));
  kecamatanLayer.getSource().addFeatures(fmt.readFeatures(batas, { featureProjection: map.getView().getProjection() }));
  // Keep initial center as requested; no auto-fit on load
})();

// Basemap switching
function setBasemap(name){
  googleSat.setVisible(name === 'googleSat');
  googleHybrid.setVisible(name === 'googleHybrid');
  osm.setVisible(name === 'osm');
  cartoDB.setVisible(name === 'carto');
  esriSat.setVisible(name === 'sat');
}

document.querySelectorAll('input[name="basemap"]').forEach(r => {
  r.addEventListener('change', (e) => setBasemap(e.target.value));
});

// Layer toggles
const chkPoints = document.getElementById('chkPoints');
const chkLines = document.getElementById('chkLines');
const chkPolygons = document.getElementById('chkPolygons');
chkPoints.addEventListener('change', () => pointsLayer.setVisible(chkPoints.checked));
chkLines.addEventListener('change', () => linesLayer.setVisible(chkLines.checked));
chkPolygons.addEventListener('change', () => polygonsLayer.setVisible(chkPolygons.checked));

// Controls
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetViewBtn = document.getElementById('resetView');
zoomInBtn.addEventListener('click', () => map.getView().setZoom(map.getView().getZoom() + 1));
zoomOutBtn.addEventListener('click', () => map.getView().setZoom(map.getView().getZoom() - 1));
resetViewBtn.addEventListener('click', () => map.getView().animate({ center, zoom: 11, duration: 400 }));

// Popup overlay
const container = el('div', { class: 'ol-popup card' });
const overlay = new Overlay({ element: container, autoPan: { animation: { duration: 250 } } });
map.addOverlay(overlay);

function renderPopup(feature){
  const props = feature.getProperties();
  const title = props.name || 'Feature';
  const photo = props.photo;
  const desc = props.description || '';
  container.innerHTML = '';
  container.append(
    el('div', { class: 'title', html: title }),
    el('div', { html: desc })
  );
  if(photo){
    const img = el('img', { src: photo, alt: title });
    img.addEventListener('click', () => openImageModal(photo));
    container.append(img);
  }
}

map.on('singleclick', (evt) => {
  const pixel = evt.pixel;
  let hit = false;
  map.forEachFeatureAtPixel(pixel, (feature) => {
    hit = true;
    renderPopup(feature);
    overlay.setPosition(evt.coordinate);
    return true;
  }, { hitTolerance: 5 });
  if(!hit){ overlay.setPosition(undefined); }
});

// Fullscreen image modal
const modal = document.getElementById('imgModal');
const modalImg = document.getElementById('modalImg');
function openImageModal(src){
  modalImg.src = src;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
modal.addEventListener('click', () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modalImg.removeAttribute('src');
});
