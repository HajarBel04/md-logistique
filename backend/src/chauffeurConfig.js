const XLSX = require('xlsx');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../samples/Chauffeur M-D LOG.xlsx');

let cache = null;

function normalizeStr(s) {
  return s.toLowerCase().replace(/\xa0/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractHomeCity(rows) {
  // City line is typically the 3rd row: "9280 Lebbeke" or "1000 Bruxelles"
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const line = rows[i].map(c => String(c || '')).join(' ').replace(/\xa0/g, ' ').trim();
    const m = line.match(/^\d{4,5}\s+(.+)/);
    if (m) return m[1].trim().toLowerCase();
  }
  return null;
}

function extractDepotKeyword(rows) {
  const fullText = rows.flat().map(c => String(c || '')).join(' ').toLowerCase().replace(/\xa0/g, ' ');

  if (fullText.includes('albert i') || fullText.includes('albertlaan') || fullText.includes('albetlaan')) {
    return 'Albert I';
  }
  if (fullText.includes('scheldeweg') || (fullText.includes('boom') && fullText.includes('commence'))) {
    return 'Boom';
  }
  if (fullText.includes('erembodegem')) return 'Erembodegem';
  if (fullText.includes('hoeselt')) return 'Hoeselt';
  if (fullText.includes('roeselare') || fullText.includes('zwaaikomstraat')) return 'Roeselare';
  if (fullText.includes('boom')) return 'Boom';
  return null;
}

function loadConfigs() {
  if (cache) return cache;

  try {
    const wb = XLSX.readFile(CONFIG_PATH);
    const configs = [];

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      configs.push({
        sheetName,
        normalizedName: normalizeStr(sheetName),
        homeCity: extractHomeCity(rows),
        depotKeyword: extractDepotKeyword(rows),
      });
    }

    cache = configs;
    return configs;
  } catch (e) {
    console.warn('chauffeurConfig: impossible de lire le fichier config:', e.message);
    return [];
  }
}

function wordOverlap(a, b) {
  const wordsA = a.split(/[\s\-_]+/).filter(w => w.length > 2);
  const wordsB = b.split(/[\s\-_]+/).filter(w => w.length > 2);
  return wordsA.filter(w => wordsB.includes(w)).length;
}

function findConfig(driverName) {
  const configs = loadConfigs();
  const normalized = normalizeStr(driverName);

  let best = null;
  let bestScore = 0;

  for (const cfg of configs) {
    const score = wordOverlap(normalized, cfg.normalizedName);
    if (score > bestScore) {
      bestScore = score;
      best = cfg;
    }
  }

  return bestScore > 0 ? best : null;
}

module.exports = { findConfig, loadConfigs };
