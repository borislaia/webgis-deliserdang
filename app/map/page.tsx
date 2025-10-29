"use client";
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, XYZ, Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';

const centerLonLat: [number, number] = [98.69870163855006, 3.5460256535269954];

export default function MapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const mapRef = useRef<Map | null>(null);

  // Layer refs for UI controls
  const googleHybridRef = useRef<TileLayer<any> | null>(null);
  const googleSatRef = useRef<TileLayer<any> | null>(null);
  const osmRef = useRef<TileLayer<any> | null>(null);
  const cartoDBRef = useRef<TileLayer<any> | null>(null);
  const esriSatRef = useRef<TileLayer<any> | null>(null);
  const kecamatanLayerRef = useRef<VectorLayer<any> | null>(null);

  // Modal state for image preview from popup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImgSrc, setModalImgSrc] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const searchParams = useSearchParams();
  const kdi = searchParams.get('k_di') || '';

  useEffect(() => {
    if (!mapDivRef.current) return;

    const center = fromLonLat(centerLonLat);

    // Base layers
    const googleHybrid = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attributions: '© Google',
        maxZoom: 20,
        crossOrigin: 'anonymous',
      }),
      visible: true,
    });
    const googleSat = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attributions: '© Google',
        maxZoom: 20,
        crossOrigin: 'anonymous',
      }),
      visible: false,
    });
    const osm = new TileLayer({ source: new OSM(), visible: false });
    const cartoDB = new TileLayer({
      source: new XYZ({
        url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors, © CARTO',
        maxZoom: 20,
        crossOrigin: 'anonymous',
      }),
      visible: false,
    });
    const esriSat = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
        crossOrigin: 'anonymous',
      }),
      visible: false,
    });

    googleHybridRef.current = googleHybrid;
    googleSatRef.current = googleSat;
    osmRef.current = osm;
    cartoDBRef.current = cartoDB;
    esriSatRef.current = esriSat;

    const map = new Map({
      target: mapDivRef.current,
      layers: [googleHybrid, googleSat, osm, cartoDB, esriSat],
      view: new View({ center, zoom: 11 }),
      controls: defaultControls({ attribution: false, zoom: false, rotate: false }),
      interactions: defaultInteractions(),
    });
    mapRef.current = map;

    const kecamatanStyle = new Style({
      stroke: new Stroke({ color: '#1f77b4', width: 2 }),
      fill: new Fill({ color: 'rgba(31, 119, 180, 0.2)' }),
    });
    const kecamatanHoverStyle = new Style({
      stroke: new Stroke({ color: '#ff7f0e', width: 3 }),
      fill: new Fill({ color: 'rgba(255, 127, 14, 0.4)' }),
    });

    const kecamatanLayer = new VectorLayer({ source: new VectorSource(), style: kecamatanStyle, visible: true, zIndex: 10 });
    kecamatanLayerRef.current = kecamatanLayer;
    map.addLayer(kecamatanLayer);

    // Tooltip
    if (tooltipRef.current) {
      const tooltipOverlay = new Overlay({ element: tooltipRef.current, offset: [10, 0], positioning: 'center-left' });
      overlayRef.current = tooltipOverlay;
      map.addOverlay(tooltipOverlay);
    }

    // Popup
    if (popupRef.current) {
      const overlay = new Overlay({ element: popupRef.current, autoPan: { animation: { duration: 250 } } });
      popupOverlayRef.current = overlay;
      map.addOverlay(overlay);
    }

    // Load data
    (async () => {
      try {
        // Always load boundary as context
        const res = await fetch('/data/batas_kecamatan.json');
        if (res.ok) {
          const batas = await res.json();
          const fmt = new GeoJSON();
          const collection = Array.isArray(batas) ? { type: 'FeatureCollection', features: batas } : batas;
          const features = fmt.readFeatures(collection, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
          kecamatanLayer.getSource()?.clear();
          kecamatanLayer.getSource()?.addFeatures(features);
        }

        const supabase = createClient();
        // detect admin role
        try {
          const { data } = await supabase.auth.getUser();
          setIsAdmin(((data.user?.app_metadata as any)?.role) === 'admin');
        } catch {}

        if (kdi) {
          const { data: di } = await supabase.from('daerah_irigasi').select('id,k_di,n_di').eq('k_di', kdi).maybeSingle();
          if (di?.id) {
            // Load saluran, ruas, bangunan, fungsional
            const [{ data: saluran }, { data: bangunan }, { data: fungsional }] = await Promise.all([
              supabase.from('saluran').select('id,no_saluran,geojson').eq('daerah_irigasi_id', di.id),
              supabase.from('bangunan').select('id,geojson'),
              supabase.from('fungsional').select('id,geojson').eq('daerah_irigasi_id', di.id),
            ]);

            // Add bangunan layer
            if (bangunan && bangunan.length) {
              const src = new VectorSource();
              const fmt = new GeoJSON();
              for (const b of bangunan) {
                if (!b.geojson) continue;
                const feat = fmt.readFeature(b.geojson, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
                src.addFeature(feat);
              }
              const layer = new VectorLayer({ source: src, zIndex: 30 });
              map.addLayer(layer);
            }

            // Add fungsional layer
            if (fungsional && fungsional.length) {
              const src = new VectorSource();
              const fmt = new GeoJSON();
              for (const f of fungsional) {
                if (!f.geojson) continue;
                const fc = f.geojson.type === 'FeatureCollection' ? f.geojson : { type: 'FeatureCollection', features: [f.geojson] };
                const fs = fmt.readFeatures(fc, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
                src.addFeatures(fs);
              }
              const layer = new VectorLayer({ source: src, zIndex: 5, style: new Style({ stroke: new Stroke({ color: '#2ca02c', width: 2 }), fill: new Fill({ color: 'rgba(44,160,44,0.2)' }) }) });
              map.addLayer(layer);
            }

            // Build ruas layer from DB rows
            let ruasFeatures: any[] = [];
            if (saluran && saluran.length) {
              const salIds = saluran.map((s: any) => s.id);
              const { data: ruas } = await supabase.from('ruas').select('id,no_ruas,urutan,geojson,foto_urls,metadata,saluran_id').in('saluran_id', salIds);
              const fmt = new GeoJSON();
              if (ruas) {
                for (const r of ruas) {
                  if (!r.geojson) continue;
                  // Attach foto_urls into properties for popup use
                  const featureGeo = { ...r.geojson, properties: { ...(r.geojson.properties || {}), foto_urls: r.foto_urls || [], ruas_id: r.id, metadata: r.metadata || {} } };
                  const f = fmt.readFeature(featureGeo, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
                  ruasFeatures.push(f);
                }
              }
            }

            if (ruasFeatures.length) {
              const src = new VectorSource();
              src.addFeatures(ruasFeatures);
              const layer = new VectorLayer({ source: src, zIndex: 20, style: new Style({ stroke: new Stroke({ color: '#ff7f0e', width: 3 }) }) });
              map.addLayer(layer);
              const extent = src.getExtent();
              if (extent) map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
            }
          }
        }
      } catch (e) {
        // ignore
      }
    })();

    // Hover
    let currentFeature: any = null;
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      let feature: any = null;
      map.forEachFeatureAtPixel(evt.pixel, (f, layer) => {
        if (layer === kecamatanLayer) { feature = f; return true; }
      });
      if (currentFeature && currentFeature !== feature) currentFeature.setStyle(undefined);
      if (feature) {
        feature.setStyle(kecamatanHoverStyle);
        currentFeature = feature;
        if (overlayRef.current && tooltipRef.current) {
          tooltipRef.current.innerText = feature.get('NAMOBJ') || 'Tidak diketahui';
          overlayRef.current.setPosition(evt.coordinate);
        }
      } else {
        overlayRef.current?.setPosition(undefined);
        currentFeature = null;
      }
    });

    // Click popup
    map.on('singleclick', (evt) => {
      let hit = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        hit = true;
        if (popupOverlayRef.current && popupRef.current) {
          const namobj = feature.get('NAMOBJ');
          const noRuas = feature.get('no_ruas');
          const noSal = feature.get('no_saluran');
          const photos: string[] = feature.get('foto_urls') || [];
          const ruasId: string | undefined = feature.get('ruas_id');
          const metadata: any = feature.get('metadata') || {};
          popupRef.current.textContent = '';
          const titleDiv = document.createElement('div');
          titleDiv.className = 'title';
          titleDiv.textContent = namobj || noRuas || 'Feature';
          popupRef.current.appendChild(titleDiv);
          if (noSal && noRuas) {
            const meta = document.createElement('div');
            meta.textContent = `${noSal} • ${noRuas}`;
            meta.style.marginBottom = '6px';
            popupRef.current.appendChild(meta);
          }
          if (photos.length) {
            const gallery = document.createElement('div');
            gallery.style.display = 'flex';
            gallery.style.gap = '6px';
            photos.slice(0, 4).forEach((url) => {
              const img = document.createElement('img');
              img.src = url;
              img.alt = 'foto';
              img.style.width = '72px';
              img.style.height = '72px';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '6px';
              img.onclick = () => { setModalImgSrc(url); setIsModalOpen(true); };
              gallery.appendChild(img);
            });
            popupRef.current.appendChild(gallery);
          }
          if (isAdmin && ruasId && noRuas) {
            const editWrap = document.createElement('div');
            editWrap.style.marginTop = '8px';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Catatan';
            input.value = metadata?.catatan || '';
            input.className = 'input';
            input.style.width = '180px';
            const save = document.createElement('button');
            save.className = 'btn';
            save.textContent = 'Simpan';
            save.onclick = async () => {
              const supabase = createClient();
              const newMeta = { ...(metadata || {}), catatan: input.value };
              const { error } = await supabase.from('ruas').update({ metadata: newMeta }).eq('id', ruasId);
              if (error) alert('Gagal menyimpan: ' + error.message);
              else alert('Tersimpan');
            };
            editWrap.appendChild(input);
            editWrap.appendChild(save);
            popupRef.current.appendChild(editWrap);
          }
          popupOverlayRef.current.setPosition(evt.coordinate);
        }
        return true;
      });
      if (!hit) popupOverlayRef.current?.setPosition(undefined);
    });

    return () => {
      map.setTarget(undefined as any);
      mapRef.current = null;
    };
  }, []);

  // UI handlers
  const setBasemap = (name: string) => {
    googleHybridRef.current?.setVisible(name === 'googleHybrid');
    googleSatRef.current?.setVisible(name === 'googleSat');
    osmRef.current?.setVisible(name === 'osm');
    cartoDBRef.current?.setVisible(name === 'carto');
    esriSatRef.current?.setVisible(name === 'sat');
  };

  const zoomIn = () => {
    const map = mapRef.current; if (!map) return;
    const view = map.getView();
    view.setZoom((view.getZoom() || 0) + 1);
  };
  const zoomOut = () => {
    const map = mapRef.current; if (!map) return;
    const view = map.getView();
    view.setZoom((view.getZoom() || 0) - 1);
  };
  const resetView = () => {
    const map = mapRef.current; if (!map) return;
    map.getView().animate({ center: fromLonLat(centerLonLat), zoom: 11, duration: 400 });
  };
  const toggleKecamatan = (checked: boolean) => {
    kecamatanLayerRef.current?.setVisible(checked);
  };
  const goHome = () => { window.location.href = '/'; };
  const goDashboard = () => { window.location.href = '/dashboard'; };
  const closeModal = () => { setIsModalOpen(false); setModalImgSrc(null); };

  return (
    <main>
      {/* Map container */}
      <div ref={mapDivRef} className="map-container" />
      {/* Floating controls (custom UI) */}
      <div className="float-controls">
        <button onClick={goHome} className="btn" title="Home">🏠</button>
        <button onClick={goDashboard} className="btn" title="Dashboard">📊</button>
        <button onClick={resetView} className="btn" title="Reset View">⤾</button>
        <button onClick={zoomIn} className="btn" title="Zoom In">＋</button>
        <button onClick={zoomOut} className="btn" title="Zoom Out">－</button>
      </div>

      {/* Floating layer panel */}
      <div className="float-panel card float-card" style={{ zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>Layers</strong>
          <span className="badge">OpenLayers</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 600, margin: '8px 0 6px' }}>Basemap</div>
          <label><input type="radio" name="basemap" defaultChecked onChange={() => setBasemap('googleHybrid')} /> Google Satellite Hybrid</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('googleSat')} /> Google Satellite</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('osm')} /> OpenStreetMap</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('carto')} /> CartoDB Light</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('sat')} /> ESRI Satellite</label>
        </div>
        <div style={{ fontWeight: 600, margin: '12px 0 6px' }}>Operational Layers</div>
        <label><input type="checkbox" defaultChecked onChange={(e) => toggleKecamatan((e.target as HTMLInputElement).checked)} /> Kecamatan Boundaries</label><br />
        <div style={{ marginTop: 12 }} className="legend" />
      </div>

      {/* Tooltip and popup overlays */}
      <div ref={tooltipRef} className="ol-tooltip" />
      <div ref={popupRef} className="ol-popup card" />

      {/* Image modal */}
      <div className={`modal ${isModalOpen ? 'open' : ''}`} aria-hidden={!isModalOpen} onClick={closeModal}>
        {isModalOpen && modalImgSrc ? <img src={modalImgSrc} alt="photo" /> : null}
      </div>
    </main>
  );
}
