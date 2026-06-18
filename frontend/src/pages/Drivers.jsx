import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import DataTable from '../components/DataTable';
import { getAlexDrivers } from '../services/api';

const columns = [
  { header: 'Nom', accessor: 'fullName' },
  { header: 'Véhicule', accessor: 'vehicle' },
  { header: 'Téléphone', accessor: 'phone' },
  { header: 'Imports', accessor: (row) => row.imports?.length ?? 0 },
  {
    header: 'Créé le',
    accessor: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
  },
  {
    header: 'Heures totales',
    accessor: (row) => `${row.totalWorkedHours?.toFixed(2) ?? '0.00'} h`,
  },
];

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDrivers() {
      setLoading(true);
      setError(null);

      try {
        const response = await getAlexDrivers();
        setDrivers(response.data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les chauffeurs.');
      } finally {
        setLoading(false);
      }
    }

    loadDrivers();
  }, []);

  const totalImports = drivers.reduce((sum, driver) => sum + (driver.imports?.length ?? 0), 0);
  const totalWorkedHours = drivers.reduce((sum, driver) => sum + (driver.totalWorkedHours ?? 0), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Chauffeurs"
        description="Visualisez le statut des chauffeurs et leurs historiques d'import en direct."
        badge="Flotte"
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="Chauffeurs suivis" description="Total des chauffeurs disponibles dans le système.">{drivers.length}</GlassCard>
        <GlassCard title="Imports" description="Nombre total de rapports Webfleet associés.">{totalImports}</GlassCard>
        <GlassCard title="Heures consolidées" description="Heures de travail cumulées pour tous les chauffeurs.">{totalWorkedHours.toFixed(2)} h</GlassCard>
      </section>

      {error ? (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-soft dark:border-red-500/40 dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <GlassCard title="Tableau des chauffeurs" description="Suivez les chauffeurs, leur véhicule, leur nombre d'imports et leur date de création.">
        <div className="-mx-4 overflow-x-auto px-4">
          <DataTable columns={columns} data={drivers} rowKey={(row) => row.id} />
        </div>
      </GlassCard>

      {loading ? (
        <div className="surface-card p-8 text-center text-slate-600 dark:text-slate-300">Chargement des chauffeurs...</div>
      ) : null}
    </div>
  );
}
