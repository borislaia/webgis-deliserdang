import { fetchJSON, el } from './utils.js';

// OpenLayers imports via global namespace (loaded from CDN)  
const ol = window.ol;
const { Map, View } = ol;
const { OSM, XYZ } = ol.source;
const { Tile: TileLayer, Vector: VectorLayer } = ol.layer;
const { Vector: VectorSource } = ol.source;
const { fromLonLat } = ol.proj;
const { GeoJSON } = ol.format;
const { Fill, Stroke, Style, Circle: CircleStyle } = ol.style;
// Support both OL UMD shapes: `.defaults.defaults` (module->fn) and `.defaults` (fn)
const defaultControls = (ol.control.defaults && ol.control.defaults.defaults)
  ? ol.control.defaults.defaults
  : ol.control.defaults;
const defaultInteractions = (ol.interaction.defaults && ol.interaction.defaults.defaults)
  ? ol.interaction.defaults.defaults
  : ol.interaction.defaults;
const { Select } = ol.interaction;
const { Overlay } = ol;

const centerLonLat = [98.69870163855006, 3.5460256535269954]; // Deli Serdang, North Sumatra
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

// Error handling and fallback: if current basemap fails, switch to OSM
function attachTileErrorFallback(layer){
  const source = layer.getSource();
  if(!source || typeof source.on !== 'function') return;
  source.on('tileloaderror', () => {
    if(layer.getVisible()){
      console.warn('Basemap tile failed; switching to OSM fallback');
      setBasemap('osm');
      // Also update the radio button UI to reflect the change
      const osmRadio = document.querySelector('input[name="basemap"][value="osm"]');
      if(osmRadio){ osmRadio.checked = true; }
    }
  });
}
[googleHybrid, googleSat, cartoDB, esriSat].forEach(attachTileErrorFallback);

// Style sederhana untuk Batas Kecamatan
const kecamatanStyle = new Style({
  stroke: new Stroke({ 
    color: '#1f77b4',  // Biru
    width: 2 
  }),
  fill: new Fill({ 
    color: 'rgba(31, 119, 180, 0.2)'  // Biru transparan
  })
});

const kecamatanLayer = new VectorLayer({ 
  source: new VectorSource(), 
  style: kecamatanStyle, 
  visible: true, 
  zIndex: 10 
});

// Add kecamatan layer to map
map.addLayer(kecamatanLayer);

// Load data
(async function loadData(){
  try {
    console.log('Loading batas_kecamatan.json...');
    const batas = await fetchJSON('./data/batas_kecamatan.json');
    console.log('Data loaded:', batas);
    
    const fmt = new GeoJSON();
    // Normalize to FeatureCollection if the file is an array of Features
    let batasGeoJSON;
    if(Array.isArray(batas)){
      batasGeoJSON = { type: 'FeatureCollection', features: batas };
    } else if(batas && batas.type === 'FeatureCollection' && Array.isArray(batas.features)){
      batasGeoJSON = batas;
    } else if(batas && Array.isArray(batas.features)){
      batasGeoJSON = { type: 'FeatureCollection', features: batas.features };
    } else {
      console.warn('Unexpected GeoJSON format for batas_kecamatan.json', batas);
      batasGeoJSON = { type: 'FeatureCollection', features: [] };
    }
    
    console.log('Processing GeoJSON with', batasGeoJSON.features?.length || 0, 'features');
    
    // Load Batas Kecamatan
    const features = fmt.readFeatures(batasGeoJSON, { 
      dataProjection: 'EPSG:4326', 
      featureProjection: map.getView().getProjection() 
    });
    
    console.log('Features created:', features.length);
    kecamatanLayer.getSource().addFeatures(features);
    
    // Zoom to extent of loaded features if they exist
    if(features.length > 0) {
      const extent = kecamatanLayer.getSource().getExtent();
      console.log('Features extent:', extent);
      // Optional: uncomment to auto-fit to data
      // map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 });
    }
    
    console.log('✅ Kecamatan layer loaded successfully!');
  } catch(error) {
    console.error('❌ Error loading kecamatan data:', error);
    alert('Gagal memuat data peta. Pastikan server sudah berjalan (npm run backend)');
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

// Apply initial basemap based on the checked radio, ensuring visibility state sync
const initialBasemap = document.querySelector('input[name="basemap"]:checked');
if(initialBasemap){ setBasemap(initialBasemap.value); }

// Layer toggles
const chkKecamatan = document.getElementById('chkKecamatan');
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
