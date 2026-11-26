// Libellés, statuts et formats partagés du module Flotte & Conformité

export const CATEGORY_LABELS = {
  TRACTEUR: 'Tracteur',
  REMORQUE: 'Remorque',
  CAMION: 'Camion',
  CAMION_ADR: 'Camion ADR',
  REMORQUE_ADR: 'Remorque ADR',
};
export const CATEGORY_PLURAL = {
  TRACTEUR: 'Tracteurs',
  REMORQUE: 'Remorques',
  CAMION: 'Camions',
  CAMION_ADR: 'Camions ADR',
  REMORQUE_ADR: 'Remorques ADR',
};
export const MOTORISES = ['TRACTEUR', 'CAMION', 'CAMION_ADR'];
export const ADR_VEHICLES = ['CAMION_ADR', 'REMORQUE_ADR'];

export const STATUT_LABELS = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  EN_COURS_EMBAUCHE: "En cours d'embauche",
};
export const TYPE_CHAUFFEUR_LABELS = {
  POIDS_LOURD: 'Poids lourd',
  CAMIONNETTE: 'Camionnette',
};
export const PERMIS_CATEGORIES = ['AM', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'C1E', 'CE', 'D1E', 'DE', 'G'];
export const ADR_CATEGORIES = ['Colis', 'Citernes', 'Classe 1', 'Classe 7'];

export const SLOTS = [
  { key: 'CARTE_IDENTITE', num: 1, label: "Carte d'identité / Séjour", card: true },
  { key: 'PERMIS_CONDUIRE', num: 2, label: 'Permis de conduire', hint: 'Recto / Verso', card: true },
  { key: 'CARTE_CHAUFFEUR', num: 3, label: 'Carte conducteur', hint: 'Tachygraphe — Recto / Verso', card: true },
  { key: 'SELECTION_MEDICALE', num: 4, label: 'Sélection médicale', hint: 'Visite médicale' },
  { key: 'CERTIFICAT_ADR', num: 5, label: 'Certificat ADR' },
  { key: 'FICHE_SIGNALETIQUE', num: 6, label: 'Fiche signalétique' },
  { key: 'CONTRAT_TRAVAIL', num: 7, label: 'Contrat de travail' },
  { key: 'DIMONA', num: 8, label: 'Déclaration DIMONA' },
  { key: 'CARTE_BANCAIRE', num: 9, label: 'Carte bancaire / RIB', card: true },
  { key: 'BADGE_KOLN', num: 10, label: 'Badge Köln', hint: 'Facultatif', card: true, only: 'POIDS_LOURD' },
  { key: 'ATTESTATION_CONDUCTEUR', num: 10, label: 'Attestation conducteur', hint: 'Facultatif', only: 'CAMIONNETTE' },
];
/** Emplacements à afficher pour un chauffeur (selon son type, + ceux déjà remplis). */
export const slotsFor = (typeChauffeur, documents = {}) =>
  SLOTS.filter((s) => !s.only || s.only === typeChauffeur || documents?.[s.key]);
export const SLOT_BY_KEY = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

// Échéance → document justificatif dans le dossier chauffeur
export const DOC_TYPE_SLOT = {
  PERMIS: 'PERMIS_CONDUIRE',
  CODE_95: 'PERMIS_CONDUIRE',
  SELECTION_MEDICALE: 'SELECTION_MEDICALE',
  CARTE_CONDUCTEUR: 'CARTE_CHAUFFEUR',
  ADR_CHAUFFEUR: 'CERTIFICAT_ADR',
  BADGE_KOLN: 'BADGE_KOLN',
  ATTESTATION_CONDUCTEUR: 'ATTESTATION_CONDUCTEUR',
};

export const STATUS_META = {
  valide: { label: 'Valide', tone: 'green' },
  bientot: { label: 'Expire bientôt', tone: 'amber' },
  expire: { label: 'Expiré', tone: 'red' },
  manquant: { label: 'Date manquante', tone: 'red-soft' },
  facultatif: { label: 'Non renseigné', tone: 'slate' },
  na: { label: 'Non applicable', tone: 'none' },
};

export const TONE_CLASSES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
  red: 'bg-red-50 text-red-700 ring-red-600/25 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25',
  'red-soft': 'bg-white text-red-600 ring-red-300 dark:bg-transparent dark:text-red-300 dark:ring-red-400/40',
  slate: 'bg-slate-50 text-slate-500 ring-slate-300/60 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-600/50',
  none: 'bg-transparent text-slate-400 ring-transparent dark:text-slate-600',
};

const DATE_FMT = new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const DATETIME_FMT = new Intl.DateTimeFormat('fr-BE', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return DATE_FMT.format(new Date(y, m - 1, d));
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return DATETIME_FMT.format(new Date(iso));
}

export function countdown(days) {
  if (days === null || days === undefined) return '';
  if (days < 0) return `Expiré depuis ${-days} j`;
  if (days === 0) return "Expire aujourd'hui";
  if (days === 1) return 'Expire demain';
  return `Dans ${days} j`;
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addYearsIso(iso, years) {
  const base = iso || todayIso();
  const [y, m, d] = base.slice(0, 10).split('-').map(Number);
  return `${y + years}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function normalizePlate(value) {
  return (value || '').replace(/[\s\-.]/g, '').toUpperCase();
}

export function slugify(text) {
  return (text || 'document')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}
