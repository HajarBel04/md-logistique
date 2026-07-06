const XLSX = require('xlsx');
const { findConfig } = require('./chauffeurConfig');

function durationToMinutes(duration) {
  if (!duration) return 0;
  const text = String(duration).trim();
  let minutes = 0;
  const hoursMatch = text.match(/(\d+)\s*h/);
  const minutesMatch = text.match(/(\d+)\s*min/);
  if (hoursMatch) minutes += parseInt(hoursMatch[1], 10) * 60;
  if (minutesMatch) minutes += parseInt(minutesMatch[1], 10);
  return minutes;
}

function parseDateTime(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(2000 + parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]));
}

function nightMinutes(start, end) {
  if (!start || !end || end <= start) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    const h = cur.getHours();
    if (h >= 20 || h < 6) count++; // nuit 20h00–06h00
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return count;
}

function fmtMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

function pauseDeduction(conduiteMin) {
  if (conduiteMin >= 540) return 90;
  if (conduiteMin >= 270) return 45;
  return 0;
}

function isCommuteRow(row, homeCity) {
  if (!homeCity) return false;
  const city = homeCity.toLowerCase();
  const start = (row['Position de départ'] || '').toLowerCase();
  const end = (row['Emplacement de fin'] || '').toLowerCase();
  return start.includes(city) || end.includes(city);
}

function extractDriverName(sheetName) {
  return sheetName
    .replace('Temps de travail_', '')
    .replaceAll('-', ' ')
    .trim();
}

function parseWebfleetFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const driverName = extractDriverName(sheetName);
  const config = findConfig(driverName);
  const homeCity = config?.homeCity ?? null;

  const totals = {
    conduiteMinutes: 0,
    travailMinutes: 0,
    reposMinutes: 0,
    disponibiliteMinutes: 0,
    totalMinutes: 0,
    commuteMinutes: 0,
  };

  const dayMap = {};

  for (const row of rows) {
    const activity = row['Activité'];
    const minutesRaw = durationToMinutes(row['Durée']);
    const minutes = minutesRaw > 720 ? 0 : minutesRaw; // anomalie > 12h exclue
    const dtStart = parseDateTime(row['Heure de début']);
    const dtEnd = parseDateTime(row['Heure de fin']);
    const commute = isCommuteRow(row, homeCity);

    if (commute) {
      totals.commuteMinutes += minutes;
      continue; // exclude from all paid calculations
    }

    totals.totalMinutes += minutes;
    if (activity === 'Conduite') totals.conduiteMinutes += minutes;
    if (activity === 'Travail') totals.travailMinutes += minutes;
    if (activity === 'Repos') totals.reposMinutes += minutes;
    if (activity === 'Disponibilité') totals.disponibiliteMinutes += minutes;

    if (!dtStart || !activity) continue;

    const dayKey = dtStart.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    }).replace(/\//g, '.');

    if (!dayMap[dayKey]) dayMap[dayKey] = { conduite: 0, dispo: 0, night: 0 };

    if (activity === 'Conduite') {
      dayMap[dayKey].conduite += minutes;
    } else {
      dayMap[dayKey].dispo += minutes;
    }

    if (dtEnd) {
      dayMap[dayKey].night += nightMinutes(dtStart, dtEnd);
    }
  }

  const dailyBreakdown = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => {
      const deduction = pauseDeduction(d.conduite);
      const dispoNet = Math.max(0, d.dispo - deduction);
      return {
        date,
        conduite: fmtMinutes(d.conduite),
        disponibilite: fmtMinutes(dispoNet),
        pauseDeduite: deduction > 0 ? fmtMinutes(deduction) : null,
        heureNuit: fmtMinutes(d.night),
        conduiteMin: d.conduite,
        dispoMin: dispoNet,
      };
    });

  return {
    sheetName,
    driverName,
    homeCity,
    depotKeyword: config?.depotKeyword ?? null,
    commuteExcluded: totals.commuteMinutes > 0,
    commuteMinutes: totals.commuteMinutes,
    totalRows: rows.length,
    dailyBreakdown,
    totals: {
      conduiteHeures: +(totals.conduiteMinutes / 60).toFixed(2),
      travailHeures: +(totals.travailMinutes / 60).toFixed(2),
      heuresTravaillees: +((totals.conduiteMinutes + totals.travailMinutes) / 60).toFixed(2),
      reposHeures: +(totals.reposMinutes / 60).toFixed(2),
      disponibiliteHeures: +(totals.disponibiliteMinutes / 60).toFixed(2),
      totalHeures: +(totals.totalMinutes / 60).toFixed(2),
    },
    preview: rows.slice(0, 5),
  };
}

module.exports = { parseWebfleetFile };
