// Boutons « Envoyer par WhatsApp » : ouvrent WhatsApp avec le numéro et le message déjà écrits.
// Aucun envoi automatique : l'utilisateur relit puis appuie sur Envoyer.
import { waLink, waNumber } from './wa';

export { messages, openWhatsApp, waLink, waNumber } from './wa';

const Logo = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.13c-.25.69-1.44 1.32-1.98 1.36-.5.05-.98.24-3.3-.69-2.8-1.1-4.58-3.97-4.72-4.15-.14-.18-1.13-1.5-1.13-2.87 0-1.37.72-2.04.97-2.32.25-.28.55-.35.74-.35l.53.01c.17 0 .4-.06.62.48.23.55.78 1.91.85 2.05.07.14.11.3.02.48-.09.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.92 1.07.95 1.97 1.24 2.25 1.38.28.14.44.12.6-.07.16-.19.69-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.14.46.21.53.32.07.12.07.67-.18 1.36Z" />
  </svg>
);

/**
 * props: phone (facultatif : sinon WhatsApp demande le contact), text, label, size, className
 */
export function WhatsAppButton({ phone, text, label = 'WhatsApp', size = 'sm', className = '', title }) {
  const sizes = { xs: 'px-2 py-1 text-[11px]', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const n = waNumber(phone);
  return (
    <a
      href={waLink(phone, text)}
      target="_blank"
      rel="noopener noreferrer"
      title={title || (n ? `Ouvrir WhatsApp avec +${n}` : 'Ouvrir WhatsApp (choisir le contact)')}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#25D366] font-semibold text-white shadow-sm transition hover:bg-[#1ebe5b] ${sizes[size]} ${className}`}
    >
      <Logo className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
      {label}
    </a>
  );
}
