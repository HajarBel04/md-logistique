import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { flotteApi } from '../../flotte/api';
import CropperModal from '../../flotte/CropperModal';
import DocumentVault from '../../flotte/DocumentVault';
import ComplianceDocTabs, { MAIN_SLOTS } from '../../flotte/ComplianceDocTabs';
import { AccountModal } from './Comptes';
import { isPdf } from '../../flotte/docTools';
import {
  Button, DeadlineCell, Drawer, Empty, ErrorBanner, Field, LinkIcon, Loader, Modal, PlusIcon,
  SearchInput, StatusPill, Tabs, TrashIcon, inputBase, inputClass, useToast,
} from '../../flotte/ui';
import {
  ADR_CATEGORIES, PERMIS_CATEGORIES, STATUT_LABELS, slotsFor, TYPE_CHAUFFEUR_LABELS, countdown,
} from '../../flotte/utils';

const item = (d, type) => d.compliance.find((c) => c.type === type);

const EMPTY_FORM = {
  nom: '', prenom: '', dateNaissance: '', telephone: '', email: '', statut: 'ACTIF', typeChauffeur: 'POIDS_LOURD',
  permisNumero: '', permisCategories: [], permisExpiration: '', selectionMedicaleExpiration: '', code95Expiration: '',
  carteConducteurNumero: '', carteConducteurExpiration: '', adrCertificatExpiration: '', adrCategories: [],
  badgeKolnExpiration: '', attestationConducteurExpiration: '',
};
const FORM_KEYS = Object.keys(EMPTY_FORM);

function toForm(d) {
  const f = {};
  FORM_KEYS.forEach((k) => { f[k] = d[k] ?? (Array.isArray(EMPTY_FORM[k]) ? [] : ''); });
  return f;
}

function Chips({ options, value, onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          aria-pressed={value.includes(o)}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset transition ${
            value.includes(o)
              ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white'
              : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <legend className="px-1 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</legend>
      {hint && <p className="-mt-1 mb-3 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {children}
    </fieldset>
  );
}

/** Champs du chauffeur (création et modification). */
function DriverFields({ form, setForm, driver }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pl = form.typeChauffeur === 'POIDS_LOURD';
  const dl = (type) => {
    const it = driver && item(driver, type);
    return it && it.date ? <StatusPill status={it.status} className="ml-2 align-middle">{countdown(it.daysRemaining)}</StatusPill> : null;
  };
  return (
    <div className="space-y-4">
      <Section title="Identité">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom"><input required className={`${inputClass} uppercase`} value={form.nom} onChange={set('nom')} placeholder="BOUHTALA OUCHEN" /></Field>
          <Field label="Prénom"><input className={inputClass} value={form.prenom} onChange={set('prenom')} placeholder="Hamid" /></Field>
          <Field label="Date de naissance"><input type="date" className={inputClass} value={form.dateNaissance} onChange={set('dateNaissance')} /></Field>
          <Field label="Téléphone"><input type="tel" className={inputClass} value={form.telephone} onChange={set('telephone')} placeholder="+32 4…" /></Field>
          <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className={inputClass} value={form.typeChauffeur} onChange={set('typeChauffeur')}>
                {Object.entries(TYPE_CHAUFFEUR_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Statut">
              <select className={inputClass} value={form.statut} onChange={set('statut')}>
                {Object.entries(STATUT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Permis de conduire & Code 95" hint="Recto : champ 5 (numéro) et 4b (validité). Verso : colonne 11 (sélection médicale) et 12 (code 95 — « 95(JJ.MM.AA) »).">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="N° de permis (champ 5)"><input className={inputClass} value={form.permisNumero} onChange={set('permisNumero')} placeholder="1806018947" /></Field>
          <Field label={<>Validité du permis (4b){dl('PERMIS')}</>}><input type="date" className={inputClass} value={form.permisExpiration} onChange={set('permisExpiration')} /></Field>
          <Field label={<>Sélection médicale (col. 11){dl('SELECTION_MEDICALE')}</>}><input type="date" className={inputClass} value={form.selectionMedicaleExpiration} onChange={set('selectionMedicaleExpiration')} /></Field>
          {pl && <Field label={<>Code 95 (col. 12){dl('CODE_95')}</>}><input type="date" className={inputClass} value={form.code95Expiration} onChange={set('code95Expiration')} /></Field>}
        </div>
        <div className="mt-3">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Catégories (champ 9)</span>
          <Chips options={PERMIS_CATEGORIES} value={form.permisCategories} onChange={(v) => setForm((f) => ({ ...f, permisCategories: v }))} />
        </div>
      </Section>

      {pl && (
        <Section title="Carte conducteur (tachygraphe)" hint="Renouvellement géré par l'entreprise — alerte 3 mois avant l'expiration.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="N° de carte (champ 5b)"><input className={`${inputClass} font-mono`} value={form.carteConducteurNumero} onChange={set('carteConducteurNumero')} placeholder="B 8110 0002 5355 3000" /></Field>
            <Field label={<>Validité (champ 4b){dl('CARTE_CONDUCTEUR')}</>}><input type="date" className={inputClass} value={form.carteConducteurExpiration} onChange={set('carteConducteurExpiration')} /></Field>
          </div>
        </Section>
      )}

      <Section title="ADR" hint="Facultatif — à remplir seulement pour les chauffeurs formés au transport de marchandises dangereuses.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={<>Certificat ADR — validité{dl('ADR_CHAUFFEUR')}</>}><input type="date" className={inputClass} value={form.adrCertificatExpiration} onChange={set('adrCertificatExpiration')} /></Field>
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Spécialisations</span>
            <Chips options={ADR_CATEGORIES} value={form.adrCategories} onChange={(v) => setForm((f) => ({ ...f, adrCategories: v }))} />
          </div>
        </div>
      </Section>

      <Section title="Autres documents" hint="Facultatif — une alerte est créée dès qu'une date est saisie.">
        <div className="grid gap-3 sm:grid-cols-2">
          {pl ? (
            <Field label={<>Badge Köln — validité{dl('BADGE_KOLN')}</>}><input type="date" className={inputClass} value={form.badgeKolnExpiration} onChange={set('badgeKolnExpiration')} /></Field>
          ) : (
            <Field label={<>Attestation conducteur — validité{dl('ATTESTATION_CONDUCTEUR')}</>}><input type="date" className={inputClass} value={form.attestationConducteurExpiration} onChange={set('attestationConducteurExpiration')} /></Field>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ─── Création rapide ────────────────────────────────────────────────── */

function NewDriverModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [docs, setDocs] = useState({}); // slot → { file, cropped }
  const [cropping, setCropping] = useState(null); // { slot, file }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputs = useRef({});

  const onboardingSlots = slotsFor(form.typeChauffeur).filter((s) => s.key !== 'CERTIFICAT_ADR' || form.adrCategories.length || form.adrCertificatExpiration);

  const pick = (slot, file) => {
    if (!file) return;
    if (!slot.card && isPdf(file)) setDocs((d) => ({ ...d, [slot.key]: { file, cropped: false } }));
    else setCropping({ slot, file });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const driver = await flotteApi.createDriver(form);
      const failed = [];
      for (const [slot, { file, cropped }] of Object.entries(docs)) {
        try { await flotteApi.uploadDriverDoc(driver.id, slot, file, cropped); } catch { failed.push(slot); }
      }
      toast(failed.length ? `Chauffeur créé — ${failed.length} document(s) à renvoyer` : `${driver.nomComplet} ajouté`, failed.length ? 'error' : 'success');
      onCreated(driver);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Nouveau chauffeur"
      subtitle="Identité, échéances et documents sur un seul écran."
      size="lg"
      onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button type="submit" form="new-driver" disabled={busy}>{busy ? 'Création…' : 'Créer le chauffeur'}</Button>
      </>}
    >
      <form id="new-driver" onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <DriverFields form={form} setForm={setForm} />
        <Section title="Documents" hint="Glissez un fichier sur un emplacement : les cartes sont recadrées avant l'enregistrement.">
          <div className="grid gap-2 sm:grid-cols-3">
            {onboardingSlots.map((slot) => {
              const doc = docs[slot.key];
              return (
                <div
                  key={slot.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => inputs.current[slot.key]?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && inputs.current[slot.key]?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); pick(slot, e.dataTransfer.files?.[0]); }}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition ${
                    doc ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10' : 'border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50/50 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{slot.num}. {slot.label}</p>
                  <p className="truncate text-xs text-slate-500">{doc ? `✓ ${doc.cropped ? 'Recadré' : doc.file.name}` : 'Déposer ou cliquer'}</p>
                  <input ref={(el) => { inputs.current[slot.key] = el; }} type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={(e) => { pick(slot, e.target.files?.[0]); e.target.value = ''; }} />
                </div>
              );
            })}
          </div>
        </Section>
      </form>
      {cropping && (
        <CropperModal
          source={cropping.file}
          title={`${cropping.slot.num}. ${cropping.slot.label}`}
          defaultPreset={cropping.slot.card ? 'card' : 'free'}
          allowRectoVerso={cropping.slot.card}
          baseName={`${form.prenom} ${form.nom} ${cropping.slot.label}`}
          onCancel={() => setCropping(null)}
          onSave={async ({ blob }) => { setDocs((d) => ({ ...d, [cropping.slot.key]: { file: blob, cropped: true } })); setCropping(null); }}
          onSaveOriginal={async () => { setDocs((d) => ({ ...d, [cropping.slot.key]: { file: cropping.file, cropped: false } })); setCropping(null); }}
        />
      )}
    </Modal>
  );
}

/* ─── Fiche chauffeur ────────────────────────────────────────────────── */

function DriverDrawer({ driverId, onClose, onChanged }) {
  const toast = useToast();
  const [driver, setDriver] = useState(null);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('documents');
  const [accountModal, setAccountModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const apply = useCallback((d) => { setDriver(d); setForm(toForm(d)); }, []);

  useEffect(() => {
    flotteApi.driver(driverId).then(apply).catch((e) => { toast(e.message, 'error'); onClose(); });
  }, [driverId, apply, toast, onClose]);

  const dirty = driver && form && FORM_KEYS.some((k) => JSON.stringify(form[k] ?? '') !== JSON.stringify(toForm(driver)[k] ?? ''));

  const save = async () => {
    setSaving(true);
    try {
      apply(await flotteApi.updateDriver(driver.id, form));
      onChanged();
      toast('Fiche chauffeur enregistrée');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyPortal = async () => {
    const url = `${window.location.origin}/portail/${driver.accessToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Lien personnel copié — envoyez-le au chauffeur par SMS ou WhatsApp');
    } catch {
      window.prompt('Lien personnel du chauffeur :', url);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement ${driver.nomComplet}, ses documents et ses messages ?\nPour un départ, préférez le statut « Inactif ».`)) return;
    try {
      await flotteApi.deleteDriver(driver.id);
      toast(`${driver.nomComplet} supprimé`);
      onChanged();
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!driver || !form) return <Drawer title="Chargement…" onClose={onClose}><Loader /></Drawer>;

  return (
    <Drawer
      title={driver.nomComplet}
      subtitle={`${TYPE_CHAUFFEUR_LABELS[driver.typeChauffeur]} · ${STATUT_LABELS[driver.statut]}${driver.telephone ? ` · ${driver.telephone}` : ''}`}
      badge={<StatusPill status={driver.status} />}
      onClose={onClose}
      actions={<>
        <Button size="sm" variant="secondary" onClick={copyPortal} title="Lien de messagerie pour le chauffeur"><LinkIcon /> Lien chauffeur</Button>
        <Link to={`/messagerie?chauffeur=${driver.id}`}><Button size="sm" variant="secondary">Messages{driver.unreadMessages ? ` (${driver.unreadMessages})` : ''}</Button></Link>
      </>}
    >
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'documents', label: 'Documents réglementaires' },
          { value: 'autres', label: 'Dossier administratif', count: `${driver.documentsCount}/${driver.documentsTotal}` },
          { value: 'conformite', label: 'Fiche & échéances' },
          { value: 'compte', label: 'Compte' },
        ]}
      />
      {tab === 'documents' && (
        <ComplianceDocTabs driver={driver} onChange={(d) => { apply(d); onChanged(); }} />
      )}
      {tab === 'autres' && (
        <>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Les cartes sont recadrées et redressées à l'envoi. « Copier » place l'image propre dans le presse-papiers, prête à coller dans un email ou un portail d'auto-école.
          </p>
          <DocumentVault driver={driver} exclude={MAIN_SLOTS} onChange={(d) => { apply(d); onChanged(); }} />
        </>
      )}
      {tab === 'compte' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          {driver.account ? (
            <>
              <p className="text-sm text-slate-500">Le chauffeur se connecte avec :</p>
              <p className="mt-1 font-semibold">{[driver.account.email, driver.account.telephone].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 text-sm text-slate-500">{driver.account.active ? 'Compte actif' : 'Compte désactivé'}{driver.account.lastLogin ? ` · dernière connexion ${new Date(driver.account.lastLogin).toLocaleString('fr-BE')}` : ' · jamais connecté'}</p>
              <Button className="mt-4" variant="secondary" onClick={() => setAccountModal(true)}>Modifier / nouveau mot de passe</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">Ce chauffeur n'a pas encore de compte. Avec un compte, il déclare sa route du jour, envoie ses documents et écrit au bureau depuis son téléphone.</p>
              <Button className="mt-4" onClick={() => setAccountModal(true)}>Créer un compte chauffeur</Button>
            </>
          )}
          {accountModal && (
            <AccountModal role="CHAUFFEUR" account={driver.account} fixedDriver={driver}
              onClose={() => setAccountModal(false)}
              onSaved={() => flotteApi.driver(driver.id).then(apply)} />
          )}
        </div>
      )}
      {tab === 'conformite' && (
        <div className="space-y-4 pb-20">
          <DriverFields form={form} setForm={setForm} driver={driver} />
          <div className="flex justify-between">
            <Button variant="danger" size="sm" onClick={remove}><TrashIcon /> Supprimer le chauffeur</Button>
          </div>
          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-slate-200 bg-slate-50/95 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-6 sm:px-6">
            <Button variant="secondary" disabled={!dirty || saving} onClick={() => setForm(toForm(driver))}>Annuler</Button>
            <Button disabled={!dirty || saving} onClick={save}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function Chauffeurs() {
  const [drivers, setDrivers] = useState(null);
  const [error, setError] = useState('');
  const [statut, setStatut] = useState('ACTIF');
  const [type, setType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [params, setParams] = useSearchParams();
  const openId = params.get('id');

  const load = useCallback(() => {
    flotteApi.drivers().then((d) => { setDrivers(d); setError(''); }).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const close = useCallback(() => setParams({}), [setParams]);

  const counts = useMemo(() => {
    const c = { all: drivers?.length || 0 };
    Object.keys(STATUT_LABELS).forEach((k) => { c[k] = drivers?.filter((d) => d.statut === k).length || 0; });
    return c;
  }, [drivers]);

  const filtered = useMemo(() => {
    if (!drivers) return [];
    const q = search.trim().toLowerCase();
    return drivers.filter((d) =>
      (statut === 'all' || d.statut === statut)
      && (type === 'all' || d.typeChauffeur === type)
      && (statusFilter === 'all' || (statusFilter === 'docs' ? d.documentsCount < d.documentsTotal : d.compliance.some((c) => c.status === statusFilter)))
      && (!q || d.nomComplet.toLowerCase().includes(q) || (d.permisNumero || '').includes(q)));
  }, [drivers, statut, type, statusFilter, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Personnel</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Chauffeurs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sélection médicale, Code 95, carte conducteur, ADR et dossier administratif.</p>
        </div>
        <Button onClick={() => setAdding(true)}><PlusIcon /> Nouveau chauffeur</Button>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs
          value={statut}
          onChange={setStatut}
          tabs={[
            { value: 'ACTIF', label: 'Actifs', count: counts.ACTIF },
            { value: 'EN_COURS_EMBAUCHE', label: "En cours d'embauche", count: counts.EN_COURS_EMBAUCHE },
            { value: 'INACTIF', label: 'Inactifs', count: counts.INACTIF },
            { value: 'all', label: 'Tous', count: counts.all },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <select className={`${inputBase} w-40`} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type de chauffeur">
            <option value="all">Tous types</option>
            {Object.entries(TYPE_CHAUFFEUR_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select className={`${inputBase} w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut">
            <option value="all">Tous statuts</option>
            <option value="bientot">Expire bientôt</option>
            <option value="expire">Expiré</option>
            <option value="manquant">Dates à compléter</option>
            <option value="docs">Dossier incomplet</option>
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Nom ou n° de permis" className="w-full sm:w-64" />
        </div>
      </div>

      {!drivers ? <Loader /> : filtered.length === 0 ? (
        <Empty title="Aucun chauffeur ne correspond" action={<Button onClick={() => setAdding(true)}><PlusIcon /> Ajouter un chauffeur</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Sélection médicale</th>
                <th className="px-4 py-3">Code 95</th>
                <th className="px-4 py-3">Carte conducteur</th>
                <th className="px-4 py-3">ADR</th>
                <th className="px-4 py-3">Permis</th>
                <th className="px-4 py-3">Documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((d) => {
                const complete = d.documentsCount === d.documentsTotal;
                return (
                  <tr key={d.id} onClick={() => setParams({ id: d.id })} className="cursor-pointer align-top transition hover:bg-orange-50/40 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{d.nom} <span className="font-normal">{d.prenom}</span></p>
                      <p className="text-xs text-slate-500">
                        {TYPE_CHAUFFEUR_LABELS[d.typeChauffeur]}
                        {d.permisCategories.length > 0 && ` · ${d.permisCategories.join(' ')}`}
                        {d.unreadMessages > 0 && <span className="ml-2 rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{d.unreadMessages} msg</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3"><DeadlineCell item={item(d, 'SELECTION_MEDICALE')} compact /></td>
                    <td className="px-4 py-3"><DeadlineCell item={item(d, 'CODE_95')} compact /></td>
                    <td className="px-4 py-3"><DeadlineCell item={item(d, 'CARTE_CONDUCTEUR')} compact /></td>
                    <td className="px-4 py-3"><DeadlineCell item={item(d, 'ADR_CHAUFFEUR')} compact /></td>
                    <td className="px-4 py-3"><DeadlineCell item={item(d, 'PERMIS')} compact /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full ${complete ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${(d.documentsCount / d.documentsTotal) * 100}%` }} />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${complete ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>
                          {d.documentsCount}/{d.documentsTotal}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <NewDriverModal onClose={() => setAdding(false)} onCreated={(d) => { setAdding(false); load(); setParams({ id: d.id }); }} />
      )}
      {openId && <DriverDrawer key={openId} driverId={openId} onClose={close} onChanged={load} />}
    </div>
  );
}
