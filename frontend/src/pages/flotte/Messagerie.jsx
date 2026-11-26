import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { flotteApi, fileUrl } from '../../flotte/api';
import CropperModal from '../../flotte/CropperModal';
import { fetchBlob, isPdf } from '../../flotte/docTools';
import {
  Button, Empty, ErrorBanner, IconButton, LinkIcon, Loader, PaperclipIcon, SearchInput, SendIcon, inputBase, inputClass, useToast,
} from '../../flotte/ui';
import { SLOTS, SLOT_BY_KEY, formatDateTime } from '../../flotte/utils';

const POLL_MS = 15000;

function usePolling(fn, deps) {
  useEffect(() => {
    fn();
    const id = setInterval(() => { if (!document.hidden) fn(); }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Pièce jointe d'un chauffeur → dossier (après recadrage). */
function SaveToVault({ attachment, driver, onSaved }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState('PERMIS_CONDUIRE');
  const [pending, setPending] = useState(null);
  const meta = SLOT_BY_KEY[slot];

  const start = async () => {
    try {
      const blob = await fetchBlob(fileUrl(attachment.url));
      const file = new File([blob], attachment.filename, { type: attachment.mimeType });
      if (!meta.card && isPdf(file)) {
        await flotteApi.uploadDriverDoc(driver.driverId, slot, file, false);
        toast(`${meta.label} enregistré dans le dossier`);
        setOpen(false);
        onSaved?.();
      } else {
        setPending(file);
      }
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-orange-600 hover:underline dark:text-orange-300">
        Enregistrer dans le dossier du chauffeur
      </button>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select className={`${inputBase} w-56 py-1.5 text-xs`} value={slot} onChange={(e) => setSlot(e.target.value)} aria-label="Emplacement">
        {SLOTS.map((s) => <option key={s.key} value={s.key}>{s.num}. {s.label}</option>)}
      </select>
      <Button size="sm" onClick={start}>Continuer</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
      {pending && (
        <CropperModal
          source={pending}
          title={`${driver.nomComplet} — ${meta.label}`}
          defaultPreset={meta.card ? 'card' : 'free'}
          allowRectoVerso={meta.card}
          baseName={`${driver.nomComplet} ${meta.label}`}
          onCancel={() => setPending(null)}
          onSave={async ({ blob }) => {
            await flotteApi.uploadDriverDoc(driver.driverId, slot, blob, true);
            toast(`${meta.label} enregistré dans le dossier`);
            setPending(null); setOpen(false); onSaved?.();
          }}
          onSaveOriginal={async () => {
            await flotteApi.uploadDriverDoc(driver.driverId, slot, pending, false);
            toast(`${meta.label} enregistré dans le dossier`);
            setPending(null); setOpen(false); onSaved?.();
          }}
        />
      )}
    </div>
  );
}

export function Attachment({ attachment, mine }) {
  const url = fileUrl(attachment.url);
  if (attachment.mimeType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        <img src={url} alt={attachment.filename} className="h-auto max-h-60 max-w-full rounded-lg ring-1 ring-black/10" loading="lazy" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${mine ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
      <PaperclipIcon /> {attachment.filename}
    </a>
  );
}

export function Composer({ onSend, placeholder = 'Écrire un message…' }) {
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const submit = async (e) => {
    e?.preventDefault();
    if (!body.trim() && !file) return;
    setBusy(true);
    try {
      await onSend(body, file);
      setBody('');
      setFile(null);
    } catch {
      /* l'erreur est affichée par l'appelant ; le brouillon est conservé */
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      {file && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5 text-xs dark:bg-slate-800">
          <span className="truncate">📎 {file.name}</span>
          <button type="button" className="font-semibold text-red-600" onClick={() => setFile(null)}>Retirer</button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <IconButton label="Joindre un fichier" onClick={() => ref.current?.click()}><PaperclipIcon className="h-5 w-5" /></IconButton>
        <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
        <textarea
          rows={1}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
          placeholder={placeholder}
          className={`${inputClass} max-h-32 min-h-[40px] resize-none`}
        />
        <Button type="submit" disabled={busy || (!body.trim() && !file)} aria-label="Envoyer"><SendIcon /></Button>
      </div>
    </form>
  );
}

function Thread({ conv, onActivity }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const bottom = useRef(null);
  const lastCount = useRef(0);

  const load = useCallback(() => {
    flotteApi.messages(conv.driverId)
      .then((d) => { setData(d); setError(''); })
      .catch((e) => setError(e.message));
  }, [conv.driverId]);
  usePolling(load, [load]);

  useEffect(() => {
    if (data && data.messages.length !== lastCount.current) {
      lastCount.current = data.messages.length;
      bottom.current?.scrollIntoView({ block: 'end' });
      onActivity();
    }
  }, [data, onActivity]);

  const send = async (body, file) => {
    try {
      await flotteApi.sendMessage(conv.driverId, body, file);
      load();
    } catch (e) {
      toast(e.message, 'error');
      throw e;
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/portail/${data.accessToken}`;
    try { await navigator.clipboard.writeText(url); toast('Lien copié — envoyez-le au chauffeur par SMS ou WhatsApp'); }
    catch { window.prompt('Lien personnel du chauffeur :', url); }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0">
          <Link to={`/chauffeurs?id=${conv.driverId}`} className="truncate font-bold text-slate-900 hover:text-orange-600 dark:text-white">{conv.nomComplet}</Link>
          <p className="text-xs text-slate-500">Le chauffeur répond depuis son lien personnel (sans compte).</p>
        </div>
        {data && <Button size="sm" variant="secondary" onClick={copyLink}><LinkIcon /> Lien chauffeur</Button>}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-950">
        <ErrorBanner message={error} onRetry={load} />
        {!data && !error && <Loader />}
        {data && data.messages.length === 0 && (
          <Empty title="Aucun message">
            Écrivez un premier message, puis envoyez le lien personnel au chauffeur pour qu'il puisse répondre et envoyer des photos.
          </Empty>
        )}
        {data?.messages.map((m) => {
          const mine = m.sender === 'ADMIN';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`min-w-0 max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                mine ? 'rounded-br-md bg-slate-900 text-white dark:bg-orange-600' : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800'
              }`}>
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment && <Attachment attachment={m.attachment} mine={mine} />}
                {m.attachment && !mine && <SaveToVault attachment={m.attachment} driver={conv} />}
                <p className={`mt-1 text-[11px] ${mine ? 'text-white/60' : 'text-slate-400'}`}>
                  {formatDateTime(m.createdAt)}{mine && m.readAt ? ' · lu' : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <Composer onSend={send} />
    </div>
  );
}

export default function Messagerie() {
  const [convs, setConvs] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('chauffeur');

  const load = useCallback(() => {
    flotteApi.conversations().then((c) => { setConvs(c); setError(''); }).catch((e) => setError(e.message));
  }, []);
  usePolling(load, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (convs || []).filter((c) => (c.statut !== 'INACTIF' || c.last) && (!q || c.nomComplet.toLowerCase().includes(q)));
  }, [convs, search]);
  const selected = convs?.find((c) => c.driverId === selectedId);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Communication</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Messagerie</h1>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <div className="grid h-[calc(100vh-260px)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[300px_1fr]">
        <div className={`flex min-h-0 flex-col border-r border-slate-200 dark:border-slate-800 ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="border-b border-slate-200 p-3 dark:border-slate-800">
            <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un chauffeur" />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {!convs && <Loader />}
            {filtered.map((c) => (
              <li key={c.driverId}>
                <button
                  type="button"
                  onClick={() => setParams({ chauffeur: c.driverId })}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition dark:border-slate-800 ${
                    c.driverId === selectedId ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {c.nomComplet.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${c.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>{c.nomComplet}</span>
                      {c.unread > 0 && <span className="rounded-full bg-orange-600 px-1.5 text-xs font-bold text-white">{c.unread}</span>}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {c.last ? `${c.last.sender === 'ADMIN' ? 'Vous : ' : ''}${c.last.body}` : 'Aucun message'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={`min-h-0 ${selected ? 'block' : 'hidden md:block'}`}>
          {selected ? (
            <div className="flex h-full flex-col">
              <button type="button" className="border-b border-slate-200 px-4 py-2 text-left text-sm font-semibold text-orange-600 dark:border-slate-800 md:hidden" onClick={() => setParams({})}>← Conversations</button>
              <div className="min-h-0 flex-1"><Thread key={selected.driverId} conv={selected} onActivity={load} /></div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <Empty title="Sélectionnez un chauffeur">
                Les photos envoyées par un chauffeur (carte renouvelée, certificat…) peuvent être recadrées et rangées directement dans son dossier.
              </Empty>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
