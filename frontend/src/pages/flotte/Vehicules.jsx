import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { flotteApi, fileUrl } from '../../flotte/api';
import CropperModal from '../../flotte/CropperModal';
import { DocumentActions } from '../../flotte/DocumentVault';
import { isPdf } from '../../flotte/docTools';
import {
  Button, Card, DeadlineCell, Drawer, Empty, ErrorBanner, Field, Loader, Modal, PlusIcon,
  SearchInput, StatusPill, Tabs, TrashIcon, UploadIcon, inputBase, inputClass, useToast,
} from '../../flotte/ui';
import {
  ADR_VEHICLES, CATEGORY_LABELS, CATEGORY_PLURAL, MOTORISES, countdown, formatDateTime, normalizePlate,
} from '../../flotte/utils';

const CATEGORIES = Object.keys(CATEGORY_LABELS);
const item = (v, type) => v.compliance.find((c) => c.type === type);

const STATUS_FILTERS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'bientot', label: 'Expire bientôt' },
  { value: 'expire', label: 'Expiré' },
  { value: 'manquant', label: 'À compléter' },
];

/* ─── Champ date enregistré automatiquement ─────────────────────────── */

function AutoDateField({ label, value, deadline, onSave, hint }) {
  const [v, setV] = useState(value || '');
  useEffect(() => setV(value || ''), [value]);
  const commit = () => { if ((v || null) !== (value || null)) onSave(v || null); };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        {deadline && deadline.status !== 'na' && (
          <StatusPill status={deadline.status}>{deadline.date ? countdown(deadline.daysRemaining) : undefined}</StatusPill>
        )}
      </div>
      <input type="date" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className={inputClass} aria-label={label} />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ─── Fiche véhicule ─────────────────────────────────────────────────── */

function VehicleDrawer({ vehicleId, onClose, onChanged }) {
  const toast = useToast();
  const [v, setV] = useState(null);
  const [tab, setTab] = useState('controles');
  const [pendingFile, setPendingFile] = useState(null);
  const [note, setNote] = useState({});
  const [vehicleTypes, setVehicleTypes] = useState([]);
  useEffect(() => { flotteApi.refs().then((r) => setVehicleTypes(r['vehicle-types'].filter((t) => t.active))).catch(() => {}); }, []);
  const fileRef = useRef(null);

  useEffect(() => {
    flotteApi.vehicle(vehicleId).then((data) => {
      setV(data);
      setNote({ remarque: data.remarque || '', assuranceCompagnie: data.assuranceCompagnie || '', assurancePolice: data.assurancePolice || '', assuranceRemarque: data.assuranceRemarque || '' });
    }).catch((e) => { toast(e.message, 'error'); onClose(); });
  }, [vehicleId, toast, onClose]);

  const patch = async (data, msg = 'Enregistré') => {
    try {
      const updated = await flotteApi.updateVehicle(v.id, data);
      setV(updated);
      onChanged();
      toast(msg);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const saveText = (key) => { if ((note[key] || '') !== (v[key] || '')) patch({ [key]: note[key] }); };

  const uploadInsurance = async (file) => {
    const updated = await flotteApi.uploadInsurance(v.id, file);
    setV(updated);
    onChanged();
    toast("Attestation d'assurance enregistrée");
  };

  const startUpload = (file) => {
    if (!file) return;
    if (isPdf(file)) uploadInsurance(file).catch((e) => toast(e.message, 'error'));
    else setPendingFile(file);
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement le véhicule ${v.plaque} ?`)) return;
    try {
      await flotteApi.deleteVehicle(v.id);
      toast(`${v.plaque} supprimé`);
      onChanged();
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!v) {
    return <Drawer title="Chargement…" onClose={onClose}><Loader /></Drawer>;
  }

  const motorise = MOTORISES.includes(v.categorie);
  const adr = ADR_VEHICLES.includes(v.categorie);
  const assurance = item(v, 'ASSURANCE');

  return (
    <Drawer
      title={<span className="font-mono tracking-wider">{v.plaque}</span>}
      subtitle={`${CATEGORY_LABELS[v.categorie]} · mis à jour ${formatDateTime(v.updatedAt)}`}
      badge={<StatusPill status={v.status} />}
      onClose={onClose}
      actions={<Button variant="danger" size="sm" onClick={remove}><TrashIcon /> Supprimer</Button>}
    >
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[{ value: 'controles', label: 'Contrôles & échéances' }, { value: 'assurance', label: 'Assurance' }]}
      />

      {tab === 'controles' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AutoDateField label="Contrôle technique" value={v.controleTechniqueExpiration} deadline={item(v, 'CONTROLE_TECHNIQUE')}
              onSave={(d) => patch({ controleTechniqueExpiration: d }, 'Contrôle technique mis à jour')} />
            {motorise ? (
              <AutoDateField label="Étalonnage tachygraphe" value={v.etalonnageTachygrapheExpiration} deadline={item(v, 'ETALONNAGE_TACHYGRAPHE')}
                onSave={(d) => patch({ etalonnageTachygrapheExpiration: d }, 'Étalonnage mis à jour')} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
                Étalonnage tachygraphe : non applicable aux remorques.
              </div>
            )}
            {(adr || v.certificatAdrExpiration) && (
              <AutoDateField label="Certificat ADR" value={v.certificatAdrExpiration} deadline={item(v, 'CERTIFICAT_ADR_VEHICULE')}
                onSave={(d) => patch({ certificatAdrExpiration: d }, 'Certificat ADR mis à jour')} />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Catégorie">
              <select className={inputClass} value={v.categorie} onChange={(e) => patch({ categorie: e.target.value }, 'Catégorie modifiée')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="Plaque">
              <input className={`${inputClass} font-mono uppercase`} defaultValue={v.plaque}
                onBlur={(e) => { const p = normalizePlate(e.target.value); if (p && p !== v.plaque) patch({ plaque: p }, 'Plaque modifiée'); }} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Type de véhicule">
              <select className={inputClass} value={v.typeVehiculeId || ''} onChange={(e) => patch({ typeVehiculeId: e.target.value }, 'Type modifié')}>
                <option value="">—</option>
                {vehicleTypes.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
              </select>
            </Field>
            <Field label="Carburant">
              <select className={inputClass} value={v.carburant || ''} onChange={(e) => patch({ carburant: e.target.value }, 'Carburant modifié')}>
                <option value="">—</option>
                {['diesel', 'essence', 'HVO', 'GNL', 'électrique'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Consommation (L/100 km)">
              <input type="number" step="0.01" min="0" className={inputClass} defaultValue={v.consommation ?? ''}
                onBlur={(e) => { const n = e.target.value === '' ? null : Number(e.target.value); if (n !== (v.consommation ?? null)) patch({ consommation: e.target.value }, 'Consommation modifiée'); }} />
            </Field>
          </div>

          <Field label="Remarque">
            <textarea rows={3} className={inputClass} value={note.remarque} onChange={(e) => setNote({ ...note, remarque: e.target.value })} onBlur={() => saveText('remarque')}
              placeholder="Ex. : pneus à remplacer, rendez-vous CT pris le…" />
          </Field>
        </div>
      )}

      {tab === 'assurance' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AutoDateField label="Validité de l'assurance" value={v.assuranceExpiration} deadline={assurance}
              onSave={(d) => patch({ assuranceExpiration: d }, 'Assurance mise à jour')} />
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Field label="Compagnie">
                <input className={inputClass} value={note.assuranceCompagnie} onChange={(e) => setNote({ ...note, assuranceCompagnie: e.target.value })} onBlur={() => saveText('assuranceCompagnie')} />
              </Field>
              <Field label="N° de police">
                <input className={inputClass} value={note.assurancePolice} onChange={(e) => setNote({ ...note, assurancePolice: e.target.value })} onBlur={() => saveText('assurancePolice')} />
              </Field>
            </div>
          </div>
          <Field label="Notes sur la police">
            <textarea rows={3} className={inputClass} value={note.assuranceRemarque} onChange={(e) => setNote({ ...note, assuranceRemarque: e.target.value })} onBlur={() => saveText('assuranceRemarque')}
              placeholder="Franchise, couverture, contact courtier…" />
          </Field>

          <Card
            title="Carte verte / attestation d'assurance"
            action={
              <div className="flex items-center gap-1">
                {v.assuranceDocument && <DocumentActions file={v.assuranceDocument} name={`${v.plaque} assurance`} cropped={false} />}
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                  <UploadIcon /> {v.assuranceDocument ? 'Remplacer' : 'Ajouter'}
                </Button>
              </div>
            }
          >
            {v.assuranceDocument ? (
              isPdf(v.assuranceDocument.mimeType) ? (
                <iframe title="Attestation d'assurance" src={fileUrl(v.assuranceDocument.url)} className="h-[520px] w-full rounded-lg bg-slate-100" />
              ) : (
                <img src={fileUrl(v.assuranceDocument.url)} alt="Attestation d'assurance" className="mx-auto max-h-[520px] rounded-lg ring-1 ring-slate-200 dark:ring-slate-700" />
              )
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); startUpload(e.dataTransfer.files?.[0]); }}
                className="rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700"
              >
                Glissez le PDF ou la photo de l'attestation ici, ou{' '}
                <button type="button" className="font-semibold text-orange-600 hover:underline" onClick={() => fileRef.current?.click()}>parcourez</button>.
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => { startUpload(e.target.files?.[0]); e.target.value = ''; }} />
          </Card>
        </div>
      )}

      {pendingFile && (
        <CropperModal
          source={pendingFile}
          title={`Assurance ${v.plaque}`}
          defaultPreset="free"
          allowRectoVerso={false}
          baseName={`${v.plaque} assurance`}
          onCancel={() => setPendingFile(null)}
          onSave={async ({ blob }) => { await uploadInsurance(blob); setPendingFile(null); }}
          onSaveOriginal={async () => { await uploadInsurance(pendingFile); setPendingFile(null); }}
        />
      )}
    </Drawer>
  );
}

/* ─── Ajout d'un véhicule ────────────────────────────────────────────── */

function NewVehicleModal({ defaultCategory, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    plaque: '', categorie: defaultCategory || 'TRACTEUR', controleTechniqueExpiration: '',
    etalonnageTachygrapheExpiration: '', certificatAdrExpiration: '', assuranceExpiration: '', remarque: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const motorise = MOTORISES.includes(form.categorie);
  const adr = ADR_VEHICLES.includes(form.categorie);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, plaque: normalizePlate(form.plaque) };
      if (!motorise) payload.etalonnageTachygrapheExpiration = null;
      if (!adr) payload.certificatAdrExpiration = null;
      const v = await flotteApi.createVehicle(payload);
      toast(`${v.plaque} ajouté à la flotte`);
      onCreated(v);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Nouveau véhicule"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button type="submit" form="new-vehicle" disabled={busy}>{busy ? 'Ajout…' : 'Ajouter le véhicule'}</Button>
      </>}
    >
      <form id="new-vehicle" onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plaque" hint="Ex. 1XTP669 ou QAL749">
            <input required autoFocus className={`${inputClass} font-mono uppercase`} value={form.plaque} onChange={set('plaque')} />
          </Field>
          <Field label="Catégorie">
            <select className={inputClass} value={form.categorie} onChange={set('categorie')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </Field>
          <Field label="Contrôle technique — expiration">
            <input type="date" className={inputClass} value={form.controleTechniqueExpiration} onChange={set('controleTechniqueExpiration')} />
          </Field>
          {motorise && (
            <Field label="Étalonnage tachygraphe — expiration">
              <input type="date" className={inputClass} value={form.etalonnageTachygrapheExpiration} onChange={set('etalonnageTachygrapheExpiration')} />
            </Field>
          )}
          {adr && (
            <Field label="Certificat ADR — expiration">
              <input type="date" className={inputClass} value={form.certificatAdrExpiration} onChange={set('certificatAdrExpiration')} />
            </Field>
          )}
          <Field label="Assurance — expiration">
            <input type="date" className={inputClass} value={form.assuranceExpiration} onChange={set('assuranceExpiration')} />
          </Field>
        </div>
        <Field label="Remarque">
          <textarea rows={2} className={inputClass} value={form.remarque} onChange={set('remarque')} />
        </Field>
      </form>
    </Modal>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function Vehicules() {
  const [vehicles, setVehicles] = useState(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');
  const searchRef = useRef(null);

  const load = useCallback(() => {
    flotteApi.vehicles().then((v) => { setVehicles(v); setError(''); }).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const open = (id) => setParams(id ? { id } : {});
  const close = useCallback(() => setParams({}), [setParams]);

  const counts = useMemo(() => {
    const c = { all: vehicles?.length || 0 };
    CATEGORIES.forEach((k) => { c[k] = vehicles?.filter((v) => v.categorie === k).length || 0; });
    return c;
  }, [vehicles]);

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    const q = normalizePlate(search);
    return vehicles.filter((v) =>
      (category === 'all' || v.categorie === category)
      && (statusFilter === 'all' || v.compliance.some((c) => c.status === statusFilter))
      && (!q || v.plaque.includes(q)));
  }, [vehicles, category, statusFilter, search]);

  const onSearchEnter = (e) => {
    if (e.key === 'Enter' && filtered.length === 1) open(filtered[0].id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Flotte</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Véhicules</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Contrôle technique, étalonnage tachygraphe, ADR et assurance de chaque véhicule.</p>
        </div>
        <Button onClick={() => setAdding(true)}><PlusIcon /> Nouveau véhicule</Button>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs
          value={category}
          onChange={setCategory}
          tabs={[{ value: 'all', label: 'Tous', count: counts.all }, ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_PLURAL[c], count: counts[c] }))]}
        />
        <div className="flex flex-wrap gap-2">
          <select className={`${inputBase} w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut">
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div onKeyDown={onSearchEnter} className="w-full sm:w-64">
            <SearchInput inputRef={searchRef} value={search} onChange={setSearch} placeholder="Plaque (ex. 1XTP669)" />
          </div>
        </div>
      </div>

      {!vehicles ? <Loader /> : filtered.length === 0 ? (
        <Empty title="Aucun véhicule ne correspond" action={search || statusFilter !== 'all' || category !== 'all'
          ? <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setCategory('all'); }}>Effacer les filtres</Button>
          : <Button onClick={() => setAdding(true)}><PlusIcon /> Ajouter un véhicule</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Plaque</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Contrôle technique</th>
                <th className="px-4 py-3">Étalonnage tachy.</th>
                <th className="px-4 py-3">ADR</th>
                <th className="px-4 py-3">Assurance</th>
                <th className="px-4 py-3">Remarque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((v) => (
                <tr key={v.id} onClick={() => open(v.id)} className="cursor-pointer align-top transition hover:bg-orange-50/40 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md border-2 border-red-700/80 bg-white px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-red-800 dark:bg-slate-950 dark:text-red-300">{v.plaque}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{CATEGORY_LABELS[v.categorie]}</td>
                  <td className="px-4 py-3"><DeadlineCell item={item(v, 'CONTROLE_TECHNIQUE')} compact /></td>
                  <td className="px-4 py-3"><DeadlineCell item={item(v, 'ETALONNAGE_TACHYGRAPHE')} compact /></td>
                  <td className="px-4 py-3"><DeadlineCell item={item(v, 'CERTIFICAT_ADR_VEHICULE')} compact /></td>
                  <td className="px-4 py-3"><DeadlineCell item={item(v, 'ASSURANCE')} compact /></td>
                  <td className="max-w-[233px] px-4 py-3 text-xs text-slate-500 dark:text-slate-400"><span className="line-clamp-2">{v.remarque || ''}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <NewVehicleModal
          defaultCategory={category !== 'all' ? category : undefined}
          onClose={() => setAdding(false)}
          onCreated={(v) => { setAdding(false); load(); open(v.id); }}
        />
      )}
      {openId && <VehicleDrawer key={openId} vehicleId={openId} onClose={close} onChanged={load} />}
    </div>
  );
}
