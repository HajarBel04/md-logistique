import './TrackingCard.css';

export default function TrackingCard() {
  return (
    <div className="tc">

      {/* ── Header row ──────────────── */}
      <div className="tc-header">
        <div className="tc-title-group">
          <span className="tc-title">Suivi GPS en temps réel</span>
          <span className="tc-status">
            <span className="tc-dot" aria-hidden="true" />
            En cours de livraison
          </span>
        </div>
        <svg className="tc-pin-icon" width="16" height="20" viewBox="0 0 16 20" fill="none"
             aria-hidden="true">
          <path d="M8 0C4.69 0 2 2.69 2 6c0 4.19 6 12 6 12s6-7.81 6-12C14 2.69 11.31 0 8 0z"
                fill="#ff5a00"/>
          <circle cx="8" cy="6" r="2.5" fill="#fff"/>
        </svg>
      </div>

      {/* ── Route SVG ───────────────── */}
      <div className="tc-map">
        <svg viewBox="0 0 160 80" fill="none" aria-hidden="true">
          {/* Dashed route */}
          <path
            className="tc-route"
            d="M18 60 C50 74 100 52 138 16"
          />
          {/* Origin (green dot) */}
          <circle cx="18" cy="60" r="5.5" fill="#27c46b"/>
          <circle cx="18" cy="60" r="2.5" fill="#fff"/>
          {/* Destination (orange pin) */}
          <g>
            <path d="M138 6C133.03 6 129 10.03 129 15c0 6.08 9 16 9 16s9-9.92 9-16
                     c0-4.97-4.03-9-9-9z"
                  fill="#ff5a00"/>
            <circle cx="138" cy="15" r="3.5" fill="#fff"/>
          </g>
        </svg>
      </div>

      {/* ── Meta ─────────────────────── */}
      <div className="tc-meta">
        <p className="tc-id">MD-2505-7856</p>
        <p className="tc-eta">Arrivée estimée : 14h30 – 15h00</p>
      </div>

    </div>
  );
}
