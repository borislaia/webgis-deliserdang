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
const { defaults: defaultControls } = ol.control;
const { defaults: defaultInteractions, Select } = ol.interaction;
const { Overlay } = ol;

const centerLonLat = [106.827153, -6.175392]; // Jakarta Monas as example center
const center = fromLonLat(centerLonLat);

// Use robust, HTTPS-only, CORS-friendly basemap sources for production hosting
const osm = new TileLayer({
  source: new XYZ({
    urls: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    attributions: '© OpenStreetMap contributors',
    maxZoom: 19,
    crossOrigin: 'anonymous'
  }),
  visible: true
});

// Light basemap (Carto Positron) as a Stamen-like alternative without API key
const stamen = new TileLayer({
  source: new XYZ({
    urls: [
      'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    ],
    attributions: '© OpenStreetMap contributors, © CARTO',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: false
});

const esriSat = new TileLayer({
  source: new XYZ({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 20,
    crossOrigin: 'anonymous'
  }),
  visible: false
});

const map = new Map({
  target: 'map',
  layers: [osm, stamen, esriSat],
  view: new View({ center, zoom: 11 }),
  controls: defaultControls({ attribution: true }),
  interactions: defaultInteractions()
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

const pointsLayer = new VectorLayer({ source: new VectorSource(), style: pointStyle, visible: true });
const linesLayer = new VectorLayer({ source: new VectorSource(), style: lineStyle, visible: true });
const polygonsLayer = new VectorLayer({ source: new VectorSource(), style: polygonStyle, visible: true });
map.addLayer(polygonsLayer);
map.addLayer(linesLayer);
map.addLayer(pointsLayer);

// Load data
(async function loadData(){
  const [points, lines, polys] = await Promise.all([
    fetchJSON('./data/points.geojson'),
    fetchJSON('./data/lines.geojson'),
    fetchJSON('./data/polygons.geojson')
  ]);
  const fmt = new GeoJSON();
  pointsLayer.getSource().addFeatures(fmt.readFeatures(points, { featureProjection: map.getView().getProjection() }));
  linesLayer.getSource().addFeatures(fmt.readFeatures(lines, { featureProjection: map.getView().getProjection() }));
  polygonsLayer.getSource().addFeatures(fmt.readFeatures(polys, { featureProjection: map.getView().getProjection() }));

  // Fit to polygons if available
  const extent = polygonsLayer.getSource().getExtent();
  if (extent && extent[0] !== Infinity) {
    map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 500 });
  }
})();

// Basemap switching
function setBasemap(name){
  osm.setVisible(name === 'osm');
  stamen.setVisible(name === 'stamen');
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
