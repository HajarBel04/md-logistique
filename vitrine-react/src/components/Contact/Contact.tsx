import { useEffect, useRef, useState, type FormEvent, type CSSProperties } from 'react';
import './Contact.css';

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */

const IcnPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.31-2.69-6-6-6z"/>
    <circle cx="12" cy="8" r="2.5"/>
  </svg>
);
const IcnPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1.01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.18 7.91a16 16 0 006.61 6.61l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);
const IcnMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <polyline points="2,4 12,13 22,4"/>
  </svg>
);
const IcnClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcnHeadset = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 18v-6a9 9 0 0118 0v6"/>
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z"/>
    <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
  </svg>
);
const IcnPackage = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IcnShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcnPeople = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IcnSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcnNav = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);
const IcnShieldSm = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
       stroke="#ff5a00" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcnChevron = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
       stroke="#9a9fa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   GOOGLE MAPS–STYLE SVG
   Palette fidèle : beige #f2efe9, blocs urbains #ede8de,
   empreintes bâtiments #dcd8cf, parcs #c8dfc8/#b2d3b2,
   eau #aad3df, routes blanches, jaune artère, pin rouge Google
═══════════════════════════════════════════════════════════ */
const MapSVG = () => (
  <svg viewBox="0 0 280 210" xmlns="http://www.w3.org/2000/svg"
       role="img" aria-label="Google Maps — Rue de l'Industrie 12, Bruxelles">
    <defs>
      <filter id="gmPin" x="-50%" y="-20%" width="200%" height="160%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodOpacity="0.30"/>
      </filter>
      <filter id="gmCtrl">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.18"/>
      </filter>
      <filter id="gmPopup">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.22"/>
      </filter>
      <clipPath id="gmClip"><rect width="280" height="210"/></clipPath>
    </defs>

    <g clipPath="url(#gmClip)">

      {/* ── LAND ── */}
      <rect width="280" height="210" fill="#f2efe9"/>

      {/* ── CANAL (gauche, vertical) ── */}
      <path d="M18 0 C20 60 22 120 24 210 L30 210 C28 120 26 60 24 0Z" fill="#aad3df"/>
      <path d="M20 30 L22 58"   stroke="white" strokeWidth="0.8" opacity="0.5"  fill="none"/>
      <path d="M21 90 L23 118"  stroke="white" strokeWidth="0.8" opacity="0.45" fill="none"/>
      <path d="M20 150 L22 174" stroke="white" strokeWidth="0.8" opacity="0.5"  fill="none"/>

      {/* ── PARC — haut droit ── */}
      <rect x="188" y="0" width="92" height="56" fill="#c8dfc8"/>
      <circle cx="202" cy="14" r="10" fill="#b2d3b2"/>
      <circle cx="222" cy="22" r="8"  fill="#b2d3b2"/>
      <circle cx="244" cy="11" r="9"  fill="#b2d3b2"/>
      <circle cx="265" cy="27" r="7"  fill="#b2d3b2"/>
      <circle cx="212" cy="41" r="7"  fill="#b2d3b2"/>
      <circle cx="256" cy="43" r="8"  fill="#b2d3b2"/>
      <circle cx="277" cy="13" r="6"  fill="#b2d3b2"/>
      <circle cx="234" cy="47" r="5"  fill="#b2d3b2"/>

      {/* ── PARC — bas gauche ── */}
      <rect x="34" y="162" width="52" height="48" fill="#c8dfc8"/>
      <circle cx="48"  cy="177" r="7" fill="#b2d3b2"/>
      <circle cx="66"  cy="171" r="6" fill="#b2d3b2"/>
      <circle cx="78"  cy="183" r="8" fill="#b2d3b2"/>
      <circle cx="56"  cy="196" r="6" fill="#b2d3b2"/>
      <circle cx="78"  cy="200" r="5" fill="#b2d3b2"/>
      <circle cx="44"  cy="202" r="4" fill="#b2d3b2"/>

      {/* ── BLOCS URBAINS ── */}
      <rect x="33"  y="0"   width="22" height="44" fill="#ede8de"/>
      <rect x="33"  y="49"  width="22" height="44" fill="#ede8de"/>
      <rect x="33"  y="99"  width="22" height="43" fill="#ede8de"/>
      <rect x="33"  y="148" width="22" height="12" fill="#ede8de"/>
      <rect x="60"  y="0"   width="46" height="44" fill="#ede8de"/>
      <rect x="60"  y="49"  width="46" height="44" fill="#ede8de"/>
      <rect x="60"  y="99"  width="46" height="43" fill="#ede8de"/>
      <rect x="60"  y="148" width="10" height="12" fill="#ede8de"/>
      <rect x="111" y="0"   width="51" height="44" fill="#ede8de"/>
      <rect x="111" y="49"  width="51" height="44" fill="#ede8de"/>
      <rect x="111" y="99"  width="51" height="43" fill="#ede8de"/>
      <rect x="111" y="148" width="51" height="62" fill="#ede8de"/>
      <rect x="166" y="0"   width="20" height="44" fill="#ede8de"/>
      <rect x="166" y="49"  width="20" height="44" fill="#ede8de"/>
      <rect x="166" y="99"  width="20" height="43" fill="#ede8de"/>
      <rect x="166" y="148" width="20" height="62" fill="#ede8de"/>
      <rect x="189" y="58"  width="91" height="41" fill="#ede8de"/>
      <rect x="189" y="99"  width="91" height="43" fill="#ede8de"/>
      <rect x="189" y="148" width="91" height="62" fill="#ede8de"/>

      {/* ── EMPREINTES BÂTIMENTS ── */}
      <rect x="35"  y="3"   width="15" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="16"  width="10" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="28"  width="16" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="52"  width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="66"  width="16" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="80"  width="12" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="102" width="16" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="116" width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="130" width="16" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="35"  y="151" width="15" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="3"   width="18" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="84"  y="3"   width="18" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="16"  width="28" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="28"  width="16" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="82"  y="29"  width="22" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="52"  width="20" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="86"  y="52"  width="16" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="66"  width="30" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="79"  width="16" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="82"  y="80"  width="22" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="102" width="22" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="88"  y="102" width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="116" width="28" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="130" width="18" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="84"  y="131" width="20" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="62"  y="151" width="20" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="3"   width="20" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="137" y="3"   width="20" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="16"  width="28" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="145" y="18"  width="15" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="30"  width="20" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="137" y="31"  width="24" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="52"  width="22" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="139" y="52"  width="19" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="66"  width="30" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="147" y="67"  width="14" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="79"  width="20" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="137" y="80"  width="24" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="113" y="102" width="24" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="141" y="103" width="18" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="116" width="28" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="145" y="117" width="16" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="113" y="130" width="20" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="137" y="131" width="24" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="113" y="151" width="26" height="13" rx="1" fill="#dcd8cf"/>
      <rect x="143" y="153" width="16" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="113" y="169" width="22" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="139" y="171" width="20" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="113" y="187" width="28" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="145" y="188" width="15" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="168" y="3"   width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="168" y="16"  width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="168" y="30"  width="14" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="168" y="52"  width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="168" y="66"  width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="168" y="80"  width="14" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="168" y="102" width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="168" y="116" width="14" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="168" y="130" width="14" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="168" y="151" width="14" height="13" rx="1" fill="#dcd8cf"/>
      <rect x="168" y="169" width="14" height="13" rx="1" fill="#dcd8cf"/>
      <rect x="168" y="187" width="14" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="61"  width="26" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="221" y="61"  width="22" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="248" y="61"  width="22" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="76"  width="20" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="215" y="77"  width="26" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="246" y="76"  width="24" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="90"  width="30" height="7"  rx="1" fill="#dcd8cf"/>
      <rect x="191" y="102" width="24" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="219" y="103" width="22" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="246" y="102" width="24" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="116" width="28" height="9"  rx="1" fill="#dcd8cf"/>
      <rect x="224" y="117" width="20" height="8"  rx="1" fill="#dcd8cf"/>
      <rect x="248" y="116" width="22" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="130" width="22" height="11" rx="1" fill="#dcd8cf"/>
      <rect x="217" y="131" width="28" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="250" y="130" width="20" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="151" width="26" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="221" y="153" width="22" height="10" rx="1" fill="#dcd8cf"/>
      <rect x="248" y="151" width="22" height="13" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="168" width="24" height="13" rx="1" fill="#dcd8cf"/>
      <rect x="219" y="169" width="28" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="251" y="168" width="21" height="13" rx="1" fill="#dcd8cf"/>
      <rect x="191" y="186" width="28" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="223" y="187" width="22" height="12" rx="1" fill="#dcd8cf"/>
      <rect x="250" y="185" width="22" height="14" rx="1" fill="#dcd8cf"/>

      {/* ── RÉSEAU ROUTIER ── */}
      {/* Horizontales mineures */}
      <rect x="0" y="44"  width="280" height="3"   fill="white"/>
      <rect x="0" y="160" width="280" height="3"   fill="white"/>
      <rect x="0" y="188" width="280" height="2.5" fill="white"/>
      {/* Horizontale majeure — Rue de l'Industrie */}
      <rect x="0" y="94"  width="280" height="6"   fill="white"/>
      <rect x="0" y="94"  width="280" height="1"   fill="#fce07a" opacity="0.7"/>
      <rect x="0" y="99"  width="280" height="1"   fill="#fce07a" opacity="0.7"/>
      {/* Boulevard secondaire */}
      <rect x="0" y="144" width="280" height="5"   fill="white"/>
      {/* Verticale — bord canal */}
      <rect x="31"  y="0"  width="2"   height="210" fill="white"/>
      {/* Verticales majeures */}
      <rect x="57"  y="0"  width="5"   height="210" fill="white"/>
      <rect x="108" y="0"  width="4"   height="210" fill="white"/>
      <rect x="163" y="0"  width="4"   height="210" fill="white"/>
      <rect x="186" y="0"  width="5"   height="210" fill="white"/>
      <rect x="245" y="0"  width="4"   height="210" fill="white"/>
      {/* Verticales mineures */}
      <rect x="82"  y="0"  width="2"   height="210" fill="white"/>
      <rect x="136" y="0"  width="2"   height="210" fill="white"/>
      <rect x="215" y="0"  width="2"   height="210" fill="white"/>
      <rect x="266" y="0"  width="2"   height="210" fill="white"/>

      {/* ── VOIE FERRÉE ── */}
      <line x1="0" y1="122" x2="280" y2="118" stroke="#c0c0c0" strokeWidth="1.3" strokeDasharray="5 2.5"/>
      <line x1="0" y1="126" x2="280" y2="122" stroke="#c0c0c0" strokeWidth="1.3" strokeDasharray="5 2.5" strokeDashoffset="3.5"/>

      {/* ── PIN (140, 87) ── */}
      {/* Halo animé */}
      <circle className="ct-pin-ring" cx="140" cy="87" r="22"
              stroke="#EA4335" strokeWidth="1.4" fill="none" opacity="0.6"/>
      {/* Ombre */}
      <ellipse cx="140.5" cy="116" rx="7" ry="2.5" fill="rgba(0,0,0,.22)"/>
      {/* Teardrop Google Maps */}
      <path d="M140 66 C128.5 66 119 75.5 119 87 C119 103 140 116 140 116 C140 116 161 103 161 87 C161 75.5 151.5 66 140 66Z"
            fill="#EA4335" filter="url(#gmPin)"/>
      {/* Cercle blanc intérieur */}
      <circle cx="140" cy="87" r="9" fill="white"/>

      {/* ── POPUP INFO ── */}
      <rect x="80" y="28" width="120" height="32" rx="5" fill="white" filter="url(#gmPopup)"/>
      <rect x="80" y="28" width="120" height="32" rx="5" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="0.8"/>
      {/* Caret */}
      <path d="M135 60 L140 66 L145 60Z" fill="white"/>
      {/* Textes */}
      <text x="140" y="43" textAnchor="middle" fontSize="9.5" fontWeight="700"
            fill="#1a1a1a" fontFamily="Roboto, Arial, sans-serif">MD Logistique</text>
      <text x="140" y="55" textAnchor="middle" fontSize="8" fill="#666"
            fontFamily="Roboto, Arial, sans-serif">Rue de l'Industrie 12 · Bruxelles</text>

      {/* ── CONTRÔLES ZOOM ── */}
      <rect x="248" y="8"  width="24" height="48" rx="3" fill="white" filter="url(#gmCtrl)"/>
      <rect x="248" y="8"  width="24" height="48" rx="3" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="0.8"/>
      <line x1="249" y1="32" x2="271" y2="32" stroke="#e0e0e0" strokeWidth="1"/>
      <line x1="254" y1="20" x2="266" y2="20" stroke="#555" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="260" y1="14" x2="260" y2="26" stroke="#555" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="254" y1="44" x2="266" y2="44" stroke="#555" strokeWidth="1.6" strokeLinecap="round"/>

      {/* ── BOUTON LOCALISATION ── */}
      <rect x="248" y="62" width="24" height="24" rx="3" fill="white" filter="url(#gmCtrl)"/>
      <rect x="248" y="62" width="24" height="24" rx="3" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="0.8"/>
      <circle cx="260" cy="74" r="5.5" fill="none" stroke="#4285f4" strokeWidth="1.5"/>
      <circle cx="260" cy="74" r="1.8" fill="#4285f4"/>
      <line x1="260" y1="66" x2="260" y2="64.2" stroke="#4285f4" strokeWidth="1.2"/>
      <line x1="260" y1="84" x2="260" y2="82.2" stroke="#4285f4" strokeWidth="1.2"/>
      <line x1="252" y1="74" x2="250" y2="74" stroke="#4285f4" strokeWidth="1.2"/>
      <line x1="270" y1="74" x2="268" y2="74" stroke="#4285f4" strokeWidth="1.2"/>

      {/* ── BARRE D'ÉCHELLE ── */}
      <rect x="8"  y="200" width="60" height="1.5" fill="#777"/>
      <rect x="8"  y="197" width="1.5" height="5"  fill="#777"/>
      <rect x="68" y="197" width="1.5" height="5"  fill="#777"/>
      <text x="10" y="197" fontSize="8.5" fill="#777" fontFamily="Arial, sans-serif">100 m</text>

      {/* ── LOGO GOOGLE ── */}
      <text x="8" y="209" fontSize="9" fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="0.2">
        <tspan fill="#4285f4">G</tspan>
        <tspan fill="#ea4335">o</tspan>
        <tspan fill="#fbbc05">o</tspan>
        <tspan fill="#4285f4">g</tspan>
        <tspan fill="#34a853">l</tspan>
        <tspan fill="#ea4335">e</tspan>
      </text>

      {/* ── CONDITIONS ── */}
      <text x="185" y="209" fontSize="7.5" fill="#777" fontFamily="Arial, sans-serif">Conditions d'utilisation</text>

    </g>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */

const DETAILS = [
  { Icon: IcnPin,   label: 'Adresse',   info: ['Rue de l\'Industrie 12, 1000 Bruxelles, Belgique'] },
  { Icon: IcnPhone, label: 'Téléphone', info: ['+32 2 123 45 67'] },
  { Icon: IcnMail,  label: 'Email',     info: ['info@mdlogistique.com'] },
  { Icon: IcnClock, label: 'Horaires',  info: ['Lundi - Vendredi : 8h00 - 18h00', 'Samedi : 9h00 - 13h00'] },
] as const;

const BENEFITS = [
  { Icon: IcnHeadset, title: 'Réponse rapide',      desc: ['Nous vous répondons',         'sous 24h ouvrées.'] },
  { Icon: IcnPackage, title: 'Solutions sur mesure', desc: ['Des offres adaptées à vos besoins', 'et à votre activité.'] },
  { Icon: IcnShield,  title: 'Fiabilité & sécurité', desc: ['Vos colis sont entre de bonnes', 'mains, à chaque étape.'] },
  { Icon: IcnPeople,  title: 'Équipe dédiée',        desc: ['Un interlocuteur unique pour', 'vous accompagner.'] },
] as const;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */

export default function Contact() {
  const secRef = useRef<HTMLElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.06 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e: FormEvent) => e.preventDefault();

  return (
    <section
      ref={secRef}
      className={`ct${vis ? ' ct--vis' : ''}`}
    >
      {/* ── HEADING ───────────────────────────────────────── */}
      <div className="ct-head">
        <p className="ct-kicker">Contactez-nous</p>
        <h2 className="ct-title">
          Une question, un projet ?<br />
          <span>Notre équipe est{' '}</span>
          <span className="ct-orange">à votre écoute.</span>
        </h2>
        <p className="ct-desc">
          Que vous soyez une entreprise ou un particulier, nous vous accompagnons<br />
          avec des solutions logistiques sur mesure.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN LAYOUT
          Left column  = info card  +  van  (stacked, no gap)
          Right column = form card
      ══════════════════════════════════════════════════════ */}
      <div className="ct-layout">

        {/* ─── LEFT COLUMN ────────────────────────────────── */}
        <div className={`ct-left-col${vis ? ' ct-left-col--vis' : ''}`}>

          {/* Info card */}
          <div className="ct-card ct-card--info">
            <h3 className="ct-ctitle">Nos coordonnées</h3>
            <span className="ct-rule" aria-hidden="true" />

            {/* Two sub-columns: details | map */}
            <div className="ct-inner">

              {/* Contact rows */}
              <ul className="ct-details" role="list">
                {DETAILS.map(({ Icon, label, info }, i) => (
                  <li
                    key={label}
                    className="ct-detail"
                    style={{ '--rd': `${160 + i * 80}ms` } as CSSProperties}
                  >
                    <span className="ct-icn-bg"><Icon /></span>
                    <div className="ct-dtext">
                      <strong className="ct-dlabel">{label}</strong>
                      {info.map((line, j) => (
                        <span key={j} className="ct-dinfo">{line}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Map */}
              <div className="ct-mapcol">
                <h4 className="ct-maptitle">Nous trouver</h4>
                <span className="ct-rule" aria-hidden="true" />
                <div className="ct-mapbox">
                  <MapSVG />
                </div>
                <button className="ct-itin" type="button">
                  <IcnNav /> Itinéraire
                </button>
              </div>

            </div>
          </div>

          {/* Van scene — directly below left card, no gap */}
          <div className="ct-van" aria-hidden="true">
            <img src="/contact.png" alt="" className="ct-van-img" />
          </div>

        </div>

        {/* ─── RIGHT COLUMN: Form ──────────────────────────── */}
        <div className={`ct-card ct-card--form${vis ? ' ct-card--form-vis' : ''}`}>
          <h3 className="ct-ctitle">Envoyez-nous un message</h3>
          <span className="ct-rule" aria-hidden="true" />
          <p className="ct-fsub">
            Remplissez le formulaire ci-dessous, nous vous répondrons dans les meilleurs délais.
          </p>

          <form onSubmit={handleSubmit} className="ct-form" noValidate>

            {/* Vous êtes */}
            <div className="ct-lsel">
              <span className="ct-lsel-lbl">Vous êtes *</span>
              <select defaultValue="" className="ct-lsel-sel">
                <option value="" disabled>Sélectionnez</option>
                <option value="e">Une entreprise</option>
                <option value="p">Un particulier</option>
              </select>
              <span className="ct-lsel-chev" aria-hidden="true"><IcnChevron /></span>
            </div>

            {/* Nom + Email */}
            <div className="ct-frow">
              <input type="text"  className="ct-inp" placeholder="Nom complet *" autoComplete="name"/>
              <input type="email" className="ct-inp" placeholder="Email *"       autoComplete="email"/>
            </div>

            {/* Phone */}
            <input type="tel" className="ct-inp" placeholder="Téléphone" autoComplete="tel"/>

            {/* Sujet */}
            <div className="ct-lsel">
              <span className="ct-lsel-lbl">Sujet *</span>
              <select defaultValue="" className="ct-lsel-sel">
                <option value="" disabled>Sélectionnez</option>
                <option value="devis">Demande de devis</option>
                <option value="info">Information générale</option>
                <option value="suivi">Suivi de livraison</option>
                <option value="partenariat">Partenariat</option>
              </select>
              <span className="ct-lsel-chev" aria-hidden="true"><IcnChevron /></span>
            </div>

            {/* Message */}
            <div className="ct-farea">
              <label className="ct-area-lbl">Votre message *</label>
              <textarea
                className="ct-inp ct-textarea"
                placeholder="Décrivez votre demande..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <button type="submit" className="ct-submit">
              <IcnSend /> Envoyer le message
            </button>

            {/* Privacy */}
            <p className="ct-privacy">
              <IcnShieldSm />
              Vos données sont protégées et ne seront jamais partagées.
            </p>

          </form>
        </div>

      </div>

      {/* ── BENEFITS BAR ──────────────────────────────────── */}
      <div className="ct-bar">
        {BENEFITS.map(({ Icon, title, desc }, i) => (
          <div
            key={title}
            className="ct-benefit"
            style={{ '--bd': `${280 + i * 80}ms` } as CSSProperties}
          >
            <span className="ct-b-icn"><Icon /></span>
            <div className="ct-b-text">
              <strong className="ct-b-title">{title}</strong>
              {desc.map((line, j) => (
                <span key={j} className="ct-b-desc">{line}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
