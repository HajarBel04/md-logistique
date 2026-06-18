import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';
import { getAlexPlanning } from '../services/api';

const statusMap = {
  planned: { label: 'Prévu', variant: 'planned' },
  confirmed: { label: 'Confirmé', variant: 'confirmed' },
  unavailable: { label: 'Indisponible', variant: 'unavailable' },
};

function groupByDate(plans) {
  return plans.reduce((groups, plan) => {
    const date = new Date(plan.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(plan);
    return groups;
  }, {});
}

export default function Planning() {
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPlanning() {
      setLoading(true);
      setError(null);

      try {
        const response = await getAlexPlanning();
        setPlanning(response.data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger le planning.');
      } finally {
        setLoading(false);
      }
    }

    loadPlanning();
  }, []);

  const confirmedCount = planning.filter((item) => item.status === 'confirmed').length;
  const unavailableCount = planning.filter((item) => item.status === 'unavailable').length;
  const groupedSchedule = groupByDate(planning);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        description="Organisez les tournées et suivez l'état des chauffeurs avec une vue claire et performante."
        badge="Opérations"
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="Tournées prévues" description="Visibilité sur les missions à venir.">{planning.length}</GlassCard>
        <GlassCard title="Confirmées" description="Tournées validées pour le dispatch.">{confirmedCount}</GlassCard>
        <GlassCard title="Indisponibilité" description="Chauffeurs non disponibles cette semaine.">{unavailableCount}</GlassCard>
      </section>

      <GlassCard
        title="Planning opérationnel"
        description="Regroupez les tournées par date et vérifiez rapidement le statut de chaque mission."
      >
        <div className="space-y-4 py-5">
          {error ? (
            <div className="rounded-[32px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-soft dark:border-red-500/40 dark:bg-red-900/50 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {Object.entries(groupedSchedule).length > 0 ? (
            Object.entries(groupedSchedule).map(([date, tours]) => (
              <div key={date} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{date}</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{tours.length} tournée(s)</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {tours.map((tour) => (
                    <div key={tour.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{tour.driverName ?? 'Chauffeur inconnu'}</p>
                          <p className="mt-1 text-sm text-slate-500">{tour.startTime} - {tour.endTime}</p>
                        </div>
                        <StatusBadge
                          label={statusMap[tour.status]?.label ?? tour.status}
                          variant={statusMap[tour.status]?.variant ?? 'planned'}
                          className="shrink-0"
                        />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{tour.routeName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
              Aucune tournée planifiée pour le moment.
            </p>
          )}
        </div>
      </GlassCard>

      {loading ? (
        <div className="surface-card p-8 text-center text-slate-600 dark:text-slate-300">Chargement du planning...</div>
      ) : null}
    </div>
  );
}
