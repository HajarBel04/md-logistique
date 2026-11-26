// Espace chauffeur (mobile) : route du jour, historique, documents, messages.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { flotteApi } from '../../flotte/api';
import ComplianceDocTabs, { MAIN_SLOTS } from '../../flotte/ComplianceDocTabs';
import DocumentVault from '../../flotte/DocumentVault';
import TripForm from '../../flotte/TripForm';
import { ErrorBanner, Loader, StatusPill, ToastProvider, useToast } from '../../flotte/ui';
import { countdown, formatDate, formatDateTime } from '../../flotte/utils';
import { Attachment, Composer } from './Messagerie';
import logo from '../../assets/logo1.png';

const NAV = [
  { key: 'trajet', label: 'Trajet', d: 'M3 17h2a2 2 0 1 0 4 0h6a2 2 0 1 0 4 0h2v-5l-3-4h-4V5H3v12Z' },
  { key: 'historique', label: 'Historique', d: 'M12 8v4l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z' },
  { key: 'documents', label: 'Documents', d: 'M7 3h7l5 5v13H7zM14 3v5h5' },
  { key: 'messages', label: 'Messages', d: 'M4 5h16v11H8l-4 4V5Z' },
];

function NewTrip({ onDone }) {
  const toast = useToast();
  const [options, setOptions] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [key, setKey] = useState(0);

  const load = useCallback(() => {
    flotteApi.myOptions().then(setOptions).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!options) return <Loader />;
  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <p className="text-3xl">✓</p>
        <p className="mt-2 font-bold text-emerald-900 dark:text-emerald-200">Trajet enregistré</p>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
          {done.routeCode} · {done.distanceKm} km · {formatDate(done.date)}
        </p>
        {done.ctWarning && <p className="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-300">⚠ {done.ctWarning}</p>}
        <button type="button" className="mt-4 text-sm font-semibold text-emerald-800 underline dark:text-emerald-300"
          onClick={() => { setDone(null); setKey((k) => k + 1); load(); }}>
          Déclarer un autre trajet
        </button>
      </div>
    );
  }
  return (
    <TripForm
      key={key}
      options={options}
      onSubmit={async (payload) => {
        const t = await flotteApi.createMyTrip(payload);
        toast('Trajet enregistré');
        setDone(t);
        onDone();
      }}
    />
  );
}

function History() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { flotteApi.myTrips().then(setTrips).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorBanner message={error} />;
  if (!trips) return <Loader />;
  if (!trips.length) return <p className="py-10 text-center text-sm text-slate-500">Aucun trajet déclaré pour l'instant.</p>;
  return (
    <ul className="space-y-2">
      {trips.map((t) => (
        <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-baseline justify-between">
            <span className="font-mono font-bold">{t.routeCode}</span>
            <span className="text-sm tabular-nums text-slate-500">{formatDate(t.date)}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.itineraire}</p>
          <p className="mt-1 text-xs text-slate-500">{t.distanceKm} km · {t.vehiclePlaque}{t.trailerPlaque ? ` - ${t.trailerPlaque}` : ''}{t.companyNom ? ` · ${t.companyNom}` : ''}</p>
          {t.breakdownNom && <p className="mt-1 text-xs font-semibold text-red-600">Panne signalée : {t.breakdownNom}</p>}
        </li>
      ))}
    </ul>
  );
}

function Documents({ driver, setDriver }) {
  const alerts = driver.compliance.filter((c) => ['expire', 'bientot'].includes(c.status));
  return (
    <div className="space-y-5">
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.type} className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
              <span className="font-semibold">{a.label}</span>
              <StatusPill status={a.status}>{countdown(a.daysRemaining)}</StatusPill>
            </div>
          ))}
        </div>
      )}
      <ComplianceDocTabs driver={driver} onChange={setDriver} mode="driver" />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Autres documents</p>
        <DocumentVault driver={driver} onChange={setDriver} mode="driver" exclude={MAIN_SLOTS} />
      </div>
    </div>
  );
}

function Messages() {
  const toast = useToast();
  const [msgs, setMsgs] = useState(null);
  const bottom = useRef(null);
  const load = useCallback(() => { flotteApi.myMessages().then(setMsgs).catch(() => {}); }, []);
  useEffect(() => {
    load();
    const id = setInterval(() => !document.hidden && load(), 15000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [msgs?.length]);
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {!msgs && <Loader />}
        {msgs && msgs.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Écrivez au bureau ou envoyez une photo avec le trombone.</p>}
        {msgs?.map((m) => {
          const mine = m.sender === 'CHAUFFEUR';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${mine ? 'rounded-br-md bg-orange-600 text-white' : 'rounded-bl-md bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800'}`}>
                {!mine && <p className="mb-0.5 text-[11px] font-semibold text-slate-400">Bureau</p>}
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment && <Attachment attachment={m.attachment} mine={mine} />}
                <p className={`mt-1 text-[11px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>{formatDateTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <div className="-mx-4 border-t border-slate-200 dark:border-slate-800">
        <Composer placeholder="Votre message…" onSend={async (body, file) => {
          try { await flotteApi.sendMyMessage(body, file); load(); } catch (e) { toast(e.message, 'error'); throw e; }
        }} />
      </div>
    </div>
  );
}

function Space() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('trajet');
  const [driver, setDriver] = useState(null);
  const [error, setError] = useState('');

  const loadMe = useCallback(() => { flotteApi.me().then(setDriver).catch((e) => setError(e.message)); }, []);
  useEffect(loadMe, [loadMe]);

  const docAlerts = driver ? driver.compliance.filter((c) => ['expire', 'bientot'].includes(c.status)).length
    + MAIN_SLOTS.filter((s) => (s !== 'CARTE_CHAUFFEUR' || driver.typeChauffeur === 'POIDS_LOURD') && s !== 'CERTIFICAT_ADR' && !driver.documents?.[s]).length : 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <img src={logo} alt="MD Logistique" className="h-8 w-auto" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Bonjour {driver?.prenom || user?.nom}</p>
          <p className="text-xs text-slate-500">Espace chauffeur</p>
        </div>
        <button type="button" onClick={logout} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-300 dark:text-slate-300 dark:ring-slate-700">
          Déconnexion
        </button>
      </header>

      <main className={`flex-1 overflow-y-auto px-4 py-4 ${tab === 'messages' ? 'flex flex-col overflow-hidden' : ''}`}>
        <div className={`mx-auto w-full max-w-lg ${tab === 'messages' ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
          <h1 className="mb-4 text-xl font-extrabold">
            {{ trajet: 'Route du jour', historique: 'Mes trajets', documents: 'Mes documents', messages: 'Messages' }[tab]}
          </h1>
          {error && <ErrorBanner message={error} onRetry={loadMe} />}
          {tab === 'trajet' && <NewTrip onDone={() => {}} />}
          {tab === 'historique' && <History />}
          {tab === 'documents' && (driver ? <Documents driver={driver} setDriver={setDriver} /> : <Loader />)}
          {tab === 'messages' && <Messages />}
        </div>
      </main>

      <nav className="grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900">
        {NAV.map((n) => (
          <button key={n.key} type="button" onClick={() => setTab(n.key)} aria-current={tab === n.key ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${tab === n.key ? 'text-orange-600' : 'text-slate-500'}`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.d} /></svg>
            {n.label}
            {n.key === 'documents' && docAlerts > 0 && (
              <span className="absolute right-[28%] top-1.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{docAlerts}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function EspaceChauffeur() {
  return <ToastProvider><Space /></ToastProvider>;
}
