// Composants d'interface partagés du module Flotte & Conformité
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { STATUS_META, TONE_CLASSES, countdown, formatDate, addYearsIso } from './utils';

/* ─── Badges de statut ──────────────────────────────────────────────── */

export function StatusPill({ status, children, className = '' }) {
  const meta = STATUS_META[status] || STATUS_META.na;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONE_CLASSES[meta.tone]} ${className}`}
    >
      {meta.tone !== 'none' && meta.tone !== 'slate' && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', 'red-soft': 'bg-red-400' }[meta.tone]
          }`}
        />
      )}
      {children ?? meta.label}
    </span>
  );
}

/** Cellule d'échéance : date + badge compte à rebours. */
export function DeadlineCell({ item, compact = false }) {
  if (!item || item.status === 'na') {
    return <span className="text-xs text-slate-400 dark:text-slate-600">Non applicable</span>;
  }
  if (!item.date) {
    return <StatusPill status={item.status} />;
  }
  return (
    <div className={`flex flex-col items-start ${compact ? 'gap-0.5' : 'gap-1'}`}>
      <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatDate(item.date)}</span>
      <StatusPill status={item.status}>{countdown(item.daysRemaining)}</StatusPill>
    </div>
  );
}

/* ─── Toasts ─────────────────────────────────────────────────────────── */

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-4 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-4 sm:left-auto sm:max-w-sm" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 ${
              t.tone === 'error'
                ? 'bg-red-600 text-white ring-red-700'
                : 'bg-slate-900 text-white ring-slate-800 dark:bg-white dark:text-slate-900'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ─── Modale & tiroir ────────────────────────────────────────────────── */

function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Modal({ title, subtitle, onClose, children, footer, size = 'md' }) {
  useEscape(onClose);
  const width = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }[size];
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`flex max-h-[94vh] w-full ${width} flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800 sm:rounded-3xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <IconButton label="Fermer" onClick={onClose}><CloseIcon /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ title, subtitle, badge, onClose, children, actions }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside className="flex h-full w-full max-w-3xl flex-col bg-slate-50 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-extrabold text-slate-900 dark:text-slate-50">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <IconButton label="Fermer" onClick={onClose}><CloseIcon /></IconButton>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </aside>
    </div>
  );
}

/* ─── Boutons & champs ───────────────────────────────────────────────── */

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-orange-600 text-white shadow-sm hover:bg-orange-700',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
    secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 dark:bg-transparent dark:text-red-300 dark:ring-red-500/40 dark:hover:bg-red-500/10',
  };
  return (
    <button type="button" className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const inputBase =
  'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
export const inputClass = `w-full ${inputBase}`;

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  );
}

export function Card({ title, subtitle, action, children, className = '', padded = true }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 scrollbar-none dark:bg-slate-900 ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            value === t.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${value === t.value ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-200/70 dark:bg-slate-800'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Loader({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-orange-600" />
      {label}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <span>{message}</span>
      {onRetry && <Button size="sm" variant="danger" onClick={onRetry}>Réessayer</Button>}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, inputRef, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input ref={inputRef} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} pl-9`} />
    </div>
  );
}

/* ─── « Marquer comme renouvelé » : sélecteur de date en ligne ──────── */

export function RenewInline({ currentDate, years = 1, onConfirm, onCancel }) {
  const [value, setValue] = useState(addYearsIso(currentDate, years));
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const submit = async () => {
    if (!value) return;
    setBusy(true);
    try { await onConfirm(value); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
        className={`${inputBase} w-40 py-1.5`}
        aria-label="Nouvelle date d'expiration"
      />
      <Button size="sm" onClick={submit} disabled={busy || !value}>{busy ? '…' : 'Enregistrer'}</Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
    </div>
  );
}

/* ─── Icônes ─────────────────────────────────────────────────────────── */

const icon = (d, extra) => function Icon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
      {extra}
    </svg>
  );
};

export const CloseIcon = icon(['M6 6l12 12M18 6 6 18']);
export const PlusIcon = icon(['M12 5v14M5 12h14']);
export const CopyIcon = icon(['M9 9h10v10H9z', 'M5 15V5h10']);
export const DownloadIcon = icon(['M12 4v11m0 0 4-4m-4 4-4-4', 'M5 20h14']);
export const PrintIcon = icon(['M7 9V4h10v5', 'M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2', 'M7 14h10v6H7z']);
export const EyeIcon = icon(['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z']);
export const UploadIcon = icon(['M12 20V9m0 0 4 4m-4-4-4 4', 'M5 4h14']);
export const TrashIcon = icon(['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3']);
export const RotateLeftIcon = icon(['M4 4v6h6', 'M4.5 15a8 8 0 1 0 1.9-8.3L4 10']);
export const RotateRightIcon = icon(['M20 4v6h-6', 'M19.5 15a8 8 0 1 1-1.9-8.3L20 10']);
export const ScissorsIcon = icon(['M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12']);
export const CheckIcon = icon(['M5 12.5 10 17l9-10']);
export const SendIcon = icon(['M4 12 20 4l-6 16-3-7-7-1Z']);
export const PaperclipIcon = icon(['M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-3-3L15 7.5']);
export const LinkIcon = icon(['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1']);
export const BellIcon = icon(['M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z', 'M10 21h4']);
export const EditIcon = icon(['M4 20h4L19 9l-4-4L4 16v4Z', 'M13.5 6.5l4 4']);
