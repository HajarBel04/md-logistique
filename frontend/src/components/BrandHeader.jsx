// En-tête de marque du menu.
// Au chargement : pas de logo. Le camion MD arrive par la droite en tirant le logo derrière lui,
// le logo s'arrête à sa place, le camion continue vers la gauche et disparaît : le logo reste seul.
// Seules les couches animées bougent (transform + opacity) dans un bloc à hauteur fixe :
// aucun décalage de mise en page. Avec « réduire les animations » : logo affiché directement.
import { useEffect, useState } from 'react';
import logo from '../assets/logo-md.png';
import truck from '../assets/truck-md.png';

/**
 * Props (tous facultatifs) :
 *  - duration      durée totale de la séquence, en ms. Défaut 3600.
 *  - delay         attente avant le départ, en ms. Défaut 300.
 *  - replayEveryMs rejoue la séquence à intervalle régulier (ms), ou null pour une seule fois. Défaut null.
 *  - replayOnHover rejoue la séquence au survol (une fois la précédente terminée). Défaut false.
 */
export default function BrandHeader({ duration = 3600, delay = 300, replayEveryMs = null, replayOnHover = false }) {
  const [run, setRun] = useState(0); // changer la clé relance les animations CSS
  const [playing, setPlaying] = useState(true);

  const replay = () => { setRun((r) => r + 1); setPlaying(true); };

  useEffect(() => {
    if (!replayEveryMs) return undefined;
    const id = setInterval(() => { if (!document.hidden) replay(); }, replayEveryMs);
    return () => clearInterval(id);
  }, [replayEveryMs]);

  const timing = { '--md-brand-duration': `${duration}ms`, '--md-brand-delay': `${run === 0 ? delay : 0}ms` };

  return (
    <div
      className="md-brand relative h-[92px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700"
      style={timing}
      onMouseEnter={() => { if (replayOnHover && !playing) replay(); }}
    >
      {/* Logo : arrive tiré par le camion, puis reste fixe et lisible sur fond blanc */}
      <img
        key={`logo-${run}`}
        src={logo}
        alt="MD Logistique"
        className="md-brand-logo absolute left-1/2 top-1/2 h-auto w-36 max-w-none object-contain"
      />
      {/* Camion : devant le logo (il roule vers la gauche), même ligne, puis sort à gauche */}
      <img
        key={`truck-${run}`}
        src={truck}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="md-brand-truck pointer-events-none absolute bottom-2 left-1/2 h-11 w-auto max-w-none select-none"
        onAnimationEnd={() => setPlaying(false)}
      />
    </div>
  );
}
