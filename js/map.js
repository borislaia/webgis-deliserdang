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

// Style untuk hover effect
const kecamatanHoverStyle = new Style({
  stroke: new Stroke({ 
    color: '#ff7f0e',  // Orange
    width: 3 
  }),
  fill: new Fill({ 
    color: 'rgba(255, 127, 14, 0.4)'  // Orange transparan lebih terang
  })
});

// Create kecamatan layer using layer manager
const kecamatanSource = new VectorSource();
const kecamatanLayer = layerManager.addLayer(
  'Batas Kecamatan', 
  kecamatanSource, 
  kecamatanStyle, 
  true, 
  ['NAMOBJ', 'name', 'KECAMATAN']
);

// Tooltip untuk hover
const tooltipElement = el('div', { class: 'ol-tooltip' });
tooltipElement.style.cssText = `
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
  z-index: 9999;
`;
const tooltipOverlay = new Overlay({
  element: tooltipElement,
  offset: [10, 0],
  positioning: 'center-left'
});
map.addOverlay(tooltipOverlay);

// Hover interaction - Updated to work with all layers
let currentFeature = null;
map.on('pointermove', (evt) => {
  if (evt.dragging) return;
  
  const pixel = evt.pixel;
  let feature = null;
  let layerName = '';
  
  // Cari feature yang di-hover dari semua layers
  map.forEachFeatureAtPixel(pixel, (f, layer) => {
    // Check if this layer is managed by our layer manager
    for (const [name, managedLayer] of layerManager.layers) {
      if (layer === managedLayer) {
        feature = f;
        layerName = name;
        return true;
      }
    }
  });
  
  // Reset style feature sebelumnya
  if (currentFeature && currentFeature !== feature) {
    currentFeature.setStyle(undefined);
  }
  
  // Set hover style dan tampilkan tooltip
  if (feature) {
    feature.setStyle(kecamatanHoverStyle);
    currentFeature = feature;
    
    // Tampilkan nama feature di tooltip
    const featureName = feature.get('NAMOBJ') || feature.get('name') || 'Tidak diketahui';
    tooltipElement.innerHTML = `<strong>${featureName}</strong><br><small>${layerName}</small>`;
    tooltipOverlay.setPosition(evt.coordinate);
    
    // Ubah cursor jadi pointer
    map.getTargetElement().style.cursor = 'pointer';
  } else {
    // Sembunyikan tooltip
    tooltipOverlay.setPosition(undefined);
    currentFeature = null;
    map.getTargetElement().style.cursor = '';
  }
});

// Function to load GeoJSON file
async function loadGeoJSONFile(filePath, layerName, style, searchableFields = ['NAMOBJ', 'name']) {
  try {
    console.log(`Loading ${filePath}...`);
    const data = await fetchJSON(filePath);
    console.log('Data loaded:', data);
    
    const fmt = new GeoJSON();
    // Normalize to FeatureCollection if the file is an array of Features
    let geoJSON;
    if(Array.isArray(data)){
      geoJSON = { type: 'FeatureCollection', features: data };
    } else if(data && data.type === 'FeatureCollection' && Array.isArray(data.features)){
      geoJSON = data;
    } else if(data && Array.isArray(data.features)){
      geoJSON = { type: 'FeatureCollection', features: data.features };
    } else {
      console.warn(`Unexpected GeoJSON format for ${filePath}`, data);
      geoJSON = { type: 'FeatureCollection', features: [] };
    }
    
    console.log(`Processing GeoJSON with ${geoJSON.features?.length || 0} features`);
    
    // Load features
    const features = fmt.readFeatures(geoJSON, { 
      dataProjection: 'EPSG:4326', 
      featureProjection: map.getView().getProjection() 
    });
    
    console.log('Features created:', features.length);
    
    // Create layer using layer manager
    const source = new VectorSource();
    const layer = layerManager.addLayer(layerName, source, style, true, searchableFields);
    source.addFeatures(features);
    
    // Zoom to extent of loaded features if they exist
    if(features.length > 0) {
      const extent = source.getExtent();
      console.log('Features extent:', extent);
    }
    
    console.log(`✅ ${layerName} layer loaded successfully!`);
    return layer;
  } catch(error) {
    console.error(`❌ Error loading ${filePath}:`, error);
    return null;
  }
}

// Load data
(async function loadData(){
  try {
    // Load Batas Kecamatan
    await loadGeoJSONFile(
      './data/batas_kecamatan.json', 
      'Batas Kecamatan', 
      kecamatanStyle, 
      ['NAMOBJ', 'name', 'KECAMATAN']
    );
    
    // Load additional GeoJSON files if they exist
    const additionalFiles = [
      { path: './data/sungai.json', name: 'Sungai', fields: ['NAMOBJ', 'name', 'SUNGAI'] },
      { path: './data/danau.json', name: 'Danau', fields: ['NAMOBJ', 'name', 'DANAU'] },
      { path: './data/irigasi.json', name: 'Irigasi', fields: ['NAMOBJ', 'name', 'IRIGASI'] },
      { path: './data/bencana.json', name: 'Rawan Bencana', fields: ['NAMOBJ', 'name', 'BENCANA'] }
    ];
    
    // Create different styles for different layer types
    const sungaiStyle = new Style({
      stroke: new Stroke({ color: '#0066cc', width: 2 }),
      fill: new Fill({ color: 'rgba(0, 102, 204, 0.2)' })
    });
    
    const danauStyle = new Style({
      stroke: new Stroke({ color: '#00cc66', width: 2 }),
      fill: new Fill({ color: 'rgba(0, 204, 102, 0.3)' })
    });
    
    const irigasiStyle = new Style({
      stroke: new Stroke({ color: '#cc6600', width: 2 }),
      fill: new Fill({ color: 'rgba(204, 102, 0, 0.2)' })
    });
    
    const bencanaStyle = new Style({
      stroke: new Stroke({ color: '#cc0000', width: 2 }),
      fill: new Fill({ color: 'rgba(204, 0, 0, 0.3)' })
    });
    
    const styleMap = {
      'Sungai': sungaiStyle,
      'Danau': danauStyle,
      'Irigasi': irigasiStyle,
      'Rawan Bencana': bencanaStyle
    };
    
    // Try to load additional files
    for (const file of additionalFiles) {
      try {
        await loadGeoJSONFile(file.path, file.name, styleMap[file.name], file.fields);
      } catch (error) {
        console.log(`File ${file.path} not found, skipping...`);
      }
    }
    
  } catch(error) {
    console.error('❌ Error loading data:', error);
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

// Layer toggles - Update to support multiple layers
function updateLayerToggles() {
  const layerPanel = document.querySelector('.float-panel .legend');
  if (!layerPanel) return;
  
  // Clear existing toggles
  layerPanel.innerHTML = '';
  
  // Add toggles for each layer
  layerManager.layers.forEach((layer, name) => {
    const toggleId = `chk${name.replace(/\s+/g, '')}`;
    const div = document.createElement('div');
    div.innerHTML = `<label><input id="${toggleId}" type="checkbox" checked /> ${name}</label>`;
    layerPanel.appendChild(div);
    
    // Add event listener
    const checkbox = document.getElementById(toggleId);
    if (checkbox) {
      checkbox.addEventListener('change', () => layer.setVisible(checkbox.checked));
    }
  });
}

// Update layer toggles after data is loaded
setTimeout(updateLayerToggles, 2000);

// Controls
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetViewBtn = document.getElementById('resetView');
const homeBtn = document.getElementById('homeBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

zoomInBtn.addEventListener('click', () => map.getView().setZoom(map.getView().getZoom() + 1));
zoomOutBtn.addEventListener('click', () => map.getView().setZoom(map.getView().getZoom() - 1));
resetViewBtn.addEventListener('click', () => map.getView().animate({ center, zoom: 11, duration: 400 }));

// Navigation controls
homeBtn.addEventListener('click', () => window.location.href = './index.html');
dashboardBtn.addEventListener('click', () => window.location.href = './dashboard.html');

// GeoJSON Layer Manager
class GeoJSONLayerManager {
  constructor(map) {
    this.map = map;
    this.layers = new Map(); // Store layers by name
    this.searchableFields = new Map(); // Store searchable fields for each layer
  }

  addLayer(name, source, style, visible = true, searchableFields = ['NAMOBJ', 'name']) {
    const layer = new VectorLayer({
      source: source,
      style: style,
      visible: visible,
      zIndex: 10
    });
    
    this.layers.set(name, layer);
    this.searchableFields.set(name, searchableFields);
    this.map.addLayer(layer);
    
    return layer;
  }

  getLayer(name) {
    return this.layers.get(name);
  }

  getAllFeatures() {
    const allFeatures = [];
    this.layers.forEach((layer, name) => {
      const features = layer.getSource().getFeatures();
      features.forEach(feature => {
        allFeatures.push({
          feature: feature,
          layerName: name,
          searchableFields: this.searchableFields.get(name)
        });
      });
    });
    return allFeatures;
  }

  searchFeatures(query) {
    const allFeatures = this.getAllFeatures();
    const matches = [];
    
    allFeatures.forEach(({ feature, layerName, searchableFields }) => {
      let isMatch = false;
      let displayName = '';
      
      // Check each searchable field
      for (const field of searchableFields) {
        const value = feature.get(field);
        if (value && value.toLowerCase().includes(query.toLowerCase())) {
          isMatch = true;
          displayName = value;
          break;
        }
      }
      
      if (isMatch) {
        matches.push({
          feature: feature,
          layerName: layerName,
          displayName: displayName
        });
      }
    });
    
    return matches;
  }
}

// Initialize layer manager
const layerManager = new GeoJSONLayerManager(map);

// Expanding Search Bar functionality - Initialize after DOM is ready
function initializeSearchBar() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const expandingSearch = document.querySelector('.expanding-search');

  if (!searchInput || !searchResults || !expandingSearch) {
    console.warn('Search elements not found, retrying...');
    setTimeout(initializeSearchBar, 100);
    return;
  }

  // Keep search results visible when hovering over them
  let isSearchActive = false;

  expandingSearch.addEventListener('mouseenter', () => {
    isSearchActive = true;
  });

  expandingSearch.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!searchResults.matches(':hover')) {
        isSearchActive = false;
        if (searchInput.value.trim() === '') {
          searchResults.classList.remove('active');
        }
      }
    }, 200);
  });

  searchResults.addEventListener('mouseenter', () => {
    isSearchActive = true;
  });

  searchResults.addEventListener('mouseleave', () => {
    isSearchActive = false;
    if (searchInput.value.trim() === '') {
      searchResults.classList.remove('active');
    }
  });

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    
    if (query.length === 0) {
      searchResults.classList.remove('active');
      return;
    }
    
    if (query.length < 2) {
      searchResults.classList.add('active');
      searchResults.innerHTML = '<div class="search-no-results">Ketik minimal 2 karakter untuk mencari...</div>';
      return;
    }
    
    // Search in all layers
    const matches = layerManager.searchFeatures(query);
    
    if (matches.length === 0) {
      searchResults.classList.add('active');
      searchResults.innerHTML = '<div class="search-no-results">Tidak ada hasil ditemukan</div>';
      return;
    }
    
    searchResults.classList.add('active');
    matches.forEach(({ feature, layerName, displayName }) => {
      const div = document.createElement('div');
      div.className = 'search-result-item';
      div.innerHTML = `<strong>${displayName}</strong><br><small>${layerName}</small>`;
      div.addEventListener('click', () => {
        // Zoom to feature
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();
        map.getView().fit(extent, { 
          padding: [50, 50, 50, 50], 
          duration: 1000,
          maxZoom: 14
        });
        
        // Highlight feature temporarily
        feature.setStyle(kecamatanHoverStyle);
        setTimeout(() => {
          feature.setStyle(undefined);
        }, 3000);
        
        // Clear search
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.classList.remove('active');
      });
      searchResults.appendChild(div);
    });
  });

  // Clear search when clicking outside
  document.addEventListener('click', (e) => {
    if (!expandingSearch.contains(e.target) && !searchResults.contains(e.target)) {
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
    }
  });
}

// Initialize search bar when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSearchBar);

// Popup overlay
const container = el('div', { class: 'ol-popup card' });
const overlay = new Overlay({ element: container, autoPan: { animation: { duration: 250 } } });
map.addOverlay(overlay);

function renderPopup(feature, layerName = ''){
  const props = feature.getProperties();
  const title = props.NAMOBJ || props.name || 'Feature';
  const photo = props.photo;
  const desc = props.description || '';
  container.innerHTML = '';
  container.append(
    el('div', { class: 'title', html: title }),
    el('div', { html: `<small>Layer: ${layerName}</small>` }),
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
  let layerName = '';
  
  map.forEachFeatureAtPixel(pixel, (feature, layer) => {
    // Check if this layer is managed by our layer manager
    for (const [name, managedLayer] of layerManager.layers) {
      if (layer === managedLayer) {
        hit = true;
        layerName = name;
        renderPopup(feature, layerName);
        overlay.setPosition(evt.coordinate);
        return true;
      }
    }
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
