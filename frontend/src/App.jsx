import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WebfleetImport from './pages/WebfleetImport';
import Drivers from './pages/Drivers';
import Planning from './pages/Planning';
import Settings from './pages/Settings';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
  },
  {
    path: '/import-webfleet',
    label: 'Import Webfleet',
  },
  {
    path: '/chauffeurs',
    label: 'Chauffeurs',
  },
  {
    path: '/planning',
    label: 'Planning',
  },
  {
    path: '/parametres',
    label: 'Paramètres',
  },
];

export default function App() {
    return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.1),_transparent_20%)] text-slate-900 transition-colors duration-500">
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-md lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <Route path="/planning" element={<Planning />} />
              <Route path="/parametres" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
