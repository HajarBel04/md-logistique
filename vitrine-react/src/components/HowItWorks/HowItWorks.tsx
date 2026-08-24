import { Fragment, useEffect, useRef, useState } from 'react';
import './HowItWorks.css';

/* ─────────────────────────────────────────────────────────────
   SVG icons — orange outline, stroke 1.7, traced from screenshot
───────────────────────────────────────────────────────────── */

const Icon1Box = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none"
       stroke="#ff4b0a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M5 19 L5 31 L24 31 L24 19"/>
    <path d="M5 19 L14 13 L33 13 L24 19 Z"/>
    <path d="M24 19 L33 13 L33 25 L24 31"/>
    <line x1="14" y1="13" x2="14" y2="19"/>
    <line x1="5"  y1="25" x2="24" y2="25"/>
  </svg>
);

const Icon2Network = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none"
       stroke="#ff4b0a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <circle cx="19" cy="20" r="3.2"/>
    <circle cx="19" cy="7"  r="2.4"/>
    <circle cx="7"  cy="28" r="2.4"/>
    <circle cx="31" cy="28" r="2.4"/>
    <circle cx="31" cy="10" r="2.4"/>
    <line x1="19"   y1="16.8" x2="19"   y2="9.4"/>
    <line x1="16.7" y1="22.4" x2="9.2"  y2="26"/>
    <line x1="21.3" y1="22.4" x2="28.8" y2="26"/>
    <line x1="21.5" y1="17.8" x2="28.7" y2="12.2"/>
  </svg>
);

const Icon3Truck = () => (
  <svg width="42" height="38" viewBox="0 0 42 38" fill="none"
       stroke="#ff4b0a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <line x1="1" y1="17"   x2="6" y2="17"/>
    <line x1="0" y1="20.5" x2="6" y2="20.5"/>
    <line x1="1" y1="24"   x2="6" y2="24"/>
    <rect x="7"  y="13" width="20" height="15" rx="1.5"/>
    <path d="M27 25 L27 16 L32 16 L37 21 L37 28 L27 28"/>
    <path d="M28 16 L32 16 L36 21 L28 21 Z"/>
    <circle cx="14" cy="30.5" r="3.2"/>
    <circle cx="31" cy="30.5" r="3.2"/>
  </svg>
);

const Icon4Check = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none"
       stroke="#ff4b0a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <circle cx="19" cy="19" r="14"/>
    <polyline points="11,19 17,25 27,12"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   SVG arrow between steps
───────────────────────────────────────────────────────────── */
const ArrowSvg = () => (
  <svg
    className="how-arrow-svg"
    viewBox="0 0 24 24" fill="none"
    stroke="#111318" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Absolutely-positioned decorative orange dotted curves
   Uses position:absolute so it's taken out of grid flow.
───────────────────────────────────────────────────────────── */
const DecorPaths = ({ inView }: { inView: boolean }) => (
  <svg
    className={`how-decor${inView ? ' how-decor--draw' : ''}`}
    viewBox="0 0 1200 200"
    fill="none"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {/* Left curve: sweeps from top-left corner down-right toward first circle */}
    <path
      className="how-decor-path"
      d="M0 38 C28 38 62 85 95 122"
      stroke="#ff7a32" strokeWidth="1.8" strokeDasharray="4 8" strokeLinecap="round"
    />
    {/* Right curve: from last circle area sweeping back up to top-right */}
    <path
      className="how-decor-path"
      d="M1105 122 C1138 85 1172 38 1200 38"
      stroke="#ff7a32" strokeWidth="1.8" strokeDasharray="4 8" strokeLinecap="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Step data
───────────────────────────────────────────────────────────── */
const STEPS = [
  { num: 1, icon: <Icon1Box />,     lines: ['Réception']               },
  { num: 2, icon: <Icon2Network />, lines: ['Tri &', 'affectation']    },
  { num: 3, icon: <Icon3Truck />,   lines: ['Livraison', 'GPS-tracée'] },
  { num: 4, icon: <Icon4Check />,   lines: ['Confirmation']            },
] as const;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold: 0.22 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`how-section${inView ? ' how-section--visible' : ''}`}
    >
      {/* ── Heading ──────────────────────────────── */}
      <h2 className="how-title">
        Comment ça{' '}
        <span className="how-accent">marche</span>
      </h2>

      {/* ── Process row ──────────────────────────── */}
      {/*
          Grid: 1fr  44px  1fr  44px  1fr  44px  1fr
          DecorPaths is position:absolute — removed from grid flow.
          Fragment children flatten directly as grid items.
      */}
      <div className="how-row">
        <DecorPaths inView={inView} />

        {STEPS.map((step, i) => (
          <Fragment key={step.num}>

            {/* ── Step (1fr column) ── */}
            <div
              className={`how-step${inView ? ' how-step--visible' : ''}`}
              style={{ '--step-delay': `${420 + i * 110}ms` } as React.CSSProperties}
            >
              <div className="how-circle">
                <span
                  className={`how-badge${inView ? ' how-badge--pop' : ''}`}
                  style={{ '--badge-delay': `${520 + i * 110}ms` } as React.CSSProperties}
                >
                  {step.num}
                </span>
                {step.icon}
              </div>
              <p className="how-label">
                {step.lines.map((line, j) => (
                  <span key={j} className="how-label-line">{line}</span>
                ))}
              </p>
            </div>

            {/* ── Arrow (44px column) — not after last step ── */}
            {i < STEPS.length - 1 && (
              <div className="how-arrow-col" aria-hidden="true">
                <ArrowSvg />
              </div>
            )}

          </Fragment>
        ))}
      </div>
    </section>
  );
}
