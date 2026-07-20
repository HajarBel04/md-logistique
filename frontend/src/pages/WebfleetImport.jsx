import { useState, useRef } from 'react';
import { read, utils, writeFile } from 'xlsx';
import UploadDropzone from '../components/UploadDropzone';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';
import { uploadWebfleet } from '../services/api';
import DRIVER_CONFIGS from '../driverConfigs';

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


function fmt(mins) {
  return parseFloat((mins / 60).toFixed(2));
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

function computeDaily(rows, homeCity, depotKeyword) {
  const map = {};
  let commuteMin = 0;

  // Trier toutes les activités par heure de début
  const sorted = rows
    .map(r => ({
      act: r['Activité'],
      dtStart: parseDT(r['Heure de début']),
      dtEnd: parseDT(r['Heure de fin']),
      depart: (r['Position de départ'] || '').toLowerCase(),
      arrivee: (r['Emplacement de fin'] || '').toLowerCase(),
    }))
    .filter(r => r.act && r.dtStart)
    .sort((a, b) => a.dtStart - b.dtStart);

  // Grouper en shifts : pause ≥ 9h entre activités de travail = nouveau shift
  // On ignore les "Repos" pour calculer le gap — ils remplissent le temps mais ne sont pas du travail
  const SHIFT_GAP = 9 * 60 * 60 * 1000;
  const shifts = [];
  let cur = [];
  let lastWorkEnd = null;
  for (const r of sorted) {
    if (cur.length === 0) {
      cur.push(r);
      if (r.act !== 'Repos') lastWorkEnd = r.dtEnd || r.dtStart;
      continue;
    }
    const ref = r.act !== 'Repos' && lastWorkEnd
      ? lastWorkEnd
      : (cur[cur.length - 1].dtEnd || cur[cur.length - 1].dtStart);
    if (r.dtStart - ref >= SHIFT_GAP) {
      shifts.push(cur); cur = [r];
      lastWorkEnd = r.act !== 'Repos' ? (r.dtEnd || r.dtStart) : null;
    } else {
      cur.push(r);
      if (r.act !== 'Repos') lastWorkEnd = r.dtEnd || r.dtStart;
    }
  }
  if (cur.length) shifts.push(cur);

  // Calculer par shift (date = début du shift)
  for (const shift of shifts) {
    const key = shift[0].dtStart.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    }).replace(/\//g, '.');

    if (!map[key]) map[key] = { travail: 0, travailRaw: 0, conduite: 0, dispo: 0, night: 0, commute: 0 };

    for (const r of shift) {
      const { act, dtStart, dtEnd, depart, arrivee } = r;
      const dur = dtEnd ? Math.max(0, Math.round((dtEnd - dtStart) / 60000)) : 0;
      if (dur > 720) continue; // anomalie Webfleet

      const city = homeCity ? homeCity.toLowerCase() : null;
      const depot = depotKeyword ? depotKeyword.toLowerCase() : null;
      // Règle Alex : tout trajet PARTANT du domicile = non payé (trajet aller)
      // Retour : seulement Albert I-laan → domicile (retour dépôt). Ex: Opwijk→Lebbeke = payé.
      const isCommuteOut = city && depart.includes(city);
      const isCommuteReturn = city && depot && depart.includes(depot) && arrivee.includes(city);
      const isCommute = isCommuteOut || isCommuteReturn;

      if (act === 'Conduite' || act === 'Travail') {
        map[key].travailRaw += dur;
        if (isCommute) {
          map[key].commute += dur;
          commuteMin += dur;
        } else {
          map[key].travail += dur;
          if (act === 'Conduite') map[key].conduite += dur;
          if (dtEnd) map[key].night += nightMinutes(dtStart, dtEnd);
        }
      } else if (act === 'Disponibilité' || act === 'Repos') {
        if (isCommute) {
          // Repos/Dispo dans périmètre domicile → exclu
          map[key].commute += dur;
          commuteMin += dur;
        } else {
          map[key].dispo += dur;
          if (dtEnd) map[key].night += nightMinutes(dtStart, dtEnd);
        }
      }
    }

    // Après 4h30 de conduite → déduire 45 min de pause obligatoire (non payée)
    if (map[key].conduite >= 270) {
      map[key].dispo = Math.max(0, map[key].dispo - 45);
    }
  }

  function dateKey(s) {
    const [d, m, y] = s.split('.');
    return `20${y}-${m}-${d}`;
  }

  const breakdown = Object.entries(map)
    .sort(([a], [b]) => dateKey(a).localeCompare(dateKey(b)))
    .map(([date, d]) => ({
      date,
      travailAvant: d.commute > 0 ? fmt(d.travailRaw) : null,
      tempsTravail: fmt(d.travail),
      trajetExclu: d.commute > 0 ? fmt(d.commute) : null,
      disponibilite: fmt(d.dispo),
      heureNuit: fmt(d.night),
    }));

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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const driverConfigs = useRef(DRIVER_CONFIGS);

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
      const depotKeyword = cfg?.depotKeyword ?? null;
      const fullName = cfg ? toTitleCase(cfg.name) : rawName;

      const { breakdown, commuteMin } = computeDaily(rows, homeCity, depotKeyword);
      setDaily(breakdown);
      setDriverName(fullName);
      // Auto-sélectionne le mois le plus fréquent dans les données
      if (breakdown.length) {
        const monthCounts = {};
        breakdown.forEach(r => {
          const key = r.date.slice(3, 8); // "06.26"
          monthCounts[key] = (monthCounts[key] || 0) + 1;
        });
        const dominant = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0];
        setSelectedMonth(dominant);
      }
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
          ? 'Impossible de joindre le serveur. Vérifiez votre connexion.'
          : raw || 'Impossible de joindre le backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!daily.length) return;
    const filtered = selectedMonth ? daily.filter(r => r.date.slice(3, 8) === selectedMonth) : daily;
    const wb = utils.book_new();
    const wsData = [
      ['Prestations'],
      [],
      ['Code Abs', 'Temps de travail', 'Disponibilité', 'Heures de nuit'],
      ['', '= Temps de conduite + Travail', '=Disponibilité', '= de 20h00 à 06h00'],
      ['', 0.27, 0.4, ''],
      [],
      [driverName ?? ''],
      [],
      ['Date', 'Code Abs', 'Temps de travail', 'Disponibilité', 'Heures de nuit'],
      ...filtered.map((r) => [r.date, '', r.tempsTravail, r.disponibilite, r.heureNuit]),
    ];
    const ws = utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
    utils.book_append_sheet(wb, ws, 'Prestations');
    writeFile(wb, `prestations_${(driverName ?? 'chauffeur').replace(/\s+/g, '_')}.xlsx`);
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

          {/* Sélecteur de mois */}
          {(() => {
            const months = [...new Set(daily.map(r => r.date.slice(3, 8)))];
            if (months.length <= 1) return null;
            const labels = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' };
            return (
              <div className="mt-4 flex gap-2 flex-wrap">
                {months.map(m => {
                  const [mm, yy] = m.split('.');
                  return (
                    <button key={m} onClick={() => setSelectedMonth(m)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedMonth === m ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {labels[mm]} 20{yy}
                    </button>
                  );
                })}
              </div>
            );
          })()}

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
            {(() => {
              const filtered = selectedMonth ? daily.filter(r => r.date.slice(3, 8) === selectedMonth) : daily;
              return (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Code Abs</th>
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Temps de travail<span className="ml-1 text-slate-400 normal-case font-normal">(×0,27)</span></th>
                  {filtered.some(r => r.trajetExclu) && (
                    <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Trajet exclu</th>
                  )}
                  <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Disponibilité<span className="ml-1 text-slate-400 normal-case font-normal">(×0,4)</span></th>
                  <th className="py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Heures de nuit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.date} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 pr-6 font-medium text-slate-800">{row.date}</td>
                    <td className="py-3 pr-6 text-slate-400">—</td>
                    <td className="py-3 pr-6">
                      {row.trajetExclu ? (
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 line-through text-xs">{row.travailAvant}</span>
                          <span className="font-mono text-slate-800 font-semibold">{row.tempsTravail}</span>
                        </span>
                      ) : (
                        <span className="font-mono text-slate-700">{row.tempsTravail}</span>
                      )}
                    </td>
                    {filtered.some(r => r.trajetExclu) && (
                      <td className="py-3 pr-6 font-mono text-xs text-blue-600 font-semibold">
                        {row.trajetExclu ? `− ${row.trajetExclu}` : '—'}
                      </td>
                    )}
                    <td className="py-3 pr-6 font-mono text-slate-700">{row.disponibilite}</td>
                    <td className="py-3 font-mono text-slate-500">{row.heureNuit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
              );
            })()}
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
