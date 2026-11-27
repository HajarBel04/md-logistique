// Facturation hebdomadaire : lignes déclarées par les chauffeurs → Rate/Tour saisi par l'admin
// + Fuel Surch/KM → facture PDF / Excel au format M-D logistique.com sprl.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { flotteApi, fileUrl } from '../../flotte/api';
import { currentMonth, monthLabel } from '../../flotte/excel';
import { buildInvoicePdf, eur2, eur5, exportInvoiceXlsx, periodLabel } from '../../flotte/invoiceExport';
import {
  Button, Card, DownloadIcon, Empty, ErrorBanner, EyeIcon, Field, Loader, Modal, Tabs, TrashIcon, UploadIcon,
  inputBase, inputClass, useToast,
} from '../../flotte/ui';
import { formatDate } from '../../flotte/utils';
import { messages, openWhatsApp } from '../../flotte/whatsapp';

const STATUS = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  EMISE: { label: 'Émise', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
  PAYEE: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
};

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function weekOf(offset = 0) {
  const d = new Date();
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { start: iso(monday), end: iso(sunday) };
}
const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

/* ─── CMR : voir / ajouter ───────────────────────────────────────────── */

export function CmrButton({ trip, onUpdated, retour = false }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const url = retour ? trip.returnCmrUrl : trip.cmrUrl;
  const label = retour ? 'Retour' : 'Aller';
  if (url) {
    return (
      <Button size="sm" variant="secondary" onClick={() => window.open(fileUrl(url), '_blank', 'noopener')}
        title={`Voir le CMR ${label.toLowerCase()}${(retour ? trip.returnCmrNumero : trip.cmrNumero) ? ` n° ${retour ? trip.returnCmrNumero : trip.cmrNumero}` : ''}`}>
        <EyeIcon /> {label}
      </Button>
    );
  }
  return (
    <label className={`inline-flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:ring-amber-500/40 ${busy ? 'opacity-50' : ''}`}
      title={`Aucun CMR ${label.toLowerCase()} — ajouter`}>
      <UploadIcon /> {label}
      <input type="file" accept="image/*,application/pdf" className="hidden" disabled={busy} onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setBusy(true);
        try { onUpdated(await flotteApi.uploadTripCmr(trip.id, f, retour)); toast('CMR ajouté'); } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
      }} />
    </label>
  );
}

/* ─── Éditeur de facture (lignes de la période pour un client) ──────── */

function InvoiceBuilder({ group, period, onCreated }) {
  const toast = useToast();
  const [rows, setRows] = useState(group.trips);
  const [draft, setDraft] = useState({}); // id → { basePrice, fuelRate } en cours de saisie
  const [vat, setVat] = useState('21');
  const [section, setSection] = useState('');
  const [numero, setNumero] = useState('');
  const [bulkRate, setBulkRate] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setRows(group.trips), [group.trips]);

  const val = (t, k) => (draft[t.id]?.[k] !== undefined ? draft[t.id][k] : t[k] ?? '');
  const calc = (t) => {
    const rate = num(val(t, 'basePrice'));
    const fuelInput = val(t, 'fuelRate');
    const fuel = fuelInput === '' ? t.fuelRate : num(fuelInput);
    const tot = fuel == null ? null : t.distanceKm * (t.tour || 1) * fuel;
    return { rate, fuel, tot, total: rate == null || tot == null ? null : rate + tot };
  };
  const lines = rows.map((t) => ({ t, ...calc(t) }));
  const cancelled = rows.filter((t) => t.statut === 'ANNULE').length;
  const totals = lines.reduce((s, l) => ({
    km: s.km + l.t.distanceKm, fuel: s.fuel + (l.tot || 0), sub: s.sub + (l.total ?? 0),
    missing: s.missing + (l.rate == null ? 1 : 0), noFuel: s.noFuel + (l.fuel == null ? 1 : 0),
  }), { km: 0, fuel: 0, sub: 0, missing: 0, noFuel: 0 });
  const vatN = num(vat) || 0;
  const tva = Math.round(totals.sub * vatN) / 100;

  const save = async (t, key) => {
    const v = draft[t.id]?.[key];
    if (v === undefined) return;
    const current = t[key] ?? '';
    if (String(v) === String(current)) return;
    try {
      const updated = await flotteApi.updateTrip(t.id, { [key]: v === '' ? null : v });
      setRows((rs) => rs.map((r) => (r.id === t.id ? updated : r)));
      setDraft((d) => { const n = { ...d }; if (n[t.id]) delete n[t.id][key]; return n; });
    } catch (e) { toast(e.message, 'error'); }
  };
  const setD = (t, key, v) => setDraft((d) => ({ ...d, [t.id]: { ...d[t.id], [key]: v } }));

  const applyBulk = async () => {
    if (bulkRate === '') return;
    try {
      const updated = await Promise.all(rows.map((t) => flotteApi.updateTrip(t.id, { fuelRate: bulkRate })));
      setRows(updated);
      setDraft({});
      toast(`Fuel Surch/KM ${bulkRate} appliqué à ${updated.length} ligne(s)`);
    } catch (e) { toast(e.message, 'error'); }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const inv = await flotteApi.createInvoice({
        companyId: group.companyId, start: period.start, end: period.end, vatRate: vat, section, numero,
        tripIds: rows.map((t) => t.id),
      });
      toast(`Facture ${inv.numero} créée`);
      onCreated(inv);
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };

  const cell = 'border border-slate-300 px-2 py-1.5 dark:border-slate-700';
  return (
    <Card padded={false} title={group.nom} subtitle={`${rows.length} ligne(s) · ${totals.km.toLocaleString('fr-BE')} km · ${formatDate(period.start)} au ${formatDate(period.end)}`}
      action={
        <div className="flex flex-wrap items-end gap-2">
          <input className={`${inputBase} w-28 py-1.5 text-sm`} placeholder="0,066" value={bulkRate} onChange={(e) => setBulkRate(e.target.value)} aria-label="Fuel Surch/KM pour toutes les lignes" />
          <Button size="sm" variant="secondary" onClick={applyBulk} disabled={bulkRate === ''}>Fuel/KM sur toutes les lignes</Button>
        </div>
      }>
      {cancelled > 0 && (
        <p className="mx-5 mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-200">
          {cancelled} route(s) <strong>annulée(s) sur place</strong> : le chauffeur s'est déplacé mais la route n'a pas été effectuée — ne facturez pas le tarif plein (adaptez le Rate/Tour).
        </p>
      )}
      {!group.companyId && <p className="px-5 pt-4 text-sm text-amber-700">Attribuez un client à ces lignes (page « Formulaires chauffeurs ») pour pouvoir les facturer.</p>}
      <div className="overflow-x-auto p-4">
        <table className="min-w-full border-collapse text-xs">
          <thead className="bg-slate-50 text-left text-xs font-bold dark:bg-slate-800">
            <tr>
              {['Date', 'Job# /Schedule#', 'Routing (city)', 'km per job', 'Tour', 'Rate/Tour', 'Fuel Surch/KM', 'Tot Fuel surch', 'Total Rate', 'CMR'].map((h) => (
                <th key={h} className={`${cell} whitespace-nowrap`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map(({ t, rate, fuel, tot, total }) => (
              <tr key={t.id} className={t.statut === 'ANNULE' ? 'bg-red-50 dark:bg-red-500/10' : ''}>
                <td className={`${cell} tabular-nums`}>{formatDate(t.date)}</td>
                <td className={cell}>{t.routeCode}
                  {t.statut === 'ANNULE' && <div className="mt-0.5 inline-block rounded bg-red-600 px-1.5 text-xs font-bold text-white" title="Route annulée sur place : ne pas facturer le tarif plein">ANNULÉ</div>}
                  {t.phase === 'EN_COURS' && <div className="mt-0.5 inline-block rounded bg-orange-100 px-1.5 text-xs font-bold text-orange-700">EN COURS</div>}
                  <div className="text-xs text-slate-500">{t.driverNom}</div></td>
                <td className={cell}>{t.itineraire}</td>
                <td className={`${cell} text-right tabular-nums`}>{t.distanceKm}</td>
                <td className={`${cell} text-center`}>{t.tour}</td>
                <td className={`${cell} p-1`}>
                  <input inputMode="decimal" value={val(t, 'basePrice')} placeholder="À saisir"
                    onChange={(e) => setD(t, 'basePrice', e.target.value)} onBlur={() => save(t, 'basePrice')}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className={`${inputBase} w-24 py-1 text-right tabular-nums ${rate == null ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : ''}`} aria-label={`Rate/Tour ${t.routeCode}`} />
                </td>
                <td className={`${cell} p-1`}>
                  <input inputMode="decimal" value={draft[t.id]?.fuelRate !== undefined ? draft[t.id].fuelRate : t.fuelRateOnRow ? t.fuelRate : ''}
                    placeholder={t.fuelRate != null && !t.fuelRateOnRow ? `${t.fuelRate} (mois)` : '0,066'}
                    onChange={(e) => setD(t, 'fuelRate', e.target.value)} onBlur={() => save(t, 'fuelRate')}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className={`${inputBase} w-28 py-1 text-right tabular-nums ${fuel == null ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : ''}`} aria-label={`Fuel Surch/KM ${t.routeCode}`} />
                </td>
                <td className={`${cell} text-right tabular-nums`}>{tot == null ? '—' : eur5(tot)}</td>
                <td className={`${cell} text-right font-bold tabular-nums`}>{total == null ? '—' : eur2(total)}</td>
                <td className={`${cell} p-1`}>
                  <div className="flex gap-1">
                    <CmrButton trip={t} onUpdated={(u) => setRows((rs) => rs.map((r) => (r.id === u.id ? u : r)))} />
                    <CmrButton trip={t} retour onUpdated={(u) => setRows((rs) => rs.map((r) => (r.id === u.id ? u : r)))} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold">
            <tr>
              <td colSpan={3} className="px-2 pt-3 text-right">Subtotal</td>
              <td className="px-2 pt-3 text-right tabular-nums">{totals.km.toLocaleString('fr-BE')}</td>
              <td colSpan={3} />
              <td className="px-2 pt-3 text-right tabular-nums">{eur2(totals.fuel)}</td>
              <td className="px-2 pt-3 text-right tabular-nums">{eur2(totals.sub)}</td>
            </tr>
            <tr>
              <td colSpan={8} className="px-2 text-right">TVA {vatN} %</td>
              <td className="px-2 text-right tabular-nums">{eur2(tva)}</td>
            </tr>
            <tr className="text-base">
              <td colSpan={8} className="px-2 text-right">Total</td>
              <td className="px-2 text-right tabular-nums">{eur2(totals.sub + tva)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
        <Field label="TVA (%)" hint="0 % = autoliquidation (client UE)"><input className={`${inputBase} w-24`} value={vat} onChange={(e) => setVat(e.target.value)} /></Field>
        <Field label="Libellé (ex. PAN -)"><input className={`${inputBase} w-36`} value={section} onChange={(e) => setSection(e.target.value)} /></Field>
        <Field label="N° de facture" hint="Vide = numéro automatique"><input className={`${inputBase} w-36`} value={numero} onChange={(e) => setNumero(e.target.value)} /></Field>
        <div className="ml-auto text-right">
          {(totals.missing > 0 || totals.noFuel > 0) && (
            <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
              {totals.missing > 0 && `${totals.missing} Rate/Tour à saisir. `}{totals.noFuel > 0 && `${totals.noFuel} Fuel Surch/KM à saisir (0 = sans surcharge).`}
            </p>
          )}
          <Button onClick={generate} disabled={busy || !group.companyId || totals.missing > 0 || totals.noFuel > 0 || Object.values(draft).some((d) => Object.keys(d).length)}>
            {busy ? 'Création…' : 'Générer la facture'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Prepare({ onCreated }) {
  const [period, setPeriod] = useState(weekOf(-1));
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setTrips(null);
    flotteApi.trips({ start: period.start, end: period.end, status: 'a_facturer' })
      .then((t) => { setTrips(t.slice().reverse()); setError(''); })
      .catch((e) => setError(e.message));
  }, [period]);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Du"><input type="date" className={`${inputBase} w-40`} value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} /></Field>
        <Field label="Au"><input type="date" className={`${inputBase} w-40`} value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} /></Field>
        <Button variant="secondary" onClick={() => setPeriod(weekOf(-1))}>Semaine dernière</Button>
        <Button variant="secondary" onClick={() => setPeriod(weekOf(0))}>Cette semaine</Button>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {!trips ? <Loader /> : groups.length === 0 ? (
        <Empty title="Rien à facturer sur cette période">Les lignes apparaissent ici dès que les chauffeurs déclarent leurs routes.</Empty>
      ) : groups.map((g) => (
        <InvoiceBuilder key={`${g.companyId}-${period.start}-${period.end}`} group={g} period={period} onCreated={(inv) => { onCreated(inv); load(); }} />
      ))}
    </div>
  );
}

/* ─── Factures ───────────────────────────────────────────────────────── */

function InvoiceModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const [inv, setInv] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  useEffect(() => { flotteApi.invoice(id).then(setInv).catch((e) => { toast(e.message, 'error'); onClose(); }); }, [id, toast, onClose]);
  useEffect(() => {
    if (!inv) return undefined;
    let url;
    buildInvoicePdf(inv).then((b) => { url = URL.createObjectURL(b); setPdfUrl(url); }).catch((e) => toast(e.message, 'error'));
    return () => url && URL.revokeObjectURL(url);
  }, [inv, toast]);

  const setStatus = async (status) => {
    try { setInv(await flotteApi.updateInvoice(id, { status })); onChanged(); } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async () => {
    if (!window.confirm(`Supprimer la facture brouillon ${inv.numero} ? Ses lignes redeviennent « à facturer ».`)) return;
    try { await flotteApi.deleteInvoice(id); toast('Facture supprimée'); onChanged(); onClose(); } catch (e) { toast(e.message, 'error'); }
  };
  const shareWhatsApp = async () => {
    const text = messages.facture({ client: inv.client?.nom, numero: inv.numero, periode: periodLabel(inv), total: eur2(inv.totalTtc) });
    // Sur téléphone : feuille de partage avec le PDF joint (choisir WhatsApp). Sinon : WhatsApp avec le message.
    try {
      const blob = await (await fetch(pdfUrl)).blob();
      const file = new File([blob], `Facture-${inv.numero}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: `Facture ${inv.numero}` });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    download();
    openWhatsApp(null, text);
    toast('PDF téléchargé : joignez-le dans la conversation WhatsApp');
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `Facture-${inv.numero}.pdf`;
    a.click();
  };

  return (
    <Modal
      title={inv ? `Facture ${inv.numero}` : 'Facture'}
      subtitle={inv ? `${inv.client?.nom} · ${periodLabel(inv)}` : ''}
      size="xl"
      onClose={onClose}
      footer={inv && <>
        {inv.status === 'BROUILLON' && <Button variant="danger" className="mr-auto" onClick={remove}><TrashIcon /> Supprimer</Button>}
        <Button variant="secondary" onClick={() => exportInvoiceXlsx(inv).catch((e) => toast(e.message, 'error'))}><DownloadIcon /> Excel</Button>
        <Button variant="secondary" onClick={download} disabled={!pdfUrl}><DownloadIcon /> PDF</Button>
        <Button onClick={shareWhatsApp} disabled={!pdfUrl} className="!bg-[#25D366] hover:!bg-[#1ebe5b]" title="Envoyer la facture au client par WhatsApp">WhatsApp</Button>
        {inv.status === 'BROUILLON' && <Button onClick={() => setStatus('EMISE')}>Marquer comme émise</Button>}
        {inv.status === 'EMISE' && <Button onClick={() => setStatus('PAYEE')}>Marquer comme payée</Button>}
      </>}
    >
      {!inv ? <Loader /> : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[inv.status].cls}`}>{STATUS[inv.status].label}</span>
            <span className="text-slate-500">Émise le {formatDate(inv.dateEmission)} · {inv.lines.length} ligne(s) · {inv.lines.filter((l) => l.cmrUrl).length} CMR</span>
          </div>
          {pdfUrl ? <iframe title="Aperçu PDF de la facture" src={pdfUrl} className="h-[62vh] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-700" /> : <Loader label="Génération du PDF…" />}
          <details className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <summary className="cursor-pointer font-semibold">CMR des lignes</summary>
            <ul className="mt-2 space-y-1">
              {inv.lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <span>{formatDate(l.date)} · {l.routeCode}{l.statut === 'ANNULE' ? ' (annulé)' : ''} · {l.driverNom}</span>
                  <span className="flex gap-3">
                    {l.cmrUrl ? <a className="font-semibold text-orange-600 hover:underline" href={fileUrl(l.cmrUrl)} target="_blank" rel="noopener noreferrer">CMR aller {l.cmrNumero || ''}</a> : <span className="text-amber-600">Pas de CMR aller</span>}
                    {l.returnCmrUrl ? <a className="font-semibold text-orange-600 hover:underline" href={fileUrl(l.returnCmrUrl)} target="_blank" rel="noopener noreferrer">CMR retour {l.returnCmrNumero || ''}</a> : <span className="text-amber-600">Pas de CMR retour</span>}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </Modal>
  );
}

function Invoices({ openId, setOpenId, refreshKey }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { flotteApi.invoices().then(setList).catch((e) => setError(e.message)); }, []);
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
                <th className="px-4 py-3 text-right">Subtotal</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((i) => (
                <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer hover:bg-orange-50/40 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono font-bold">{i.numero}</td>
                  <td className="px-4 py-3">{i.client?.nom}</td>
                  <td className="px-4 py-3">{periodLabel(i)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{eur2(i.totalHt)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{eur2(i.totalTtc)}</td>
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

  const load = useCallback(() => { flotteApi.fuelRates().then(setRates).catch((e) => toast(e.message, 'error')); }, [toast]);
  useEffect(() => { load(); flotteApi.companyInfo().then(setIssuer).catch(() => {}); }, [load]);
  useEffect(() => { const r = rates?.find((x) => x.month === month); setRate(r ? String(r.rate) : ''); }, [month, rates]);

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
      <Card title="Fuel Surch/KM par défaut" subtitle="Utilisé pour une ligne quand aucun taux n'y est saisi. Chaque ligne peut avoir son propre taux.">
        <form onSubmit={saveRate} className="flex flex-wrap items-end gap-3">
          <Field label="Mois"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${inputBase} w-44`} /></Field>
          <Field label="Taux (€/km)"><input required inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0,066" className={`${inputBase} w-32`} /></Field>
          <Button type="submit">Enregistrer</Button>
        </form>
        <ul className="mt-5 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {(rates || []).map((r) => (
            <li key={r.month} className="flex justify-between py-2">
              <button type="button" className="capitalize hover:text-orange-600" onClick={() => setMonth(r.month)}>{monthLabel(r.month)}</button>
              <span className="font-semibold tabular-nums">{eur5(r.rate)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="En-tête des factures" subtitle="Coordonnées de M-D logistique.com sprl.">
        {!issuer ? <Loader /> : (
          <form onSubmit={saveIssuer} className="grid gap-3 sm:grid-cols-2">
            {[['nom', 'Raison sociale'], ['adresse', 'Adresse'], ['cpVille', 'CP & Ville'], ['pays', 'Pays'], ['telephone', 'Téléphone'], ['email', 'E-mail'],
              ['iban', 'Rekeningnummer (IBAN)'], ['tva', 'BTW nr']].map(([k, l]) => (
              <Field key={k} label={l}><input className={inputClass} value={issuer[k] || ''} onChange={(e) => setIssuer({ ...issuer, [k]: e.target.value })} /></Field>
            ))}
            <Field label="Mentions en bas de facture" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={issuer.conditions || ''} onChange={(e) => setIssuer({ ...issuer, conditions: e.target.value })} placeholder="Paiement à 30 jours." /></Field>
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
  const [openId, setOpenId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Exploitation</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Facturation</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total Rate = Rate/Tour + km × Fuel Surch/KM. Une facture par client et par semaine.</p>
        </div>
        <Tabs value={tab} onChange={(v) => setParams({ tab: v })} tabs={[
          { value: 'preparer', label: 'À facturer' }, { value: 'factures', label: 'Factures' }, { value: 'carburant', label: 'Carburant & en-tête' },
        ]} />
      </div>
      {tab === 'preparer' && (
        <Prepare onCreated={(inv) => { setRefreshKey((k) => k + 1); setParams({ tab: 'factures' }); setOpenId(inv.id); }} />
      )}
      {tab === 'factures' && <Invoices openId={openId} setOpenId={setOpenId} refreshKey={refreshKey} />}
      {tab === 'carburant' && <FuelAndIssuer />}
    </div>
  );
}
