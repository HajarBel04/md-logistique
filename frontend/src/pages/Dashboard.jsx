import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DashboardCard from '../components/DashboardCard';
import DataTable from '../components/DataTable';
import DonutChart from '../components/DonutChart';
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
        const status = err.response?.status;
        const raw = err.response?.data?.error || err.message || '';
        const isNetwork = raw === 'Network Error' || raw === 'Load failed' || raw.includes('Failed to fetch');
        if (isNetwork) {
          setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
        } else if (status === 503) {
          setError('Base de données non configurée (Prisma). Le dashboard sera disponible après la configuration.');
        } else {
          setError('Impossible de charger les données du tableau de bord.');
        }
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
        <div className="surface-card p-10 text-center text-slate-600 dark:text-slate-300">
          Chargement des données...
        </div>
      ) : error ? (
        <div className="surface-card border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-500/40 dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <DashboardCard
              icon="👷"
              label="Chauffeurs"
              value={dashboard.totalDrivers}
              subtitle="En service aujourd'hui"
              status="Données à jour"
              accent="orange"
            />
            <DashboardCard
              icon="📄"
              label="Imports"
              value={dashboard.totalImports}
              subtitle="Rapports reçus"
              status="Actualisé"
              accent="orange"
            />
            <DashboardCard
              icon="🗂️"
              label="Documents"
              value={dashboard.totalDocuments}
              subtitle="Documents suivis"
              status="Suivi en direct"
              accent="blue"
            />
            <DashboardCard
              icon="📅"
              label="Planning"
              value={dashboard.totalPlanning}
              subtitle="Tournées planifiées"
              status="Prochains créneaux"
              accent="teal"
            />
            <DashboardCard
              icon="⏱️"
              label="Heures travaillées"
              value={Number(dashboard.totalWorkedHours ?? 0).toFixed(2)}
              subtitle="Total heures travaillées"
              status="Métrique consolidée"
              accent="green"
            />
            <DashboardCard
              icon="🚛"
              label="Heures de conduite"
              value={Number(dashboard.totalDrivingHours ?? 0).toFixed(2)}
              subtitle="Heures en trajet"
              status="Trajets enregistrés"
              accent="purple"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Synthèse de la semaine
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Vue des totaux Webfleet
                  </h2>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-orange-700 dark:bg-orange-500/15 dark:text-orange-200">
                  Actualisé en direct
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Repos total</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{Number(dashboard.totalRestHours ?? 0).toFixed(2)} h</p>
                </div>
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Conduite</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{Number(dashboard.totalDrivingHours ?? 0).toFixed(2)} h</p>
                </div>
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Travail</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{Number(dashboard.totalWorkedHours ?? 0).toFixed(2)} h</p>
                </div>
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Disponibilité</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{dashboard.totalAvailableHours?.toFixed(2) ?? '—'} h</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Vue des activités
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Répartition des heures
                  </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Conduite, travail et repos en un coup d'œil.
                </p>
              </div>
              <div className="mt-6">
                <DonutChart
                  data={[
                    { label: 'Conduite', value: Number(dashboard.totalDrivingHours ?? 0) },
                    { label: 'Travail', value: Number(dashboard.totalWorkedHours ?? 0) },
                    { label: 'Repos', value: Number(dashboard.totalRestHours ?? 0) },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Documents récents
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Derniers documents
                  </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Suivi des échéances des documents chauffeurs.
                </p>
              </div>
              <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-slate-700/70">
                <DataTable
                  columns={[
                    { header: 'Chauffeur', accessor: 'driverName' },
                    { header: 'Type', accessor: 'type' },
                    {
                      header: 'Expiration',
                      accessor: (row) => (row.expirationDate ? new Date(row.expirationDate).toLocaleDateString('fr-FR') : '—'),
                    },
                    {
                      header: 'Statut',
                      accessor: (row) => row.status,
                    },
                  ]}
                  data={dashboard.lastDocuments ?? []}
                  rowKey={(row) => row.id}
                />
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Planning à venir
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Prochaines tournées
                  </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Les prochains créneaux planifiés dans la base.
                </p>
              </div>
              <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-slate-700/70">
                <DataTable
                  columns={[
                    { header: 'Date', accessor: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
                    { header: 'Chauffeur', accessor: 'driverName' },
                    { header: 'Horaire', accessor: (row) => `${row.startTime} - ${row.endTime}` },
                    { header: 'Route', accessor: 'routeName' },
                  ]}
                  data={dashboard.upcomingPlanning ?? []}
                  rowKey={(row) => row.id}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="surface-card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Activité récente
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    Derniers imports
                  </h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Les derniers rapports Webfleet traités.
                </p>
              </div>
              <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-slate-700/70">
                <DataTable columns={dashboardColumns} data={dashboard.lastImports} rowKey={(row) => row.id} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
