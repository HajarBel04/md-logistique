import { useState, useEffect, useRef } from 'react';
import { read, utils, writeFile } from 'xlsx';
import UploadDropzone from '../components/UploadDropzone';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';
import { uploadWebfleet } from '../services/api';

function parseDT(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(2000 + +m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
}

function nightMinutes(start, end) {
  if (!start || !end || end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    const h = cur.getHours();
    if (h >= 20 || h < 6) count++; // nuit : 20h00 → 06h00
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return count;
}

// Déduction pause obligatoire : 45 min après 4h30 de conduite, 90 min après 9h
function pauseDeduction(conduiteMin) {
  if (conduiteMin >= 540) return 90; // ≥ 9h → 2 pauses
  if (conduiteMin >= 270) return 45; // ≥ 4h30 → 1 pause
  return 0;
}

function fmt(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

function wordOverlap(a, b) {
  const wa = a.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
  const wb = b.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
  // partial match: "sidib" matches "sidibe"
  return wa.filter(wa_w => wb.some(wb_w => wb_w.startsWith(wa_w) || wa_w.startsWith(wb_w))).length;
}

function findDriverConfig(driverName, configs) {
  if (!configs?.length) return null;
  let best = null, bestScore = 0;
  for (const cfg of configs) {
    const score = wordOverlap(driverName, cfg.name);
    if (score > bestScore) { bestScore = score; best = cfg; }
  }
  return bestScore > 0 ? best : null;
}

function toTitleCase(str) {
  return str.replace(/\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function computeDaily(rows, homeCity) {
  const map = {};
  let commuteMin = 0;

  for (const row of rows) {
    const act = row['Activité'];
    const dtStart = parseDT(row['Heure de début']);
    const dtEnd = parseDT(row['Heure de fin']);
    if (!act || !dtStart) continue;

    const durRaw = dtEnd ? Math.max(0, Math.round((dtEnd - dtStart) / 60000)) : 0;
    // Activité > 12h = anomalie Webfleet (ex: weekend non scanné) → on l'exclut
    const isAnomaly = durRaw > 720;
    const dur = isAnomaly ? 0 : durRaw;

    const key = dtStart.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    }).replace(/\//g, '.');

    if (!map[key]) map[key] = { conduite: 0, conduiteRaw: 0, dispo: 0, night: 0, commute: 0 };

    // Détecter trajet domicile
    if (homeCity) {
      const city = homeCity.toLowerCase();
      const start = (row['Position de départ'] || '').toLowerCase();
      const end = (row['Emplacement de fin'] || '').toLowerCase();
      if (start.includes(city) || end.includes(city)) {
        if (act === 'Conduite') {
          map[key].conduiteRaw += dur; // conduite brute avant déduction
          map[key].commute += dur;     // part trajet
          commuteMin += dur;
        }
        continue; // exclu du calcul payé
      }
    }

    if (!isAnomaly) {
      if (act === 'Conduite') {
        map[key].conduite += dur;
        map[key].conduiteRaw += dur;
      } else {
        map[key].dispo += dur;
      }
      if (dtEnd) map[key].night += nightMinutes(dtStart, dtEnd);
    }
  }

  // Tri chronologique correct sur "dd.mm.yy"
  function dateKey(s) {
    const [d, m, y] = s.split('.');
    return `20${y}-${m}-${d}`;
  }

  const breakdown = Object.entries(map)
    .sort(([a], [b]) => dateKey(a).localeCompare(dateKey(b)))
    .map(([date, d]) => {
      const deduction = pauseDeduction(d.conduite);
      const dispoNet = Math.max(0, d.dispo - deduction);
      return {
        date,
        conduiteAvant: d.commute > 0 ? fmt(d.conduiteRaw) : null, // valeur brute avant exclusion
        conduite: fmt(d.conduite),
        trajetExclu: d.commute > 0 ? fmt(d.commute) : null,
        disponibilite: fmt(dispoNet),
        pauseDeduite: deduction > 0 ? fmt(deduction) : null,
        heureNuit: fmt(d.night),
      };
    });

  return { breakdown, commuteMin };
}

export default function WebfleetImport() {
  const [file, setFile] = useState(null);
  const [daily, setDaily] = useState([]);
  const [driverName, setDriverName] = useState(null);
  const [totals, setTotals] = useState(null);
  const [commuteInfo, setCommuteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const driverConfigs = useRef([]);

  // Charge les configs domicile/dépôt depuis le backend au démarrage
  useEffect(() => {
    fetch('/api/chauffeur-configs')
      .then(r => r.json())
      .then(data => { driverConfigs.current = data; })
      .catch(() => {});
  }, []);

  const handleSelectFile = async (selectedFile) => {
    setError(null);
    setDaily([]);
    setDriverName(null);
    setTotals(null);
    setCommuteInfo(null);
    setFile(selectedFile);

    if (!selectedFile) return;
    try {
      const data = await selectedFile.arrayBuffer();
      const wb = read(data, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const rows = utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

      // Nom du chauffeur depuis le nom de feuille (potentiellement tronqué)
      const rawName = sheetName
        .replace('Temps de travail_', '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .trim();

      // Chercher la config correspondante pour avoir le vrai nom + domicile
      const cfg = findDriverConfig(rawName, driverConfigs.current);
      const homeCity = cfg?.homeCity ?? null;
      const fullName = cfg ? toTitleCase(cfg.name) : rawName;

      const { breakdown, commuteMin } = computeDaily(rows, homeCity);
      setDaily(breakdown);
      setDriverName(fullName);
      if (homeCity) {
        setCommuteInfo({ homeCity, excluded: commuteMin > 0, minutes: commuteMin });
      }
    } catch {
      setDaily([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadWebfleet(formData);
      const payload = response.data;
      const result = payload.result ?? (payload.saved ? { totals: payload.saved.summary, driverName: payload.saved.driver?.fullName } : null);

      if (result?.totals) setTotals(result.totals);
      if (result?.driverName) setDriverName(result.driverName);
      if (result?.dailyBreakdown?.length) setDaily(result.dailyBreakdown);
      if (result?.homeCity) {
        setCommuteInfo({
          homeCity: result.homeCity,
          excluded: result.commuteExcluded,
          minutes: result.commuteMinutes ?? 0,
        });
      }
    } catch (err) {
      const raw = err.response?.data?.error || err.message || '';
      const isNetwork = raw === 'Network Error' || raw.includes('Failed to fetch') || raw === 'Load failed';
      setError(
        isNetwork
          ? 'Backend Node.js inaccessible (port 4000). Lance : cd backend && node src/server.js'
          : raw || 'Impossible de joindre le backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!daily.length) return;
    const wb = utils.book_new();
    const wsData = [
      [],
      [],
      ['', '', driverName ?? ''],
      [],
      ['Date', 'Conduite', 'Disponibilité', 'Pause déduite', 'Heure de nuit'],
      ...daily.map((r) => [r.date, r.conduite, r.disponibilite, r.pauseDeduite ? `- ${r.pauseDeduite}` : '', r.heureNuit]),
    ];
    const ws = utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 16 }];
    utils.book_append_sheet(wb, ws, 'Rapport');
    writeFile(wb, `rapport_${(driverName ?? 'chauffeur').replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Webfleet"
        description="Chargez votre rapport Excel pour voir les heures par jour."
        badge="Import"
      />

      <UploadDropzone
        file={file}
        onSelectFile={handleSelectFile}
        onUpload={handleUpload}
        loading={loading}
      />

      {error ? (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      ) : null}

      {daily.length > 0 ? (
        <GlassCard
          title={`Rapport journalier${driverName ? ` — ${driverName}` : ''}`}
          description="Heures de conduite, disponibilité et heures de nuit par jour."
          tag="Résultat"
        >
          {driverName ? (
            <p className="mt-4 text-lg font-semibold text-slate-900">
              Chauffeur : <span className="text-orange-600">{driverName}</span>
            </p>
          ) : null}

          {commuteInfo ? (
            <div className={`mt-3 rounded-2xl px-4 py-3 text-sm flex items-center gap-3 ${
              commuteInfo.excluded
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-slate-50 border border-slate-200 text-slate-600'
            }`}>
              <span className="text-base">{commuteInfo.excluded ? '🏠' : 'ℹ️'}</span>
              {commuteInfo.excluded
                ? `Trajet domicile (${commuteInfo.homeCity}) exclu automatiquement — ${Math.round(commuteInfo.minutes)} min non comptées`
                : `Domicile détecté : ${commuteInfo.homeCity} — aucun trajet domicile trouvé ce mois-ci`
              }
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0l4-4m-4 4l-4-4" /><path d="M5 21h14" />
              </svg>
              Exporter Excel
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Conduite</th>
                  {daily.some(r => r.trajetExclu) && (
                    <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Trajet exclu</th>
                  )}
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Disponibilité</th>
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pause déduite</th>
                  <th className="py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Heure de nuit</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((row) => (
                  <tr key={row.date} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 pr-6 font-medium text-slate-800">{row.date}</td>
                    <td className="py-3 pr-6">
                      {row.trajetExclu ? (
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 line-through text-xs">{row.conduiteAvant}</span>
                          <span className="font-mono text-slate-800 font-semibold">{row.conduite}</span>
                        </span>
                      ) : (
                        <span className="font-mono text-slate-700">{row.conduite}</span>
                      )}
                    </td>
                    {daily.some(r => r.trajetExclu) && (
                      <td className="py-3 pr-6 font-mono text-xs text-blue-600 font-semibold">
                        {row.trajetExclu ? `− ${row.trajetExclu}` : '—'}
                      </td>
                    )}
                    <td className="py-3 pr-6 font-mono text-slate-700">{row.disponibilite}</td>
                    <td className="py-3 pr-6 font-mono text-xs text-red-500">{row.pauseDeduite ? `− ${row.pauseDeduite}` : '—'}</td>
                    <td className="py-3 font-mono text-slate-500">{row.heureNuit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totals ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3 border-t border-slate-100 pt-6">
              {[
                { label: 'Total conduite', value: totals.conduiteHeures },
                { label: 'Total travail', value: totals.travailHeures },
                { label: 'Total repos', value: totals.reposHeures },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value ?? '-'} h</p>
                </div>
              ))}
            </div>
          ) : null}
        </GlassCard>
      ) : null}
    </div>
  );
}
