import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import DataTable from '../components/DataTable';
import { getAlexDashboard } from '../services/api';

const dashboardColumns = [
  {
    header: 'Chauffeur',
    accessor: (row) => row.driver?.fullName ?? '—',
  },
  {
    header: 'Fichier',
    accessor: 'fileName',
  },
  {
    header: 'Date',
    accessor: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
  },
  {
    header: 'Heures travaillées',
    accessor: (row) => row.summary?.heuresTravaillees?.toFixed(2) ?? '0.00',
  },
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await getAlexDashboard();
        setDashboard(response.data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données du tableau de bord.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Suivez les indicateurs clés de la paie et des imports Webfleet d'Alex en temps réel."
        badge="Vue Alex"
        action={
          <Link
            to="/import-webfleet"
            className="inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            Importer Webfleet
          </Link>
        }
      />

      {loading ? (
        <div className="surface-card p-10 text-center text-slate-600 text-slate-300">
          Chargement des données...
        </div>
      ) : error ? (
        <div className="surface-card border-red-200 bg-red-50 p-6 text-center text-red-700 bg-red-900/50 text-red-200">
          {error}
        </div>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-5">
            <DashboardCard
              icon={<span className="text-xl">👷</span>}
              label="Chauffeurs"
              value={dashboard.totalDrivers}
              subtitle="En service aujourd'hui"
            />
            <DashboardCard
              icon={<span className="text-xl">📄</span>}
              label="Imports"
              value={dashboard.totalImports}
              subtitle="Rapports reçus"
            />
            <DashboardCard
              icon={<span className="text-xl">⏱️</span>}
              label="Heures travaillées"
              value={Number(dashboard.totalWorkedHours ?? 0).toFixed(2)}
              subtitle="Total payé"
            />
            <DashboardCard
              icon={<span className="text-xl">🚛</span>}
              label="Conduite"
              value={Number(dashboard.totalDrivingHours ?? 0).toFixed(2)}
              subtitle="Heures de trajet"
            />
            <DashboardCard
              icon={<span className="text-xl">🛌</span>}
              label="Repos"
              value={Number(dashboard.totalRestHours ?? 0).toFixed(2)}
              subtitle="Heures prévues"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.16fr_1.84fr]">
            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 text-slate-400">
                    Synthèse de la semaine
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 text-white">
                    Vue des totaux Webfleet
                  </h2>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-orange-700 bg-orange-500/15 text-orange-200">
                  Actualisé en direct
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 border-slate-700/70 bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 text-slate-400">Repos total</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 text-white">{Number(dashboard.totalRestHours ?? 0).toFixed(2)} h</p>
                </div>
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 border-slate-700/70 bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 text-slate-400">Conduite</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 text-white">{Number(dashboard.totalDrivingHours ?? 0).toFixed(2)} h</p>
                </div>
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 border-slate-700/70 bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 text-slate-400">Travail</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 text-white">{Number(dashboard.totalWorkedHours ?? 0).toFixed(2)} h</p>
                </div>
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 border-slate-700/70 bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 text-slate-400">Disponibilité</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 text-white">{dashboard.totalAvailableHours?.toFixed(2) ?? '—'} h</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 text-slate-400">
                    Activité récente
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 text-white">
                    Derniers imports
                  </h2>
                </div>
                <p className="text-sm text-slate-500 text-slate-400">
                  Les derniers rapports Webfleet traités.
                </p>
              </div>
              <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/70 border-slate-700/70">
                <DataTable columns={dashboardColumns} data={dashboard.lastImports} rowKey={(row) => row.id} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
