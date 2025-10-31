"use client";
import { useEffect, useRef, useState } from 'react';
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

type SummaryRow = {
  profil: string;
  keterangan: string;
  jumlah: string;
  satuan: string;
};

const formatNumeric = (value: number | null | undefined, fractionDigits = 0) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value));
};

const toDisplayString = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  const text = String(value).trim();
  return text.length ? text : '—';
};

const centerLonLat: [number, number] = [98.69870163855006, 3.5460256535269954];

export default function MapPage() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const mapRef = useRef<Map | null>(null);
  const dataExtentRef = useRef<[number, number, number, number] | null>(null);

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
  const [summaryRows, setSummaryRows] = useState<SummaryRow[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [activeDiName, setActiveDiName] = useState<string>('');

  const searchParams = useSearchParams();
  // Terima baik ?di= maupun ?k_di= untuk fleksibilitas dari dashboard
  const kdi = (searchParams.get('di') || searchParams.get('k_di') || '').trim();

  // Jika masuk dari tombol Map (kdi ada), layer kecamatan default disembunyikan
  const [kecamatanVisible, setKecamatanVisible] = useState<boolean>(!(kdi && kdi.length > 0));

  useEffect(() => {
    if (!mapDivRef.current) return;

    if (!kdi) {
      setSummaryRows(null);
      setSummaryError(null);
      setSummaryLoading(false);
      setActiveDiName('');
    } else {
      setSummaryLoading(true);
      setSummaryError(null);
      setSummaryRows(null);
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

    const kecamatanLayer = new VectorLayer({ source: new VectorSource(), style: kecamatanStyle, visible: kecamatanVisible, zIndex: 10 });
    kecamatanLayerRef.current = kecamatanLayer;
    map.addLayer(kecamatanLayer);

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
        // Always load boundary as context
        const res = await fetch('/data/batas_kecamatan.json');
        if (res.ok) {
          const batas = await res.json();
          const fmt = new GeoJSON();
          const collection = Array.isArray(batas) ? { type: 'FeatureCollection', features: batas } : batas;
          const features = fmt.readFeatures(collection, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
          kecamatanLayer.getSource()?.clear();
          kecamatanLayer.getSource()?.addFeatures(features);
          // Fit boundary only jika tidak ada kdi (mode konteks umum)
          if (!kdi && features.length > 0) {
            const ext = kecamatanLayer.getSource()?.getExtent();
            if (ext) {
              dataExtentRef.current = ext.slice() as any;
              map.getView().fit(ext, { padding: [50, 50, 50, 50], duration: 500 });
            }
          }
        }

        const supabase = createClient();
        // detect admin role
        try {
          const { data } = await supabase.auth.getUser();
          setIsAdmin(((data.user?.app_metadata as any)?.role) === 'admin');
        } catch {}

        // 1) Load GeoJSON paths via manifest (CDN) with graceful fallbacks
        try {
          setLoadingStorage(true);
          setStorageError(null);
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

            // Fallback to server endpoint (will also create/upload manifest)
            try {
              const r = await fetch('/api/geojson/manifest', { cache: 'no-cache' });
              if (r.ok) {
                const m = await r.json();
                if (Array.isArray(m)) return m;
                if (Array.isArray(m?.files)) return m.files as string[];
              }
            } catch {}

            // Final fallback: list recursively (client-side)
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
          if (kdi) {
            const codeLower = kdi.toLowerCase();
            // Muat hanya berkas di folder root yang PERSIS sama dengan kode DI
            const byExactRoot = allFiles.filter((p) => ((p.split('/')[0] || '').toLowerCase()) === codeLower);
            if (byExactRoot.length) {
              targetFiles = byExactRoot;
            } else {
              // Fallback aman: prefix ketat
              targetFiles = allFiles.filter((p) => p.startsWith(`${kdi}/`));
            }
          }
          const processFile = async (path: string) => {
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
                    setStorageCounts((prev) => ({ points: prev.points + cPoints, lines: prev.lines + cLines, polygons: prev.polygons + cPolys, files: prev.files + 1 }));
                    return;
                  }
                }
              }
            } catch {}

            // Fallback to SDK download
            const { data: blob } = await supabase.storage.from('geojson').download(path);
            if (!blob) return;
            const text = await blob.text();
            let json: any;
            try { json = JSON.parse(text); } catch { return; }
            const fmt = new GeoJSON();
            const projection = map.getView().getProjection();
            const features = json?.type === 'FeatureCollection'
              ? fmt.readFeatures(json, { dataProjection: 'EPSG:4326', featureProjection: projection })
              : json?.type === 'Feature'
                ? [fmt.readFeature(json, { dataProjection: 'EPSG:4326', featureProjection: projection })]
                : [];
            if (!features.length) return;
            let cPoints = 0, cLines = 0, cPolys = 0;
            for (const f of features) {
              const geom: any = f.getGeometry?.();
              const t = geom?.getType?.();
              if (t === 'Point' || t === 'MultiPoint') { pointsSrc.addFeature(f); cPoints++; }
              else if (t === 'LineString' || t === 'MultiLineString') { linesSrc.addFeature(f); cLines++; }
              else if (t === 'Polygon' || t === 'MultiPolygon') { polygonsSrc.addFeature(f); cPolys++; }
            }
            setStorageCounts((prev) => ({ points: prev.points + cPoints, lines: prev.lines + cLines, polygons: prev.polygons + cPolys, files: prev.files + 1 }));
          };

          // Limit concurrency to avoid blocking UI
          let index = 0;
          const concurrency = 8; // slightly higher; CDN helps
          const workers = Array.from({ length: concurrency }, async () => {
            while (index < targetFiles.length) {
              const current = targetFiles[index++];
              try { await processFile(current); } catch {}
            }
          });
          await Promise.all(workers);
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
            // Fit jika kdi ada (prioritaskan data DI yang termuat dari storage)
            if (kdi) map.getView().fit(combined, { padding: [50, 50, 50, 50], duration: 500 });
          }
        } catch (err: any) {
          setStorageError(err?.message || 'Gagal memuat GeoJSON dari Storage');
        } finally {
          setLoadingStorage(false);
        }

        // 2) Jika k_di/di disediakan, muat layer operasional terkait dari DB
        if (kdi) {
          try {
            const { data: di, error: diError } = await supabase
              .from('daerah_irigasi')
              .select('id,k_di,n_di,luas_ha,jumlah_saluran,jumlah_bangunan,panjang_sp,panjang_ss,kecamatan,desa_kel,sumber_air,tahun_data,kondisi,metadata')
              .eq('k_di', kdi)
              .maybeSingle();
            if (diError) throw diError;

            if (!di?.id) {
              setActiveDiName('');
              setSummaryRows([]);
              setSummaryError('Data daerah irigasi tidak ditemukan');
            } else {
              setActiveDiName(di.n_di || '');

              // Load saluran, bangunan, fungsional
              const [{ data: saluran }, { data: bangunan }, { data: fungsional }] = await Promise.all([
                supabase.from('saluran').select('id,no_saluran,geojson,jenis,panjang_total').eq('daerah_irigasi_id', di.id),
                supabase.from('bangunan').select('id,geojson').eq('daerah_irigasi_id', di.id),
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

              // Build ruas layer from DB rows dan kumpulkan ringkasan
              let ruasFeatures: any[] = [];
              let ruasList: any[] = [];
              if (saluran && saluran.length) {
                const salIds = saluran.map((s: any) => s.id).filter(Boolean);
                if (salIds.length) {
                  const { data: ruas, error: ruasError } = await supabase
                    .from('ruas')
                    .select('id,no_ruas,urutan,panjang,geojson,foto_urls,metadata,saluran_id')
                    .in('saluran_id', salIds);
                  if (ruasError) throw ruasError;
                  const fmt = new GeoJSON();
                  ruasList = ruas || [];
                  for (const r of ruasList) {
                    if (!r?.geojson) continue;
                    const featureGeo = { ...r.geojson, properties: { ...(r.geojson.properties || {}), foto_urls: r.foto_urls || [], ruas_id: r.id, metadata: r.metadata || {} } };
                    const f = fmt.readFeature(featureGeo, { dataProjection: 'EPSG:4326', featureProjection: map.getView().getProjection() });
                    ruasFeatures.push(f);
                  }
                }
              }

              if (ruasFeatures.length) {
                const src = new VectorSource();
                src.addFeatures(ruasFeatures);
                const layer = new VectorLayer({ source: src, zIndex: 20, style: new Style({ stroke: new Stroke({ color: '#ff7f0e', width: 5 }) }) });
                map.addLayer(layer);
                const extent = src.getExtent();
                if (extent) {
                  const combined = dataExtentRef.current ? dataExtentRef.current.slice() as any : createEmptyExtent();
                  extendExtent(combined, extent);
                  dataExtentRef.current = combined;
                  map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
                }
              }

              // Hitung ringkasan untuk tabel profil
              const saluranCount = saluran?.length ?? 0;
              const bangunanCount = di.jumlah_bangunan ?? (bangunan?.length ?? 0);
              const ruasCount = ruasList.length;
              const totalPanjangRuas = ruasList.reduce((sum: number, r: any) => sum + (Number(r?.panjang) || 0), 0);
              const panjangByJenis = { primer: 0, sekunder: 0, tersier: 0, lainnya: 0 };
              (saluran || []).forEach((item: any) => {
                const jenis = String(item?.jenis || '').toLowerCase();
                const panjang = Number(item?.panjang_total) || 0;
                if (jenis === 'primer') panjangByJenis.primer += panjang;
                else if (jenis === 'sekunder') panjangByJenis.sekunder += panjang;
                else if (jenis === 'tersier') panjangByJenis.tersier += panjang;
                else panjangByJenis.lainnya += panjang;
              });

              const computedValues: Record<string, any> = {
                k_di: di.k_di,
                n_di: di.n_di,
                luas_ha: Number(di.luas_ha ?? 0),
                jumlah_saluran: di.jumlah_saluran ?? saluranCount,
                jumlah_bangunan: bangunanCount,
                jumlah_ruas: ruasCount,
                total_panjang_ruas: totalPanjangRuas,
                panjang_primer: panjangByJenis.primer,
                panjang_sekunder: panjangByJenis.sekunder,
                panjang_tersier: panjangByJenis.tersier,
                panjang_lainnya: panjangByJenis.lainnya,
                panjang_sp: Number(di.panjang_sp ?? 0),
                panjang_ss: Number(di.panjang_ss ?? 0),
                tahun_data: di.tahun_data,
                kondisi: di.kondisi,
                kecamatan: di.kecamatan,
                desa_kel: di.desa_kel,
                sumber_air: di.sumber_air,
              };

              const metadataRows = Array.isArray((di.metadata as any)?.profil_table) ? (di.metadata as any).profil_table : null;
              const rows: SummaryRow[] = [];
              const pushRow = (
                profil: string,
                keterangan: string,
                value: number | string | null | undefined,
                satuan = '',
                fractionDigits?: number
              ) => {
                let jumlahText: string;
                if (typeof value === 'number' && !Number.isNaN(value)) {
                  const digits = fractionDigits ?? (Number.isInteger(value) ? 0 : 2);
                  jumlahText = formatNumeric(value, digits);
                } else {
                  jumlahText = toDisplayString(value);
                }
                rows.push({
                  profil: profil || '—',
                  keterangan: keterangan ? String(keterangan) : '—',
                  jumlah: jumlahText,
                  satuan: satuan || '',
                });
              };

              if (metadataRows?.length) {
                metadataRows.forEach((row: any, idx: number) => {
                  const profilLabel = toDisplayString(row?.profil);
                  const keteranganLabel = toDisplayString(row?.keterangan);
                  let value = row?.jumlah;
                  if (row?.valueKey && computedValues[row.valueKey] !== undefined) {
                    value = computedValues[row.valueKey];
                  }
                  if (typeof value === 'string' && value.startsWith('auto:')) {
                    const key = value.replace('auto:', '');
                    if (computedValues[key] !== undefined) value = computedValues[key];
                  }
                  const digits = typeof row?.fractionDigits === 'number' ? row.fractionDigits : undefined;
                  pushRow(
                    profilLabel !== '—' ? profilLabel : `Profil ${idx + 1}`,
                    keteranganLabel !== '—' ? keteranganLabel : '—',
                    value,
                    row?.satuan,
                    digits
                  );
                });
              } else {
                pushRow('Kode DI', di.n_di || '—', di.k_di);
                pushRow('Luas Areal', 'Luas layanan', Number(di.luas_ha ?? 0), 'ha', 2);
                pushRow('Panjang Saluran Primer', 'Akumulasi saluran primer', panjangByJenis.primer || Number(di.panjang_sp ?? 0), 'm');
                pushRow('Panjang Saluran Sekunder', 'Akumulasi saluran sekunder', panjangByJenis.sekunder || Number(di.panjang_ss ?? 0), 'm');
                if (panjangByJenis.tersier > 0 || panjangByJenis.lainnya > 0) {
                  pushRow('Panjang Saluran Tersier', 'Akumulasi saluran tersier', panjangByJenis.tersier, 'm');
                }
                pushRow('Jumlah Saluran', 'Total saluran semua jenis', di.jumlah_saluran ?? saluranCount, 'unit');
                if (ruasCount) {
                  pushRow('Jumlah Ruas', 'Segmentasi saluran', ruasCount, 'unit');
                  pushRow('Total Panjang Ruas', 'Akumulasi panjang ruas', totalPanjangRuas, 'm');
                }
                pushRow('Jumlah Bangunan', 'Bangunan air', bangunanCount, 'unit');
                if (di.tahun_data) pushRow('Tahun Data', 'Sumber tahun data', di.tahun_data);
                if (di.kondisi) pushRow('Kondisi', 'Status operasional', di.kondisi);
              }

              setSummaryRows(rows);
              setSummaryError(null);
            }
          } catch (err: any) {
            setSummaryRows([]);
            setSummaryError(err?.message || 'Gagal memuat profil DI');
          } finally {
            setSummaryLoading(false);
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
          const label =
            hovered.get('NAMOBJ') ||
            hovered.get('name') ||
            hovered.get('no_ruas') ||
            hovered.get('no_saluran') ||
            hovered.get('k_di') ||
            'Feature';
          tooltipRef.current.innerText = String(label);
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

      const getProp = (keys: string[]): string => {
        const props = selected.getProperties ? selected.getProperties() : {};
        for (const k of keys) {
          if (k in props && props[k] != null && props[k] !== '') return String(props[k]);
          const found = Object.keys(props).find((p) => p.toLowerCase() === k.toLowerCase());
          if (found && props[found] != null && props[found] !== '') return String(props[found]);
        }
        return '';
      };

      if (!popupOverlayRef.current || !popupRef.current) return;
      const el = popupRef.current;
      el.textContent = '';
      const titleDiv = document.createElement('div');
      titleDiv.className = 'title';

      const row = (label: string, value: string) => {
        if (!value) return;
        const div = document.createElement('div');
        div.textContent = `${label}: ${value}`;
        el.appendChild(div);
      };

      if (t === 'LineString' || t === 'MultiLineString') {
        titleDiv.textContent = 'Saluran';
        el.appendChild(titleDiv);
        row('k_di', getProp(['k_di']));
        row('nama', getProp(['nama', 'NAMA']));
        row('panjang_sa', getProp(['panjang_sa', 'PANJANG_SA', 'panjang']));
      } else if (t === 'Point' || t === 'MultiPoint') {
        titleDiv.textContent = 'Bangunan';
        el.appendChild(titleDiv);
        row('n_di', getProp(['n_di', 'NAMA_DI']));
        row('k_di', getProp(['k_di', 'K_DI']));
        row('nama', getProp(['nama', 'NAMA']));
      } else if (t === 'Polygon' || t === 'MultiPolygon') {
        titleDiv.textContent = 'Fungsional';
        el.appendChild(titleDiv);
        row('NAMA_DI', getProp(['NAMA_DI', 'n_di']));
        row('LUAS_HA', getProp(['LUAS_HA', 'luas_ha']));
        row('Thn_Dat', getProp(['Thn_Dat', 'tahun_data']));
      } else {
        titleDiv.textContent = 'Feature';
        el.appendChild(titleDiv);
      }

      // Tampilkan foto jika tersedia (ruas)
      const photos: string[] = selected.get('foto_urls') || [];
      if (photos.length) {
        const gallery = document.createElement('div');
        gallery.style.display = 'flex';
        gallery.style.gap = '6px';
        gallery.style.marginTop = '6px';
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
        el.appendChild(gallery);
      }

      popupOverlayRef.current.setPosition(evt.coordinate);
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
    const map = mapRef.current; if (!map) return;

    // Rehitung extent dari semua layer vektor yang ada agar selalu selaras
    const computed = createEmptyExtent();
    map.getLayers().forEach((layer: any) => {
      const source = layer?.getSource?.();
      if (!source) return;

      let extent = source.getExtent ? source.getExtent() : undefined;
      if ((!extent || isExtentEmpty(extent)) && source.getSource) {
        const inner = source.getSource();
        extent = inner?.getExtent ? inner.getExtent() : extent;
      }

      if (extent && !isExtentEmpty(extent)) {
        extendExtent(computed, extent);
      }
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
        <button onClick={fitData} className="btn" title="Fit Data">🗺️</button>
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
          <label><input type="radio" name="basemap"  onChange={() => setBasemap('googleHybrid')} /> Google Satellite Hybrid</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('googleSat')} /> Google Satellite</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('osm')} /> OpenStreetMap</label><br />
          <label><input type="radio" name="basemap" defaultChecked onChange={() => setBasemap('carto')} /> CartoDB Light</label><br />
          <label><input type="radio" name="basemap" onChange={() => setBasemap('sat')} /> ESRI Satellite</label>
        </div>
        <div style={{ fontWeight: 600, margin: '12px 0 6px' }}>Operational Layers</div>
        {!kdi && (
          <>
            <label><input type="checkbox" checked={kecamatanVisible} onChange={(e) => toggleKecamatan((e.target as HTMLInputElement).checked)} /> Kecamatan Boundaries</label><br />
          </>
        )}
        <div style={{ fontWeight: 600, margin: '12px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Daerah Irigasi</span>
          <span className="badge" title="Jumlah file yang dimuat">{storageCounts.files}</span>
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', paddingRight: 6 }}>
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
      </div>

      {kdi ? (
        <div className="map-summary-panel card">
          <div className="map-summary-header">
            <div>
              <strong>{activeDiName || 'Profil DI'}</strong>
              <span className="map-summary-subtitle">Kode: {kdi}</span>
            </div>
          </div>
          <div className="map-summary-content">
            {summaryLoading ? (
              <div className="map-summary-loading">Memuat profil…</div>
            ) : summaryError ? (
              <div className="map-summary-error">{summaryError}</div>
            ) : summaryRows && summaryRows.length ? (
              <table className="map-summary-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Profil</th>
                    <th>Keterangan</th>
                    <th>Jumlah/Panjang</th>
                    <th>Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, idx) => (
                    <tr key={`${row.profil}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{row.profil}</td>
                      <td>{row.keterangan}</td>
                      <td>{row.jumlah}</td>
                      <td>{row.satuan || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="map-summary-empty">Data profil tidak tersedia.</div>
            )}
          </div>
        </div>
      ) : null}

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
