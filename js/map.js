import { fetchJSON, el } from './utils.js';

// Use OpenLayers ESM imports from CDN (reliable on Vercel)
import Map from 'https://cdn.jsdelivr.net/npm/ol/Map.js';
import View from 'https://cdn.jsdelivr.net/npm/ol/View.js';
import TileLayer from 'https://cdn.jsdelivr.net/npm/ol/layer/Tile.js';
import VectorLayer from 'https://cdn.jsdelivr.net/npm/ol/layer/Vector.js';
import OSM from 'https://cdn.jsdelivr.net/npm/ol/source/OSM.js';
import XYZ from 'https://cdn.jsdelivr.net/npm/ol/source/XYZ.js';
import VectorSource from 'https://cdn.jsdelivr.net/npm/ol/source/Vector.js';
import GeoJSON from 'https://cdn.jsdelivr.net/npm/ol/format/GeoJSON.js';
import Overlay from 'https://cdn.jsdelivr.net/npm/ol/Overlay.js';
import { fromLonLat } from 'https://cdn.jsdelivr.net/npm/ol/proj.js';
import Style from 'https://cdn.jsdelivr.net/npm/ol/style/Style.js';
import Fill from 'https://cdn.jsdelivr.net/npm/ol/style/Fill.js';
import Stroke from 'https://cdn.jsdelivr.net/npm/ol/style/Stroke.js';
import CircleStyle from 'https://cdn.jsdelivr.net/npm/ol/style/Circle.js';
import { defaults as defaultControls } from 'https://cdn.jsdelivr.net/npm/ol/control.js';
import { defaults as defaultInteractions } from 'https://cdn.jsdelivr.net/npm/ol/interaction.js';

const centerLonLat = [106.827153, -6.175392]; // Jakarta Monas as example center
const center = fromLonLat(centerLonLat);

const osm = new TileLayer({ source: new OSM({ crossOrigin: 'anonymous' }), visible: true });
// Note: Stamen public tiles are deprecated. Replace with OpenTopoMap as a free alternative.
const openTopo = new TileLayer({
  source: new XYZ({
    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attributions: 'Map data © OpenStreetMap contributors, SRTM | Style: OpenTopoMap',
    maxZoom: 17,
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
  layers: [osm, openTopo, esriSat],
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
  openTopo.setVisible(name === 'topo');
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
