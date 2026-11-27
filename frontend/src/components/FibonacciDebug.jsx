// Grille de vérification Fibonacci : contour des blocs et des grilles, avec leurs dimensions et proportions.
// Visible uniquement en développement, ou en ajoutant ?fib=1 à l'adresse. Jamais affichée par défaut.
import { useEffect, useState } from 'react';

const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
const ok = (px) => (FIB.includes(Math.round(px)) ? ' ✓' : '');
const fmt = (px) => `${Math.round(px)}px${ok(px)}`;

function measure() {
  const boxes = [];
  const add = (el, kind, label) => {
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 30) return;
    boxes.push({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height, kind, label });
  };
  const side = document.querySelector('aside');
  if (side) add(side, 'section', `menu · ${fmt(side.getBoundingClientRect().width)}`);
  const main = document.querySelector('main');
  if (!main) return boxes;
  const cs = getComputedStyle(main);
  add(main, 'section', `contenu · max ${cs.maxWidth} · marges ${fmt(parseFloat(cs.paddingLeft))}`);
  main.querySelectorAll('*').forEach((el) => {
    const s = getComputedStyle(el);
    if (s.display !== 'grid') return;
    const cols = s.gridTemplateColumns.split(' ').map(parseFloat).filter((n) => !Number.isNaN(n));
    if (cols.length < 2) return;
    const min = Math.min(...cols);
    const ratio = cols.map((c) => (c / min).toFixed(2).replace(/\.?0+$/, '')).join(' : ');
    const gap = parseFloat(s.columnGap) || 0;
    add(el, 'grid', `${cols.map((c) => Math.round(c)).join(' / ')} px · ${ratio}${gap ? ` · écart ${fmt(gap)}` : ''}`);
  });
  return boxes;
}

export default function FibonacciDebug() {
  const allowed = import.meta.env.DEV || new URLSearchParams(window.location.search).has('fib');
  const [on, setOn] = useState(false);
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    if (!on) return undefined;
    const update = () => setBoxes(measure());
    update();
    const t = setInterval(update, 1500); // les pages chargent leurs données après coup
    window.addEventListener('resize', update);
    return () => { clearInterval(t); window.removeEventListener('resize', update); };
  }, [on]);

  if (!allowed) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        title="Afficher la grille Fibonacci (contours et proportions)"
        className={`fixed bottom-[89px] right-5 z-[10000] lg:bottom-5 rounded-full bg-slate-900/85 px-3 py-2 text-xs font-semibold text-white shadow-soft transition ${on ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
      >
        φ {on ? 'Masquer la grille' : 'Grille Fibonacci'}
      </button>
      {on && (
        <div className="pointer-events-none absolute left-0 top-0 z-[9999] w-full" aria-hidden="true">
          {boxes.map((b, i) => (
            <div
              key={i}
              className={`absolute ${b.kind === 'section' ? 'outline-dashed outline-2 outline-orange-500/80' : 'bg-blue-500/[0.04] outline outline-1 outline-blue-600/70'}`}
              style={{ top: b.top, left: b.left, width: b.width, height: b.height, outlineOffset: -2 }}
            >
              <span
                className={`absolute left-0 whitespace-nowrap px-2 font-mono text-[11px] font-semibold leading-5 text-white ${b.kind === 'section' ? 'top-0 bg-orange-500/90' : 'bottom-0 bg-blue-600/90'}`}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
