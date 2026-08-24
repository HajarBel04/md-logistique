import { useState, useRef, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

// Toujours utiliser le proxy (Vite en local → port 8000, Vercel en prod → Railway)
const GPS_API = '';

const STATUS_FILTERS = [
  'CLOSED 1','CLOSED 2','CLOSED 3','NOT IN 1','NOT IN 2','NOT IN 3',
  'SIG OBTAINED','DR RELEASED','REDIRECT','FUTURE','VOID ENTRY',
  'NO MONEY 1','NO MONEY 2','LEFT ARS TAG','NI1 ALT DEL',
];

/* ─── Badge distance GPS → adresse de livraison (même ligne) ─── */
function DistBadge({ distM }) {
  if (distM === null || distM === undefined) return <span className="text-slate-400">—</span>;
  const d = Number(distM);
  const fmt = d < 1000 ? `≈${Math.round(d)} m` : `≈${(d / 1000).toFixed(2)} km`;
  const title = 'Distance entre la position GPS du scan (Trigger 3) et l\'adresse de livraison de cette ligne.';
  if (d <=  10) return <span title={title} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 cursor-help">{fmt} ✓</span>;
  if (d <=  30) return <span title={title} className="rounded-full bg-green-100   px-2 py-0.5 text-xs font-bold text-green-700  cursor-help">{fmt}</span>;
  if (d <=  50) return <span title={title} className="rounded-full bg-yellow-100  px-2 py-0.5 text-xs font-bold text-yellow-800 cursor-help">{fmt}</span>;
  if (d <= 200) return <span title={title} className="rounded-full bg-orange-100  px-2 py-0.5 text-xs font-bold text-orange-800 cursor-help">{fmt}</span>;
  return         <span title={title} className="rounded-full bg-red-100     px-2 py-0.5 text-xs font-bold text-red-800    cursor-help">{fmt} !</span>;
}

/* ─── GPS Modal — Leaflet injecté via srcDoc ─────────────────────────── */
function GpsModal({ gps, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!gps) return null;
  const { lat, lon, label } = gps;
  const osmLink  = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`;
  const gmapLink = `https://www.google.com/maps?q=${lat},${lon}`;

  // Leaflet injecté directement dans l'iframe (srcDoc) — contourne les problèmes d'iframe OSM
  const mapDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lon}], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    L.marker([${lat}, ${lon}])
      .addTo(map)
      .bindPopup('<b>Position GPS</b><br>${String(label).replace(/'/g, "\\'")}')
      .openPopup();
  </script>
</body>
</html>`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">📍 Position GPS au scan</p>
            {label && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>}
            <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">{lat}, {lon}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Carte Leaflet */}
        <div className="mx-4 overflow-hidden rounded-xl" style={{ height: 300 }}>
          <iframe
            srcDoc={mapDoc}
            width="100%"
            height="300"
            style={{ border: 'none', display: 'block' }}
            title="Carte GPS"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 py-4">
          <a href={osmLink} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition">
            🗺 OpenStreetMap
          </a>
          <a href={gmapLink} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-green-50 dark:bg-green-900/30 px-4 py-2 text-xs font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 transition">
            📍 Google Maps
          </a>
          <span className="ml-auto flex items-center text-xs text-slate-400 italic">Trigger 3 GPS</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Composants utilitaires ─────────────────────────────────────────── */
function FileInput({ label, hint, value, onChange }) {
  const ref = useRef();
  return (
    <div
      className="flex cursor-pointer flex-col gap-1.5 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-orange-400 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-orange-500 dark:hover:bg-orange-500/10"
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".xlsx,.xls" className="sr-only"
        onChange={e => onChange(e.target.files?.[0] ?? null)} />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      {value
        ? <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{value.name}</span>
        : <span className="text-sm text-slate-400 dark:text-slate-500">{hint}</span>}
    </div>
  );
}

function SummaryTile({ label, count, colorClass }) {
  return (
    <div className={`flex flex-col items-center rounded-[20px] px-5 py-4 ${colorClass}`}>
      <span className="text-2xl font-bold">{count ?? '—'}</span>
      <span className="mt-1 text-center text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────── */
export default function GpsAnalysis() {
  const [file, setFile]         = useState(null);
  const [geocode, setGeocode]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(null); // {current, total, phase}
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);
  const [filterT, setFilterT]           = useState('');
  const [filterExpress, setFilterExpress] = useState(false);
  const [filterLate, setFilterLate]       = useState(false);
  const [filterColor, setFilterColor]     = useState(''); // 'orange'|'timing'|'excused'|''
  const [filterLoop, setFilterLoop]       = useState(''); // 'Q03', 'Q04', …
  const [gpsModal, setGpsModal] = useState(null); // {lat, lon, label}

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null); setProgress(null);

    // Polling progression toutes les 2s pendant le géocodage
    let pollInterval = null;
    if (geocode) {
      pollInterval = setInterval(async () => {
        try {
          const r = await fetch(`${GPS_API}/api/gps/progress`);
          if (r.ok) setProgress(await r.json());
        } catch {}
      }, 2000);
    }

    const fd = new FormData();
    fd.append('gps_file', file);
    fd.append('geocode', geocode ? 'true' : 'false');
    try {
      const res = await fetch(`${GPS_API}/api/gps/process`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body.detail || '';
        if (res.status === 500) {
          throw new Error(`Erreur serveur (500)${detail ? ' : ' + detail : ' — vérifiez que le backend est démarré et que le disque n\'est pas plein.'}`);
        }
        throw new Error(detail || `Erreur ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'Load failed' || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        setError('Backend inaccessible — démarrez le serveur local (python3 backend/payroll_api.py) ou vérifiez que Railway est en ligne.');
      } else {
        setError(msg);
      }
    } finally {
      clearInterval(pollInterval);
      setLoading(false);
      setProgress(null);
    }
  };

  const s = result?.summary;

  // Loops disponibles triés (depuis les résultats)
  const availableLoops = [...new Set((result?.rows ?? []).map(r => r.loop).filter(Boolean))].sort();

  const filteredRows = (result?.rows ?? []).filter(r => {
    if (filterT && r.status !== filterT) return false;
    if (filterLoop && r.loop !== filterLoop) return false;
    if (filterExpress && !r.is_express) return false;
    if (filterLate && !r.is_late) return false;
    if (filterColor === 'orange'  && !(r.is_late && r.is_express && !r.excused)) return false;
    if (filterColor === 'timing'  && !r.timing_warn) return false;
    if (filterColor === 'excused' && !r.excused) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Modal GPS */}
      {gpsModal && <GpsModal gps={gpsModal} onClose={() => setGpsModal(null)} />}

      <PageHeader
        title="GPS Analysis — Chauffeur"
        description="Analyse les données GPS : retards express, liens Maps, visualisation position."
        badge="Module GPS"
      />

      {/* ── Upload ── */}
      <GlassCard title="Fichier GPS" tag="Upload">
        <div className="grid gap-3 sm:grid-cols-2">
          <FileInput label="Fichier GPS (.xlsx)" hint="GPS MD1 M-D Logistique.xlsx" value={file} onChange={setFile} />
          <div className="flex flex-col justify-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={geocode} onChange={e => setGeocode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-orange-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Calculer distances GPS → Adresse
              </span>
            </label>
            <p className={`text-xs ${geocode ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
              {geocode
                ? '⚠ 1ère exécution : ~15 min (géocodage Nominatim). Instantané ensuite grâce au cache.'
                : 'Désactivé — distances non calculées.'}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-[16px] border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          ℹ️ Distance entre la position GPS du scan (Trigger 3, cols Q/R) et l'adresse de livraison (col H) de la <strong>même ligne</strong>. L'itinéraire 🗺 ouvre Google Maps depuis le point GPS vers l'adresse.
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
              file && !loading ? 'bg-orange-600 hover:bg-orange-700' : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700'
            }`}
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
            )}
            {loading ? 'Traitement…' : 'Analyser'}
          </button>
        </div>

        {/* Barre de progression géocodage */}
        {loading && geocode && (
          <div className="mt-4 rounded-[16px] border border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-900/20 p-4">
            {progress && progress.total > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    Géocodage des adresses…
                  </span>
                  <span className="text-sm font-mono text-orange-700 dark:text-orange-400">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-orange-200 dark:bg-orange-900">
                  <div
                    className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-orange-600 dark:text-orange-400">
                  {Math.round((progress.current / progress.total) * 100)}% —
                  reste ~{Math.round((progress.total - progress.current) * 1.1 / 60)} min
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                </svg>
                <span className="text-sm text-orange-700 dark:text-orange-300">Lecture du fichier…</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
      </GlassCard>

      {/* ── Résultats ── */}
      {result && (
        <>
          <GlassCard title="Résumé" tag="Résultat">
            <div className="flex flex-wrap gap-3">
              <SummaryTile label="Total colis"       count={s.total}        colorClass="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" />
              <SummaryTile label="Retards"           count={s.late}         colorClass="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" />
              <SummaryTile label="Retards Express"   count={s.express_late} colorClass="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" />
              {s.dist_ok !== undefined && <>
                <SummaryTile label="GPS ≤10m ✓"      count={s.dist_ok}    colorClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" />
                <SummaryTile label="GPS 10–50m"       count={s.dist_warn}  colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" />
                <SummaryTile label="GPS >50m ⚠"       count={s.dist_alarm} colorClass="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" />
              </>}
            </div>
            <div className="mt-5">
              <a
                href={`${GPS_API}${result.download_url}`}
                download
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"/>
                </svg>
                Télécharger rapport Excel
              </a>
            </div>
          </GlassCard>

          {/* ── Filtres ── */}
          <GlassCard title="Filtres" tag="Table">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtre loop */}
              <select
                value={filterLoop}
                onChange={e => setFilterLoop(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Tous les loops</option>
                {availableLoops.map(l => <option key={l} value={l}>{l}</option>)}
              </select>

              <select
                value={filterT}
                onChange={e => setFilterT(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Tous les statuts (T)</option>
                {STATUS_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={filterExpress} onChange={e => setFilterExpress(e.target.checked)}
                  className="h-4 w-4 rounded accent-orange-500" />
                Express seulement
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={filterLate} onChange={e => setFilterLate(e.target.checked)}
                  className="h-4 w-4 rounded accent-orange-500" />
                Retards seulement
              </label>

              {/* Filtre par couleur */}
              <select
                value={filterColor}
                onChange={e => setFilterColor(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Toutes les couleurs</option>
                <option value="orange">🟠 Retard Express</option>
                <option value="timing">🔵 Timing &lt;1min20</option>
                <option value="excused">✅ Excusés (cluster)</option>
              </select>

              <span className="ml-auto text-sm text-slate-500">{filteredRows.length} colis affichés</span>
            </div>
          </GlassCard>

          <GlassCard title="Colis analysés" tag={`${filteredRows.length} résultats`}>
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    {['Seq','Loop','Barcode','Express?','Commit','Réel','RETARD','Timing','Statut (T)','Rue','CP','Destinataire','GPS'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]">{h}</th>
                    ))}
                    <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px] cursor-help"
                        title="Distance entre la position GPS du scan (Trigger 3) et l'adresse de livraison de cette même ligne.">
                      GPS→Adr. ℹ
                    </th>
                    <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]"
                        title="Google Maps : depuis la position GPS vers l'adresse de livraison">Itinéraire</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => {
                    const lateExpress = row.is_late && row.is_express && !row.excused;
                    const hasGps = row.gps_lat && row.gps_lon;
                    return (
                      <tr
                        key={i}
                        style={lateExpress ? { backgroundColor: '#FF8C00' } : {}}
                        className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${
                          !lateExpress ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''
                        }`}
                      >
                        <td className={`px-2 py-1 ${lateExpress ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{row.seq}</td>
                        <td className={`px-2 py-1 ${lateExpress ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{row.loop}</td>
                        <td className={`px-2 py-1 font-mono max-w-[120px] truncate ${lateExpress ? 'font-bold text-red-200' : 'text-slate-800 dark:text-slate-200'}`} title={row.barcode}>{row.barcode}</td>
                        <td className="px-2 py-1">
                          {row.is_express
                            ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${lateExpress ? 'bg-red-700 text-white' : 'bg-orange-100 text-orange-800'}`}>EXP</span>
                            : <span className={lateExpress ? 'text-white/70' : 'text-slate-400'}>STD</span>}
                        </td>
                        <td className={`px-2 py-1 font-mono whitespace-nowrap ${lateExpress ? 'font-bold text-red-200' : ''}`}>{row.commit_time || '—'}</td>
                        <td className={`px-2 py-1 font-mono whitespace-nowrap ${lateExpress ? 'font-bold text-red-100' : ''}`}>{row.actual_time}</td>
                        <td className="px-2 py-1">
                          {row.is_late && !row.excused
                            ? <span className={`font-bold ${lateExpress ? 'text-red-200' : 'text-red-600 dark:text-red-400'}`}>OUI</span>
                            : row.excused
                              ? <span className="text-[10px] text-emerald-600 dark:text-emerald-400">excusé</span>
                              : <span className={lateExpress ? 'text-white/50' : 'text-slate-400'}>—</span>}
                        </td>

                        {/* Timing < 1min20 */}
                        <td className="px-2 py-1">
                          {row.timing_warn
                            ? <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 whitespace-nowrap" title="Moins de 1min20 avec le stop précédent">⚡&lt;1'20</span>
                            : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <span className={`rounded px-1 py-0.5 text-[10px] ${
                            lateExpress ? 'bg-red-800 text-red-100' :
                            row.status?.startsWith('CLOSED') ? 'bg-blue-100 text-blue-800' :
                            row.status === 'SIG OBTAINED' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>{row.status}</span>
                        </td>
                        <td className={`px-2 py-1 max-w-[160px] truncate ${lateExpress ? 'font-bold text-red-100' : 'text-slate-700 dark:text-slate-300'}`} title={row.street}>{row.street}</td>
                        <td className={`px-2 py-1 whitespace-nowrap ${lateExpress ? 'font-bold text-red-100' : ''}`}>{row.postal}</td>
                        <td className={`px-2 py-1 max-w-[130px] truncate ${lateExpress ? 'text-red-100' : 'text-slate-700 dark:text-slate-300'}`} title={row.consignee}>{row.consignee}</td>

                        {/* GPS preview button */}
                        <td className="px-2 py-1">
                          {hasGps ? (
                            <button
                              onClick={() => setGpsModal({
                                lat: row.gps_lat,
                                lon: row.gps_lon,
                                label: `${row.street || ''} ${row.postal || ''} ${row.city || ''}`.trim(),
                              })}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                                lateExpress
                                  ? 'bg-red-800 text-red-100 hover:bg-red-700'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                            >
                              📍
                            </button>
                          ) : (
                            <span className={lateExpress ? 'text-white/40' : 'text-slate-400'}>—</span>
                          )}
                        </td>

                        {/* Distance inter-stops */}
                        <td className="px-2 py-1">
                          {geocode
                            ? <DistBadge distM={row.dist_m} />
                            : <span className="text-slate-300 dark:text-slate-600 text-xs italic" title="Active le géocodage pour calculer les distances">—</span>}
                        </td>

                        {/* Itinéraire */}
                        <td className="px-2 py-1">
                          {row.route
                            ? <a href={row.route} target="_blank" rel="noreferrer"
                                className={`underline hover:no-underline ${lateExpress ? 'text-red-200 hover:text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                                🗺
                              </a>
                            : <span className={lateExpress ? 'text-white/40' : 'text-slate-400'}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {geocode && (
              <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                * Distance (vol d'oiseau) entre la position GPS Trigger 3 (cols Q/R) et l'adresse de livraison géocodée (col H) de la même ligne. 🗺 = itinéraire Google Maps GPS → adresse.
              </p>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}
