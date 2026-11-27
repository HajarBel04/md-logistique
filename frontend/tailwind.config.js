// ════════════════════════════════════════════════════════════
// Système de design M-D Logistique : suite de Fibonacci
// 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597
// Les classes Tailwind existantes (p-4, gap-3, text-sm, rounded-xl…) gardent leur nom
// mais pointent vers la valeur de Fibonacci la plus proche.
// ════════════════════════════════════════════════════════════
const FIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
const nearest = (px) => FIB.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a));

// Échelle d'espacement Tailwind (1 = 4px) → px de Fibonacci
const TW_KEYS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];
const fibSpacing = { 0: '0px', px: '1px' };
for (const k of TW_KEYS) {
  const px = k * 4;
  // 16px (p-4, gap-4) → 13px : densité d'une application de gestion
  fibSpacing[k] = `${px === 16 ? 13 : nearest(px)}px`;
}

// Tailles de texte : [taille, interligne] — légende 13/21, texte 16/26 (≈ φ), titres 21/34, 34/34, 55/55
const fibFontSize = {
  xs: ['13px', { lineHeight: '21px' }],
  sm: ['14px', { lineHeight: '1.618' }],   // 14px : densité de lecture (choix explicite, hors suite)
  base: ['16px', { lineHeight: '1.618' }],
  lg: ['21px', { lineHeight: '34px' }],
  xl: ['21px', { lineHeight: '34px' }],
  '2xl': ['34px', { lineHeight: '34px' }],
  '3xl': ['34px', { lineHeight: '34px' }],
  '4xl': ['34px', { lineHeight: '34px' }],
  '5xl': ['55px', { lineHeight: '55px' }],
  '6xl': ['89px', { lineHeight: '89px' }],
};

// Interlignes explicites (leading-5, leading-6…)
const fibLineHeight = {
  none: '1', tight: '1.13', snug: '1.38', normal: '1.618', relaxed: '1.618', loose: '2',
  3: '13px', 4: '21px', 5: '21px', 6: '1.618', 7: '34px', 8: '34px', 9: '34px', 10: '34px',
};

const fibRadius = {
  none: '0px', sm: '3px', DEFAULT: '3px', md: '5px', lg: '8px', xl: '13px', '2xl': '13px', '3xl': '21px', '4xl': '21px', full: '9999px',
};

// Largeurs maximales : mesure de texte et conteneurs (987 éditorial, 1597 large)
const fibMaxWidth = {
  none: 'none', full: '100%', min: 'min-content', max: 'max-content', fit: 'fit-content', prose: '65ch',
  xs: '377px', sm: '377px', md: '377px', lg: '610px', xl: '610px', '2xl': '610px', '3xl': '610px',
  '4xl': '987px', '5xl': '987px', '6xl': '987px', '7xl': '1597px',
  narrow: '987px', wide: '1597px',
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Remplacements complets (et non « extend ») : toutes les valeurs passent sur l'échelle Fibonacci
    padding: fibSpacing,
    margin: ({ theme }) => ({ auto: 'auto', ...fibSpacing }),
    gap: fibSpacing,
    space: fibSpacing,
    fontSize: fibFontSize,
    lineHeight: fibLineHeight,
    borderRadius: fibRadius,
    maxWidth: fibMaxWidth,
    extend: {
      spacing: { 233: '233px' },
      gridTemplateColumns: {
        // Proportions de Fibonacci (rapport ≈ 1,618 entre deux colonnes voisines)
        'fib-8-5': '8fr 5fr',
        'fib-5-8': '5fr 8fr',
        'fib-13-8': '13fr 8fr',
        'fib-8-13': '8fr 13fr',
        'fib-5-13': '5fr 13fr',
        'fib-5-3-2': '5fr 3fr 2fr',
      },
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#cf4a0c',   // assombri pour un contraste AA avec le texte blanc (4,5:1)
          700: '#c2410c',
        },
        sand: '#fdf7ee',
        cream: '#fff7ed',
        beige: '#fce9d8',
        'glass-light': 'rgba(255,255,255,0.72)',
        'glass-dark': 'rgba(15,23,42,0.72)',
        brandDark: '#0F172A',
        mdorange: '#f97316',
        mdorangeDark: '#ea580c',
        mdgold: '#ffd400',
        mdgray: '#111827',
        mdmuted: '#64748b',
      },
      backgroundImage: {
        'dashboard-light': 'radial-gradient(circle at top left, rgba(249, 115, 22, 0.14), transparent 22%), radial-gradient(circle at bottom right, rgba(251, 146, 60, 0.08), transparent 20%)',
        'dashboard-dark': 'radial-gradient(circle at top left, rgba(249, 115, 22, 0.12), transparent 22%), radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.05), transparent 18%)',
      },
      boxShadow: {
        soft: '0 24px 55px rgba(15, 23, 42, 0.08)',
        premium: '0 18px 40px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        card: '0 18px 40px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
