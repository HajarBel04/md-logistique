// Recherche globale (⌘K / Ctrl+K) : pages, chauffeurs, plaques et factures, au clavier.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flotteApi } from '../flotte/api';
import { NAV_GROUPS } from './Sidebar';

const Ctx = createContext({ open: () => {} });
export const useCommandPalette = () => useContext(Ctx);

const norm = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plate = (s) => norm(s).replace(/[^a-z0-9]/g, '');

export function CommandPaletteProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((v) => !v); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && <Palette onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

function Palette({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    Promise.allSettled([flotteApi.drivers(), flotteApi.vehicles(), flotteApi.invoices()]).then(([d, v, i]) => {
      if (d.status === 'rejected' && v.status === 'rejected') setFailed(true);
      setData({ drivers: d.value || [], vehicles: v.value || [], invoices: i.value || [] });
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const results = useMemo(() => {
    const term = norm(q.trim());
    const pages = NAV_GROUPS.flatMap((g) => g.items.map((it) => ({
      kind: 'Page', label: it.label, sub: g.title, icon: it.icon, to: it.path,
    })));
    if (!term) return pages.slice(0, 8);
    const out = pages.filter((p) => norm(p.label).includes(term));
    if (data) {
      data.drivers
        .filter((d) => norm(`${d.prenom} ${d.nom}`).includes(term) || norm(`${d.nom} ${d.prenom}`).includes(term) || norm(d.permisNumero).includes(term) || plate(d.telephone).includes(plate(term)))
        .slice(0, 6)
        .forEach((d) => out.push({ kind: 'Chauffeur', label: `${d.prenom || ''} ${d.nom}`.trim(), sub: d.typeChauffeur || '', to: `/chauffeurs?id=${d.id}` }));
      const pt = plate(term);
      if (pt) {
        data.vehicles
          .filter((v) => plate(v.plaque).includes(pt) || norm(v.categorie).includes(term))
          .slice(0, 6)
          .forEach((v) => out.push({ kind: 'Véhicule', label: v.plaque, sub: v.categorie || '', to: `/vehicules?id=${v.id}`, mono: true }));
      }
      data.invoices
        .filter((i) => norm(i.numero).includes(term) || norm(i.client?.nom || i.client).includes(term))
        .slice(0, 5)
        .forEach((i) => out.push({ kind: 'Facture', label: `Facture ${i.numero}`, sub: i.client?.nom || '', to: '/facturation?tab=factures' }));
    }
    return out.slice(0, 20);
  }, [q, data]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (r) => { if (!r) return; onClose(); navigate(r.to); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[13vh]" role="dialog" aria-modal="true" aria-label="Recherche">
      <button type="button" aria-label="Fermer la recherche" className="md-fade-in absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="md-pop-in relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Chauffeur, plaque, facture ou page…"
            aria-label="Rechercher"
            aria-controls="cmdk-list"
            aria-activedescendant={results[active] ? `cmdk-${active}` : undefined}
            className="h-14 w-full bg-transparent text-base text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-slate-100"
          />
          <kbd className="hidden rounded-md border border-slate-200 px-1.5 text-xs text-slate-500 sm:block dark:border-slate-700">Échap</kbd>
        </div>

        <ul id="cmdk-list" ref={listRef} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
          {results.map((r, i) => (
            <li
              key={`${r.kind}-${r.to}-${r.label}`}
              id={`cmdk-${i}`}
              data-idx={i}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${i === active ? 'bg-orange-50 dark:bg-orange-500/10' : ''}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 [&>svg]:h-4 [&>svg]:w-4">
                {r.icon || <span className="text-xs font-bold">{r.kind[0]}</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold text-slate-900 dark:text-slate-100 ${r.mono ? 'font-mono tracking-wider' : ''}`}>{r.label}</span>
                {r.sub && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{r.sub}</span>}
              </span>
              <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{r.kind}</span>
            </li>
          ))}
          {!results.length && (
            <li className="px-3 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {data ? `Aucun résultat pour « ${q} »` : 'Chargement…'}
            </li>
          )}
          {failed && <li className="px-3 py-2 text-xs text-red-700 dark:text-red-300">Chauffeurs et véhicules indisponibles pour le moment.</li>}
        </ul>
        <div className="hidden items-center gap-4 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex">
          <span>↑ ↓ pour naviguer</span><span>Entrée pour ouvrir</span>
        </div>
      </div>
    </div>
  );
}
