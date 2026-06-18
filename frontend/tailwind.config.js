export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
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
      borderRadius: {
        '4xl': '32px',
        '3xl': '28px',
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
