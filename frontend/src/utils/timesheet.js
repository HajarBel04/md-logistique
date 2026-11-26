// Calcul de la feuille journalière (CP 140.03) à partir de l'export Webfleet.
// Fonctions pures : testées dans timesheet.test.js (node --test).

export const NIGHT_START = 20; // 20h00
export const NIGHT_END = 6;    // 06h00
export const BREAK_MINUTES = 45;
export const BREAK_AFTER_DRIVING = 270; // 4h30 de conduite

export function parseDT(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(2000 + +m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
}

export function nightMinutes(start, end) {
  if (!start || !end || end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    const h = cur.getHours();
    if (h >= NIGHT_START || h < NIGHT_END) count++; // nuit : 20h00 → 06h00 (minute par minute : passage de minuit exact)
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return count;
}


export function fmt(mins) {
  return parseFloat((mins / 60).toFixed(2));
}

/**
 * Minutes de nuit contenues dans la pause déduite.
 * La pause est prise dans les périodes de repos du shift (Repos d'abord, puis Disponibilité ;
 * la plus longue d'abord), à partir du début de chaque période.
 */
export function breakNightMinutes(shift, breakMinutes, isCommuteRow = () => false) {
  const pauses = shift
    .filter((r) => (r.act === 'Repos' || r.act === 'Disponibilité') && r.dtEnd && !isCommuteRow(r))
    .map((r) => ({ ...r, dur: Math.max(0, Math.round((r.dtEnd - r.dtStart) / 60000)) }))
    .sort((a, b) => (a.act === b.act ? b.dur - a.dur : a.act === 'Repos' ? -1 : 1));
  let left = breakMinutes;
  let night = 0;
  for (const p of pauses) {
    if (left <= 0) break;
    const take = Math.min(left, p.dur);
    night += nightMinutes(p.dtStart, new Date(p.dtStart.getTime() + take * 60000));
    left -= take;
  }
  return night;
}

export function computeDaily(rows, homeCity, depotKeyword) {
  const map = {};
  let commuteMin = 0;
  const SHIFT_GAP = 9 * 60 * 60 * 1000;
  const ANOMALY = 12 * 60 * 60 * 1000;

  // Trier toutes les activités par heure de début
  const city = homeCity ? homeCity.toLowerCase() : null;
  const depot = depotKeyword ? depotKeyword.toLowerCase() : null;
  // Règle Alex : tout trajet PARTANT du domicile = non payé (trajet aller)
  // Retour : seulement Albert I-laan → domicile (retour dépôt). Ex: Opwijk→Lebbeke = payé.
  const isCommuteRow = ({ depart, arrivee }) =>
    Boolean((city && depart.includes(city)) || (city && depot && depart.includes(depot) && arrivee.includes(city)));

  const sorted = rows
    .map(r => ({
      act: r['Activité'],
      dtStart: parseDT(r['Heure de début']),
      dtEnd: parseDT(r['Heure de fin']),
      depart: (r['Position de départ'] || '').toLowerCase(),
      arrivee: (r['Emplacement de fin'] || '').toLowerCase(),
    }))
    .filter(r => r.act && r.dtStart)
    // Lignes > 12h (Webfleet resté en "Travail" tout le week-end) et repos journalier ≥ 9h :
    // ni payés ni comptés en nuit, et ne doivent pas coller deux shifts ensemble.
    .filter(r => {
      const span = r.dtEnd ? r.dtEnd - r.dtStart : 0;
      return span <= ANOMALY && !(r.act === 'Repos' && span >= SHIFT_GAP);
    })
    .sort((a, b) => a.dtStart - b.dtStart);

  // Grouper en shifts : pause ≥ 9h entre activités de travail = nouveau shift
  // On ignore les "Repos" pour calculer le gap — ils remplissent le temps mais ne sont pas du travail
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
      const { act, dtStart, dtEnd } = r;
      const dur = dtEnd ? Math.max(0, Math.round((dtEnd - dtStart) / 60000)) : 0;
      const isCommute = isCommuteRow(r);

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

    // Après 4h30 de conduite → déduire 45 min de pause obligatoire (non payée), prises sur la
    // disponibilité. Les minutes de pause situées entre 20h00 et 06h00 sont aussi retirées des
    // heures de nuit (sinon la pause reste comptée en nuit).
    if (map[key].conduite >= BREAK_AFTER_DRIVING) {
      const deducted = Math.min(BREAK_MINUTES, map[key].dispo);
      map[key].dispo -= deducted;
      map[key].night -= breakNightMinutes(shift, deducted, isCommuteRow);
    }
    // Les heures de nuit ne peuvent pas dépasser le temps de service (travail + disponibilité)
    map[key].night = Math.min(Math.max(0, map[key].night), map[key].travail + map[key].dispo);
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
