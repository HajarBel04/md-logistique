import { useState, useRef, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

const PAYROLL_API = 'http://localhost:8000';

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

function extractDriverNameFromFile(filename) {
  let name = filename.replace(/\.xlsx$/i, '');
  name = name.replace(/^Temps_de_travail_/i, '');
  name = name.replace(/_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/, '');
  return name.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function StatusBadge({ status }) {
  if (status === 'ok') return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25">
      OK
    </span>
  );
  return (
    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25">
      Non trouvé
    </span>
  );
}

export default function Payroll() {
  const [files, setFiles]     = useState([]);
  const [dragging, setDragging] = useState(false);
  const [mois, setMois]       = useState(5);
  const [annee, setAnnee]     = useState(2026);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const fileInputRef          = useRef(null);

  // ── Drag & drop ──────────────────────────────────────────────────────────

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);

  const addFiles = useCallback((incoming) => {
    const xlsx = [...incoming].filter(f => f.name.toLowerCase().endsWith('.xlsx'));
    if (!xlsx.length) return;
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...xlsx.filter(f => !existing.has(f.name))];
    });
    setResult(null);
    setError(null);
  }, []);

  const onDrop     = useCallback((e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onFileInput = useCallback((e) => { addFiles(e.target.files); e.target.value = ''; }, [addFiles]);
  const removeFile  = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  // ── Génération ────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!files.length) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('webfleet_files', f));
      formData.append('mois', mois);
      formData.append('annee', annee);
      const res = await fetch(`${PAYROLL_API}/api/payroll/generate`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur serveur ${res.status}`);
      }
      setResult(await res.json());
    } catch (e) {
      const msg = e.message || '';
      const isNetwork = msg === 'Load failed' || msg === 'Network Error' || msg.includes('Failed to fetch');
      setError(
        isNetwork
          ? 'Serveur FastAPI inaccessible (port 8000). Lance ./start.sh ou : python3 backend/payroll_api.py'
          : msg || 'Erreur inconnue.'
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadUrl        = (path) => `${PAYROLL_API}${path}`;
  const totalAnomalies     = result?.conducteurs?.reduce((s, c) => s + c.anomalies.length, 0) ?? 0;
  const totalJours         = result?.conducteurs?.reduce((s, c) => s + c.jours_travailles, 0) ?? 0;
  const moisLabel          = MONTHS.find(m => m.value === (result?.mois ?? mois))?.label;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Fiches de paie CP140"
        description="Glissez vos fichiers Webfleet pour générer automatiquement les fiches de paie CP140 et les récapitulatifs par conducteur."
        badge="Module B"
      />

      {/* ── Zone drag & drop ─────────────────────────────────────────────── */}
      <GlassCard title="Fichiers Webfleet">
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-[20px] border-2 border-dashed p-6 text-center transition-all sm:p-10
            ${dragging
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10'
              : 'border-slate-300 bg-slate-50/60 hover:border-orange-300 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-orange-500/50'
            }`}
        >
          <input ref={fileInputRef} type="file" accept=".xlsx" multiple className="hidden" onChange={onFileInput} />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20 sm:mb-4 sm:h-14 sm:w-14">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-600 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9,15 12,12 15,15" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Glissez vos fichiers Webfleet ici
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ou appuyez pour parcourir — plusieurs .xlsx acceptés
          </p>
        </div>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2 sm:mt-4">
            {files.map(f => (
              <li key={f.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{f.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{extractDriverNameFromFile(f.name)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* ── Paramètres + bouton génération ───────────────────────────────── */}
      <GlassCard title="Paramètres">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Mois</label>
            <select
              value={mois}
              onChange={e => setMois(Number(e.target.value))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Année</label>
            <input
              type="number" value={annee} onChange={e => setAnnee(Number(e.target.value))}
              min={2020} max={2030}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-28"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!files.length || loading}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold transition sm:w-auto
              ${!files.length || loading
                ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                : 'bg-orange-600 text-white shadow-sm hover:bg-orange-700 active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Génération en cours…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13,2 13,9 20,9"/>
                </svg>
                Générer les fiches de paie
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* ── Erreur ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 sm:p-5">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* ── Résultats ────────────────────────────────────────────────────── */}
      {result && (
        <>
          {/* Cartes récap globales — 1 col mobile, 3 col desktop */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                label: 'Conducteurs traités',
                value: result.conducteurs.length,
                sub: `${result.conducteurs.filter(c => c.status === 'ok').length} trouvés dans CP140`,
                color: 'bg-blue-50 dark:bg-blue-500/10',
                text: 'text-blue-700 dark:text-blue-300',
              },
              {
                label: 'Jours travaillés',
                value: totalJours,
                sub: `${moisLabel} ${result.annee}`,
                color: 'bg-emerald-50 dark:bg-emerald-500/10',
                text: 'text-emerald-700 dark:text-emerald-300',
              },
              {
                label: 'Anomalies',
                value: totalAnomalies,
                sub: totalAnomalies === 0 ? 'Aucune anomalie' : 'Pauses manquantes',
                color: totalAnomalies > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-900/40',
                text: totalAnomalies > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500',
              },
            ].map(c => (
              <div key={c.label} className={`rounded-[20px] p-4 sm:p-6 ${c.color}`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{c.label}</p>
                <p className={`mt-2 text-3xl font-extrabold sm:text-4xl ${c.text}`}>{c.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Tableau conducteurs — scrollable sur mobile */}
          <GlassCard title="Récapitulatif par conducteur" tag="Résultats">
            <div className="-mx-2 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Conducteur', 'Statut', 'Jours', 'Travail', 'Service', 'Anomalies'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 first:pl-2 sm:first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.conducteurs.map((c, i) => (
                    <tr key={i}>
                      <td className="py-3 pr-4 pl-2 font-semibold text-slate-800 dark:text-slate-100 sm:pl-0">{c.nom}</td>
                      <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{c.jours_travailles}</td>
                      <td className="py-3 pr-4 font-mono text-slate-700 dark:text-slate-200">{c.total_heures_travail}h</td>
                      <td className="py-3 pr-4 font-mono text-slate-700 dark:text-slate-200">{c.total_heures_service}h</td>
                      <td className="py-3">
                        {c.anomalies.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <details>
                            <summary className="cursor-pointer list-none rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25">
                              {c.anomalies.length} ⚠
                            </summary>
                            <ul className="mt-2 space-y-1 pl-1">
                              {c.anomalies.map((a, j) => (
                                <li key={j} className="text-xs text-slate-600 dark:text-slate-400">⚠ {a}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Boutons téléchargement — empilés sur mobile */}
          <GlassCard title="Télécharger les fichiers générés">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={downloadUrl(result.cp140_url)}
                download
                className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.98] sm:w-auto"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger CP140 complet
              </a>
              <a
                href={downloadUrl(result.recaps_url)}
                download
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500/50 sm:w-auto"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger récapitulatifs (.zip)
              </a>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
