// Espace chauffeur (mobile) : route du jour, historique, documents, messages.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { flotteApi, fileUrl } from '../../flotte/api';
import ComplianceDocTabs, { MAIN_SLOTS } from '../../flotte/ComplianceDocTabs';
import DocumentVault from '../../flotte/DocumentVault';
import TripForm, { CmrPhotoField, StatutField } from '../../flotte/TripForm';
import { Button, ErrorBanner, Field, Loader, StatusPill, ToastProvider, inputClass, useToast } from '../../flotte/ui';
import { countdown, formatDate, formatDateTime } from '../../flotte/utils';
import { Attachment, Composer } from './Messagerie';
import logo from '../../assets/logo1.png';

const NAV = [
  { key: 'trajet', label: 'Trajet', d: 'M3 17h2a2 2 0 1 0 4 0h6a2 2 0 1 0 4 0h2v-5l-3-4h-4V5H3v12Z' },
  { key: 'historique', label: 'Historique', d: 'M12 8v4l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z' },
  { key: 'documents', label: 'Documents', d: 'M7 3h7l5 5v13H7zM14 3v5h5' },
  { key: 'messages', label: 'Messages', d: 'M4 5h16v11H8l-4 4V5Z' },
];

const pad = (n) => String(n).padStart(2, '0');
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function Info({ label, children }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900 dark:text-white">{children || '—'}</span>
    </div>
  );
}

/** Trajet en cours → « Je suis arrivé » → formulaire de retour (CMR retour obligatoire). */
function ActiveTrip({ trip, onFinished }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ arrivalAt: nowLocal(), waitHours: '0', waitMinutes: '0', statut: trip.statut || 'CONFIRME', returnCmrNumero: '', remarque: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.returnCmrNumero.trim()) { setError('Le numéro du CMR retour est obligatoire.'); return; }
    if (!file) { setError('La photo du CMR retour est obligatoire.'); return; }
    setBusy(true);
    try {
      await flotteApi.arriveTrip(trip.id, form, file);
      toast('Formulaire de retour envoyé');
      onFinished();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const context = (
    <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 px-3 dark:divide-slate-800 dark:bg-slate-800/60">
      <Info label="Itinéraire">{trip.routeCode} → {trip.itineraire}</Info>
      <Info label="Date">{formatDateTime(trip.createdAt)}</Info>
      <Info label="Société">{trip.companyNom}</Info>
      <Info label="Véhicule">{trip.vehiclePlaque}{trip.trailerPlaque ? ` - ${trip.trailerPlaque}` : ''}</Info>
      <Info label="Type de véhicule">{trip.vehicleType}</Info>
      <Info label="CMR aller">{trip.cmrNumero}</Info>
    </div>
  );

  if (!open) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm dark:border-orange-500/30 dark:bg-slate-900">
        <p className="font-bold text-slate-900 dark:text-white">Trajet en cours</p>
        <p className="mb-3 text-xs font-semibold text-orange-600">En attente d'arrivée</p>
        {context}
        <button type="button" onClick={() => { setForm((f) => ({ ...f, arrivalAt: nowLocal() })); setOpen(true); }}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-3.5 text-base font-bold text-white shadow-sm active:bg-emerald-700">
          ✓ Je suis arrivé
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-lg font-extrabold">Formulaire de retour</p>
      {error && <ErrorBanner message={error} />}
      <Field label="Date & heure d'arrivée">
        <input type="datetime-local" className={inputClass} value={form.arrivalAt} onChange={set('arrivalAt')} required />
      </Field>
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Temps d'attente du chauffeur</span>
        <div className="grid grid-cols-2 gap-2">
          <select className={inputClass} value={form.waitHours} onChange={set('waitHours')} aria-label="Heures">
            {Array.from({ length: 13 }, (_, h) => <option key={h} value={h}>{h} h</option>)}
          </select>
          <select className={inputClass} value={form.waitMinutes} onChange={set('waitMinutes')} aria-label="Minutes">
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
      </div>
      {context}
      <StatutField value={form.statut} onChange={(v) => setForm((f) => ({ ...f, statut: v }))} />
      <Field label={<>Numéro CMR retour<span className="text-red-600"> *</span></>}>
        <input required inputMode="numeric" className={inputClass} value={form.returnCmrNumero} onChange={set('returnCmrNumero')} />
      </Field>
      <CmrPhotoField label={form.statut === 'ANNULE' ? 'Photo du CMR annulé (« Cancel »)' : 'Photo du CMR retour'} file={file} onChange={setFile} />
      <Field label="Remarque (facultatif)">
        <textarea rows={2} className={inputClass} value={form.remarque} onChange={set('remarque')} />
      </Field>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Retour</Button>
        <Button type="submit" size="lg" className="flex-1" disabled={busy || !file || !form.returnCmrNumero.trim()}>
          {busy ? 'Envoi…' : 'Soumettre le formulaire'}
        </Button>
      </div>
    </form>
  );
}

function NewTrip() {
  const toast = useToast();
  const [options, setOptions] = useState(null);
  const [active, setActive] = useState(undefined);
  const [error, setError] = useState('');
  const [key, setKey] = useState(0);

  const load = useCallback(() => {
    setError('');
    Promise.all([flotteApi.myOptions(), flotteApi.myActiveTrip()])
      .then(([o, a]) => { setOptions(o); setActive(a); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorBanner message={error} onRetry={load} />;
  if (!options || active === undefined) return <Loader />;
  if (active) return <ActiveTrip trip={active} onFinished={() => { setKey((k) => k + 1); load(); }} />;
  return (
    <TripForm
      key={key}
      options={options}
      submitLabel="Soumettre le formulaire"
      onSubmit={async (payload, cmrFile) => {
        const t = await flotteApi.createMyTrip(payload, cmrFile);
        toast('Formulaire envoyé — trajet en cours');
        setActive(t);
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
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            {t.statut === 'ANNULE' && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">Annulé</span>}
            {t.phase === 'EN_COURS' && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700">En cours</span>}
            {t.cmrUrl && <a className="text-emerald-700" href={fileUrl(t.cmrUrl)} target="_blank" rel="noopener noreferrer">CMR aller {t.cmrNumero}</a>}
            {t.returnCmrUrl && <a className="text-emerald-700" href={fileUrl(t.returnCmrUrl)} target="_blank" rel="noopener noreferrer">CMR retour {t.returnCmrNumero}</a>}
          </div>
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
            {{ trajet: 'Formulaire de trajet', historique: 'Mes trajets', documents: 'Mes documents', messages: 'Messages' }[tab]}
          </h1>
          {error && <ErrorBanner message={error} onRetry={loadMe} />}
          {tab === 'trajet' && <NewTrip />}
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
