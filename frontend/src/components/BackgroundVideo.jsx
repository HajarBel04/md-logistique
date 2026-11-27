// Vidéo décorative en boucle, sans aucun bouton de lecture.
// Si le téléphone bloque la lecture automatique (économie de batterie / de données), ou si
// « réduire les animations » est activé, on affiche l'image fixe à la place : jamais de bouton ▶.
import { useEffect, useRef, useState } from 'react';

export default function BackgroundVideo({ src, poster, className = '', reducedMotion = false }) {
  const ref = useRef(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion) return undefined;
    // React ne pose pas l'attribut « muted » : iOS/Android refusent alors la lecture automatique.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    const tryPlay = () => v.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    tryPlay();
    // Nouvelle tentative au premier contact avec la page (certains navigateurs l'exigent)
    const onTouch = () => { if (v.paused) tryPlay(); };
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    window.addEventListener('pointerdown', onTouch, { once: true });
    return () => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('pointerdown', onTouch);
    };
  }, [src, reducedMotion]);

  if (reducedMotion || blocked) {
    return <img src={poster} alt="" aria-hidden="true" className={`pointer-events-none ${className}`} />;
  }
  return (
    <video
      ref={ref}
      className={`md-bg-video pointer-events-none ${className}`}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}
