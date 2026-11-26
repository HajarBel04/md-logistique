// Facturation : préparation par client et par mois, factures, taux carburant mensuel, coordonnées émetteur.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { flotteApi } from '../../flotte/api';
import { currentMonth, euro, exportTripsXlsx, monthLabel } from '../../flotte/excel';
import {
  Button, Card, DownloadIcon, Empty, ErrorBanner, Field, Loader, Modal, PrintIcon, Tabs, TrashIcon,
  inputBase, inputClass, useToast,
} from '../../flotte/ui';
import { formatDate } from '../../flotte/utils';

const STATUS = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  EMISE: { label: 'Émise', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  PAYEE: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl = (s) => esc(s).replace(/\n/g, '<br>');

function invoiceHtml(inv) {
  const e = inv.emetteur || {};
  const c = inv.client || {};
  const lines = inv.lines.map((t) => `
    <tr><td>${formatDate(t.date)}</td><td>${esc(t.routeCode)}<br><small>${esc(t.itineraire)}</small></td>
    <td>${esc(t.driverNom)}<br><small>${esc(t.vehiclePlaque || '')}${t.trailerPlaque ? ' - ' + esc(t.trailerPlaque) : ''}</small></td>
    <td class="r">${t.distanceKm}</td><td class="r">${euro(t.basePrice)}</td>
    <td class="r">${euro(t.surcharge)}</td><td class="r"><b>${euro((t.basePrice || 0) + (t.surcharge || 0))}</b></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Facture ${esc(inv.numero)}</title><style>
    @page{size:A4;margin:14mm} body{font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#111;margin:0}
    h1{font-size:22px;margin:0 0 4px} .top{display:flex;justify-content:space-between;gap:24px;margin-bottom:24px}
    .box{border:1px solid #ddd;border-radius:6px;padding:10px 12px;min-width:220px} small{color:#666}
    table{width:100%;border-collapse:collapse;margin-top:8px} th{background:#f3f4f6;text-align:left;font-size:10px;text-transform:uppercase}
    th,td{padding:6px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top} .r{text-align:right}
    .tot{margin-left:auto;width:280px;margin-top:14px} .tot td{border:0;padding:3px 8px} .grand td{font-size:14px;font-weight:bold;border-top:2px solid #111}
    .foot{margin-top:28px;color:#444;font-size:10px;white-space:pre-line}</style></head><body>
    <div class="top"><div><h1>${esc(e.nom || 'MD Logistique')}</h1><div>${nl(e.adresse)}</div>
      ${e.tva ? `<div>TVA : ${esc(e.tva)}</div>` : ''}${e.telephone ? `<div>${esc(e.telephone)}</div>` : ''}${e.email ? `<div>${esc(e.email)}</div>` : ''}</div>
      <div><h1>Facture</h1><div>N° <b>${esc(inv.numero)}</b></div><div>Date : ${formatDate(inv.dateEmission)}</div>
      <div>Période : ${esc(monthLabel(inv.month))}</div></div></div>
    <div class="box"><small>Facturé à</small><br><b>${esc(c.nom)}</b><br>${nl(c.adresse)}${c.tva ? `<br>TVA : ${esc(c.tva)}` : ''}</div>
    <table><thead><tr><th>Date</th><th>Route</th><th>Chauffeur / véhicule</th><th class="r">Km</th><th class="r">Prix de base</th>
      <th class="r">Surcharge carburant</th><th class="r">Total HT</th></tr></thead><tbody>${lines}</tbody></table>
    <table class="tot"><tr><td>Prix de base</td><td class="r">${euro(inv.totalBase)}</td></tr>
      <tr><td>Surcharge carburant</td><td class="r">${euro(inv.totalSurcharge)}</td></tr>
      <tr><td>Total HT</td><td class="r">${euro(inv.totalHt)}</td></tr>
      <tr><td>TVA ${inv.vatRate} %</td><td class="r">${euro(inv.totalTva)}</td></tr>
      <tr class="grand"><td>Total TTC</td><td class="r">${euro(inv.totalTtc)}</td></tr></table>
    <div class="foot">${inv.lines[0]?.fuelRate != null ? `Surcharge carburant : ${inv.lines[0].fuelRate} €/km (${esc(monthLabel(inv.month))}).\n` : ''}${esc(inv.notes || '')}
${e.iban ? `Paiement : IBAN ${esc(e.iban)}${e.bic ? ` — BIC ${esc(e.bic)}` : ''}` : ''}
${esc(e.conditions || '')}</div></body></html>`;
}

function printHtml(html) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 250);
  setTimeout(() => iframe.remove(), 60000);
}

/* ─── Préparer une facture ───────────────────────────────────────────── */

function Prepare({ companies, onCreated }) {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [trips, setTrips] = useState(null);
  const [vat, setVat] = useState('21');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setTrips(null);
    flotteApi.trips({ month, status: 'a_facturer' }).then(setTrips).catch((e) => setError(e.message));
  }, [month]);
  useEffect(load, [load]);

  const groups = useMemo(() => {
    const g = {};
    (trips || []).forEach((t) => {
      const k = t.companyId || 'none';
      g[k] = g[k] || { companyId: t.companyId, nom: t.companyNom || 'Sans client', trips: [] };
      g[k].trips.push(t);
    });
    return Object.values(g).sort((a, b) => (a.companyId ? 0 : 1) - (b.companyId ? 0 : 1) || a.nom.localeCompare(b.nom));
  }, [trips]);
  const noRate = trips?.some((t) => t.fuelRate == null);

  const create = async (g) => {
    setBusy(g.companyId);
    try {
      const inv = await flotteApi.createInvoice({ companyId: g.companyId, month, vatRate: vat });
      toast(`Facture ${inv.numero} créée (brouillon)`);
      onCreated(inv);
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Mois"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputBase} w-44`} /></Field>
        <Field label="TVA (%)"><input type="number" min="0" step="0.01" value={vat} onChange={(e) => setVat(e.target.value)} className={`${inputBase} w-24`} /></Field>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {noRate && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Renseignez le taux de surcharge carburant de {monthLabel(month)} (onglet « Carburant ») avant de facturer.
        </div>
      )}
      {!trips ? <Loader /> : groups.length === 0 ? (
        <Empty title={`Rien à facturer en ${monthLabel(month)}`}>Tous les trajets du mois sont déjà facturés, ou aucun n'a été déclaré.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => {
            const missing = g.trips.filter((t) => t.basePrice == null).length;
            const km = g.trips.reduce((s, t) => s + t.distanceKm, 0);
            const sur = g.trips.reduce((s, t) => s + (t.surcharge || 0), 0);
            const base = g.trips.reduce((s, t) => s + (t.basePrice || 0), 0);
            const ht = base + sur;
            const ready = g.companyId && !missing && !noRate;
            return (
              <Card key={g.companyId || 'none'} title={g.nom} subtitle={`${g.trips.length} trajet(s) · ${km.toLocaleString('fr-BE')} km`}>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Prix de base</dt><dd className="tabular-nums">{euro(base)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Surcharge carburant</dt><dd className="tabular-nums">{euro(sur)}</dd></div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold dark:border-slate-800"><dt>Total HT</dt><dd className="tabular-nums">{euro(ht)}</dd></div>
                  <div className="flex justify-between text-slate-500"><dt>TTC ({vat} %)</dt><dd className="tabular-nums">{euro(ht * (1 + Number(vat || 0) / 100))}</dd></div>
                </dl>
                {!g.companyId && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Attribuez un client à ces trajets dans « Formulaires chauffeurs ».</p>}
                {g.companyId && missing > 0 && (
                  <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                    Prix de base à saisir pour {missing} trajet(s) — <Link className="font-semibold underline" to="/trajets">compléter</Link>.
                  </p>
                )}
                <Button className="mt-4 w-full" disabled={!ready || busy === g.companyId} onClick={() => create(g)}>
                  {busy === g.companyId ? 'Création…' : 'Générer la facture'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Factures ───────────────────────────────────────────────────────── */

function InvoiceModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const [inv, setInv] = useState(null);
  useEffect(() => { flotteApi.invoice(id).then(setInv).catch((e) => { toast(e.message, 'error'); onClose(); }); }, [id, toast, onClose]);

  const setStatus = async (status) => {
    try { setInv(await flotteApi.updateInvoice(id, { status })); onChanged(); } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async () => {
    if (!window.confirm(`Supprimer la facture brouillon ${inv.numero} ? Ses trajets redeviennent « à facturer ».`)) return;
    try { await flotteApi.deleteInvoice(id); toast('Facture supprimée'); onChanged(); onClose(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <Modal
      title={inv ? `Facture ${inv.numero}` : 'Facture'}
      subtitle={inv ? `${inv.client?.nom} · ${monthLabel(inv.month)}` : ''}
      size="lg"
      onClose={onClose}
      footer={inv && <>
        {inv.status === 'BROUILLON' && <Button variant="danger" className="mr-auto" onClick={remove}><TrashIcon /> Supprimer</Button>}
        <Button variant="secondary" onClick={() => exportTripsXlsx(inv.lines, `${inv.numero}.xlsx`)}><DownloadIcon /> Excel</Button>
        <Button variant="secondary" onClick={() => printHtml(invoiceHtml(inv))}><PrintIcon /> Imprimer / PDF</Button>
        {inv.status === 'BROUILLON' && <Button onClick={() => setStatus('EMISE')}>Marquer comme émise</Button>}
        {inv.status === 'EMISE' && <Button onClick={() => setStatus('PAYEE')}>Marquer comme payée</Button>}
      </>}
    >
      {!inv ? <Loader /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[inv.status].cls}`}>{STATUS[inv.status].label}</span>
            <span className="text-slate-500">Émise le {formatDate(inv.dateEmission)}</span>
          </div>
          <iframe title="Aperçu de la facture" srcDoc={invoiceHtml(inv)} className="h-[60vh] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700" />
        </div>
      )}
    </Modal>
  );
}

function Invoices({ openId, setOpenId, refreshKey }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    flotteApi.invoices().then(setList).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load, refreshKey]);

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} onRetry={load} />
      {!list ? <Loader /> : list.length === 0 ? (
        <Empty title="Aucune facture">Générez une facture depuis l'onglet « À facturer ».</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
              <tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Période</th>
                <th className="px-4 py-3 text-right">HT</th><th className="px-4 py-3 text-right">TTC</th><th className="px-4 py-3">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((i) => (
                <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer hover:bg-orange-50/40 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono font-bold">{i.numero}</td>
                  <td className="px-4 py-3">{i.client?.nom}</td>
                  <td className="px-4 py-3 capitalize">{monthLabel(i.month)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{euro(i.totalHt)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{euro(i.totalTtc)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {openId && <InvoiceModal id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

/* ─── Carburant & coordonnées ────────────────────────────────────────── */

function FuelAndIssuer() {
  const toast = useToast();
  const [rates, setRates] = useState(null);
  const [month, setMonth] = useState(currentMonth());
  const [rate, setRate] = useState('');
  const [issuer, setIssuer] = useState(null);

  const load = useCallback(() => {
    flotteApi.fuelRates().then(setRates).catch((e) => toast(e.message, 'error'));
  }, [toast]);
  useEffect(() => { load(); flotteApi.companyInfo().then(setIssuer).catch(() => {}); }, [load]);
  useEffect(() => {
    const r = rates?.find((x) => x.month === month);
    setRate(r ? String(r.rate) : '');
  }, [month, rates]);

  const saveRate = async (e) => {
    e.preventDefault();
    try { await flotteApi.setFuelRate(month, rate); toast(`Taux de ${monthLabel(month)} enregistré`); load(); } catch (err) { toast(err.message, 'error'); }
  };
  const saveIssuer = async (e) => {
    e.preventDefault();
    try { setIssuer(await flotteApi.saveCompanyInfo(issuer)); toast('Coordonnées enregistrées'); } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Surcharge carburant mensuelle" subtitle="Surcharge d'un trajet = distance de la route × taux du mois.">
        <form onSubmit={saveRate} className="flex flex-wrap items-end gap-3">
          <Field label="Mois"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputBase} w-44`} /></Field>
          <Field label="Taux (€/km)"><input required type="number" step="0.0001" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0,06" className={`${inputBase} w-32`} /></Field>
          <Button type="submit">Enregistrer</Button>
        </form>
        {rate && <p className="mt-3 text-sm text-slate-500">Ex. route de 447 km → surcharge de <strong>{euro(447 * Number(rate))}</strong>.</p>}
        <ul className="mt-5 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {(rates || []).map((r) => (
            <li key={r.month} className="flex justify-between py-2">
              <button type="button" className="capitalize hover:text-orange-600" onClick={() => setMonth(r.month)}>{monthLabel(r.month)}</button>
              <span className="font-semibold tabular-nums">{r.rate} €/km</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">Le taux est figé sur chaque trajet au moment de la facture : le modifier ensuite ne change pas les factures existantes.</p>
      </Card>

      <Card title="Coordonnées de MD Logistique" subtitle="Affichées en en-tête et en pied des factures.">
        {!issuer ? <Loader /> : (
          <form onSubmit={saveIssuer} className="grid gap-3 sm:grid-cols-2">
            {[['nom', 'Raison sociale'], ['tva', 'N° TVA'], ['telephone', 'Téléphone'], ['email', 'Email'], ['iban', 'IBAN'], ['bic', 'BIC']].map(([k, l]) => (
              <Field key={k} label={l}><input className={inputClass} value={issuer[k] || ''} onChange={(e) => setIssuer({ ...issuer, [k]: e.target.value })} /></Field>
            ))}
            <Field label="Adresse" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={issuer.adresse || ''} onChange={(e) => setIssuer({ ...issuer, adresse: e.target.value })} /></Field>
            <Field label="Conditions de paiement" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={issuer.conditions || ''} onChange={(e) => setIssuer({ ...issuer, conditions: e.target.value })} placeholder="Paiement à 30 jours fin de mois." /></Field>
            <div className="sm:col-span-2"><Button type="submit">Enregistrer</Button></div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function Facturation() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'preparer';
  const [companies, setCompanies] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => { flotteApi.refs().then((r) => setCompanies(r.companies)).catch(() => {}); }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Exploitation</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Facturation</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prix de base + surcharge carburant (km × taux du mois), une facture par client et par mois.</p>
        </div>
        <Tabs value={tab} onChange={(v) => setParams({ tab: v })} tabs={[
          { value: 'preparer', label: 'À facturer' }, { value: 'factures', label: 'Factures' }, { value: 'carburant', label: 'Carburant & coordonnées' },
        ]} />
      </div>
      {tab === 'preparer' && (
        <Prepare companies={companies} onCreated={(inv) => { setRefreshKey((k) => k + 1); setParams({ tab: 'factures' }); setOpenId(inv.id); }} />
      )}
      {tab === 'factures' && <Invoices openId={openId} setOpenId={setOpenId} refreshKey={refreshKey} />}
      {tab === 'carburant' && <FuelAndIssuer />}
    </div>
  );
}
