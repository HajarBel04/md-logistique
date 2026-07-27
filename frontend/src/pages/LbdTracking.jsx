import { useState, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

const LBD_API = 'http://localhost:8000';

const STATUS_CONFIG = {
  'No Inbound Scan': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'Retour dépôt':    { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-300',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',   dot: 'bg-amber-500'   },
  'Driver Error':    { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-300',       badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',           dot: 'bg-red-500'     },
  'Future delivery': { bg: 'bg-slate-50 dark:bg-slate-800/40',   text: 'text-slate-600 dark:text-slate-400',   badge: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',      dot: 'bg-slate-400'   },
};

function FileInput({ label, hint, value, onChange }) {
  const ref = useRef();
  return (
    <div
      className="flex cursor-pointer flex-col gap-1.5 rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-orange-400 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-orange-500 dark:hover:bg-orange-500/10"
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        onChange={e => onChange(e.target.files?.[0] ?? null)}
      />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      {value ? (
        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{value.name}</span>
      ) : (
        <span className="text-sm text-slate-400 dark:text-slate-500">{hint}</span>
      )}
    </div>
  );
}

function SummaryTile({ label, count, colorClass }) {
  return (
    <div className={`flex flex-col items-center rounded-[20px] px-6 py-5 ${colorClass}`}>
      <span className="text-3xl font-bold">{count}</span>
      <span className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
    </div>
  );
}

export default function LbdTracking() {
  const [files, setFiles] = useState({ lbd: null, scanning: null, kc_j: null, kc_j1: null, future: null });
  const [targetDate, setTargetDate] = useState('2026-07-23');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);  // { summary, download_url, rows }

  const setFile = (key) => (f) => setFiles(prev => ({ ...prev, [key]: f }));

  const allFilesReady = Object.values(files).every(Boolean) && targetDate;

  const handleSubmit = async () => {
    if (!allFilesReady) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('lbd_file',      files.lbd);
    fd.append('scanning_file', files.scanning);
    fd.append('kc_j_file',     files.kc_j);
    fd.append('kc_j1_file',    files.kc_j1);
    fd.append('future_file',   files.future);
    fd.append('target_date',   targetDate);

    try {
      const res = await fetch(`${LBD_API}/api/lbd/process`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      const msg = err.message || '';
      if (msg === 'Load failed' || msg.includes('fetch') || msg.includes('Failed')) {
        setError('Serveur FastAPI inaccessible (port 8000). Lance : python3 backend/payroll_api.py');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="LBD Tracking — Abdelhakim"
        description="Analyse les colis MD3449 et les colorise par statut de livraison."
        badge="Module A"
      />

      {/* ── Upload ── */}
      <GlassCard title="Fichiers d'entrée" tag="Upload">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <FileInput label="LBD (multi-onglets)"      hint="LBD__22-230726.xlsx"    value={files.lbd}      onChange={setFile('lbd')}      />
          <FileInput label="SCANNING dépôt"           hint="SCANNING_240726.xlsx"   value={files.scanning} onChange={setFile('scanning')} />
          <FileInput label="KC jour J"                hint="KC_230726.xlsx"         value={files.kc_j}     onChange={setFile('kc_j')}     />
          <FileInput label="KC jour J+1"              hint="KC_240726.xlsx"         value={files.kc_j1}    onChange={setFile('kc_j1')}    />
          <FileInput label="Future summer"            hint="Future_summer_2026.xlsx" value={files.future}  onChange={setFile('future')}   />
          <div className="flex flex-col gap-1.5 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Date cible
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={!allFilesReady || loading}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
              allFilesReady && !loading
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700'
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
          {!allFilesReady && !loading && (
            <span className="text-sm text-slate-400">Sélectionne les 5 fichiers et une date</span>
          )}
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
              <SummaryTile label="Total"           count={s.total}  colorClass="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" />
              <SummaryTile label="No Inbound Scan" count={s.vert}   colorClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" />
              <SummaryTile label="Retour dépôt"    count={s.jaune}  colorClass="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" />
              <SummaryTile label="Driver Error"    count={s.rouge}  colorClass="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" />
              <SummaryTile label="Future"          count={s.gris}   colorClass="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" />
            </div>

            <div className="mt-5">
              <a
                href={`${LBD_API}${result.download_url}`}
                download
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"/>
                </svg>
                Télécharger le rapport Excel
              </a>
            </div>
          </GlassCard>

          <GlassCard title={`Colis analysés — ${targetDate}`} tag={`${s.total} colis`}>
            <div className="overflow-x-auto rounded-[20px] border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    {['Statut', 'Tracking', 'Client', 'Adresse', 'Commentaire'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(result.rows ?? []).map((row, i) => {
                    const cfg = STATUS_CONFIG[row.statut] ?? STATUS_CONFIG['Future delivery'];
                    return (
                      <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 ${cfg.bg}`}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {row.statut}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-mono text-xs ${cfg.text}`}>{row.tracking}</td>
                        <td className={`px-4 py-3 ${cfg.text}`}>{row.client}</td>
                        <td className={`px-4 py-3 text-xs ${cfg.text}`}>{row.adresse}</td>
                        <td className={`px-4 py-3 text-xs ${cfg.text}`}>{row.commentaire}</td>
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
