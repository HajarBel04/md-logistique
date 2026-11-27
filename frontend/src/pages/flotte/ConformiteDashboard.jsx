import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { flotteApi, fileUrl } from '../../flotte/api';
import {
  Button, Card, Empty, ErrorBanner, EyeIcon, Loader, RenewInline, StatusPill, Tabs, useToast,
} from '../../flotte/ui';
import { WhatsAppButton, messages } from '../../flotte/whatsapp';
import { CATEGORY_LABELS, TYPE_CHAUFFEUR_LABELS, countdown, formatDate } from '../../flotte/utils';

const PRIORITY_TYPES = new Set(['CODE_95', 'CARTE_CONDUCTEUR']);

function Kpi({ label, value, tone = 'slate', hint, to }) {
  const tones = {
    slate: 'text-slate-900 dark:text-white',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-emerald-600 dark:text-emerald-400',
  };
  const body = (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

function EntityLink({ row }) {
  const to = row.entityType === 'VEHICLE' ? `/vehicules?id=${row.entityId}` : `/chauffeurs?id=${row.entityId}`;
  return (
    <Link to={to} className="font-semibold text-slate-900 hover:text-orange-600 dark:text-slate-100 dark:hover:text-orange-300">
      {row.name}
    </Link>
  );
}

function DeadlineRow({ row, onRenewed }) {
  const toast = useToast();
  const [renewing, setRenewing] = useState(false);
  const priority = PRIORITY_TYPES.has(row.type);
  const confirm = async (date) => {
    try {
      await flotteApi.renew(row.entityType, row.entityId, row.type, date);
      toast(`${row.label} mis à jour pour ${row.name}`);
      setRenewing(false);
      onRenewed();
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  return (
    <li className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <EntityLink row={row} />
          <span className="text-xs text-slate-500">
            {row.entityType === 'VEHICLE' ? CATEGORY_LABELS[row.sub] : TYPE_CHAUFFEUR_LABELS[row.sub]}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className={priority ? 'font-semibold text-slate-900 dark:text-white' : ''}>{row.label}</span>
          {priority && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">Préavis 3 mois</span>}
          <span className="text-slate-500">·</span>
          <span className="tabular-nums">{formatDate(row.date)}</span>
        </div>
      </div>
      {renewing ? (
        <RenewInline currentDate={row.date} years={row.type === 'CODE_95' ? 5 : 1} onConfirm={confirm} onCancel={() => setRenewing(false)} />
      ) : (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusPill status={row.status}>{countdown(row.daysRemaining)}</StatusPill>
          {row.entityType === 'DRIVER' && row.date && (
            <WhatsAppButton phone={row.telephone} label="Prévenir"
              text={messages.echeance({ prenom: row.prenom, document: row.label, date: row.date, daysRemaining: row.daysRemaining })}
              title={row.telephone ? `Prévenir ${row.name} sur WhatsApp` : 'Pas de téléphone dans la fiche : WhatsApp demandera le contact'} />
          )}
          {row.documentUrl && (
            <Button size="sm" variant="ghost" onClick={() => window.open(fileUrl(row.documentUrl), '_blank', 'noopener')}>
              <EyeIcon /> Voir le document
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setRenewing(true)}>Marquer comme renouvelé</Button>
        </div>
      )}
    </li>
  );
}

export default function ConformiteDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  const load = useCallback(() => {
    setError('');
    flotteApi.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error && !data) return <ErrorBanner message={error} onRetry={load} />;
  if (!data) return <Loader />;

  const { kpis, upcoming, expired, missing, radar } = data;
  const maxRadar = Math.max(1, ...radar.map((r) => r.count));
  const lists = { upcoming, expired, missing };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Flotte & conformité</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Situation au {formatDate(data.today)} — contrôles, échéances chauffeurs et documents.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/vehicules"><Button variant="secondary">Véhicules</Button></Link>
          <Link to="/chauffeurs"><Button variant="secondary">Chauffeurs</Button></Link>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={load} />
      {data.ctSoon?.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200" role="alert">
          <p className="font-bold">⛔ Contrôle technique dans les 48 h — ne pas affecter à une tournée de nuit</p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {data.ctSoon.map((v) => (
              <li key={v.entityId}>
                <Link to={`/vehicules?id=${v.entityId}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-mono font-bold ring-1 ring-red-200 hover:ring-red-400 dark:bg-slate-900 dark:ring-red-500/40">
                  {v.plaque}
                  <span className="font-sans text-xs font-semibold">{v.daysRemaining === 0 ? "aujourd'hui" : v.daysRemaining === 1 ? 'demain' : 'dans 2 jours'}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs">Les chauffeurs ne peuvent pas déclarer de départ avec un véhicule dont le CT est expiré ou expire le lendemain.</p>
        </div>
      )}
      {data.docsToVerify > 0 && (
        <Link to="/chauffeurs" className="block rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:border-amber-400 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <strong>{data.docsToVerify} document(s) envoyé(s) par les chauffeurs</strong> à vérifier — ouvrez la fiche du chauffeur, onglet « Documents réglementaires ».
        </Link>
      )}
      {data.storageWarning && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <strong>Base de données temporaire :</strong> aucune base Postgres n'est reliée au serveur. Les véhicules, chauffeurs et documents saisis seront effacés au prochain déploiement.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Expirés" value={kpis.expired} tone={kpis.expired ? 'red' : 'green'} hint="À régulariser" />
        <Kpi label="Expirent bientôt" value={kpis.soon} tone={kpis.soon ? 'amber' : 'green'} hint="Dans la fenêtre d'alerte" />
        <Kpi label="Dates à compléter" value={kpis.missing} tone={kpis.missing ? 'red' : 'green'} hint="Champs obligatoires vides" />
        <Kpi label="Véhicules" value={kpis.vehicles} to="/vehicules" />
        <Kpi label="Chauffeurs actifs" value={kpis.drivers} to="/chauffeurs" hint={`${kpis.docsComplete} dossier(s) complet(s)`} />
        <Kpi label="Messages non lus" value={kpis.unreadMessages} tone={kpis.unreadMessages ? 'amber' : 'slate'} to="/messagerie" />
      </div>

      <div className="grid gap-6 xl:grid-cols-fib-13-8">
        <Card
          padded={false}
          title="Renouvellements à prévoir (3 mois)"
          subtitle="Code 95 et carte conducteur : alerte 3 mois avant, le temps de réserver l'auto-école ou la demande de carte."
          action={
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'upcoming', label: '3 prochains mois', count: upcoming.length },
                { value: 'expired', label: 'Expirés', count: expired.length },
                { value: 'missing', label: 'À compléter', count: missing.length },
              ]}
            />
          }
        >
          {lists[tab].length === 0 ? (
            <div className="p-5">
              <Empty title={{ upcoming: 'Aucune échéance dans les 3 prochains mois', expired: 'Aucun document expiré', missing: 'Toutes les dates obligatoires sont renseignées' }[tab]} />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {lists[tab].map((row) => (
                <DeadlineRow key={`${row.entityId}-${row.type}`} row={row} onRenewed={load} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Radar des renouvellements" subtitle="Échéances par mois (90 jours)">
          <ul className="space-y-4">
            {radar.map((m) => (
              <li key={m.month}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-100">{m.label}</span>
                  <span className="tabular-nums text-slate-500">{m.count}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-orange-500" style={{ width: `${(m.vehicles / maxRadar) * 100}%` }} title={`${m.vehicles} véhicule(s)`} />
                  <div className="h-full bg-slate-700 dark:bg-slate-300" style={{ width: `${(m.drivers / maxRadar) * 100}%` }} title={`${m.drivers} chauffeur(s)`} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" />Véhicules</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-700 dark:bg-slate-300" />Chauffeurs</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
