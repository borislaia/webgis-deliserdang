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

const centerLonLat = [98.8664408999889, 3.550706892846442]; // Deli Serdang, North Sumatra
const center = fromLonLat(centerLonLat);

const googleHybrid = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: true
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

// Google basemaps
const googleSat = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: true // default basemap
});

const googleHybrid = new TileLayer({
  source: new XYZ({
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attributions: '© Google',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: false
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

// Color palette for each NAMOBJ (22 distinct colors)
const colorPalette = {
  'BANGUNPURBA': '#FF6B6B',      // Coral Red
  'BATANGKUIS': '#4ECDC4',       // Turquoise
  'BERINGIN': '#45B7D1',         // Sky Blue
  'BIRU-BIRU': '#96CEB4',        // Sage Green
  'DELITUA': '#FFEAA7',          // Pale Yellow
  'GALANG': '#DFE6E9',           // Light Gray
  'GUNUNGMERIAH': '#74B9FF',     // Light Blue
  'HAMPARANPERAK': '#A29BFE',    // Periwinkle
  'KUTALIMBARU': '#FD79A8',      // Pink
  'LABUHANDELI': '#FDCB6E',      // Orange Yellow
  'LUBUKPAKAM': '#6C5CE7',       // Purple
  'NAMORAMBE': '#00B894',        // Teal
  'PAGARMERBAU': '#E17055',      // Terra Cotta
  'PANCURBATU': '#55EFC4',       // Mint
  'PANTAILABU': '#81ECEC',       // Cyan
  'PATUMBAK': '#FAB1A0',         // Peach
  'PERCUTSEITUAN': '#FF7675',    // Salmon
  'SENEMBAHTANJUNGMUDA HILIR': '#FD79A8', // Rose
  'SENEMBAHTANJUNGMUDA HULU': '#A29BFE',  // Lavender
  'SIBOLANGIT': '#00CEC9',       // Aqua
  'SUNGGAL': '#F8A5C2',          // Light Pink
  'TANJUNGMORAWA': '#63CDDA'     // Ocean Blue
};

// Style function for kecamatan boundaries
function kecamatanStyleFunction(feature) {
  const namobj = feature.get('NAMOBJ');
  const color = colorPalette[namobj] || '#CCCCCC'; // Default gray if not found
  return new Style({
    stroke: new Stroke({ color: '#333333', width: 2 }),
    fill: new Fill({ color: color + '80' }) // Adding transparency (50%)
  });
}

// Vector layers
const pointStyle = new Style({
  image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ef4444' }), stroke: new Stroke({ color: '#b91c1c', width: 1 }) })
});
const lineStyle = new Style({ stroke: new Stroke({ color: '#10b981', width: 3 }) });
const polygonStyle = new Style({
  stroke: new Stroke({ color: '#2563eb', width: 2 }),
  fill: new Fill({ color: 'rgba(59,130,246,0.18)' })
});

const kecamatanLayer = new VectorLayer({ 
  source: new VectorSource(), 
  style: kecamatanStyleFunction, 
  visible: true 
});
const pointsLayer = new VectorLayer({ source: new VectorSource(), style: pointStyle, visible: true });
const linesLayer = new VectorLayer({ source: new VectorSource(), style: lineStyle, visible: true });
const polygonsLayer = new VectorLayer({ source: new VectorSource(), style: polygonStyle, visible: true });
map.addLayer(kecamatanLayer);
map.addLayer(polygonsLayer);
map.addLayer(linesLayer);
map.addLayer(pointsLayer);

// Load data
(async function loadData(){
  const [kecamatan, points, lines, polys] = await Promise.all([
    fetchJSON('./data/batas_kecamatan.geojson'),
    fetchJSON('./data/points.geojson'),
    fetchJSON('./data/lines.geojson'),
    fetchJSON('./data/polygons.geojson')
  ]);
  const fmt = new GeoJSON();
  kecamatanLayer.getSource().addFeatures(fmt.readFeatures(kecamatan, { featureProjection: map.getView().getProjection() }));
  pointsLayer.getSource().addFeatures(fmt.readFeatures(points, { featureProjection: map.getView().getProjection() }));
  linesLayer.getSource().addFeatures(fmt.readFeatures(lines, { featureProjection: map.getView().getProjection() }));
  polygonsLayer.getSource().addFeatures(fmt.readFeatures(polys, { featureProjection: map.getView().getProjection() }));

  // Fit to kecamatan boundaries if available
  const extent = kecamatanLayer.getSource().getExtent();
  if (extent && extent[0] !== Infinity) {
    map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 500 });
  }
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
const chkKecamatan = document.getElementById('chkKecamatan');
const chkPoints = document.getElementById('chkPoints');
const chkLines = document.getElementById('chkLines');
const chkPolygons = document.getElementById('chkPolygons');
chkKecamatan.addEventListener('change', () => kecamatanLayer.setVisible(chkKecamatan.checked));
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
