import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const drivers = [
  { name: 'Houssam Oukil', phone: '+32 498 12 34 56', vehicle: 'Renault T', documents: { permis: '2027-05-12', code95: '2026-12-03', medical: '2026-09-15' } },
  { name: 'Sofia Mathers', phone: '+32 473 45 67 89', vehicle: 'Volvo FH', documents: { permis: '2028-01-31', code95: '2027-06-22', medical: '2026-10-08' } },
  { name: 'Karim Louka', phone: '+32 468 55 77 21', vehicle: 'Mercedes Actros', documents: { permis: '2025-11-12', code95: '2026-05-02', medical: '2026-01-14' } },
];

const getStatus = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Expiré', variant: 'expired' };
  }
  if (diffDays <= 30) {
    return { label: 'Bientôt expiré', variant: 'warning' };
  }
  return { label: 'Valide', variant: 'valid' };
};

const columns = [
  { header: 'Nom', accessor: 'name' },
  { header: 'Téléphone', accessor: 'phone' },
  { header: 'Véhicule', accessor: 'vehicle' },
  {
    header: 'Permis',
    cell: (row) => {
      const status = getStatus(row.documents.permis);
      return <StatusBadge label={status.label} variant={status.variant} />;
    },
  },
  {
    header: 'Code 95',
    cell: (row) => {
      const status = getStatus(row.documents.code95);
      return <StatusBadge label={status.label} variant={status.variant} />;
    },
  },
  {
    header: 'Certificat médical',
    cell: (row) => {
      const status = getStatus(row.documents.medical);
      return <StatusBadge label={status.label} variant={status.variant} />;
    },
  },
];

export default function Drivers() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Chauffeurs"
        description="Visualisez le statut des chauffeurs et la conformité de leurs documents en un coup d'œil."
        badge="Conformité"
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="Chauffeurs actifs" description="Nombre total de chauffeurs actuellement en route.">86</GlassCard>
        <GlassCard title="Documents valides" description="Permis, Code 95 et certificats médicaux conformes.">78</GlassCard>
        <GlassCard title="Alertes" description="Documents nécessitant un suivi dans les 30 prochains jours.">5</GlassCard>
      </section>

      <GlassCard title="Tableau des chauffeurs" description="Statut des documents et de la flotte pour chaque chauffeur.">
        <div className="-mx-4 overflow-x-auto px-4">
          <DataTable columns={columns} data={drivers} rowKey={(row) => row.name} />
        </div>
      </GlassCard>
    </div>
  );
}
