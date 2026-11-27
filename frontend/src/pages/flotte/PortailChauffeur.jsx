// Page chauffeur : ouverte depuis le lien personnel (SMS / WhatsApp), sans compte ni mot de passe.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { flotteApi } from '../../flotte/api';
import { ToastProvider, useToast } from '../../flotte/ui';
import { formatDateTime } from '../../flotte/utils';
import { Attachment, Composer } from './Messagerie';
import logo from '../../assets/logo-md.png';

function Portal() {
  const { token } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const bottom = useRef(null);
  const count = useRef(0);

  const load = useCallback(() => {
    flotteApi.portal(token).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 15000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (data && data.messages.length !== count.current) {
      count.current = data.messages.length;
      bottom.current?.scrollIntoView({ block: 'end' });
    }
  }, [data]);

  const send = async (body, file) => {
    try {
      await flotteApi.portalSend(token, body, file);
      load();
    } catch (e) {
      toast(e.message, 'error');
      throw e;
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <img src={logo} alt="MD Logistique" className="h-8 w-auto" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{data ? `Bonjour ${data.prenom || data.nomComplet}` : 'MD Logistique'}</p>
          <p className="text-xs text-slate-500">Messages avec le bureau</p>
        </div>
      </header>
      <main className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4">
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
        {data && data.messages.length === 0 && (
          <p className="rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
            Envoyez ici vos questions ou la photo d'un document renouvelé (permis, carte conducteur, sélection médicale…). Appuyez sur le trombone pour joindre une photo.
          </p>
        )}
        {data?.messages.map((m) => {
          const mine = m.sender === 'CHAUFFEUR';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                mine ? 'rounded-br-md bg-orange-600 text-white' : 'rounded-bl-md bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800'
              }`}>
                {!mine && <p className="mb-0.5 text-xs font-semibold text-slate-500">Bureau</p>}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment && <Attachment attachment={m.attachment} mine={mine} />}
                <p className={`mt-1 text-xs ${mine ? 'text-white/70' : 'text-slate-500'}`}>{formatDateTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </main>
      {data && <Composer onSend={send} placeholder="Votre message…" />}
    </div>
  );
}

export default function PortailChauffeur() {
  return <ToastProvider><Portal /></ToastProvider>;
}
