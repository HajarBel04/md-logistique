// Les 4 documents réglementaires du chauffeur, un onglet chacun :
// Carte d'identité · Permis de conduire · Carte conducteur · Certificat ADR.
// Admin : informations modifiables + document + validation. Chauffeur : lecture + envoi du document.
import { useEffect, useState } from 'react';
import { flotteApi } from './api';
import DocumentVault from './DocumentVault';
import { Button, Field, StatusPill, Tabs, inputClass, useToast } from './ui';
import { ADR_CATEGORIES, PERMIS_CATEGORIES, countdown, formatDate } from './utils';

const TABS = [
  {
    key: 'identite', label: "Carte d'identité", slot: 'CARTE_IDENTITE', item: 'CARTE_IDENTITE',
    fields: [
      { key: 'cinNumero', label: 'N° de carte' },
      { key: 'cinExpiration', label: "Date d'expiration", type: 'date', item: 'CARTE_IDENTITE' },
      { key: 'dateNaissance', label: 'Date de naissance', type: 'date' },
      { key: 'adresse', label: 'Adresse', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'permis', label: 'Permis de conduire', slot: 'PERMIS_CONDUIRE', item: 'PERMIS',
    fields: [
      { key: 'permisNumero', label: 'N° de permis (champ 5)' },
      { key: 'permisDelivrance', label: 'Délivré le (4a)', type: 'date' },
      { key: 'permisExpiration', label: 'Valable jusqu’au (4b)', type: 'date', item: 'PERMIS' },
      { key: 'selectionMedicaleExpiration', label: 'Sélection médicale (col. 11)', type: 'date', item: 'SELECTION_MEDICALE' },
      { key: 'code95Expiration', label: 'Code 95 (col. 12)', type: 'date', item: 'CODE_95', pl: true },
      { key: 'permisCategories', label: 'Catégories (champ 9)', type: 'chips', options: PERMIS_CATEGORIES, wide: true },
    ],
  },
  {
    key: 'carte', label: 'Carte conducteur', slot: 'CARTE_CHAUFFEUR', item: 'CARTE_CONDUCTEUR', pl: true,
    fields: [
      { key: 'carteConducteurNumero', label: 'N° de carte (5b)', mono: true },
      { key: 'carteConducteurDelivrance', label: 'Délivrée le (4a)', type: 'date' },
      { key: 'carteConducteurExpiration', label: 'Valable jusqu’au (4b)', type: 'date', item: 'CARTE_CONDUCTEUR' },
      { key: 'permisNumero', label: 'N° de permis lié (5a)', readOnly: true },
    ],
  },
  {
    key: 'adr', label: 'Certificat ADR', slot: 'CERTIFICAT_ADR', item: 'ADR_CHAUFFEUR',
    fields: [
      { key: 'adrNumero', label: 'N° de certificat' },
      { key: 'adrCertificatExpiration', label: 'Valable jusqu’au', type: 'date', item: 'ADR_CHAUFFEUR' },
      { key: 'adrCategories', label: 'Classes / spécialisations', type: 'chips', options: ADR_CATEGORIES, wide: true },
    ],
  },
];

function Chips({ options, value, onChange, readOnly }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        if (readOnly && !on) return null;
        return (
          <button key={o} type="button" disabled={readOnly} aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${on
              ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900'
              : 'bg-white text-slate-600 ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>
            {o}
          </button>
        );
      })}
      {readOnly && value.length === 0 && <span className="text-sm text-slate-400">—</span>}
    </div>
  );
}

export default function ComplianceDocTabs({ driver, onChange, mode = 'admin' }) {
  const toast = useToast();
  const isDriver = mode === 'driver';
  const pl = driver.typeChauffeur === 'POIDS_LOURD';
  const tabs = TABS.filter((t) => !t.pl || pl);
  const [tab, setTab] = useState(tabs[0].key);
  const def = tabs.find((t) => t.key === tab) || tabs[0];
  const fields = def.fields.filter((f) => !f.pl || pl);

  const initial = () => Object.fromEntries(fields.map((f) => [f.key, driver[f.key] ?? (f.type === 'chips' ? [] : '')]));
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(initial()), [driver, tab]);

  const dirty = fields.some((f) => !f.readOnly && JSON.stringify(form[f.key] ?? '') !== JSON.stringify(driver[f.key] ?? (f.type === 'chips' ? [] : '')));
  const itemFor = (type) => driver.compliance.find((c) => c.type === type);
  const main = itemFor(def.item);
  const doc = driver.documents?.[def.slot];

  const save = async () => {
    setSaving(true);
    try {
      const payload = Object.fromEntries(fields.filter((f) => !f.readOnly).map((f) => [f.key, form[f.key]]));
      onChange(await flotteApi.updateDriver(driver.id, payload));
      toast(`${def.label} enregistré`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={def.key} onChange={setTab} tabs={tabs.map((t) => {
        const it = itemFor(t.item);
        const d = driver.documents?.[t.slot];
        return { value: t.key, label: <>{t.label}{(!d || (it && ['expire', 'manquant'].includes(it.status))) && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-label="à compléter" />}</> };
      })} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white">{def.label}</h3>
          {main && main.status !== 'na' && (
            <StatusPill status={main.status}>{main.date ? `${formatDate(main.date)} · ${countdown(main.daysRemaining)}` : undefined}</StatusPill>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => {
            const ro = isDriver || f.readOnly;
            const it = f.item && itemFor(f.item);
            const label = <>{f.label}{it?.date && it.status !== 'valide' && <StatusPill status={it.status} className="ml-2 align-middle">{countdown(it.daysRemaining)}</StatusPill>}</>;
            return (
              <Field key={f.key} label={label} className={f.wide ? 'sm:col-span-2' : ''}>
                {f.type === 'chips' ? (
                  <Chips options={f.options} value={form[f.key] || []} readOnly={ro} onChange={(v) => setForm({ ...form, [f.key]: v })} />
                ) : ro ? (
                  <p className={`min-h-[38px] rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800 ${f.mono ? 'font-mono' : ''}`}>
                    {f.type === 'date' ? formatDate(form[f.key]) : form[f.key] || '—'}
                  </p>
                ) : f.type === 'textarea' ? (
                  <textarea rows={2} className={inputClass} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                ) : (
                  <input type={f.type || 'text'} className={`${inputClass} ${f.mono ? 'font-mono' : ''}`} value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                )}
              </Field>
            );
          })}
        </div>
        {!isDriver && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" disabled={!dirty || saving} onClick={() => setForm(initial())}>Annuler</Button>
            <Button disabled={!dirty || saving} onClick={save}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        )}
        {isDriver && <p className="mt-3 text-xs text-slate-500">Ces informations sont saisies par le bureau à partir du document que vous envoyez.</p>}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Document (recto / verso)</p>
        <DocumentVault driver={driver} onChange={onChange} mode={mode} only={[def.slot]} />
        {!doc && <p className="mt-2 text-xs text-slate-500">Photo ou scan : il sera recadré, et le recto et le verso peuvent être assemblés sur une seule image.</p>}
      </div>
    </div>
  );
}

export const MAIN_SLOTS = TABS.map((t) => t.slot);
