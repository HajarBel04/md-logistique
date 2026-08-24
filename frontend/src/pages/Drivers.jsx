import { useState, useRef, useMemo, useCallback } from 'react';

const API = 'http://localhost:8787';
import PageHeader from '../components/PageHeader';

/* ═══════════════════════════════════════════════════════════
   DOC DEFINITIONS
═══════════════════════════════════════════════════════════ */
const DOC_DEFS = {
  camion: [
    { key: 'carte-identite',   label: "Carte d'identité",  required: true  },
    { key: 'permis-ce',        label: 'Permis CE',          required: true  },
    { key: 'carte-conducteur', label: 'Carte conducteur',   required: true  },
    { key: 'badge-koln',       label: 'Badge Köln',         required: false },
  ],
  camionnette: [
    { key: 'carte-identite', label: "Carte d'identité", required: true  },
    { key: 'permis-b',       label: 'Permis B',          required: true  },
    { key: 'attestation',    label: 'Attestation cond.', required: false },
  ],
};

/* ═══════════════════════════════════════════════════════════
   INITIAL DATA  (pré-chargé depuis samples/)
═══════════════════════════════════════════════════════════ */
const d = (file) => (file ? { file, uploadedAt: '23/08/2026', url: null } : null);

const INITIAL_DRIVERS = [
  /* ── CAMION ─────────────────────────────────────────── */
  { id: 'adib-abderazak', type: 'camion', name: 'ADIB Abderazak', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d("Carte d'identité.pdf"), 'permis-ce': d('Permis.pdf'), 'carte-conducteur': d('Carte conducteur.pdf'), 'badge-koln': null } },
  { id: 'allouchi-abdelmajid', type: 'camion', name: 'ALLOUCHI Abdelmajid', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': null, 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'amghar-youssef', type: 'camion', name: 'AMGHAR Youssef', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d("Carte d'identité.pdf"), 'permis-ce': d('Permis.pdf'), 'carte-conducteur': d('Carte conducteur.pdf'), 'badge-koln': null } },
  { id: 'bekkali-faouzi', type: 'camion', name: 'BEKKALI Faouzi', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': d('MD028 Faouzi CE.pdf'), 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'belkhatir-tayeb', type: 'camion', name: 'BELKHATIR Tayeb', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d('ID Tayeb.pdf'), 'permis-ce': d('Belkhatir Tayeb Permis.pdf'), 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'belyayev-oleg', type: 'camion', name: 'BELYAYEV Oleg', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d('ID Oleg.pdf'), 'permis-ce': null, 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'bendada-mohamed', type: 'camion', name: 'BENDADA Mohamed', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': d('Permis Recto M. Bendada.jpeg'), 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'bouhtala-hamid', type: 'camion', name: 'BOUHTALA OUCHEN Hamid', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': null, 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'dahmani-mohamed', type: 'camion', name: 'DAHMANI Mohamed', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d('Koln id.jpeg'), 'permis-ce': d('permis mo Dh.jpeg'), 'carte-conducteur': d('Carte cond.jpeg'), 'badge-koln': null } },
  { id: 'didouche-mohamed', type: 'camion', name: 'DIDOUCHE Mohamed', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': d('Permis (1).pdf'), 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'el-ghammat', type: 'camion', name: 'EL GHAMMAT CHAKOUR Abdessamad', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': null, 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'mechate-noureddine', type: 'camion', name: 'MECHATE Noureddine', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': null, 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'oukil-houssam', type: 'camion', name: 'OUKIL Houssam', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d('Scan2025-10-16_132237.pdf'), 'permis-ce': d('Scan2025-10-16_132259.pdf'), 'carte-conducteur': d('Scan2025-10-16_132321.pdf'), 'badge-koln': null } },
  { id: 'oulad-bellechkar', type: 'camion', name: 'OULAD BELLECHKAR Gellel', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d("Carte d'identité.pdf"), 'permis-ce': d('Permis.pdf'), 'carte-conducteur': null, 'badge-koln': d('Validité badge Koln.jpeg') } },
  { id: 'pirvulescu-sorin', type: 'camion', name: 'PIRVULESCU Sorin Gabriel', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d("Carte d'identité.pdf"), 'permis-ce': d('Permis.pdf'), 'carte-conducteur': d('Carte conducteur.pdf'), 'badge-koln': null } },
  { id: 'sidibe-mohamed', type: 'camion', name: 'SIDIBE SIDIBE Mohamed', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d("Carte d'identité (1).pdf"), 'permis-ce': d('Permis.pdf'), 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'temsamani-jawad', type: 'camion', name: 'TEMSAMANI Jawad', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': d('CI Jawad 01.pdf'), 'permis-ce': d('Permis Jawad 01.pdf'), 'carte-conducteur': null, 'badge-koln': null } },
  { id: 'vural-sami', type: 'camion', name: 'VURAL Sami', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '',
    docs: { 'carte-identite': null, 'permis-ce': null, 'carte-conducteur': null, 'badge-koln': null } },
  /* ── CAMIONNETTE ─────────────────────────────────────── */
  { id: 'alouache-chaouki', type: 'camionnette', name: 'ALOUACHE Chaouki', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d("Carte d'identité (1).pdf"), 'permis-b': null, 'attestation': null } },
  { id: 'annouri-jamal', type: 'camionnette', name: 'ANNOURI Jamal', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d('Carte ID Annouri Jamal.pdf'), 'permis-b': d('Permis de conduire Annouri Jamal.pdf'), 'attestation': null } },
  { id: 'berruho-imad', type: 'camionnette', name: 'BERRUHO BERROUHO Imad', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d("Carte d'dentité.pdf"), 'permis-b': d('Permis.pdf'), 'attestation': null } },
  { id: 'el-fekri-nabil', type: 'camionnette', name: 'EL FEKRI Nabil', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d('Carte ID El Fekri Nabil.pdf'), 'permis-b': d('Permis de Conduire El Fekri Nabil.pdf'), 'attestation': null } },
  { id: 'faratto-karim', type: 'camionnette', name: 'FARATTO Karim', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d('ID Faratto.pdf'), 'permis-b': d('Doc Karim.pdf'), 'attestation': d('ATTESTATION Conducteur 08.10.2026.pdf') } },
  { id: 'rawek-antoan', type: 'camionnette', name: 'RAWEK Antoan', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d("Carte d'identité.pdf"), 'permis-b': d('Permis.pdf'), 'attestation': null } },
  { id: 'riahi-karim', type: 'camionnette', name: 'RIAHI Karim', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': null, 'permis-b': null, 'attestation': null } },
  { id: 'sadok-abdeladim', type: 'camionnette', name: 'SADOK Abdeladim', phone: '', permisNum: '', permisExp: '',
    docs: { 'carte-identite': d("Carte d'identité.pdf"), 'permis-b': d('Permis.pdf'), 'attestation': null } },
];

/* ═══════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════ */
function getInitials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  'bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500',   'bg-amber-500', 'bg-cyan-500',   'bg-fuchsia-500',
];
function avatarColor(name) {
  const n = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

function completeness(driver) {
  const req = DOC_DEFS[driver.type].filter(x => x.required);
  const done = req.filter(x => driver.docs[x.key] !== null).length;
  return { total: req.length, done, pct: Math.round((done / req.length) * 100) };
}

function statusTag(driver) {
  const { total, done } = completeness(driver);
  if (done === total) return 'complete';
  if (done === 0)    return 'empty';
  return 'partial';
}

/* ═══════════════════════════════════════════════════════════
   VEHICLE ICONS  (silhouettes pixel-parfaites, style premium)
═══════════════════════════════════════════════════════════ */
const IcnCamion = ({ className = 'h-5 w-8' }) => (
  <svg className={className} viewBox="0 0 48 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Remorque */}
    <rect x="0" y="4" width="30" height="16" rx="2"/>
    {/* Cabine */}
    <path d="M30 8 L30 20 L47 20 L47 12 L42 8 Z" rx="1"/>
    {/* Pare-brise */}
    <path d="M31.5 9.5 L40 9.5 L44.5 14 L31.5 14 Z" fill="white" opacity="0.25"/>
    {/* Feux avant */}
    <rect x="44.5" y="15" width="2" height="3" rx="0.5" fill="white" opacity="0.5"/>
    {/* Roues camion */}
    <circle cx="8"  cy="21.5" r="4.5" fill="currentColor"/>
    <circle cx="8"  cy="21.5" r="2"   fill="white" opacity="0.3"/>
    <circle cx="20" cy="21.5" r="4.5" fill="currentColor"/>
    <circle cx="20" cy="21.5" r="2"   fill="white" opacity="0.3"/>
    {/* Roues cabine */}
    <circle cx="39" cy="21.5" r="4.5" fill="currentColor"/>
    <circle cx="39" cy="21.5" r="2"   fill="white" opacity="0.3"/>
    {/* Attelage */}
    <rect x="29" y="17" width="3" height="2" rx="0.5" opacity="0.6"/>
    {/* Détail remorque */}
    <line x1="10" y1="4" x2="10" y2="20" stroke="white" strokeWidth="0.8" opacity="0.15"/>
    <line x1="20" y1="4" x2="20" y2="20" stroke="white" strokeWidth="0.8" opacity="0.15"/>
  </svg>
);

const IcnCamionnette = ({ className = 'h-5 w-7' }) => (
  <svg className={className} viewBox="0 0 42 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Caisse */}
    <rect x="0" y="5" width="24" height="15" rx="1.5"/>
    {/* Cabine */}
    <path d="M24 9 L24 20 L41 20 L41 13 L35 9 Z"/>
    {/* Pare-brise */}
    <path d="M25.5 10.5 L33.5 10.5 L38 15 L25.5 15 Z" fill="white" opacity="0.25"/>
    {/* Feux */}
    <rect x="38.5" y="15.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.5"/>
    {/* Roues */}
    <circle cx="8"  cy="21.5" r="4.5" fill="currentColor"/>
    <circle cx="8"  cy="21.5" r="2"   fill="white" opacity="0.3"/>
    <circle cx="33" cy="21.5" r="4.5" fill="currentColor"/>
    <circle cx="33" cy="21.5" r="2"   fill="white" opacity="0.3"/>
    {/* Détail porte */}
    <line x1="23.5" y1="5" x2="23.5" y2="20" stroke="white" strokeWidth="1" opacity="0.2"/>
    <rect x="11" y="10" width="9" height="7" rx="1" fill="white" opacity="0.12"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   ICONS (inline SVG helpers)
═══════════════════════════════════════════════════════════ */
const IcnEye = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcnUpload = ({ size = 4 }) => (
  <svg className={`h-${size} w-${size}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IcnTrash = ({ size = 4 }) => (
  <svg className={`h-${size} w-${size}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IcnEdit = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcnSearch = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IcnPlus = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IcnClose = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IcnScan = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.5"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   DOC ROW
═══════════════════════════════════════════════════════════ */
function DocRow({ def, docData, driverName, driverType, onUpload, onReplace, onDelete, onDateExtracted }) {
  const uploaded = docData !== null;
  const isPdf    = uploaded && docData.file?.toLowerCase().endsWith('.pdf');
  const [scanning, setScanning] = useState(false);
  const [extractedDate, setExtractedDate] = useState(docData?.expiry_date ?? null);

  // Build backend URL to preview the file
  const fileUrl = uploaded
    ? docData.url  // locally uploaded (object URL)
      ?? `${API}/api/chauffeurs/file?type=${driverType}&folder=${encodeURIComponent(driverName)}&filename=${encodeURIComponent(docData.file)}`
    : null;

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(
        `${API}/api/chauffeurs/extract-dates?type=${driverType}&folder=${encodeURIComponent(driverName)}&filename=${encodeURIComponent(docData.file)}`
      );
      const data = await res.json();
      if (data.expiry_date) {
        setExtractedDate(data.expiry_date);
        onDateExtracted?.(def.key, data.expiry_date, data.expiry_iso);
      } else {
        setExtractedDate('—');
      }
    } catch {
      setExtractedDate('erreur');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={`flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2 transition-colors ${
      !uploaded && def.required
        ? 'bg-red-50 dark:bg-red-900/20'
        : uploaded
          ? 'bg-slate-50 dark:bg-slate-800/40'
          : 'bg-slate-50/60 dark:bg-slate-800/20'
    }`}>
      {/* Status dot */}
      <span className={`h-2 w-2 shrink-0 rounded-full ${
        uploaded
          ? 'bg-emerald-500'
          : def.required
            ? 'bg-red-500 animate-pulse'
            : 'bg-slate-300 dark:bg-slate-600'
      }`} />

      {/* Label + filename + date */}
      <span className="min-w-0 flex-1 leading-tight">
        <span className={`block truncate text-[13px] font-semibold ${
          uploaded
            ? 'text-slate-800 dark:text-slate-200'
            : def.required
              ? 'text-red-700 dark:text-red-300'
              : 'text-slate-500 dark:text-slate-400'
        }`}>
          {def.label}
          {!uploaded && def.required && (
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500"> · MANQUANT</span>
          )}
          {!uploaded && !def.required && (
            <span className="ml-1.5 text-[10px] text-slate-400"> · optionnel</span>
          )}
        </span>
        {uploaded && (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="truncate">{docData.file}</span>
            {extractedDate && extractedDate !== '—' && extractedDate !== 'erreur' && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                exp. {extractedDate}
              </span>
            )}
          </span>
        )}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        {uploaded ? (
          <>
            {/* Aperçu — toujours actif via backend */}
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              title="Aperçu du document"
              className="icon-btn text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700">
              <IcnEye />
            </button>

            {/* Scan dates — PDF uniquement */}
            {isPdf && (
              <button
                onClick={handleScan}
                disabled={scanning}
                title="Extraire la date d'expiration par OCR"
                className={`icon-btn transition ${
                  scanning
                    ? 'animate-pulse text-orange-400'
                    : 'text-slate-400 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400'
                }`}>
                <IcnScan />
              </button>
            )}

            <button onClick={onReplace} title="Remplacer le fichier"
              className="icon-btn text-slate-400 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/30 dark:hover:text-orange-400">
              <IcnUpload />
            </button>
            <button onClick={onDelete} title="Supprimer"
              className="icon-btn text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400">
              <IcnTrash />
            </button>
          </>
        ) : (
          <button onClick={onUpload}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-bold transition active:scale-95 ${
              def.required
                ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
            <IcnUpload size={3} />
            {def.required ? 'Uploader' : 'Ajouter'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DRIVER CARD
═══════════════════════════════════════════════════════════ */
function DriverCard({ driver, onUploadDoc, onDeleteDoc, onDeleteDriver, onEdit, onUpdateField }) {
  const { total, done, pct } = completeness(driver);
  const tag = statusTag(driver);
  const initials = getInitials(driver.name);
  const color = avatarColor(driver.name);
  const defs = DOC_DEFS[driver.type];
  const isCamion = driver.type === 'camion';

  return (
    <div className="surface-card overflow-hidden flex flex-col">
      {/* ── Card header ── */}
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${color} text-[13px] font-extrabold text-white shadow-sm`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-1.5">
            <h3 className="text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
              {driver.name}
            </h3>
            <span className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isCamion
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
            }`}>
              {isCamion
                ? <><IcnCamion className="h-3 w-5" /> Camion</>
                : <><IcnCamionnette className="h-3 w-4" /> Camionnette</>}
            </span>
          </div>
          {driver.phone && (
            <p className="mt-0.5 text-[11px] text-slate-400">{driver.phone}</p>
          )}
          {driver.permisNum && (
            <p className="text-[11px] text-slate-400">Permis {driver.permisNum}{driver.permisExp ? ` · exp. ${driver.permisExp}` : ''}</p>
          )}
          {isCamion && driver.carteNum && (
            <p className="text-[11px] text-slate-400">Carte {driver.carteNum}{driver.carteExp ? ` · exp. ${driver.carteExp}` : ''}</p>
          )}
        </div>
        {/* Dossier status pill */}
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
          tag === 'complete'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
            : tag === 'empty'
              ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
        }`}>
          {tag === 'complete' ? '✓ Complet' : tag === 'empty' ? '✗ Vide' : '⚠ Incomplet'}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-red-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
            {done}/{total}
          </span>
        </div>
      </div>

      <div className="mx-5 border-t border-slate-100 dark:border-slate-800" />

      {/* ── Documents ── */}
      <div className="flex-1 space-y-1.5 p-4">
        {defs.map((def) => (
          <DocRow
            key={def.key}
            def={def}
            docData={driver.docs[def.key]}
            driverName={driver.name}
            driverType={driver.type}
            onUpload={() => onUploadDoc(driver.id, def.key)}
            onReplace={() => onUploadDoc(driver.id, def.key)}
            onDelete={() => onDeleteDoc(driver.id, def.key)}
            onDateExtracted={(docKey, expiry_date) => {
              if (docKey === 'permis-ce' || docKey === 'permis-b') {
                onUpdateField(driver.id, 'permisExp', expiry_date);
              } else if (docKey === 'carte-conducteur') {
                onUpdateField(driver.id, 'carteExp', expiry_date);
              }
            }}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <button onClick={() => onEdit(driver)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
          <IcnEdit /> Modifier le profil
        </button>
        <button
          onClick={() => window.confirm(`Supprimer le profil de ${driver.name} ?`) && onDeleteDriver(driver.id)}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
          <IcnTrash size={3} /> Supprimer
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD / EDIT MODAL
═══════════════════════════════════════════════════════════ */
function DriverModal({ driver, onClose, onSave }) {
  const isNew = !driver;
  const [form, setForm] = useState(
    driver
      ? { type: driver.type, name: driver.name, phone: driver.phone,
          permisNum: driver.permisNum, permisExp: driver.permisExp,
          carteNum: driver.carteNum ?? '', carteExp: driver.carteExp ?? '' }
      : { type: 'camion', name: '', phone: '', permisNum: '', permisExp: '', carteNum: '', carteExp: '' }
  );

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 placeholder:text-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="surface-card w-full max-w-md max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {isNew ? 'Nouveau chauffeur' : `Modifier — ${driver.name}`}
          </h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <IcnClose />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-6">

          {/* Type */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: 'camion',      label: 'Camion',      Icon: IcnCamion,      icls: 'h-6 w-10', active: 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                { k: 'camionnette', label: 'Camionnette', Icon: IcnCamionnette, icls: 'h-6 w-8',  active: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
              ].map(({ k, label, Icon, icls, active }) => (
                <button key={k} type="button" onClick={() => set('type', k)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 text-sm font-bold transition ${
                    form.type === k ? active : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                  }`}>
                  <Icon className={icls} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Nom complet *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="NOM Prénom" className={inputCls} />
          </div>

          {/* Téléphone */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Téléphone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+32 4xx xx xx xx" className={inputCls} />
          </div>

          {/* Permis */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">N° Permis</label>
              <input value={form.permisNum} onChange={e => set('permisNum', e.target.value)} placeholder="BE-XXXXXX" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Expiration</label>
              <input type="date" value={form.permisExp} onChange={e => set('permisExp', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Carte conducteur — Camion uniquement */}
          {form.type === 'camion' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">N° Carte conducteur</label>
                <input value={form.carteNum} onChange={e => set('carteNum', e.target.value)} placeholder="BExxxxxxxxxxxxxxx" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Expiration</label>
                <input type="date" value={form.carteExp} onChange={e => set('carteExp', e.target.value)} className={inputCls} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Annuler
          </button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()}
            className="flex-1 rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-40">
            {isNew ? 'Créer le chauffeur' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function Drivers() {
  const [drivers, setDrivers]   = useState(INITIAL_DRIVERS);
  const [activeTab, setActiveTab] = useState('camion');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // null | {} (add) | driver (edit)

  const fileInputRef  = useRef(null);
  const pendingUpload = useRef(null); // { driverId, docKey }

  /* ── Derived stats ── */
  const camionList      = drivers.filter(d => d.type === 'camion');
  const camionnetteList = drivers.filter(d => d.type === 'camionnette');
  const totalComplete   = drivers.filter(d => statusTag(d) === 'complete').length;
  const totalMissing    = drivers.reduce((acc, dr) => {
    return acc + DOC_DEFS[dr.type].filter(def => def.required && !dr.docs[def.key]).length;
  }, 0);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    const list = activeTab === 'camion' ? camionList : camionnetteList;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(dr => dr.name.toLowerCase().includes(q));
  }, [drivers, activeTab, search]);

  /* ── File upload flow ── */
  const handleUploadDoc = (driverId, docKey) => {
    pendingUpload.current = { driverId, docKey };
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !pendingUpload.current) return;
    const { driverId, docKey } = pendingUpload.current;
    const url = URL.createObjectURL(file);
    setDrivers(prev => prev.map(dr =>
      dr.id === driverId
        ? { ...dr, docs: { ...dr.docs, [docKey]: { file: file.name, uploadedAt: new Date().toLocaleDateString('fr-FR'), url } } }
        : dr
    ));
    pendingUpload.current = null;
    e.target.value = '';
  };

  const handleDeleteDoc = (driverId, docKey) => {
    if (!window.confirm('Supprimer ce document du dossier ?')) return;
    setDrivers(prev => prev.map(dr =>
      dr.id === driverId ? { ...dr, docs: { ...dr.docs, [docKey]: null } } : dr
    ));
  };

  const handleDeleteDriver = (driverId) => {
    setDrivers(prev => prev.filter(dr => dr.id !== driverId));
  };

  const handleUpdateField = (driverId, field, value) => {
    setDrivers(prev => prev.map(dr => dr.id === driverId ? { ...dr, [field]: value } : dr));
  };

  /* ── Modal save ── */
  const handleSave = (form) => {
    if (modal?.id) {
      // EDIT — preserve docs; reset if type changed
      const typeChanged = modal.type !== form.type;
      const docs = typeChanged
        ? Object.fromEntries(DOC_DEFS[form.type].map(x => [x.key, null]))
        : modal.docs;
      setDrivers(prev => prev.map(dr => dr.id === modal.id ? { ...modal, ...form, docs } : dr));
    } else {
      // ADD
      const id = `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const docs = Object.fromEntries(DOC_DEFS[form.type].map(x => [x.key, null]));
      setDrivers(prev => [...prev, { ...form, id, docs }]);
    }
    setModal(null);
  };

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden" onChange={handleFileChange} />

      {/* ── Page header ── */}
      <PageHeader
        title="Chauffeurs"
        badge="Personnel roulant"
        description="Gérez les profils et dossiers des chauffeurs — uploadez, remplacez ou supprimez les documents requis."
        action={
          <button onClick={() => setModal({})}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-95">
            <IcnPlus /> Ajouter un chauffeur
          </button>
        }
      />

      {/* ── Stats ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total chauffeurs', val: drivers.length,
            sub: `${camionList.length} camion · ${camionnetteList.length} camionnette`,
            color: 'text-orange-600 dark:text-orange-400' },
          { label: 'Dossiers complets', val: totalComplete,
            sub: `${drivers.length - totalComplete} dossier(s) incomplet(s)`,
            color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Documents manquants', val: totalMissing,
            sub: 'parmi les documents obligatoires',
            color: totalMissing > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
        ].map(({ label, val, sub, color }) => (
          <div key={label} className="surface-card px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            <p className={`mt-1 text-3xl font-extrabold tabular-nums ${color}`}>{val}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
          </div>
        ))}
      </section>

      {/* ── Tabs + Search ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tab pills */}
        <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {[
            { key: 'camion',      label: 'Camion',      Icon: IcnCamion,      count: camionList.length,      activeClass: 'bg-orange-600 text-white', iconCls: 'h-4 w-6' },
            { key: 'camionnette', label: 'Camionnette', Icon: IcnCamionnette, count: camionnetteList.length, activeClass: 'bg-blue-600 text-white',   iconCls: 'h-4 w-5' },
          ].map(({ key, label, Icon, count, activeClass, iconCls }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold transition ${
                activeTab === key
                  ? activeClass
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}>
              <Icon className={iconCls} />
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === key
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IcnSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un chauffeur…"
            className="w-56 rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
        </div>
      </div>

      {/* ── Cards grid ── */}
      {filtered.length === 0 ? (
        <div className="surface-card p-16 text-center text-slate-400">
          Aucun chauffeur{search ? ` pour « ${search} »` : ''}.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(driver => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onUploadDoc={handleUploadDoc}
              onDeleteDoc={handleDeleteDoc}
              onDeleteDriver={handleDeleteDriver}
              onEdit={d => setModal(d)}
              onUpdateField={handleUpdateField}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modal !== null && (
        <DriverModal
          driver={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
