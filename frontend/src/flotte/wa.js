// Liens et messages WhatsApp (logique pure, testée dans whatsapp.test.js).

/** Numéro au format international sans « + » (wa.me). Numéros belges saisis en 04… acceptés. */
export function waNumber(phone) {
  if (!phone) return '';
  let d = String(phone).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `32${d.slice(1)}`;
  return d.length >= 8 ? d : '';
}

export function waLink(phone, text) {
  const n = waNumber(phone);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function openWhatsApp(phone, text) {
  window.open(waLink(phone, text), '_blank', 'noopener');
}

/* ─── Messages types ───────────────────────────────────────────────── */

const PLATFORM = typeof window !== 'undefined' ? window.location.origin : 'https://md-logistique.vercel.app';
const fd = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

export const messages = {
  identifiants: ({ prenom, ident, password }) =>
    `Bonjour${prenom ? ` ${prenom}` : ''},\n\nVoici votre accès à l'espace chauffeur M-D Logistique :\n${PLATFORM}\n\nIdentifiant : ${ident}\nMot de passe : ${password}\n\nVous pourrez y déclarer votre route du jour, envoyer la photo des CMR et vos documents.\n\nM-D Logistique`,
  lienPlateforme: ({ prenom }) =>
    `Bonjour${prenom ? ` ${prenom}` : ''},\n\nVotre espace chauffeur M-D Logistique : ${PLATFORM}\n\nM-D Logistique`,
  echeance: ({ prenom, document, date, daysRemaining }) => {
    const quand = daysRemaining < 0 ? `a expiré le ${fd(date)}` : `expire le ${fd(date)}`;
    const action = {
      'Code 95': 'Merci de prendre rendez-vous pour la formation continue (auto-école) au plus vite.',
      'Carte conducteur': 'Le bureau va lancer la demande de renouvellement : merci de nous confirmer vos coordonnées.',
      'Sélection médicale': 'Merci de prendre rendez-vous pour la visite médicale.',
    }[document] || 'Merci de faire le nécessaire et de nous envoyer le nouveau document.';
    return `Bonjour${prenom ? ` ${prenom}` : ''},\n\nVotre ${document} ${quand}.\n${action}\n\nVous pouvez envoyer la photo du nouveau document depuis votre espace : ${PLATFORM}\n\nMerci,\nM-D Logistique`;
  },
  documentsManquants: ({ prenom, documents }) =>
    `Bonjour${prenom ? ` ${prenom}` : ''},\n\nIl nous manque les documents suivants dans votre dossier :\n${documents.map((d) => `• ${d}`).join('\n')}\n\nMerci de les envoyer en photo depuis votre espace chauffeur (onglet Documents) : ${PLATFORM}\n\nM-D Logistique`,
  facture: ({ client, numero, periode, total }) =>
    `Bonjour,\n\nVeuillez trouver ci-joint la facture n° ${numero}${client ? ` (${client})` : ''} pour la période du ${periode}, d'un montant total de ${total}.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\nM-D logistique.com sprl`,
};
