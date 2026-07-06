import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WebfleetImport from './pages/WebfleetImport';
import Drivers from './pages/Drivers';
import Planning from './pages/Planning';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Payroll from './pages/Payroll';

const navItems = [
  { path: '/',               label: 'Dashboard'       },
  { path: '/import-webfleet', label: 'Import Webfleet' },
  { path: '/chauffeurs',     label: 'Chauffeurs'      },
  { path: '/documents',      label: 'Documents'       },
  { path: '/planning',       label: 'Planning'        },
  { path: '/payroll',        label: 'Fiches de paie'  },
  { path: '/parametres',     label: 'Paramètres'      },
];

export default function App() {
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
          <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import-webfleet" element={<WebfleetImport />} />
              <Route path="/chauffeurs" element={<Drivers />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/parametres" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
