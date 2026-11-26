// Formulaires chauffeurs : trajets déclarés, surcharge carburant, prix de base, export Excel.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { flotteApi } from '../../flotte/api';
import { currentMonth, euro, exportTripsXlsx, monthLabel } from '../../flotte/excel';
import TripForm from '../../flotte/TripForm';
import { CmrButton } from './Facturation';
import {
  Button, DownloadIcon, Empty, ErrorBanner, IconButton, Loader, Modal, PlusIcon, TrashIcon, inputBase,
  useToast,
} from '../../flotte/ui';
import { formatDate } from '../../flotte/utils';

function BasePriceInput({ trip, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState(trip.basePrice ?? '');
  useEffect(() => setV(trip.basePrice ?? ''), [trip.basePrice]);
  if (trip.invoiceId) return <span className="tabular-nums">{euro(trip.basePrice)}</span>;
  const commit = async () => {
    const next = v === '' ? null : Number(v);
    if (next === (trip.basePrice ?? null)) return;
    try {
      onSaved(await flotteApi.updateTrip(trip.id, { basePrice: v === '' ? null : v }));
    } catch (e) {
      toast(e.message, 'error');
      setV(trip.basePrice ?? '');
    }
  };
  return (
    <input
      type="number" step="0.01" min="0" inputMode="decimal" value={v} placeholder="À saisir"
      onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={`${inputBase} w-28 py-1 text-right tabular-nums ${v === '' ? 'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10' : ''}`}
      aria-label={`Prix de base du trajet ${trip.numero}`}
    />
  );
}

export default function Trajets() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [companyId, setCompanyId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [status, setStatus] = useState('');
  const [trips, setTrips] = useState(null);
  const [refs, setRefs] = useState({ companies: [] });
  const [drivers, setDrivers] = useState([]);
  const [options, setOptions] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setTrips(null);
    flotteApi.trips({ month, companyId, driverId, status })
      .then((t) => { setTrips(t); setError(''); })
      .catch((e) => setError(e.message));
  }, [month, companyId, driverId, status]);
  useEffect(load, [load]);
  useEffect(() => {
    flotteApi.refs().then(setRefs).catch(() => {});
    flotteApi.drivers().then((d) => setDrivers(d.filter((x) => x.statut !== 'INACTIF'))).catch(() => {});
  }, []);

  const replace = (t) => setTrips((list) => list.map((x) => (x.id === t.id ? t : x)));

  const totals = useMemo(() => {
    const list = trips || [];
    return {
      km: list.reduce((s, t) => s + (t.distanceKm || 0), 0),
      surcharge: list.reduce((s, t) => s + (t.surcharge || 0), 0),
      base: list.reduce((s, t) => s + (t.basePrice || 0), 0),
      missing: list.filter((t) => !t.invoiceId && t.basePrice == null).length,
      noRate: list.some((t) => t.fuelRate == null),
    };
  }, [trips]);

  const openAdd = async () => {
    try {
      setOptions(await flotteApi.dispatchOptions());
      setAdding(true);
    } catch (e) { toast(e.message, 'error'); }
  };

  const changeCompany = async (t, cid) => {
    try { replace(await flotteApi.updateTrip(t.id, { companyId: cid })); } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (t) => {
    if (!window.confirm(`Supprimer le formulaire ${t.numero} (${t.driverNom}, ${t.routeCode}) ?`)) return;
    try { await flotteApi.deleteTrip(t.id); toast('Formulaire supprimé'); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Exploitation</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Formulaires chauffeurs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Routes déclarées par les chauffeurs. Saisissez le prix de base convenu, puis facturez depuis « Facturation ».</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!trips?.length}
            onClick={() => exportTripsXlsx(trips, `formulaires-chauffeurs-${month || 'tous'}.xlsx`).catch((e) => toast(e.message, 'error'))}>
            <DownloadIcon /> Exporter vers Excel
          </Button>
          <Button onClick={openAdd}><PlusIcon /> Ajouter un trajet</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputBase} w-44`} aria-label="Mois" />
        <select className={`${inputBase} w-44`} value={companyId} onChange={(e) => setCompanyId(e.target.value)} aria-label="Client">
          <option value="">Tous les clients</option>
          {refs.companies.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          <option value="none">Sans client</option>
        </select>
        <select className={`${inputBase} w-52`} value={driverId} onChange={(e) => setDriverId(e.target.value)} aria-label="Chauffeur">
          <option value="">Tous les chauffeurs</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.nom} {d.prenom}</option>)}
        </select>
        <select className={`${inputBase} w-40`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Statut">
          <option value="">Tous</option>
          <option value="a_facturer">À facturer</option>
          <option value="facture">Facturés</option>
        </select>
      </div>

      <ErrorBanner message={error} onRetry={load} />
      {trips && totals.noRate && month && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Taux de surcharge carburant de {monthLabel(month)} non renseigné : la surcharge sera calculée dès qu'il est saisi dans{' '}
          <Link to="/facturation?tab=carburant" className="font-semibold underline">Facturation → Carburant</Link>.
        </div>
      )}

      {trips && trips.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Trajets', trips.length],
            ['Kilomètres', `${totals.km.toLocaleString('fr-BE')} km`],
            ['Surcharge carburant', euro(totals.surcharge)],
            ['Prix à saisir', totals.missing],
          ].map(([l, v], i) => (
            <div key={l} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{l}</p>
              <p className={`mt-1 text-2xl font-extrabold tabular-nums ${i === 3 && totals.missing ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {!trips ? <Loader /> : trips.length === 0 ? (
        <Empty title={`Aucun formulaire${month ? ` en ${monthLabel(month)}` : ''}`}>
          Les chauffeurs déclarent leur route depuis leur espace. Vous pouvez aussi ajouter un trajet à leur place.
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
              <tr>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Chauffeur</th>
                <th className="px-3 py-3">Route</th>
                <th className="px-3 py-3 text-right">Km</th>
                <th className="px-3 py-3">Véhicules</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3 text-right">Surcharge</th>
                <th className="px-3 py-3 text-right">Rate/Tour</th>
                <th className="px-3 py-3 text-right">Total HT</th>
                <th className="px-3 py-3">CMR aller / retour</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trips.map((t) => (
                <tr key={t.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-3">
                    <p className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{formatDate(t.date)}</p>
                    <p className="text-xs text-slate-400">{t.numero}{t.createdByRole === 'ADMIN' ? ' · bureau' : ''}</p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">{t.driverNom}</td>
                  <td className="px-3 py-3">
                    <p className="font-mono font-bold">{t.routeCode}
                      {t.statut === 'ANNULE' && <span className="ml-1.5 rounded bg-red-600 px-1.5 py-0.5 font-sans text-[10px] font-bold text-white">ANNULÉ</span>}
                      {t.phase === 'EN_COURS' && <span className="ml-1.5 rounded bg-orange-100 px-1.5 py-0.5 font-sans text-[10px] font-bold text-orange-700">EN COURS</span>}
                    </p>
                    <p className="text-xs text-slate-500">{t.itineraire}</p>
                    {t.breakdownNom && <p className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">Panne : {t.breakdownNom}</p>}
                    {t.remarque && <p className="mt-1 max-w-[220px] text-xs italic text-slate-500">« {t.remarque} »</p>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{t.distanceKm}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">
                    {t.vehiclePlaque}{t.trailerPlaque ? ` - ${t.trailerPlaque}` : ''}
                    {t.ctWarning && <p className="mt-1 max-w-[200px] whitespace-normal font-sans text-xs font-semibold text-amber-700 dark:text-amber-300" title={t.ctWarning}>⚠ {t.ctWarning}</p>}
                  </td>
                  <td className="px-3 py-3">
                    {t.invoiceId ? t.companyNom || '—' : (
                      <select value={t.companyId || ''} onChange={(e) => changeCompany(t, e.target.value)} className={`${inputBase} w-28 py-1 text-xs ${t.companyId ? '' : 'border-amber-300'}`} aria-label="Client">
                        <option value="">—</option>
                        {refs.companies.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {euro(t.surcharge)}
                    {t.fuelRate != null && <p className="text-xs text-slate-400">{t.fuelRate} €/km{t.fuelRateOnRow ? '' : ' (mois)'}</p>}
                  </td>
                  <td className="px-3 py-3 text-right"><BasePriceInput trip={t} onSaved={replace} /></td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {euro(t.total)}
                    {t.invoiceId && <p className="text-xs font-normal text-emerald-600">Facturé</p>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <CmrButton trip={t} onUpdated={replace} />
                      {t.cmrNumero && <span className="text-[11px] text-slate-500">n° {t.cmrNumero}</span>}
                      <CmrButton trip={t} retour onUpdated={replace} />
                      {t.returnCmrNumero && <span className="text-[11px] text-slate-500">n° {t.returnCmrNumero}</span>}
                      {t.waitMinutes > 0 && <span className="text-[11px] text-slate-500">Attente {Math.floor(t.waitMinutes / 60)} h {t.waitMinutes % 60} min</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {!t.invoiceId && <IconButton label="Supprimer" onClick={() => remove(t)} className="hover:!text-red-600"><TrashIcon /></IconButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && options && (
        <Modal title="Ajouter un trajet" subtitle="Saisie par le bureau à la place du chauffeur." onClose={() => setAdding(false)}>
          <TripForm
            admin
            drivers={drivers}
            options={options}
            submitLabel="Ajouter le trajet"
            onSubmit={async (payload, cmrFile) => {
              const t = await flotteApi.createTrip(payload);
              if (cmrFile) await flotteApi.uploadTripCmr(t.id, cmrFile);
              toast('Trajet ajouté');
              setAdding(false);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
