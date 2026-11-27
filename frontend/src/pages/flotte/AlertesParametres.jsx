import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { flotteApi } from '../../flotte/api';
import {
  BellIcon, Button, Card, Empty, ErrorBanner, Field, Loader, StatusPill, Tabs, inputBase, inputClass, useToast,
} from '../../flotte/ui';
import { countdown, formatDate } from '../../flotte/utils';

const SEVERITY = {
  CRITICAL_EXPIRED: { label: 'Expiré', status: 'expire' },
  WARNING_30J: { label: 'Urgent', status: 'bientot' },
  INFO_90J: { label: 'À prévoir', status: 'bientot' },
};

const GROUPS = [
  { title: 'Chauffeurs', keys: ['CODE_95', 'CARTE_CONDUCTEUR', 'PERMIS', 'SELECTION_MEDICALE', 'ADR_CHAUFFEUR', 'BADGE_KOLN', 'ATTESTATION_CONDUCTEUR'] },
  { title: 'Véhicules', keys: ['CONTROLE_TECHNIQUE', 'ETALONNAGE_TACHYGRAPHE', 'ASSURANCE', 'CERTIFICAT_ADR_VEHICULE'] },
];

function AlertList() {
  const toast = useToast();
  const [status, setStatus] = useState('ACTIVE');
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setAlerts(null);
    flotteApi.alerts(status).then(setAlerts).catch((e) => setError(e.message));
  }, [status]);
  useEffect(load, [load]);

  const snooze = async (a, days) => {
    try { await flotteApi.snoozeAlert(a.id, days); toast(`Alerte reportée de ${days} jours`); load(); } catch (e) { toast(e.message, 'error'); }
  };
  const reactivate = async (a) => {
    try { await flotteApi.reactivateAlert(a.id); toast('Alerte réactivée'); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <Card
      padded={false}
      title="Alertes d'expiration"
      subtitle="Mises à jour chaque jour et à chaque modification. Une alerte se ferme d'elle-même quand la nouvelle date est saisie."
      action={<Tabs value={status} onChange={setStatus} tabs={[
        { value: 'ACTIVE', label: 'Actives' }, { value: 'SNOOZED', label: 'Reportées' }, { value: 'RESOLVED', label: 'Résolues' },
      ]} />}
    >
      <ErrorBanner message={error} onRetry={load} />
      {!alerts ? <Loader /> : alerts.length === 0 ? (
        <div className="p-5"><Empty title="Aucune alerte dans cette liste" /></div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {alerts.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Link to={a.entityType === 'VEHICLE' ? `/vehicules?id=${a.entityId}` : `/chauffeurs?id=${a.entityId}`}
                  className="font-semibold text-slate-900 hover:text-orange-600 dark:text-white">{a.targetLabel}</Link>
                <p className="text-xs text-slate-500">
                  Expiration {formatDate(a.expirationDate)}{a.snoozedUntil ? ` · reportée jusqu'au ${formatDate(a.snoozedUntil)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusPill status={SEVERITY[a.severity].status}>
                  {a.severity === 'CRITICAL_EXPIRED' ? countdown(a.daysRemaining) : `${SEVERITY[a.severity].label} · ${countdown(a.daysRemaining)}`}
                </StatusPill>
                {a.status === 'ACTIVE' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => snooze(a, 7)}>Reporter 7 j</Button>
                    <Button size="sm" variant="ghost" onClick={() => snooze(a, 30)}>30 j</Button>
                  </>
                )}
                {a.status === 'SNOOZED' && <Button size="sm" variant="secondary" onClick={() => reactivate(a)}>Réactiver</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SettingsForm() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [recipients, setRecipients] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const apply = (data) => { setS(data); setRecipients(data.email.recipients.join(', ')); };
  useEffect(() => { flotteApi.settings().then(apply).catch((e) => setError(e.message)); }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!s) return <Loader />;

  const setThreshold = (k, v) => setS({ ...s, thresholds: { ...s.thresholds, [k]: v } });
  const setEmail = (patch) => setS({ ...s, email: { ...s.email, ...patch } });

  const save = async () => {
    setBusy('save');
    try {
      const payload = {
        thresholds: Object.fromEntries(Object.entries(s.thresholds).map(([k, v]) => [k, Number(v) || 0])),
        criticalDays: Number(s.criticalDays) || 0,
        email: { ...s.email, recipients: recipients.split(/[,;\s]+/).filter(Boolean) },
      };
      apply(await flotteApi.saveSettings(payload));
      toast('Paramètres enregistrés — alertes recalculées');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      const r = await flotteApi.testEmail();
      toast(r.sent ? `Email envoyé (${r.count} échéance(s))` : r.reason, r.sent ? 'success' : 'error');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <Card title="Fenêtres d'alerte" subtitle="Nombre de jours avant l'expiration où l'élément passe en orange « Expire bientôt ».">
        <div className="grid gap-6 md:grid-cols-2">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</p>
              <div className="space-y-2">
                {g.keys.map((k) => (
                  <label key={k} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                    <span className="text-sm text-slate-700 dark:text-slate-200">{s.docLabels[k]}</span>
                    <span className="flex items-center gap-2">
                      <input type="number" min="0" max="730" value={s.thresholds[k]} onChange={(e) => setThreshold(k, e.target.value)}
                        className={`${inputBase} w-20 py-1 text-right tabular-nums`} />
                      <span className="text-xs text-slate-500">jours</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 max-w-xs">
          <Field label="Seuil « urgent »" hint="En dessous, l'alerte passe en priorité haute.">
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="365" value={s.criticalDays} onChange={(e) => setS({ ...s, criticalDays: e.target.value })} className={`${inputBase} w-24 tabular-nums`} />
              <span className="text-sm text-slate-500">jours</span>
            </div>
          </Field>
        </div>
      </Card>

      <Card title="Récapitulatif par email" subtitle="Un email par jour avec les échéances à traiter.">
        {!s.smtpConfigured && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            L'envoi d'emails n'est pas encore configuré sur le serveur (variables SMTP). Les alertes restent visibles dans l'application.
          </p>
        )}
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={s.email.enabled} onChange={(e) => setEmail({ enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Envoyer le récapitulatif quotidien</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-[1fr_144px]">
            <Field label="Destinataires" hint="Séparez les adresses par une virgule.">
              <input className={inputClass} value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="dispatch@…, rh@…" />
            </Field>
            <Field label="Heure d'envoi">
              <select className={inputClass} value={s.email.hour} onChange={(e) => setEmail({ hour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={s.email.includeInfo} onChange={(e) => setEmail({ includeInfo: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
            <span className="text-sm text-slate-700 dark:text-slate-200">Inclure les échéances « à prévoir » (pas seulement urgentes et expirées)</span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={test} disabled={busy === 'test' || !s.smtpConfigured}><BellIcon /> Envoyer un email de test</Button>
        <Button onClick={save} disabled={busy === 'save'}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer les paramètres'}</Button>
      </div>
    </div>
  );
}

export default function AlertesParametres() {
  const [tab, setTab] = useState('alertes');
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Conformité</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Alertes & paramètres</h1>
        </div>
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'alertes', label: 'Alertes' }, { value: 'parametres', label: 'Paramètres' }]} />
      </div>
      {tab === 'alertes' ? <AlertList /> : <SettingsForm />}
    </div>
  );
}
