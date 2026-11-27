import { useState } from 'react';
import { useAuth } from './AuthContext';
import logo from '../assets/logo-md.png';
import logoWhite from '../assets/logo-md-white.png';

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/15';

function Label({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">{children}</label>;
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
  const phone = mode === 'phone' && !needsSetup;
  // « Réduire les animations » : la vidéo reste sur son image fixe
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
    <div className="flex min-h-[100dvh] bg-white">
      {/* Moitié gauche remplie par la vidéo (recadrée sur les côtés), logo et phrase par-dessus */}
      <aside className="sticky top-0 hidden h-[100dvh] w-1/2 shrink-0 overflow-hidden bg-[#0f172a] lg:block">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          src="/login-animation.mp4"
          poster="/login-animation-poster.jpg"
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0f172a]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0f172a]/90 to-transparent" />

        <img src={logoWhite} alt="M-D Logistique" className="absolute left-10 top-8 h-16 w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] xl:h-20" />

        <div className="absolute inset-x-10 bottom-9 [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">Transport & logistique · Belgique</p>
          <p className="mt-2 text-2xl font-extrabold leading-tight text-white xl:text-[1.9rem]">
            Toute l'exploitation, <span className="text-amber-300">en un seul endroit.</span>
          </p>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex min-h-[100dvh] w-full flex-col lg:w-1/2 items-center justify-center px-6 py-10 sm:px-10">
        <img src={logo} alt="M-D Logistique" className="mb-8 h-16 w-auto lg:hidden" />

        <div className="w-full max-w-[380px]">
          <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900">
            {needsSetup ? 'Créer le compte administrateur' : 'Bon retour 👋'}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {needsSetup
              ? 'Première connexion : ce compte gérera ensuite les chauffeurs et les accès.'
              : 'Connectez-vous à votre espace M-D Logistique.'}
          </p>

          {!needsSetup && (
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Mode de connexion">
              {[['email', 'Email'], ['phone', 'Téléphone']].map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={mode === k}
                  onClick={() => { setMode(k); setIdentifier(''); setError(''); }}
                  className={`rounded-lg py-2 text-sm font-bold transition ${mode === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {(error || loadError) && (
              <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100" role="alert">
                <span aria-hidden="true">⚠</span>{error || loadError}
              </p>
            )}
            {needsSetup && (
              <div>
                <Label htmlFor="nom">Votre nom</Label>
                <input id="nom" className={input} value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" placeholder="Prénom Nom" />
              </div>
            )}
            <div>
              <Label htmlFor="ident">{phone ? 'Numéro de téléphone' : 'Adresse email'}</Label>
              <input
                id="ident"
                required
                autoFocus
                className={input}
                type={phone ? 'tel' : 'email'}
                inputMode={phone ? 'tel' : 'email'}
                autoComplete={phone ? 'tel' : 'username'}
                placeholder={phone ? '0470 12 34 56' : 'prenom@mdlogistique.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pw">Mot de passe</Label>
              <div className="relative">
                <input id="pw" required minLength={needsSetup ? 8 : undefined} className={`${input} pr-24`} type={show ? 'text' : 'password'}
                  autoComplete={needsSetup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                  {show ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              {needsSetup && <p className="mt-1.5 text-xs text-slate-400">8 caractères minimum.</p>}
            </div>
            {needsSetup && (
              <div>
                <Label htmlFor="pw2">Confirmer le mot de passe</Label>
                <input id="pw2" required className={input} type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
            )}

            <button type="submit" disabled={busy}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-orange-600/25 transition hover:shadow-orange-600/40 active:scale-[0.99] disabled:opacity-60">
              {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : (
                <>
                  {needsSetup ? 'Créer le compte' : 'Se connecter'}
                  <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </>
              )}
            </button>
          </form>

          {!needsSetup && (
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Mot de passe oublié ? Le bureau peut le réinitialiser.<br />
              Chauffeurs : utilisez le numéro de téléphone communiqué au bureau.
            </p>
          )}
        </div>
        <p className="mt-10 text-center text-xs text-slate-400">© {new Date().getFullYear()} M-D logistique.com sprl · Saint-Gilles</p>
      </main>
    </div>
  );
}
