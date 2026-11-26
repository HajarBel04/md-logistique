import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WebfleetImport from './pages/WebfleetImport';
import Planning from './pages/Planning';
import Settings from './pages/Settings';
import Payroll from './pages/Payroll';
import LbdTracking from './pages/LbdTracking';
import GpsAnalysis from './pages/GpsAnalysis';
import ConformiteDashboard from './pages/flotte/ConformiteDashboard';
import Vehicules from './pages/flotte/Vehicules';
import Chauffeurs from './pages/flotte/Chauffeurs';
import OutilScan from './pages/flotte/OutilScan';
import Messagerie from './pages/flotte/Messagerie';
import AlertesParametres from './pages/flotte/AlertesParametres';
import PortailChauffeur from './pages/flotte/PortailChauffeur';
import Referentiels from './pages/flotte/Referentiels';
import Trajets from './pages/flotte/Trajets';
import Facturation from './pages/flotte/Facturation';
import Comptes from './pages/flotte/Comptes';
import EspaceChauffeur from './pages/flotte/EspaceChauffeur';
import { ToastProvider } from './flotte/ui';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';

const navItems = [
  { path: '/conformite',      label: 'Conformité'      },
  { path: '/vehicules',       label: 'Véhicules'       },
  { path: '/chauffeurs',      label: 'Chauffeurs'      },
  { path: '/documents',       label: 'Documents & scan' },
  { path: '/messagerie',      label: 'Messagerie'      },
  { path: '/alertes',         label: 'Alertes'         },
  { path: '/trajets',         label: 'Formulaires'     },
  { path: '/facturation',     label: 'Facturation'     },
  { path: '/referentiels',    label: 'Référentiels'    },
  { path: '/comptes',         label: 'Comptes'         },
  { path: '/',                label: 'Dashboard paie'  },
  { path: '/import-webfleet', label: 'Import Webfleet' },
  { path: '/planning',        label: 'Planning'        },
  { path: '/payroll',         label: 'Fiches de paie'  },
  { path: '/parametres',      label: 'Paramètres'      },
];

export default function App() {
  return (
    <Routes>
      {/* Lien personnel du chauffeur : page autonome, sans menu */}
      <Route path="/portail/:token" element={<PortailChauffeur />} />
      <Route path="*" element={<AuthProvider><Gate /></AuthProvider>} />
    </Routes>
  );
}

/** Aiguillage selon la connexion : écran de connexion, espace chauffeur ou plateforme admin. */
function Gate() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-orange-600" aria-label="Chargement" />
      </div>
    );
  }
  if (!user) return <LoginPage />;
  if (user.role === 'CHAUFFEUR') return <EspaceChauffeur />;
  return <ToastProvider><Platform /></ToastProvider>;
}

function Platform() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 text-slate-900 transition-colors duration-500 dark:text-slate-100">
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header theme={theme} onToggleTheme={toggleTheme} />
          <div className="border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-950/80 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <Routes>
            {/* GPS Analysis — pleine largeur pour le tableau */}
            <Route path="/gps" element={
              <main className="w-full px-3 pb-10 pt-6 sm:px-4">
                <GpsAnalysis />
              </main>
            } />
            {/* Toutes les autres pages — largeur normale */}
            <Route path="*" element={
              <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/import-webfleet" element={<WebfleetImport />} />
                  <Route path="/conformite" element={<ConformiteDashboard />} />
                  <Route path="/vehicules" element={<Vehicules />} />
                  <Route path="/chauffeurs" element={<Chauffeurs />} />
                  <Route path="/documents" element={<OutilScan />} />
                  <Route path="/messagerie" element={<Messagerie />} />
                  <Route path="/alertes" element={<AlertesParametres />} />
                  <Route path="/trajets" element={<Trajets />} />
                  <Route path="/facturation" element={<Facturation />} />
                  <Route path="/referentiels" element={<Referentiels />} />
                  <Route path="/comptes" element={<Comptes />} />
                  <Route path="/planning" element={<Planning />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/lbd" element={<LbdTracking />} />
                  <Route path="/parametres" element={<Settings />} />
                </Routes>
              </main>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}
