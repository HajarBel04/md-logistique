import { useState } from 'react';
import { useAuth } from './AuthContext';
import logo from '../assets/logo-md.png';
import logoWhite from '../assets/logo-md-white.png';

const input =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/15';

function Label({ children, htmlFor }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">{children}</label>;
}

const FEATURES = [
  { t: 'Route du jour', d: 'Le chauffeur choisit sa route : date, km et véhicule sont enregistrés.', i: 'M3 17h2a2 2 0 1 0 4 0h6a2 2 0 1 0 4 0h2v-5l-3-4h-4V5H3v12Z' },
  { t: 'CMR et documents', d: 'Photos des CMR, permis et cartes conducteur classées et vérifiées.', i: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4' },
  { t: 'Facturation', d: 'Rate/Tour, surcharge carburant et facture PDF par client.', i: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Z M9 8h6M9 12h6' },
];

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split(' M').map((p, i) => <path key={i} d={i ? `M${p}` : p} />)}
    </svg>
  );
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
    <div className="min-h-[100dvh] bg-[#f6f4f1] lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panneau marque (ordinateur) */}
      <aside className="relative hidden overflow-hidden bg-[#0f172a] lg:flex lg:flex-col lg:p-12 xl:p-16">
        {/* Animation entrepôt → livraison, en fond (muette, en boucle) */}
        <video
          className="md-login-video pointer-events-none absolute inset-0 h-full w-full object-cover"
          src="/login-animation.mp4"
          poster="/login-animation-poster.jpg"
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        {/* Voile sombre : logo en haut et textes en bas restent lisibles */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0f172a]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-orange-500/20 blur-3xl" />

        <img src={logoWhite} alt="M-D Logistique" className="relative h-24 w-auto self-start drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] xl:h-28" />

        <div className="relative mt-auto max-w-lg [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-400">Transport & logistique · Belgique</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] text-white xl:text-5xl">
            Toute l'exploitation,<br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent [text-shadow:none] [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.45))]">en un seul endroit.</span>
          </h1>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/10"><Icon d={f.i} /></span>
                <span>
                  <span className="block font-bold text-white">{f.t}</span>
                  <span className="block text-sm leading-6 text-slate-300">{f.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 text-xs text-slate-400">© {new Date().getFullYear()} M-D logistique.com sprl · Saint-Gilles</p>
      </aside>

      {/* Formulaire */}
      <main className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10 sm:px-8">
        <img src={logo} alt="M-D Logistique" className="mb-8 h-20 w-auto lg:hidden" />

        <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 sm:p-9">
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
        <p className="mt-8 text-xs text-slate-400 lg:hidden">© {new Date().getFullYear()} M-D logistique.com sprl</p>
      </main>
    </div>
  );
}
