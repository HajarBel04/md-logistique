import { useState } from 'react';
import { useAuth } from './AuthContext';
import logo from '../assets/logo1.png';

const input =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

function Label({ children }) {
  return <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</span>;
}

export default function LoginPage() {
  const { login, setup, needsSetup, error: loadError } = useAuth();
  const [mode, setMode] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (needsSetup && password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      if (needsSetup) await setup({ email: identifier, password, nom });
      else await login(identifier, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-[45%] overflow-hidden bg-slate-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.35),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(249,115,22,0.18),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-300">MD Logistique</p>
          <h2 className="mt-3 text-4xl font-extrabold leading-tight">Flotte, chauffeurs<br />et facturation</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            Les chauffeurs déclarent leur route du jour, le bureau suit les échéances et facture les clients.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <img src={logo} alt="MD Logistique" className="mb-8 h-12 w-auto" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {needsSetup ? 'Créer le compte administrateur' : 'Connexion'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {needsSetup
              ? 'Première utilisation : ce compte pourra ensuite créer les comptes des chauffeurs.'
              : 'Accédez à votre espace.'}
          </p>

          {!needsSetup && (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              {[['email', 'Email'], ['phone', 'Téléphone']].map(([k, l]) => (
                <button key={k} type="button" onClick={() => { setMode(k); setIdentifier(''); }}
                  className={`rounded-lg py-1.5 text-sm font-semibold transition ${mode === k ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-4">
            {(loadError || error) && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">{error || loadError}</p>
            )}
            {needsSetup && (
              <label className="block"><Label>Nom</Label>
                <input className={input} value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
              </label>
            )}
            <label className="block">
              <Label>{mode === 'phone' && !needsSetup ? 'Numéro de téléphone' : 'Adresse email'}</Label>
              <input
                required
                autoFocus
                className={input}
                type={mode === 'phone' && !needsSetup ? 'tel' : 'email'}
                inputMode={mode === 'phone' && !needsSetup ? 'tel' : 'email'}
                autoComplete={mode === 'phone' && !needsSetup ? 'tel' : 'username'}
                placeholder={mode === 'phone' && !needsSetup ? '0470 12 34 56' : 'prenom@mdlogistique.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </label>
            <label className="block">
              <Label>Mot de passe</Label>
              <div className="relative">
                <input required minLength={needsSetup ? 8 : undefined} className={`${input} pr-20`} type={show ? 'text' : 'password'}
                  autoComplete={needsSetup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-slate-800">
                  {show ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {needsSetup && <span className="mt-1 block text-xs text-slate-400">8 caractères minimum.</span>}
            </label>
            {needsSetup && (
              <label className="block"><Label>Confirmer le mot de passe</Label>
                <input required className={input} type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </label>
            )}
            <button type="submit" disabled={busy}
              className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-60">
              {busy ? '…' : needsSetup ? 'Créer le compte' : 'Se connecter'}
            </button>
            {!needsSetup && (
              <p className="text-center text-xs text-slate-500">Mot de passe oublié ? Demandez au bureau de le réinitialiser.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
