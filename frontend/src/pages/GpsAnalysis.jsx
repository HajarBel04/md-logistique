import { useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

const GPS_API = import.meta.env.VITE_API_URL || '';

const STATUS_FILTERS = [
  'CLOSED 1','CLOSED 2','CLOSED 3','NOT IN 1','NOT IN 2','NOT IN 3',
  'SIG OBTAINED','DR RELEASED','REDIRECT','FUTURE','VOID ENTRY',
  'NO MONEY 1','NO MONEY 2','LEFT ARS TAG','NI1 ALT DEL',
];

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

function DistBadge({ distM }) {
  if (distM === null || distM === undefined) return <span className="text-slate-400">—</span>;
  const d = Number(distM);
  if (d <= 10)  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">{d}m ✓</span>;
  if (d <= 15)  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">{d}m</span>;
  if (d <= 30)  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{d}m</span>;
  if (d <= 50)  return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">{d}m</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">{d}m !</span>;
}

export default function GpsAnalysis() {
  const [file, setFile]         = useState(null);
  const [geocode, setGeocode]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [result, setResult]     = useState(null);
  const [filterT, setFilterT]   = useState('');
  const [filterExpress, setFilterExpress] = useState(false);
  const [filterLate, setFilterLate]       = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    const fd = new FormData();
    fd.append('gps_file', file);
    fd.append('geocode', geocode ? 'true' : 'false');
    try {
      const res = await fetch(`${GPS_API}/api/gps/process`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Erreur ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'Load failed' || msg.includes('fetch')) {
        setError(`Backend inaccessible (${GPS_API || 'URL non configurée'}). Vérifie que le serveur Railway est en ligne.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;

  const filteredRows = (result?.rows ?? []).filter(r => {
    if (filterT && r.status !== filterT) return false;
    if (filterExpress && !r.is_express) return false;
    if (filterLate && !r.is_late) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="GPS Analysis — Chauffeur"
        description="Analyse les données GPS : retards express, distances, liens Maps."
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
            {geocode && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ Géocodage Nominatim — environ 15 min pour 880 adresses uniques (cache après 1ère fois)
              </p>
            )}
          </div>
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
              <SummaryTile label="Total colis"       count={s.total}         colorClass="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" />
              <SummaryTile label="Retards"           count={s.late}          colorClass="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" />
              <SummaryTile label="Retards Express"   count={s.express_late}  colorClass="bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" />
              {geocode && <>
                <SummaryTile label="GPS OK (≤10m)"    count={s.dist_ok}      colorClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" />
                <SummaryTile label="GPS warning"      count={s.dist_warn}    colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" />
                <SummaryTile label="GPS alarme (>50m)" count={s.dist_alarm}  colorClass="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" />
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
              <span className="ml-auto text-sm text-slate-500">{filteredRows.length} colis affichés</span>
            </div>
          </GlassCard>

          <GlassCard title="Colis analysés" tag={`${filteredRows.length} résultats`}>
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    {['Seq','Loop','Barcode','Express?','Commit','Réel','RETARD','Statut (T)','Rue','CP','Destinataire','Distance','Street View','Itinéraire'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => {
                    const late = row.is_late && row.is_express;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 dark:border-slate-800 ${
                          late ? 'animate-pulse-orange bg-orange-50 dark:bg-orange-900/20' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.seq}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.loop}</td>
                        <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200">{row.barcode}</td>
                        <td className="px-3 py-2">
                          {row.is_express
                            ? <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-800">EXPRESS</span>
                            : <span className="text-slate-400">STD</span>}
                        </td>
                        <td className="px-3 py-2 font-mono">{row.commit_time || '—'}</td>
                        <td className="px-3 py-2 font-mono">{row.actual_time}</td>
                        <td className="px-3 py-2">
                          {row.is_late
                            ? <span className="font-bold text-red-600 dark:text-red-400">OUI</span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`rounded px-1.5 py-0.5 text-xs ${
                            row.status?.startsWith('CLOSED') ? 'bg-blue-100 text-blue-800' :
                            row.status === 'SIG OBTAINED' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>{row.status}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.street}</td>
                        <td className="px-3 py-2">{row.postal}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.consignee}</td>
                        <td className="px-3 py-2"><DistBadge distM={row.dist_m} /></td>
                        <td className="px-3 py-2">
                          {row.streetview
                            ? <a href={row.streetview} target="_blank" rel="noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400">📍 View</a>
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {row.route
                            ? <a href={row.route} target="_blank" rel="noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400">🗺 Route</a>
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
