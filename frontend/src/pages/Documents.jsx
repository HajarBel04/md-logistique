import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getAlexDocuments } from '../services/api';

const statusLabels = {
  valid: { label: 'Valide', variant: 'confirmed' },
  expiring_soon: { label: 'À renouveler', variant: 'warning' },
  expired: { label: 'Expiré', variant: 'expired' },
};

const columns = [
  {
    header: 'Chauffeur',
    accessor: 'driverName',
  },
  {
    header: 'Type',
    accessor: 'type',
  },
  {
    header: 'Expiration',
    accessor: (row) => (row.expirationDate ? new Date(row.expirationDate).toLocaleDateString('fr-FR') : '—'),
  },
  {
    header: 'Statut',
    cell: (row) => {
      const status = statusLabels[row.status] || { label: row.status, variant: 'planned' };
      return <StatusBadge label={status.label} variant={status.variant} className="capitalize" />;
    },
  },
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      setError(null);

      try {
        const response = await getAlexDocuments();
        setDocuments(response.data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les documents.');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  const expiredCount = documents.filter((doc) => doc.status === 'expired').length;
  const expiringCount = documents.filter((doc) => doc.status === 'expiring_soon').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Suivez les documents des chauffeurs et anticipez les renouvellements importants."
        badge="RGPD"
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="Documents suivis" description="Nombre total de documents enregistrés.">{documents.length}</GlassCard>
        <GlassCard title="À renouveler" description="Documents proches de leur date d'expiration.">{expiringCount}</GlassCard>
        <GlassCard title="Expirés" description="Documents déjà périmés nécessitant une action.">{expiredCount}</GlassCard>
      </section>

      <GlassCard title="Liste des documents" description="Consultez tous les documents de flotte et leur statut." >
        <div className="-mx-4 overflow-x-auto px-4">
          <DataTable columns={columns} data={documents} rowKey={(row) => row.id} />
        </div>
      </GlassCard>

      {loading ? (
        <div className="surface-card p-8 text-center text-slate-600 dark:text-slate-300">Chargement des documents...</div>
      ) : null}

      {error ? (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-soft dark:border-red-500/40 dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
