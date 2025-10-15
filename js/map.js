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

const centerLonLat = [98.8664408999889, 3.550706892846442]; // Center (lon, lat)
const center = fromLonLat(centerLonLat);

const googleHybrid = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: true // default basemap matches UI default
});

const googleSat = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: false
});

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

// (deduplicated basemap declarations above)

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

// Batas Kecamatan layer — colored by NAMOBJ
const categoryPalette = [
  '#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c','#98df8a',
  '#d62728','#ff9896','#9467bd','#c5b0d5','#8c564b','#c49c94',
  '#e377c2','#f7b6d2','#7f7f7f','#c7c7c7','#bcbd22','#dbdb8d',
  '#17becf','#9edae5'
];
const namToColor = new Map();
let nextColorIndex = 0;
function colorForName(name){
  const key = name || 'Unknown';
  if(!namToColor.has(key)){
    const color = nextColorIndex < categoryPalette.length
      ? categoryPalette[nextColorIndex]
      : hslColorForString(key);
    namToColor.set(key, color);
    nextColorIndex++;
  }
  return namToColor.get(key);
}
function hslColorForString(str){
  let hash = 0;
  for(let i = 0; i < str.length; i++){
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}
function hexToRgba(hex, alpha = 0.4){
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function applyAlpha(color, alpha){
  if(color.startsWith('#')) return hexToRgba(color, alpha);
  if(color.startsWith('hsl(')) return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  return color;
}
const kecStyleCache = new Map();
function kecamatanStyle(feature){
  const name = feature.get('NAMOBJ') || 'Unknown';
  const baseColor = colorForName(name);
  let style = kecStyleCache.get(baseColor);
  if(!style){
    style = new Style({
      stroke: new Stroke({ color: '#111827', width: 1 }),
      fill: new Fill({ color: applyAlpha(baseColor, 0.35) })
    });
    kecStyleCache.set(baseColor, style);
  }
  return style;
}

const kecamatanLayer = new VectorLayer({ source: new VectorSource(), style: kecamatanStyle, visible: true });

const pointsLayer = new VectorLayer({ source: new VectorSource(), style: pointStyle, visible: true });
const linesLayer = new VectorLayer({ source: new VectorSource(), style: lineStyle, visible: true });
const polygonsLayer = new VectorLayer({ source: new VectorSource(), style: polygonStyle, visible: true });
// Layer draw order: polygons (sample), kecamatan (on top of sample polys), lines, points
map.addLayer(polygonsLayer);
map.addLayer(kecamatanLayer);
map.addLayer(linesLayer);
map.addLayer(pointsLayer);

// Load data
(async function loadData(){
  const [batas, points, lines, polys] = await Promise.all([
    fetchJSON('./data/batas_kecamatan.geojson'),
    fetchJSON('./data/points.geojson'),
    fetchJSON('./data/lines.geojson'),
    fetchJSON('./data/polygons.geojson')
  ]);
  const fmt = new GeoJSON();
  // Batas Kecamatan first
  kecamatanLayer.getSource().addFeatures(
    fmt.readFeatures(batas, { featureProjection: map.getView().getProjection() })
  );
  // Demo/sample data
  pointsLayer.getSource().addFeatures(fmt.readFeatures(points, { featureProjection: map.getView().getProjection() }));
  linesLayer.getSource().addFeatures(fmt.readFeatures(lines, { featureProjection: map.getView().getProjection() }));
  polygonsLayer.getSource().addFeatures(fmt.readFeatures(polys, { featureProjection: map.getView().getProjection() }));
  // Keep explicit center; avoid auto-fit overriding requested center
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
const chkKecamatan = document.getElementById('chkKecamatan');
chkPoints.addEventListener('change', () => pointsLayer.setVisible(chkPoints.checked));
chkLines.addEventListener('change', () => linesLayer.setVisible(chkLines.checked));
chkPolygons.addEventListener('change', () => polygonsLayer.setVisible(chkPolygons.checked));
if(chkKecamatan){
  chkKecamatan.addEventListener('change', () => kecamatanLayer.setVisible(chkKecamatan.checked));
}

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
  const title = props.NAMOBJ || props.name || 'Feature';
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
