// Comptes : administrateurs et chauffeurs (connexion par email ou téléphone).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { authApi, flotteApi } from '../../flotte/api';
import {
  Button, Card, EditIcon, Empty, ErrorBanner, Field, IconButton, Loader, Modal, PlusIcon, Tabs, TrashIcon,
  inputClass, useToast,
} from '../../flotte/ui';
import { formatDateTime } from '../../flotte/utils';
import { WhatsAppButton, messages } from '../../flotte/whatsapp';

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

export function AccountModal({ role, account, drivers = [], fixedDriver, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    nom: account?.nom || '', email: account?.email || '', telephone: account?.telephone || '',
    password: account ? '' : genPassword(), driverId: fixedDriver?.id || account?.driverId || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { email: form.email, telephone: form.telephone };
      if (role === 'ADMIN') payload.nom = form.nom;
      if (form.password) payload.password = form.password;
      const saved = account
        ? await flotteApi.updateUser(account.id, payload)
        : await flotteApi.createUser({ ...payload, role, driverId: form.driverId });
      onSaved(saved);
      if (form.password) {
        const drv = fixedDriver || drivers.find((d) => d.id === (form.driverId || saved.driverId));
        setCreated({ ident: form.email || form.telephone, password: form.password,
          prenom: drv?.prenom || (role === 'ADMIN' ? form.nom : ''), phone: form.telephone || drv?.telephone });
      }
      else { toast('Compte mis à jour'); onClose(); }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    const text = messages.identifiants(created);
    return (
      <Modal title="Identifiants à transmettre" size="sm" onClose={onClose}
        footer={<>
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(text).then(() => toast('Copié'))}>Copier</Button>
          <WhatsAppButton phone={created.phone} text={text} label="Envoyer par WhatsApp" size="md" />
          <Button onClick={onClose}>Terminé</Button>
        </>}>
        <p className="text-sm text-slate-600 dark:text-slate-300">Envoyez ces identifiants au chauffeur (SMS, WhatsApp). Le mot de passe ne sera plus affiché.</p>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-100 p-4 font-mono text-sm dark:bg-slate-800">{text}</pre>
      </Modal>
    );
  }

  return (
    <Modal
      title={account ? 'Modifier le compte' : role === 'ADMIN' ? 'Nouvel administrateur' : 'Créer un compte chauffeur'}
      size="sm" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button type="submit" form="account-form" disabled={busy}>{busy ? '…' : account ? 'Enregistrer' : 'Créer le compte'}</Button></>}
    >
      <form id="account-form" onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        {role === 'CHAUFFEUR' && !account && !fixedDriver && (
          <Field label="Chauffeur">
            <select required className={inputClass} value={form.driverId} onChange={set('driverId')}>
              <option value="">— Choisir —</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.nom} {d.prenom}</option>)}
            </select>
          </Field>
        )}
        {fixedDriver && <p className="text-sm font-semibold">{fixedDriver.nomComplet}</p>}
        {role === 'ADMIN' && <Field label="Nom"><input className={inputClass} value={form.nom} onChange={set('nom')} /></Field>}
        <Field label="Email" hint="Ex. prenom@mdlogistique.com — ou laissez vide et utilisez le téléphone.">
          <input type="email" className={inputClass} value={form.email} onChange={set('email')} required={role === 'ADMIN'} />
        </Field>
        {role === 'CHAUFFEUR' && (
          <Field label="Téléphone"><input type="tel" className={inputClass} value={form.telephone} onChange={set('telephone')} placeholder="0470 12 34 56" /></Field>
        )}
        <Field label={account ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} hint="8 caractères minimum.">
          <div className="flex gap-2">
            <input className={`${inputClass} font-mono`} value={form.password} onChange={set('password')} minLength={8} required={!account} />
            <Button variant="secondary" onClick={() => setForm({ ...form, password: genPassword() })}>Générer</Button>
          </div>
        </Field>
      </form>
    </Modal>
  );
}

function OwnPassword() {
  const toast = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await authApi.changePassword(cur, next); toast('Mot de passe modifié'); setCur(''); setNext(''); } catch (err) { toast(err.message, 'error'); }
  };
  return (
    <Card title="Mon mot de passe">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <Field label="Actuel"><input type="password" required autoComplete="current-password" className={inputClass} value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label="Nouveau (8 caractères min.)"><input type="password" required minLength={8} autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Button type="submit">Changer</Button>
      </form>
    </Card>
  );
}

export default function Comptes() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [role, setRole] = useState('CHAUFFEUR');
  const [users, setUsers] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { account? }

  const load = useCallback(() => {
    flotteApi.users().then(setUsers).catch((e) => setError(e.message));
    flotteApi.drivers().then(setDrivers).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const list = (users || []).filter((u) => u.role === role);
  const withoutAccount = useMemo(() => {
    const taken = new Set((users || []).map((u) => u.driverId).filter(Boolean));
    return drivers.filter((d) => !taken.has(d.id) && d.statut !== 'INACTIF');
  }, [users, drivers]);

  const toggle = async (u) => {
    try { await flotteApi.updateUser(u.id, { active: !u.active }); load(); } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Supprimer le compte de ${u.nom || u.email} ? (le dossier chauffeur est conservé)`)) return;
    try { await flotteApi.deleteUser(u.id); toast('Compte supprimé'); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Administration</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Comptes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les chauffeurs se connectent avec leur email ou leur téléphone et n'accèdent qu'à leur espace.</p>
        </div>
        <Button onClick={() => setModal({})}><PlusIcon /> {role === 'ADMIN' ? 'Nouvel administrateur' : 'Créer un compte chauffeur'}</Button>
      </div>
      <Tabs value={role} onChange={setRole} tabs={[
        { value: 'CHAUFFEUR', label: 'Chauffeurs', count: users?.filter((u) => u.role === 'CHAUFFEUR').length },
        { value: 'ADMIN', label: 'Administrateurs', count: users?.filter((u) => u.role === 'ADMIN').length },
      ]} />
      <ErrorBanner message={error} onRetry={load} />
      {role === 'CHAUFFEUR' && withoutAccount.length > 0 && (
        <p className="text-sm text-slate-500">{withoutAccount.length} chauffeur(s) actif(s) sans compte.</p>
      )}
      {!users ? <Loader /> : list.length === 0 ? (
        <Empty title="Aucun compte" action={<Button onClick={() => setModal({})}><PlusIcon /> Créer</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
              <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Identifiant</th><th className="px-4 py-3">Dernière connexion</th><th className="px-4 py-3">Actif</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((u) => (
                <tr key={u.id} className={u.active ? '' : 'opacity-50'}>
                  <td className="px-4 py-3 font-semibold">{u.nom || '—'}{u.id === me?.id && <span className="ml-2 text-xs text-slate-500">(vous)</span>}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{[u.email, u.telephone].filter(Boolean).join(' · ')}</td>
                  <td className="px-4 py-3 text-slate-500">{u.lastLogin ? formatDateTime(u.lastLogin) : 'Jamais'}</td>
                  <td className="px-4 py-3">
                    <button type="button" role="switch" aria-checked={u.active} onClick={() => toggle(u)} disabled={u.id === me?.id}
                      className={`relative h-5 w-9 rounded-full transition before:absolute before:-inset-3 before:content-[''] disabled:opacity-40 ${u.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${u.active ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <IconButton label="Modifier / nouveau mot de passe" onClick={() => setModal({ account: u })}><EditIcon /></IconButton>
                      {u.id !== me?.id && <IconButton label="Supprimer" onClick={() => remove(u)} className="hover:!text-red-600"><TrashIcon /></IconButton>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <OwnPassword />
      {modal && (
        <AccountModal role={modal.account?.role || role} account={modal.account} drivers={withoutAccount}
          onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  );
}
