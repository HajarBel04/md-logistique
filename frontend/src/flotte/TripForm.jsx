// Formulaire de trajet (route du jour) — partagé entre l'espace chauffeur et l'admin.
import { useMemo, useState } from 'react';
import { Button, ErrorBanner, Field, inputClass } from './ui';
import { formatDate } from './utils';

const CT_STYLE = {
  bloque: 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200',
  attention: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
  inconnu: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function ctLabel(ct) {
  if (!ct) return '';
  if (ct.level === 'bloque') return ' — ⛔ CT';
  if (ct.level === 'attention') return ' — ⚠ CT bientôt';
  if (ct.level === 'inconnu') return ' — CT ?';
  return '';
}

/**
 * props: options (routes, vehicles, trailers, companies, breakdownTypes, today),
 *        onSubmit(payload) → promesse, admin (bool : chauffeur + date + forçage), drivers (admin)
 */
export default function TripForm({ options, onSubmit, admin = false, drivers = [], submitLabel = 'Enregistrer le trajet' }) {
  const [form, setForm] = useState({
    driverId: '', date: options.today, routeId: '', vehicleId: '', trailerId: '', companyId: '',
    breakdownTypeId: '', remarque: '', basePrice: '',
  });
  const [panne, setPanne] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const route = options.routes.find((r) => r.id === form.routeId);
  const vehicle = options.vehicles.find((v) => v.id === form.vehicleId);
  const trailer = options.trailers.find((v) => v.id === form.trailerId);
  const checks = useMemo(() => [vehicle?.ct, trailer?.ct].filter((c) => c && c.level !== 'ok'), [vehicle, trailer]);
  const isBlocked = !admin && checks.some((c) => c.level === 'bloque');

  const pickRoute = (e) => {
    const r = options.routes.find((x) => x.id === e.target.value);
    setForm((f) => ({ ...f, routeId: e.target.value, companyId: r?.companyId || f.companyId }));
  };

  const submit = async (e, force = false) => {
    e?.preventDefault();
    setBusy(true);
    setError('');
    setBlocked(null);
    try {
      const payload = { ...form, breakdownTypeId: panne ? form.breakdownTypeId : '', force };
      await onSubmit(payload);
    } catch (err) {
      if (err.status === 409) setBlocked(err.message);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorBanner message={error} />
      {admin ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Chauffeur">
            <select required className={inputClass} value={form.driverId} onChange={set('driverId')}>
              <option value="">— Choisir —</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.nom} {d.prenom}</option>)}
            </select>
          </Field>
          <Field label="Date"><input required type="date" className={inputClass} value={form.date} onChange={set('date')} /></Field>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-slate-800">
          <span className="text-slate-500">Date du trajet : </span>
          <strong className="text-slate-900 dark:text-white">{formatDate(options.today)} (aujourd'hui)</strong>
        </div>
      )}

      <Field label="Route">
        <select required className={`${inputClass} text-base sm:text-sm`} value={form.routeId} onChange={pickRoute}>
          <option value="">— Choisir la route —</option>
          {options.routes.map((r) => (
            <option key={r.id} value={r.id} disabled={r.distanceKm == null}>
              {r.code} → {r.itineraire}{r.distanceKm == null ? ' (km à compléter par le bureau)' : ''}
            </option>
          ))}
        </select>
      </Field>
      {route && (
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-500/30 dark:bg-orange-500/10">
          <span className="text-sm text-orange-900 dark:text-orange-200">{route.itineraire}</span>
          <span className="text-lg font-extrabold tabular-nums text-orange-700 dark:text-orange-300">{route.distanceKm} km</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Camion / tracteur">
          <select required className={`${inputClass} text-base sm:text-sm`} value={form.vehicleId} onChange={set('vehicleId')}>
            <option value="">— Choisir —</option>
            {options.vehicles.map((v) => <option key={v.id} value={v.id}>{v.plaque}{ctLabel(v.ct)}</option>)}
          </select>
        </Field>
        <Field label="Remorque (si attelée)">
          <select className={`${inputClass} text-base sm:text-sm`} value={form.trailerId} onChange={set('trailerId')}>
            <option value="">— Sans remorque —</option>
            {options.trailers.map((v) => <option key={v.id} value={v.id}>{v.plaque}{ctLabel(v.ct)}</option>)}
          </select>
        </Field>
      </div>

      {checks.map((c) => (
        <div key={c.plaque} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${CT_STYLE[c.level]}`} role="alert">
          {c.level === 'bloque' ? '⛔ ' : c.level === 'attention' ? '⚠ ' : ''}{c.message}
          {c.level === 'bloque' && !admin && <span className="block font-normal">Départ impossible avec ce véhicule : contactez le bureau.</span>}
        </div>
      ))}

      <Field label="Client">
        <select className={inputClass} value={form.companyId} onChange={set('companyId')}>
          <option value="">— Non précisé —</option>
          {options.companies.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </Field>

      <label className="flex items-center gap-2.5">
        <input type="checkbox" checked={panne} onChange={(e) => setPanne(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-orange-600" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Signaler une panne</span>
      </label>
      {panne && (
        <Field label="Type de panne">
          <select required className={inputClass} value={form.breakdownTypeId} onChange={set('breakdownTypeId')}>
            <option value="">— Choisir —</option>
            {options.breakdownTypes.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
        </Field>
      )}
      <Field label="Remarque (facultatif)">
        <textarea rows={2} className={inputClass} value={form.remarque} onChange={set('remarque')} placeholder="Retard, client absent, détail de la panne…" />
      </Field>
      {admin && (
        <Field label="Prix de base (€ HT)" hint="Peut rester vide : à saisir avant la facture.">
          <input type="number" step="0.01" min="0" className={inputClass} value={form.basePrice} onChange={set('basePrice')} />
        </Field>
      )}

      {blocked && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200" role="alert">
          <p className="font-semibold">{blocked}</p>
          {admin && (
            <Button size="sm" variant="danger" className="mt-3" onClick={(e) => submit(e, true)} disabled={busy}>
              Enregistrer quand même (décision du bureau)
            </Button>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={busy || isBlocked}>
        {busy ? 'Enregistrement…' : submitLabel}
      </Button>
    </form>
  );
}
