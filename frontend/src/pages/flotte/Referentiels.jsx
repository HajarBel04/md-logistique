// Référentiels : routes, sociétés clientes, types de véhicule, types de pannes (ajouter / modifier / supprimer)
import { useCallback, useEffect, useState } from 'react';
import { flotteApi } from '../../flotte/api';
import {
  Button, EditIcon, Empty, ErrorBanner, Field, IconButton, Loader, Modal, PlusIcon, Tabs, TrashIcon,
  inputClass, useToast,
} from '../../flotte/ui';

const KINDS = {
  routes: {
    label: 'Routes', one: 'route',
    columns: [
      { key: 'code', label: 'Job# / Schedule#', mono: true },
      { key: 'itineraire', label: 'Itinéraire' },
      { key: 'distanceKm', label: 'Distance', render: (v) => (v == null ? <span className="font-semibold text-red-600">À compléter</span> : `${v.toLocaleString('fr-BE')} km`) },
      { key: 'companyNom', label: 'Client par défaut', render: (v) => v || '—' },
    ],
    fields: [
      { key: 'code', label: 'Job# / Schedule# (nom de la route)', placeholder: 'ROUTE 1', required: true, upper: true },
      { key: 'itineraire', label: 'Routing (city)', placeholder: 'BRUBE - LUMBE - EDNNL - BRUBE', upper: true },
      { key: 'distanceKm', label: 'km per job', type: 'number', placeholder: '200' },
      { key: 'companyId', label: 'Client par défaut', type: 'company' },
    ],
  },
  companies: {
    label: 'Sociétés clientes', one: 'société',
    columns: [
      { key: 'nom', label: 'Nom' },
      { key: 'numeroClient', label: 'N° client', render: (v) => v || '—' },
      { key: 'tva', label: 'BTW / T.V.A', render: (v) => v || '—' },
      { key: 'adresse', label: 'Adresse', render: (v) => v || '—' },
      { key: 'email', label: 'Email facturation', render: (v) => v || '—' },
    ],
    fields: [
      { key: 'nom', label: 'Nom', placeholder: 'UPS', required: true },
      { key: 'numeroClient', label: 'N° client (sur la facture)', placeholder: 'CL0009' },
      { key: 'tva', label: 'BTW / T.V.A', placeholder: 'DE123456789' },
      { key: 'adresse', label: 'Adresse (rue, puis code postal + ville, puis pays — une ligne chacun)', type: 'textarea' },
      { key: 'email', label: 'Email facturation', type: 'email' },
    ],
  },
  'vehicle-types': {
    label: 'Types de véhicule', one: 'type de véhicule',
    columns: [{ key: 'nom', label: 'Nom' }],
    fields: [{ key: 'nom', label: 'Nom', placeholder: 'CAMION - REMORQUE', required: true, upper: true }],
  },
  'breakdown-types': {
    label: 'Types de pannes', one: 'type de panne',
    columns: [{ key: 'nom', label: 'Nom' }],
    fields: [{ key: 'nom', label: 'Nom', placeholder: 'Crevaison', required: true }],
  },
};

function RefModal({ kind, item, companies, onClose, onSaved }) {
  const toast = useToast();
  const def = KINDS[kind];
  const [form, setForm] = useState(() => Object.fromEntries(def.fields.map((f) => [f.key, item?.[f.key] ?? ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = item ? await flotteApi.updateRef(kind, item.id, form) : await flotteApi.createRef(kind, form);
      toast(item ? 'Modifications enregistrées' : `${def.one[0].toUpperCase()}${def.one.slice(1)} ajoutée`);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={item ? `Modifier — ${item.code || item.nom}` : `Ajouter : ${def.one}`}
      size="sm"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button type="submit" form="ref-form" disabled={busy}>{busy ? '…' : item ? 'Enregistrer' : 'Ajouter'}</Button>
      </>}
    >
      <form id="ref-form" onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        {def.fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === 'textarea' ? (
              <textarea rows={3} className={inputClass} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            ) : f.type === 'company' ? (
              <select className={inputClass} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                <option value="">— Aucun (choisi au trajet) —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            ) : (
              <input
                required={f.required}
                type={f.type === 'number' ? 'number' : f.type || 'text'}
                step={f.type === 'number' ? '0.1' : undefined}
                min={f.type === 'number' ? '0' : undefined}
                className={`${inputClass} ${f.upper ? 'uppercase' : ''}`}
                placeholder={f.placeholder}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            )}
          </Field>
        ))}
      </form>
    </Modal>
  );
}

export default function Referentiels() {
  const toast = useToast();
  const [kind, setKind] = useState('routes');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item

  const load = useCallback(() => {
    flotteApi.refs().then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const def = KINDS[kind];
  const items = data?.[kind] || [];

  const toggle = async (item) => {
    try {
      await flotteApi.updateRef(kind, item.id, { active: !item.active });
      load();
    } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Supprimer « ${item.code || item.nom} » ?\nLes trajets déjà enregistrés gardent leurs informations.`)) return;
    try {
      await flotteApi.deleteRef(kind, item.id);
      toast('Supprimé');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Administration</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Référentiels</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les routes et leurs kilomètres, les clients facturés, les types de véhicule et de pannes.</p>
        </div>
        <Button onClick={() => setEditing('new')}><PlusIcon /> Ajouter : {def.one}</Button>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      <Tabs value={kind} onChange={setKind} tabs={Object.entries(KINDS).map(([k, d]) => ({ value: k, label: d.label, count: data?.[k]?.length }))} />

      {!data ? <Loader /> : items.length === 0 ? (
        <Empty title={`Aucun élément dans « ${def.label} »`} action={<Button onClick={() => setEditing('new')}><PlusIcon /> Ajouter</Button>} />
      ) : (
<>
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
              <tr>
                {def.columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
                <th className="px-4 py-3">Actif</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((it) => (
                <tr key={it.id} className={it.active ? '' : 'opacity-50'}>
                  {def.columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.mono ? 'font-mono font-bold' : ''} text-slate-700 dark:text-slate-200`}>
                      {c.render ? c.render(it[c.key]) : it[c.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button type="button" role="switch" aria-checked={it.active} onClick={() => toggle(it)}
                      className={`relative h-5 w-9 rounded-full transition before:absolute before:-inset-3 before:content-[''] ${it.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      title={it.active ? 'Désactiver (masqué pour les chauffeurs)' : 'Activer'}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${it.active ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <IconButton label="Modifier" onClick={() => setEditing(it)}><EditIcon /></IconButton>
                      <IconButton label="Supprimer" onClick={() => remove(it)} className="hover:!text-red-600"><TrashIcon /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile : une carte par élément, actions accessibles au pouce */}
        <ul className="space-y-2 md:hidden">
          {items.map((it) => (
            <li key={it.id} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${it.active ? '' : 'opacity-60'}`}>
              <dl className="space-y-1">
                {def.columns.map((c, i) => (
                  <div key={c.key} className={i === 0 ? '' : 'flex justify-between gap-3 text-sm'}>
                    {i === 0 ? (
                      <dd className={`text-base font-semibold text-slate-900 dark:text-white ${c.mono ? 'font-mono' : ''}`}>{c.render ? c.render(it[c.key]) : it[c.key]}</dd>
                    ) : (
                      <>
                        <dt className="text-slate-500 dark:text-slate-400">{c.label}</dt>
                        <dd className={`text-right text-slate-800 dark:text-slate-200 ${c.mono ? 'font-mono font-bold' : ''}`}>{(c.render ? c.render(it[c.key]) : it[c.key]) || '—'}</dd>
                      </>
                    )}
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <button type="button" role="switch" aria-checked={it.active} onClick={() => toggle(it)}
                    className={`relative h-5 w-9 rounded-full transition before:absolute before:-inset-3 before:content-[''] ${it.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${it.active ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                  {it.active ? 'Actif' : 'Inactif'}
                </label>
                <div className="flex">
                  <IconButton label="Modifier" onClick={() => setEditing(it)}><EditIcon /></IconButton>
                  <IconButton label="Supprimer" onClick={() => remove(it)} className="hover:!text-red-600"><TrashIcon /></IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}

      {editing && (
        <RefModal
          kind={kind}
          item={editing === 'new' ? null : editing}
          companies={data?.companies || []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
