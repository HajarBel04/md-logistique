// En-tête de marque du menu : logo MD fixe + camion MD qui arrive puis repart vers la gauche.
// Seule la couche « camion » est animée (transform + opacity) dans une bande à hauteur fixe :
// aucun décalage de mise en page. Animation désactivée si « réduire les animations » est actif.
import { useEffect, useState } from 'react';
import logo from '../assets/logo-md.png';
import truck from '../assets/truck-md.png';

/**
 * Props (tous facultatifs) :
 *  - duration      durée d'un passage complet, en ms (arrivée + arrêt + départ). Défaut 4200.
 *  - delay         attente avant le premier passage, en ms. Défaut 600.
 *  - replayEveryMs rejoue le passage à intervalle régulier (ms), ou null pour une seule fois. Défaut null.
 *  - replayOnHover rejoue le passage au survol du bloc. Défaut true.
 */
export default function BrandHeader({ duration = 4200, delay = 600, replayEveryMs = null, replayOnHover = true }) {
  const [run, setRun] = useState(0); // changer la clé relance l'animation CSS
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!replayEveryMs) return undefined;
    const id = setInterval(() => { if (!document.hidden) { setRun((r) => r + 1); setPlaying(true); } }, replayEveryMs);
    return () => clearInterval(id);
  }, [replayEveryMs]);

  const replay = () => {
    if (replayOnHover && !playing) {
      setRun((r) => r + 1);
      setPlaying(true);
    }
  };

  return (
    <div
      className="md-brand relative overflow-hidden rounded-2xl bg-white px-4 pb-1 pt-3 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700"
      onMouseEnter={replay}
    >
      {/* Logo : toujours fixe et lisible, sur fond blanc */}
      <img src={logo} alt="MD Logistique" className="relative z-10 mx-auto h-auto w-36 object-contain" />

      {/* Bande « route » à hauteur fixe : le camion y roule sans pousser les éléments du menu */}
      <div className="relative mt-1 h-12 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-2 bottom-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        <img
          key={run}
          src={truck}
          alt=""
          draggable="false"
          className="md-truck absolute bottom-0.5 left-1/2 h-11 w-auto select-none"
          style={{ '--md-truck-duration': `${duration}ms`, '--md-truck-delay': `${run === 0 ? delay : 0}ms` }}
          onAnimationEnd={() => setPlaying(false)}
        />
      </div>
    </div>
  );
}
