"use client";
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, XYZ, Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke } from 'ol/style';

const centerLonLat: [number, number] = [98.69870163855006, 3.5460256535269954];

export default function MapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;

    const center = fromLonLat(centerLonLat);

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

    const map = new Map({
      target: mapDivRef.current,
      layers: [googleHybrid, googleSat, osm],
      view: new View({ center, zoom: 11 }),
    });

    const kecamatanStyle = new Style({
      stroke: new Stroke({ color: '#1f77b4', width: 2 }),
      fill: new Fill({ color: 'rgba(31, 119, 180, 0.2)' }),
    });
    const kecamatanHoverStyle = new Style({
      stroke: new Stroke({ color: '#ff7f0e', width: 3 }),
      fill: new Fill({ color: 'rgba(255, 127, 14, 0.4)' }),
    });

    const kecamatanLayer = new VectorLayer({ source: new VectorSource(), style: kecamatanStyle, visible: true, zIndex: 10 });
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
      const res = await fetch('/data/batas_kecamatan.json');
      if (!res.ok) return;
      const batas = await res.json();
      const fmt = new GeoJSON();
      const collection = Array.isArray(batas) ? { type: 'FeatureCollection', features: batas } : batas;
      const features = fmt.readFeatures(collection, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
      kecamatanLayer.getSource()?.addFeatures(features);
      if (features.length > 0) {
        const extent = kecamatanLayer.getSource()!.getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
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
          const title = feature.get('NAMOBJ') || 'Feature';
          // avoid injecting unsanitized HTML
          popupRef.current.textContent = '';
          const titleDiv = document.createElement('div');
          titleDiv.className = 'title';
          titleDiv.textContent = title;
          popupRef.current.appendChild(titleDiv);
          popupOverlayRef.current.setPosition(evt.coordinate);
        }
        return true;
      });
      if (!hit) popupOverlayRef.current?.setPosition(undefined);
    });

    return () => map.setTarget(undefined as any);
  }, []);

  return (
    <main>
      <header className="app-header blur">
        <div className="brand">
          <Image src="/assets/icons/logo-deliserdang.jpg" alt="Logo" width={24} height={24} className="brand-icon" />
          <span className="brand-text">Peta Deli Serdang</span>
        </div>
      </header>
      <div ref={mapDivRef} className="map-container" />
      <div ref={tooltipRef} className="ol-tooltip" />
      <div ref={popupRef} className="ol-popup card" />
    </main>
  );
}
