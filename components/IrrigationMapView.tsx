"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, XYZ, Vector as VectorSource } from 'ol/source';
import ClusterSource from 'ol/source/Cluster';
import { fromLonLat } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { createEmpty as createEmptyExtent, extend as extendExtent, isEmpty as isExtentEmpty } from 'ol/extent';

const centerLonLat: [number, number] = [98.69870163855006, 3.5460256535269954];

type StorageResult = { points: number; lines: number; polygons: number; files: number };

type MapVariant = 'map' | 'sebaran';

type IrrigationMapViewProps = {
  variant?: MapVariant;
};

type DaerahIrigasiRow = {
  id: string;
  k_di: string;
  n_di?: string | null;
  uptd?: string | null;
  kecamatan?: string | null;
  desa_kel?: string | null;
  sumber_air?: string | null;
  luas_ha?: number | null;
  metadata?: Record<string, any> | string | null;
};

const normalizeMetadata = (metadata: DaerahIrigasiRow['metadata']): Record<string, any> => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      return {};
    }
  }
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, any>;
  }
  return {};
};

const findMetadataValueBySubstring = (source: Record<string, any>, keyword: string): any => {
  if (!source || !keyword) return undefined;
  const lowerKeyword = keyword.toLowerCase();
  const visited = new WeakSet<object>();
  const walk = (node: any): any => {
    if (!node || typeof node !== 'object') return undefined;
    if (visited.has(node)) return undefined;
    visited.add(node);
    if (Array.isArray(node)) {
      for (const item of node) {
        const nestedFromArray = walk(item);
        if (nestedFromArray !== undefined) return nestedFromArray;
      }
      return undefined;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.toLowerCase().includes(lowerKeyword) && value != null) {
        if (typeof value === 'object') {
          const nestedMatch = walk(value);
          if (nestedMatch !== undefined) return nestedMatch;
          return value;
        }
        return value;
      }
      if (value && typeof value === 'object') {
        const nested = walk(value);
        if (nested !== undefined) return nested;
      }
    }
    return undefined;
  };
  return walk(source);
};

export default function IrrigationMapView({ variant = 'map' }: IrrigationMapViewProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const mapRef = useRef<Map | null>(null);
  const dataExtentRef = useRef<[number, number, number, number] | null>(null);

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '') as string;
  const supabase = useMemo(() => createClient(), []);

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
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageCounts, setStorageCounts] = useState<{ points: number; lines: number; polygons: number; files: number }>({ points: 0, lines: 0, polygons: 0, files: 0 });
  const storagePointsLayerRef = useRef<VectorLayer<any> | null>(null);
  const storageLinesLayerRef = useRef<VectorLayer<any> | null>(null);
  const storagePolygonsLayerRef = useRef<VectorLayer<any> | null>(null);
  const [pointsVisible, setPointsVisible] = useState(true);
  const [linesVisible, setLinesVisible] = useState(true);
  const [polygonsVisible, setPolygonsVisible] = useState(true);
  const [diInfo, setDiInfo] = useState<DaerahIrigasiRow | null>(null);
  const [diInfoLoading, setDiInfoLoading] = useState(false);
  const [diInfoError, setDiInfoError] = useState<string | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const searchParams = useSearchParams();
  // Terima baik ?di= maupun ?k_di= untuk fleksibilitas dari dashboard
  const rawKdi = (searchParams.get('di') || searchParams.get('k_di') || '').trim();
  const activeKdi = useMemo(() => (variant === 'map' ? rawKdi : ''), [variant, rawKdi]);

  // Jika varian MAP memuat DI spesifik (activeKdi ada), layer kecamatan default disembunyikan
  const [kecamatanVisible, setKecamatanVisible] = useState<boolean>(!(activeKdi && activeKdi.length > 0));

  useEffect(() => {
    setKecamatanVisible(!(activeKdi && activeKdi.length > 0));
  }, [activeKdi]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseTitle = 'WebGIS Deli Serdang';
    const pageTitle = variant === 'sebaran' ? 'Sebaran Irigasi' : 'Peta Daerah Irigasi';
    document.title = `${pageTitle} | ${baseTitle}`;
  }, [variant]);

  useEffect(() => {
    let cancelled = false;
    if (!activeKdi) {
      setDiInfo(null);
      setDiInfoError(null);
      setDiInfoLoading(false);
      return () => {
        cancelled = true;
      };
    }
    setDiInfo(null);
    setDiInfoError(null);
    setDiInfoLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('daerah_irigasi')
          .select('id,k_di,n_di,uptd,kecamatan,desa_kel,sumber_air,luas_ha,metadata')
          .eq('k_di', activeKdi)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (!data) {
          setDiInfo(null);
          setDiInfoError('Data DI tidak ditemukan');
          return;
        }
        setDiInfo(data as DaerahIrigasiRow);
      } catch (err: any) {
        if (cancelled) return;
        setDiInfo(null);
        setDiInfoError(err?.message || 'Gagal memuat data DI');
      } finally {
        if (cancelled) return;
        setDiInfoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKdi, supabase]);

    useEffect(() => {
      if (!mapDivRef.current) return;
      if (typeof document !== 'undefined') {
        if (!tooltipRef.current) {
          const tooltipEl = document.createElement('div');
          tooltipEl.className = 'ol-tooltip';
          tooltipRef.current = tooltipEl;
        }
        if (!popupRef.current) {
          const popupEl = document.createElement('div');
          popupEl.className = 'ol-popup card';
          popupRef.current = popupEl;
        }
      }

      const center = fromLonLat(centerLonLat);

    // Base layers
    const googleHybrid = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attributions: '© Google',
        maxZoom: 20,
        crossOrigin: 'anonymous',
      }),
      visible: false,
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
      visible: true,
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

    // Highlight styles untuk layer DI (storage & DB)
    const highlightPointStyle = new Style({
      image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ff1493' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }),
    });
    const highlightLineStyle = new Style({
      stroke: new Stroke({ color: '#ff7f0e', width: 4 }),
    });
    const highlightPolygonStyle = new Style({
      stroke: new Stroke({ color: '#d62728', width: 3 }),
      fill: new Fill({ color: 'rgba(214, 39, 40, 0.25)' }),
    });

    const kecamatanLayer = new VectorLayer({
      source: new VectorSource(),
      style: kecamatanStyle,
      visible: !activeKdi && kecamatanVisible,
      zIndex: 10,
    });
    kecamatanLayerRef.current = kecamatanLayer;
    if (!activeKdi) {
      map.addLayer(kecamatanLayer);
    }

    // Storage aggregated layers: polygons, lines, points (bottom -> top)
    const polygonsSrc = new VectorSource();
    const linesSrc = new VectorSource();
    const pointsSrc = new VectorSource();
    const clusterSrc = new ClusterSource({ distance: 40, minDistance: 20, source: pointsSrc });
    const polygonsLayer = new VectorLayer({
      source: polygonsSrc,
      zIndex: 7,
      style: new Style({ stroke: new Stroke({ color: '#2ca02c', width: 2 }), fill: new Fill({ color: 'rgba(44,160,44,0.2)' }) }),
      visible: true,
    });
    const linesLayer = new VectorLayer({
      source: linesSrc,
      zIndex: 22,
      style: new Style({ stroke: new Stroke({ color: '#3388ff', width: 4 }) }),
      visible: true,
    });
    const pointsLayer = new VectorLayer({
      source: clusterSrc,
      zIndex: 31,
      style: (feature: any) => {
        const members: any[] = feature?.get?.('features') || [];
        const count = members.length || 1;
        if (count > 1) {
          const radius = Math.max(10, Math.min(20, 10 + Math.log2(count)));
          return new Style({
            image: new CircleStyle({ radius, fill: new Fill({ color: 'rgba(148,103,189,0.65)' }), stroke: new Stroke({ color: '#613b7a', width: 1.5 }) }),
            text: new Text({ text: String(count), fill: new Fill({ color: '#ffffff' }), stroke: new Stroke({ color: 'rgba(0,0,0,0.3)', width: 3 }) }),
          });
        }
        return new Style({ image: new CircleStyle({ radius: 5, fill: new Fill({ color: '#9467bd' }), stroke: new Stroke({ color: '#ffffff', width: 1 }) }) });
      },
      visible: true,
    });
    map.addLayer(polygonsLayer);
    map.addLayer(linesLayer);
    map.addLayer(pointsLayer);
    storagePolygonsLayerRef.current = polygonsLayer;
    storageLinesLayerRef.current = linesLayer;
    storagePointsLayerRef.current = pointsLayer;

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
          // Load boundary for context when no DI selected
          if (!activeKdi) {
            const res = await fetch('/data/batas_kecamatan.json');
            if (res.ok) {
              const batas = await res.json();
              const fmt = new GeoJSON();
              const collection = Array.isArray(batas) ? { type: 'FeatureCollection', features: batas } : batas;
              const features = fmt.readFeatures(collection, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
              kecamatanLayer.getSource()?.clear();
              kecamatanLayer.getSource()?.addFeatures(features);
              if (features.length > 0) {
                const ext = kecamatanLayer.getSource()?.getExtent();
                if (ext) {
                  dataExtentRef.current = ext.slice() as any;
                  map.getView().fit(ext, { padding: [50, 50, 50, 50], duration: 500 });
                }
              }
            }
          }

          // detect admin role
          try {
            const { data } = await supabase.auth.getUser();
            setIsAdmin(((data.user?.app_metadata as any)?.role) === 'admin');
          } catch {}

        // 1) Load GeoJSON paths via manifest (CDN) dengan fallback
        try {
          setLoadingStorage(true);
          setStorageError(null);
          setStorageCounts({ points: 0, lines: 0, polygons: 0, files: 0 });
          const fetchManifestPaths = async (): Promise<string[]> => {
            // Try public CDN manifest first
            try {
              const pub = supabase.storage.from('geojson').getPublicUrl('manifest.json');
              const manifestUrl = pub?.data?.publicUrl;
              if (manifestUrl) {
                const r = await fetch(manifestUrl, { cache: 'no-cache' });
                if (r.ok) {
                  const m = await r.json();
                  if (Array.isArray(m)) return m;
                  if (Array.isArray(m?.files)) return m.files as string[];
                }
              }
            } catch {}

            // Fallback ke server endpoint (akan juga membuat/upload manifest)
            try {
              const r = await fetch('/api/geojson/manifest', { cache: 'no-cache' });
              if (r.ok) {
                const m = await r.json();
                if (Array.isArray(m)) return m;
                if (Array.isArray(m?.files)) return m.files as string[];
              }
            } catch {}

            // Final fallback: list langsung via client SDK
            const listAll = async (prefix: string): Promise<string[]> => {
              const { data, error } = await supabase.storage.from('geojson').list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
              if (error) return [];
              const files: string[] = [];
              for (const item of data || []) {
                const name = item.name || '';
                const fullPath = prefix ? `${prefix}${name}` : name;
                const looksLikeFile = /\.[a-z0-9]+$/i.test(name);
                if (looksLikeFile) {
                  const lower = name.toLowerCase();
                  if (lower.endsWith('.json') || lower.endsWith('.geojson')) files.push(fullPath);
                } else {
                  const nested = await listAll(`${fullPath}/`);
                  files.push(...nested);
                }
              }
              return files;
            };
            return await listAll('');
          };
          const allFiles = await fetchManifestPaths();
          let targetFiles: string[] = allFiles;
          if (activeKdi) {
            const codeLower = activeKdi.toLowerCase();
            // Muat hanya berkas di folder root yang PERSIS sama dengan kode DI
            const byExactRoot = allFiles.filter((p) => ((p.split('/')[0] || '').toLowerCase()) === codeLower);
            if (byExactRoot.length) {
              targetFiles = byExactRoot;
            } else {
              // Fallback aman: prefix ketat
              targetFiles = allFiles.filter((p) => p.startsWith(`${activeKdi}/`));
            }
          }
          const processFile = async (path: string): Promise<StorageResult | null> => {
            // Prefer CDN public URL fetch for speed; fallback to storage.download
            try {
              const pub = supabase.storage.from('geojson').getPublicUrl(path);
              const url = pub?.data?.publicUrl;
              if (url) {
                const res = await fetch(url, { cache: 'force-cache' });
                if (res.ok) {
                  const json = await res.json();
                  const fmt = new GeoJSON();
                  const projection = map.getView().getProjection();
                  const features = json?.type === 'FeatureCollection'
                    ? fmt.readFeatures(json, { dataProjection: 'EPSG:4326', featureProjection: projection })
                    : json?.type === 'Feature'
                      ? [fmt.readFeature(json, { dataProjection: 'EPSG:4326', featureProjection: projection })]
                      : [];
                  if (features.length) {
                    let cPoints = 0, cLines = 0, cPolys = 0;
                    for (const f of features) {
                      const geom: any = f.getGeometry?.();
                      const t = geom?.getType?.();
                      if (t === 'Point' || t === 'MultiPoint') { pointsSrc.addFeature(f); cPoints++; }
                      else if (t === 'LineString' || t === 'MultiLineString') { linesSrc.addFeature(f); cLines++; }
                      else if (t === 'Polygon' || t === 'MultiPolygon') { polygonsSrc.addFeature(f); cPolys++; }
                    }
                    return { points: cPoints, lines: cLines, polygons: cPolys, files: 1 };
                  }
                }
              }
            } catch {}

            // Fallback ke SDK download
            const { data: blob } = await supabase.storage.from('geojson').download(path);
            if (!blob) return null;
            const text = await blob.text();
            let json: any;
            try { json = JSON.parse(text); } catch { return null; }
            const fmt = new GeoJSON();
            const projection = map.getView().getProjection();
            const features = json?.type === 'FeatureCollection'
              ? fmt.readFeatures(json, { dataProjection: 'EPSG:4326', featureProjection: projection })
              : json?.type === 'Feature'
                ? [fmt.readFeature(json, { dataProjection: 'EPSG:4326', featureProjection: projection })]
                : [];
            if (!features.length) return null;
            let cPoints = 0, cLines = 0, cPolys = 0;
            for (const f of features) {
              const geom: any = f.getGeometry?.();
              const t = geom?.getType?.();
              if (t === 'Point' || t === 'MultiPoint') { pointsSrc.addFeature(f); cPoints++; }
              else if (t === 'LineString' || t === 'MultiLineString') { linesSrc.addFeature(f); cLines++; }
              else if (t === 'Polygon' || t === 'MultiPolygon') { polygonsSrc.addFeature(f); cPolys++; }
            }
            return { points: cPoints, lines: cLines, polygons: cPolys, files: 1 };
          };

          // Batasi concurrency agar UI tetap responsif
          let index = 0;
          const concurrency = 8; // slightly higher; CDN helps
          const storageResults: StorageResult[] = [];
          const workers = Array.from({ length: concurrency }, async () => {
            while (index < targetFiles.length) {
              const current = targetFiles[index++];
              try {
                const result = await processFile(current);
                if (result) storageResults.push(result);
              } catch {}
            }
          });
          await Promise.all(workers);
          if (storageResults.length) {
            const totals = storageResults.reduce<StorageResult>((acc, curr) => ({
              points: acc.points + curr.points,
              lines: acc.lines + curr.lines,
              polygons: acc.polygons + curr.polygons,
              files: acc.files + curr.files,
            }), { points: 0, lines: 0, polygons: 0, files: 0 });
            setStorageCounts(totals);
          } else {
            setStorageCounts({ points: 0, lines: 0, polygons: 0, files: 0 });
          }
          // Update extent dari storage layers
          const combined = createEmptyExtent();
          const pExt = polygonsSrc.getExtent();
          const lExt = linesSrc.getExtent();
          const ptExt = pointsSrc.getExtent();
          if (pExt) extendExtent(combined, pExt);
          if (lExt) extendExtent(combined, lExt);
          if (ptExt) extendExtent(combined, ptExt);
          if (!isExtentEmpty(combined)) {
            dataExtentRef.current = combined.slice() as any;
            // Fit jika activeKdi ada (prioritaskan data DI yang termuat dari storage)
            if (activeKdi) map.getView().fit(combined, { padding: [50, 50, 50, 50], duration: 500 });
          }
        } catch (err: any) {
          setStorageError(err?.message || 'Gagal memuat GeoJSON dari Storage');
        } finally {
          setLoadingStorage(false);
        }

        // 2) Jika k_di/di disediakan, muat layer operasional terkait dari DB
        if (activeKdi) {
          const { data: di } = await supabase.from('daerah_irigasi').select('id,k_di,n_di').eq('k_di', activeKdi).maybeSingle();
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
              const ext = src.getExtent();
              if (ext) {
                const combined = dataExtentRef.current ? dataExtentRef.current.slice() as any : createEmptyExtent();
                extendExtent(combined, ext);
                dataExtentRef.current = combined;
              }
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
              const ext = src.getExtent();
              if (ext) {
                const combined = dataExtentRef.current ? dataExtentRef.current.slice() as any : createEmptyExtent();
                extendExtent(combined, ext);
                dataExtentRef.current = combined;
              }
            }

            // Build ruas layer dari DB
            let ruasFeatures: any[] = [];
            if (saluran && saluran.length) {
              const salIds = saluran.map((s: any) => s.id);
              const { data: ruas } = await supabase
                .from('ruas')
                .select('id,no_ruas,urutan,geojson,img_urls,metadata,saluran_id')
                .in('saluran_id', salIds);
              const fmt = new GeoJSON();
              if (ruas) {
                for (const r of ruas) {
                  if (!r.geojson) continue;
                  // Sisipkan img_urls ke properties untuk popup
                  const featureGeo = {
                    ...r.geojson,
                    properties: {
                      ...(r.geojson.properties || {}),
                      img_urls: r.img_urls ?? r.metadata?.img_urls ?? r.metadata?.url_imgs ?? [],
                      ruas_id: r.id,
                      metadata: r.metadata || {},
                    },
                  };
                  const f = fmt.readFeature(featureGeo, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: map.getView().getProjection(),
                  });
                  ruasFeatures.push(f);
                }
              }
            }

            if (ruasFeatures.length) {
              const src = new VectorSource();
              src.addFeatures(ruasFeatures);
              const layer = new VectorLayer({
                source: src,
                zIndex: 40,
                style: new Style({ stroke: new Stroke({ color: '#ff7f0e', width: 5 }) }),
              });
              map.addLayer(layer);
              const extent = src.getExtent();
              if (extent) {
                const combined = dataExtentRef.current ? dataExtentRef.current.slice() as any : createEmptyExtent();
                extendExtent(combined, extent);
                dataExtentRef.current = combined;
                map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    })();

    // Hover (highlight + tooltip) untuk semua layer vektor (prioritas top-most)
    let currentFeature: any = null;
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      let hovered: any = null;
      let styleForHover: Style | undefined;
      map.forEachFeatureAtPixel(
        evt.pixel,
        (f, layer) => {
          hovered = f;
          const geom: any = f.getGeometry?.();
          const t = geom?.getType?.();
          if (layer === kecamatanLayer) {
            styleForHover = kecamatanHoverStyle;
          } else if (t === 'Point' || t === 'MultiPoint') {
            styleForHover = highlightPointStyle;
          } else if (t === 'LineString' || t === 'MultiLineString') {
            styleForHover = highlightLineStyle;
          } else if (t === 'Polygon' || t === 'MultiPolygon') {
            styleForHover = highlightPolygonStyle;
          } else {
            styleForHover = undefined;
          }
          return true; // stop at the first/top-most feature
        },
        { hitTolerance: 5 }
      );

      if (currentFeature && currentFeature !== hovered) currentFeature.setStyle(undefined);
      if (hovered) {
        if (styleForHover) hovered.setStyle(styleForHover);
        currentFeature = hovered;
        if (overlayRef.current && tooltipRef.current) {
          let featureForLabel: any = hovered;
          const clusterMembers: any[] = hovered?.get && hovered.get('features');
          if (Array.isArray(clusterMembers) && clusterMembers.length === 1) {
            featureForLabel = clusterMembers[0];
          }

          const findInObject = (obj: Record<string, any> | null | undefined, key: string): any => {
            if (!obj || typeof obj !== 'object') return undefined;
            if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) return obj[key];
            const lowerKey = key.toLowerCase();
            const matchedKey = Object.keys(obj).find((existing) => existing.toLowerCase() === lowerKey);
            if (matchedKey && obj[matchedKey] != null) return obj[matchedKey];
            return undefined;
          };

          const readValue = (feature: any, key: string): any => {
            if (!feature) return undefined;
            if (typeof feature.get === 'function') {
              const direct = feature.get(key);
              if (direct != null) return direct;
            }
            const props = typeof feature.getProperties === 'function' ? feature.getProperties() : undefined;
            const fromProps = findInObject(props as Record<string, any>, key);
            if (fromProps != null) return fromProps;
            const metadata = props && typeof props.metadata === 'object' ? props.metadata : undefined;
            return findInObject(metadata as Record<string, any>, key);
          };

          const pickText = (feature: any, keys: string[]): string => {
            for (const key of keys) {
              const value = readValue(feature, key);
              if (value == null) continue;
              if (Array.isArray(value)) {
                const joined = value
                  .map((item) => (item == null ? '' : String(item).trim()))
                  .filter((item) => item.length > 0);
                if (joined.length) return joined.join(', ');
                continue;
              }
              const text = String(value).trim();
              if (text) return text;
            }
            return '';
          };

          const geomForLabel: any = featureForLabel?.getGeometry?.();
          const geomType = geomForLabel?.getType?.();

          let label = '';

          if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
            label = pickText(featureForLabel, ['nama', 'NAMA', 'name', 'NAMOBJ', 'label', 'jenis', 'type', 'tipe', 'judul', 'title']);
            if (!label) label = 'Fungsional';
          } else if (geomType === 'Point' || geomType === 'MultiPoint') {
            label = pickText(featureForLabel, ['nama', 'NAMA', 'name', 'NAMOBJ', 'nama_di', 'NAMA_DI', 'judul', 'title']);
          } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
            const noRuasValue = pickText(featureForLabel, ['no_ruas', 'NO_RUAS']);
            label =
              pickText(featureForLabel, ['nama', 'NAMA', 'name', 'NAMOBJ']) ||
              (noRuasValue ? `Ruas ${noRuasValue}` : '') ||
              pickText(featureForLabel, ['no_saluran', 'NO_SALURAN']);
          }

          if (!label) {
            const noRuasValue = pickText(featureForLabel, ['no_ruas', 'NO_RUAS']);
            label =
              pickText(featureForLabel, ['NAMOBJ', 'name', 'nama']) ||
              (noRuasValue ? `Ruas ${noRuasValue}` : '') ||
              pickText(featureForLabel, ['no_saluran', 'NO_SALURAN', 'k_di', 'K_DI']) ||
              'Feature';
          }

          tooltipRef.current.innerText = label;
          overlayRef.current.setPosition(evt.coordinate);
        }
      } else {
        overlayRef.current?.setPosition(undefined);
        currentFeature = null;
      }
    });

    // Click popup (tampilkan kolom sesuai tipe geometri)
    map.on('singleclick', (evt) => {
      let selected: any = null;
      map.forEachFeatureAtPixel(evt.pixel, (f) => { selected = f; return true; });
      if (!selected) { popupOverlayRef.current?.setPosition(undefined); return; }

      // Support cluster feature
      const members: any[] = selected.get && selected.get('features');
      if (Array.isArray(members)) {
        if (members.length > 1) {
          // Zoom in to help disaggregate cluster
          const view = map.getView();
          const current = view.getZoom() || 0;
          view.setZoom(current + 1);
          return;
        }
        selected = members[0];
      }

      const geom: any = selected.getGeometry?.();
      const t = geom?.getType?.();

      if (!popupOverlayRef.current || !popupRef.current) return;
      const el = popupRef.current;
      el.textContent = '';

      const propsRaw = (selected.getProperties ? (selected.getProperties() as Record<string, any>) : {}) || {};
      const props = { ...propsRaw } as Record<string, any>;
      const metadata: Record<string, any> =
        propsRaw && typeof propsRaw === 'object' && propsRaw.metadata && typeof propsRaw.metadata === 'object'
          ? (propsRaw.metadata as Record<string, any>)
          : {};

      delete props.metadata;
      if ('geometry' in props) delete props.geometry;

      const formatNumber = (value: number, digits?: number): string => {
        const maximumFractionDigits = typeof digits === 'number' ? digits : Number.isInteger(value) ? 0 : 2;
        return new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(value);
      };

      const formatDisplay = (value: any, digits?: number): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
          if (!Number.isFinite(value)) return '';
          return formatNumber(value, digits);
        }
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (!trimmed) return '';
          const numericMatch = /^-?\d+(?:[.,]\d+)?$/.test(trimmed);
          if (numericMatch) {
            const normalized = Number(trimmed.replace(',', '.'));
            if (!Number.isNaN(normalized)) {
              const inferredDigits = typeof digits === 'number'
                ? digits
                : trimmed.includes('.') || trimmed.includes(',')
                  ? Math.min(2, (trimmed.split(/[.,]/)[1] || '').length)
                  : 0;
              return formatNumber(normalized, inferredDigits);
            }
          }
          return trimmed;
        }
        if (typeof value === 'boolean') {
          return value ? 'Ya' : 'Tidak';
        }
        if (Array.isArray(value)) {
          const joined = value
            .map((item) => formatDisplay(item, digits))
            .filter((item) => item && item.length > 0);
          return Array.from(new Set(joined)).join(', ');
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'object') {
          const entries = Object.entries(value as Record<string, any>);
          const rendered = entries
            .map(([, v]) => formatDisplay(v, digits))
            .filter((item) => item && item.length > 0);
          return rendered.join(', ');
        }
        return String(value);
      };

      const findRawValue = (keys: string[]): any => {
        for (const key of keys) {
          for (const source of [props, metadata]) {
            if (!source || typeof source !== 'object') continue;
            if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
            const actualKey = Object.keys(source).find((existing) => existing.toLowerCase() === key.toLowerCase());
            if (actualKey) return source[actualKey];
          }
        }
        return undefined;
      };

      const getDisplayValue = (keys: string[], digits?: number): string => {
        const raw = findRawValue(keys);
        return formatDisplay(raw, digits);
      };

      const rows: Array<[string, string]> = [];

      let popupTitle = 'Feature';
      const isLine = t === 'LineString' || t === 'MultiLineString';
      const isPoint = t === 'Point' || t === 'MultiPoint';
      const isPolygon = t === 'Polygon' || t === 'MultiPolygon';

      if (isLine) {
        popupTitle = 'Saluran';
        const noRuasRaw = findRawValue(['no_ruas', 'NO_RUAS', 'ruas_id']);
        const noRuas = formatDisplay(noRuasRaw);
        rows.push(['No Ruas', noRuas ? `Ruas ${noRuas}` : 'Ruas -']);

        const saluranName = getDisplayValue(['nama', 'NAMA', 'saluran', 'SALURAN', 'NAMOBJ']);
        rows.push(['Saluran', saluranName || '-']);
      } else if (isPoint) {
        popupTitle = 'Bangunan';
        const nama = getDisplayValue(['nama', 'NAMA', 'NAMOBJ', 'n_di', 'NAMA_DI']);
        rows.push(['Nama', nama || '-']);

        const nomen = getDisplayValue(['nomenklatu', 'NOMENKLATU', 'nomenklatur']);
        rows.push(['Nomenklatur', nomen || '-']);
      } else if (isPolygon) {
        popupTitle = 'Fungsional';
        const luas = getDisplayValue(['LUAS_HA', 'luas_ha'], 2);
        rows.push(['Luas', luas || '-']);

        const tahunRaw = findRawValue(['Thn_Dat', 'tahun_data', 'TAHUN']);
        const tahun = tahunRaw === null || tahunRaw === undefined ? '' : String(tahunRaw).trim();
        rows.push(['Tahun Data', tahun || '-']);
      } else {
        popupTitle = 'Feature';
        const name = getDisplayValue(['nama', 'NAMA', 'NAMOBJ']);
        if (name) rows.push(['Nama', name]);
        const description = getDisplayValue(['keterangan', 'KETERANGAN', 'deskripsi', 'DESKRIPSI']);
        if (description) rows.push(['Keterangan', description]);
      }

      const titleDiv = document.createElement('div');
      titleDiv.className = 'title';
      titleDiv.textContent = popupTitle;
      el.appendChild(titleDiv);

      if (rows.length) {
        const table = document.createElement('table');
        table.className = 'popup-table';
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        rows.forEach(([label, value]) => {
          const tr = document.createElement('tr');
          const labelTd = document.createElement('td');
          labelTd.className = 'label';
          labelTd.textContent = label;
          tr.appendChild(labelTd);

          const valueTd = document.createElement('td');
          valueTd.className = 'value';
          valueTd.textContent = value && value.length ? value : '-';
          tr.appendChild(valueTd);

          tbody.appendChild(tr);
        });

        el.appendChild(table);
      } else {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Data atribut tidak tersedia';
        el.appendChild(empty);
      }

      const collectCandidates = (...inputs: any[]): string[] => {
        const results: string[] = [];
        for (const input of inputs) {
          if (!input) continue;
          if (Array.isArray(input)) {
            for (const entry of input) {
              if (entry == null) continue;
              const value = String(entry).trim();
              if (value) results.push(value);
            }
          } else if (typeof input === 'string') {
            const parts = input.split(/[;,\n]/);
            for (const part of parts) {
              const value = part.trim();
              if (value) results.push(value);
            }
          }
        }
        return results;
      };

      const candidatePhotos = collectCandidates(
        selected.get('img_urls'),
        selected.get('url_imgs'),
        props.img_urls,
        props.url_imgs,
        props.URL_IMGS,
        metadata?.img_urls,
        metadata?.url_imgs
      );

      const resolveUrl = (raw: string): string | null => {
        if (!raw) return null;
        if (/^https?:\/\//i.test(raw)) return raw;

        const diCode = (
          props.k_di ||
          props.K_DI ||
          props.kdi ||
          props.kode_di ||
          props.KODE_DI ||
          metadata?.k_di ||
          metadata?.K_DI ||
          metadata?.kdi ||
          metadata?.kode_di ||
          activeKdi ||
          ''
        )
          .toString()
          .trim();
        if (!diCode) return null;

        let folder = (
          props.no_saluran ||
          props.NO_SALURAN ||
          props.noSaluran ||
          metadata?.no_saluran ||
          metadata?.NO_SALURAN ||
          metadata?.noSaluran ||
          metadata?.saluran_folder ||
          ''
        )
          .toString()
          .trim();
        folder = folder.replace(/^\/+|\/+$|\s+$/g, '');
        if (/^SAL\d+$/i.test(folder)) {
          folder = folder.slice(3);
        }

        const fileName = raw.replace(/^\/+/, '').trim();
        if (!fileName) return null;

        const pathParts = [diCode];
        if (folder) pathParts.push(folder);
        pathParts.push(fileName);
        const storagePath = pathParts.join('/');

        const { data: publicData } = supabase.storage.from('images').getPublicUrl(storagePath);
        if (publicData?.publicUrl) return publicData.publicUrl;

        if (supabaseUrl) {
          const encodedPath = pathParts.map((part) => encodeURIComponent(part)).join('/');
          return `${supabaseUrl}/storage/v1/object/public/images/${encodedPath}`;
        }

        return null;
      };

      const allPhotos = Array.from(
        new Set(
          candidatePhotos
            .map((raw) => resolveUrl(raw))
            .filter((url): url is string => Boolean(url))
        )
      );

      if (allPhotos.length) {
        const gallery = document.createElement('div');
        gallery.style.display = 'flex';
        gallery.style.flexDirection = 'column';
        gallery.style.gap = '12px';
        gallery.style.marginTop = '12px';
        gallery.style.width = '100%';
        allPhotos.slice(0, 6).forEach((url) => {
          const imgWrapper = document.createElement('div');
          imgWrapper.style.position = 'relative';
          imgWrapper.style.cursor = 'pointer';
          imgWrapper.style.width = '100%';

          const img = document.createElement('img');
          img.src = url;
          img.alt = 'foto';
          img.style.display = 'block';
          img.style.width = '100%';
          img.style.height = 'auto';
          img.style.maxHeight = '320px';
          img.style.borderRadius = '10px';
          img.style.border = '1px solid #ddd';

          img.onerror = () => {
            img.style.display = 'none';
          };

          img.onclick = (e) => {
            e.stopPropagation();
            setModalImgSrc(url);
            setIsModalOpen(true);
          };

          imgWrapper.appendChild(img);
          gallery.appendChild(imgWrapper);
        });
        el.appendChild(gallery);
      }

        popupOverlayRef.current.setPosition(evt.coordinate);
      });

      return () => {
        map.setTarget(undefined as any);
        mapRef.current = null;
        overlayRef.current = null;
        popupOverlayRef.current = null;
        if (tooltipRef.current) {
          tooltipRef.current.remove();
          tooltipRef.current = null;
        }
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      };
    }, [kecamatanVisible, activeKdi, supabase, supabaseUrl]);

  // UI handlers
  const setBasemap = (name: string) => {
    googleHybridRef.current?.setVisible(name === 'googleHybrid');
    googleSatRef.current?.setVisible(name === 'googleSat');
    osmRef.current?.setVisible(name === 'osm');
    cartoDBRef.current?.setVisible(name === 'carto');
    esriSatRef.current?.setVisible(name === 'sat');
  };

  const togglePoints = (checked: boolean) => {
    storagePointsLayerRef.current?.setVisible(checked);
    setPointsVisible(checked);
  };
  const toggleLines = (checked: boolean) => {
    storageLinesLayerRef.current?.setVisible(checked);
    setLinesVisible(checked);
  };
  const togglePolygons = (checked: boolean) => {
    storagePolygonsLayerRef.current?.setVisible(checked);
    setPolygonsVisible(checked);
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
  const fitData = () => {
    const map = mapRef.current;
    if (!map) return;

    const computed = createEmptyExtent();

    const appendSourceExtent = (source: any) => {
      if (!source) return;

      if (source instanceof ClusterSource) {
        const inner = source.getSource?.();
        if (inner && inner !== source) appendSourceExtent(inner);
      }

      if (!(source instanceof VectorSource)) {
        const inner = typeof source.getSource === 'function' ? source.getSource() : null;
        if (inner && inner !== source) appendSourceExtent(inner);
        return;
      }

      const extent = source.getExtent ? source.getExtent() : undefined;
      if (extent && !isExtentEmpty(extent)) {
        extendExtent(computed, extent);
      }
    };

    map.getLayers().forEach((layer: any) => {
      if (typeof layer?.getVisible === 'function' && !layer.getVisible()) return;
      const source = layer?.getSource?.();
      appendSourceExtent(source);
    });

    if (!isExtentEmpty(computed)) {
      dataExtentRef.current = computed.slice() as any;
      map.getView().fit(computed, { padding: [50, 50, 50, 50], duration: 400 });
      return;
    }

    const ext = dataExtentRef.current;
    if (ext && !isExtentEmpty(ext)) {
      map.getView().fit(ext, { padding: [50, 50, 50, 50], duration: 400 });
      return;
    }

    map.getView().animate({ center: fromLonLat(centerLonLat), zoom: 11, duration: 400 });
  };

  const toggleKecamatan = (checked: boolean) => {
    kecamatanLayerRef.current?.setVisible(checked);
    setKecamatanVisible(checked);
  };
  const collapsePanel = () => setIsPanelCollapsed(true);
  const expandPanel = () => setIsPanelCollapsed(false);

  const diInfoRows = useMemo<Array<[string, string]>>(() => {
    if (!diInfo) return [];
    const metadata = normalizeMetadata(diInfo.metadata);
    const metaKeys = Object.keys(metadata);
    const readMeta = (...keys: string[]) => {
      for (const key of keys) {
        if (!key) continue;
        if (Object.prototype.hasOwnProperty.call(metadata, key) && metadata[key] != null) {
          return metadata[key];
        }
        const lower = key.toLowerCase();
        const matched = metaKeys.find((existing) => existing.toLowerCase() === lower);
        if (matched && metadata[matched] != null) {
          return metadata[matched];
        }
      }
      return undefined;
    };
    const normalizeString = (value: any): string => {
      if (value == null) return '';
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      return '';
    };
    const pickStringFromValue = (value: any, depth = 0): string => {
      if (value == null || depth > 5) return '';
      if (Array.isArray(value)) {
        for (const entry of value) {
          const str = pickStringFromValue(entry, depth + 1);
          if (str) return str;
        }
        return '';
      }
      if (typeof value === 'object') {
        for (const entry of Object.values(value)) {
          const str = pickStringFromValue(entry, depth + 1);
          if (str) return str;
        }
        return '';
      }
      return normalizeString(value);
    };
    const pickString = (...values: any[]): string => {
      for (const value of values) {
        const result = pickStringFromValue(value);
        if (result) return result;
      }
      return '';
    };
    const parseNumber = (value: any): number | null => {
      if (value == null) return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const sanitized = trimmed.replace(/[^\d,.\-]/g, '');
        const lastComma = sanitized.lastIndexOf(',');
        const lastDot = sanitized.lastIndexOf('.');
        let normalized = sanitized;
        if (lastComma > -1 && lastComma > lastDot) {
          normalized = sanitized.replace(/\./g, '').replace(',', '.');
        } else {
          normalized = sanitized.replace(/,/g, '');
        }
        if (!normalized) return null;
        const num = Number(normalized);
        return Number.isNaN(num) ? null : num;
      }
      return null;
    };
    const pickNumber = (...values: any[]): number | null => {
      for (const value of values) {
        if (value == null) continue;
        if (Array.isArray(value)) {
          for (const entry of value) {
            const parsed = parseNumber(entry);
            if (parsed != null) return parsed;
          }
          continue;
        }
        const parsed = parseNumber(value);
        if (parsed != null) return parsed;
      }
      return null;
    };
    const formatNumber = (value: number): string =>
      new Intl.NumberFormat('id-ID', { maximumFractionDigits: Math.abs(value % 1) < 1e-6 ? 0 : 2 }).format(value);

    const metadataUptdCandidate = findMetadataValueBySubstring(metadata, 'uptd');
    const code = pickString(diInfo.k_di, readMeta('k_di', 'kode_irigasi', 'kode_di'));
    const name = pickString(diInfo.n_di, readMeta('nama_di', 'n_di', 'nama'));
    const uptd = pickString(
      diInfo.uptd,
      readMeta('uptd', 'nama_uptd', 'uptd_name', 'unit_pengelola', 'unit_uptd', 'nama_unit'),
      metadataUptdCandidate
    );
    const kecamatan = pickString(diInfo.kecamatan, readMeta('kecamatan'));
    const desa = pickString(diInfo.desa_kel, readMeta('desa_kel', 'desa', 'desa_kelurahan'));
    const sumberAir = pickString(diInfo.sumber_air, readMeta('sumber_air', 'sumber'));
    const luasVal = pickNumber(readMeta('luas_fungsional', 'luas_fungsi', 'luas', 'luas_ha'), diInfo.luas_ha);
    const luasText = luasVal != null ? `${formatNumber(luasVal)} ha` : '-';

    return [
      ['Kode Irigasi', code || '-'],
      ['Nama DI', name || '-'],
      ['UPTD', uptd || '-'],
      ['Kecamatan', kecamatan || '-'],
      ['Desa', desa || '-'],
      ['Sumber Air', sumberAir || '-'],
      ['Luas fungsional', luasText],
    ];
  }, [diInfo]);

  const goHome = () => { window.location.href = '/'; };
  const goDashboard = () => { window.location.href = '/dashboard'; };
  const closeModal = () => { setIsModalOpen(false); setModalImgSrc(null); };

  return (
    <main data-variant={variant}>
      {/* Map container */}
      <div ref={mapDivRef} className="map-container" />
      {/* Floating controls (custom UI) */}
      <div className="float-controls">
        <button onClick={goHome} className="btn" title="Home">🏠</button>
        <button onClick={goDashboard} className="btn" title="Dashboard">📊</button>
        <button onClick={fitData} className="btn" title="Fit Data">🗺️</button>
        <button onClick={zoomIn} className="btn" title="Zoom In">＋</button>
        <button onClick={zoomOut} className="btn" title="Zoom Out">－</button>
      </div>

      {/* Floating layer panel */}
      {isPanelCollapsed ? (
        <button
          type="button"
          className="float-panel-toggle"
          style={{ zIndex: 2 }}
          onClick={expandPanel}
          aria-label="Tampilkan panel layer OpenLayers"
          title="Buka panel layer"
        >
          <span className="float-panel-toggle__logo" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.25)" />
              <circle cx="20" cy="20" r="13" fill="none" stroke="#ecfeff" strokeWidth="2.2" opacity="0.75" />
              <circle cx="18" cy="18" r="7" fill="rgba(255,255,255,0.9)" opacity="0.65" />
              <path d="M12 22c2.3 4.4 7 7 12 7 4.1 0 7.7-1.9 10-5" stroke="#ffffff" strokeWidth="2" opacity="0.9" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          <span className="float-panel-toggle__text">OpenLayers</span>
        </button>
      ) : (
        <div className="float-panel card float-card scroll-silent" style={{ zIndex: 2 }}>
            <div className="panel-header">
              <button
                type="button"
                className="panel-collapse-btn"
                onClick={collapsePanel}
                aria-label="Sembunyikan panel layer"
                title="Sembunyikan panel"
              >
                <span className="panel-collapse-icon" aria-hidden="true">
                  &gt;
                </span>
              </button>
              <div className="panel-header-body">
                <span className="badge badge--right">OpenLayers</span>
              </div>
            </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, margin: '8px 0 6px' }}>Basemap</div>
            <label><input type="radio" name="basemap" onChange={() => setBasemap('googleHybrid')} /> Google Satellite Hybrid</label><br />
            <label><input type="radio" name="basemap" onChange={() => setBasemap('googleSat')} /> Google Satellite</label><br />
            <label><input type="radio" name="basemap" onChange={() => setBasemap('osm')} /> OpenStreetMap</label><br />
            <label><input type="radio" name="basemap" defaultChecked onChange={() => setBasemap('carto')} /> CartoDB Light</label><br />
            <label><input type="radio" name="basemap" onChange={() => setBasemap('sat')} /> ESRI Satellite</label>
          </div>
          <div style={{ fontWeight: 600, margin: '12px 0 6px' }}>Operational Layers</div>
          {!activeKdi && (
            <>
              <label><input type="checkbox" checked={kecamatanVisible} onChange={(e) => toggleKecamatan((e.target as HTMLInputElement).checked)} /> Kecamatan Boundaries</label><br />
            </>
          )}
          <div style={{ fontWeight: 600, margin: '12px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Daerah Irigasi</span>
            <span className="badge" title="Jumlah file yang dimuat">{storageCounts.files}</span>
          </div>
          <div className="layer-scroll scroll-silent">
            {loadingStorage ? <div>Memuat GeoJSON…</div> : null}
            {storageError ? <div style={{ color: 'crimson' }}>{storageError}</div> : null}
            {!loadingStorage && !storageError && storageCounts.files === 0 ? (
              <div style={{ color: '#666' }}>Tidak ada file</div>
            ) : null}
            <label style={{ display: 'block' }}>
              <input type="checkbox" checked={polygonsVisible} onChange={(e) => togglePolygons((e.target as HTMLInputElement).checked)} /> Fungsional ({storageCounts.polygons})
            </label>
            <label style={{ display: 'block' }}>
              <input type="checkbox" checked={linesVisible} onChange={(e) => toggleLines((e.target as HTMLInputElement).checked)} /> Saluran ({storageCounts.lines})
            </label>
            <label style={{ display: 'block' }}>
              <input type="checkbox" checked={pointsVisible} onChange={(e) => togglePoints((e.target as HTMLInputElement).checked)} /> Bangunan ({storageCounts.points})
            </label>
          </div>
          <div style={{ marginTop: 12 }} className="legend" />
          {activeKdi ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <strong>Data DI</strong>
                <span className="badge" title="Kode irigasi aktif">{activeKdi}</span>
              </div>
              {diInfoLoading && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Memuat detail...</div>}
              {diInfoError && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>{diInfoError}</div>}
              {!diInfoLoading && !diInfoError && diInfoRows.length > 0 && (
                <table className="detail-table" style={{ marginTop: 6 }}>
                  <tbody>
                    {diInfoRows.map(([label, value]) => (
                      <tr key={label}>
                        <td className="label">{label}</td>
                        <td className="value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!diInfoLoading && !diInfoError && diInfoRows.length === 0 && (
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Data belum tersedia.</div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Image modal */}
      <div
        className={`modal ${isModalOpen ? 'open' : ''}`}
        aria-hidden={!isModalOpen}
        onClick={closeModal}
        style={{ cursor: 'pointer' }}
      >
        {isModalOpen && modalImgSrc ? (
          <img
            src={modalImgSrc}
            alt="photo"
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'default' }}
          />
        ) : null}
      </div>
    </main>
  );
}
