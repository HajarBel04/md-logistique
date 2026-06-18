import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import StatusBadge from '../components/StatusBadge';

const weekOptions = ['10 - 16 juin', '17 - 23 juin'];

const weekSchedule = [
  {
    day: 'Lundi',
    date: '10 juin',
    tours: [
      { driver: 'Houssam Oukil', time: '06:30 - 14:30', route: 'BRUBE - LUMBE - EDNNL - BRUBE', status: 'Confirmé' },
      { driver: 'Sofia Mathers', time: '08:00 - 16:00', route: 'BRUBE - HERDE - BRUBE', status: 'Prévu' },
    ],
  },
  {
    day: 'Mardi',
    date: '11 juin',
    tours: [
      { driver: 'Karim Louka', time: '18:00 - 02:00', route: 'BRUBE - KLNAP - BRUBE', status: 'Indisponible' },
    ],
  },
  {
    day: 'Mercredi',
    date: '12 juin',
    tours: [],
  },
];

const statusMap = {
  Prévu: { label: 'Prévu', variant: 'planned' },
  Confirmé: { label: 'Confirmé', variant: 'confirmed' },
  Indisponible: { label: 'Indisponible', variant: 'unavailable' },
};

export default function Planning() {
  const [selectedWeek, setSelectedWeek] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        description="Organisez les tournées et suivez l'état des chauffeurs avec une vue claire et performante."
        badge="Opérations"
        action={
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-200 cursor-not-allowed"
          >
            Envoyer planning WhatsApp
          </button>
        }
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="Tournées prévues" description="Visibilité sur les missions à venir.">3</GlassCard>
        <GlassCard title="Confirmées" description="Tournées validées pour le dispatch.">1</GlassCard>
        <GlassCard title="Indisponibilité" description="Chauffeurs non disponibles cette semaine.">1</GlassCard>
      </section>

      <GlassCard
        title="Semaine de planning"
        description="Regroupez les tournées par jour et vérifiez rapidement le statut de chaque mission."
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Sélecteur de semaine</p>
            <h2 className="text-xl font-semibold text-slate-900">{weekOptions[selectedWeek]}</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
            {weekOptions.map((week, index) => (
              <button
                key={week}
                type="button"
                onClick={() => setSelectedWeek(index)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  index === selectedWeek ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {week}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 py-5">
          {weekSchedule.map((group) => (
            <div key={group.day} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.day}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{group.date}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-slate-200">{group.tours.length} tournée(s)</span>
              </div>

              <div className="mt-4 space-y-3">
                {group.tours.length > 0 ? (
                  group.tours.map((tour) => (
                    <div key={`${group.day}-${tour.driver}-${tour.time}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{tour.driver}</p>
                          <p className="mt-1 text-sm text-slate-500">{tour.time}</p>
                        </div>
                        <StatusBadge label={statusMap[tour.status].label} variant={statusMap[tour.status].variant} className="shrink-0" />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{tour.route}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">Aucune tournée planifiée pour ce jour.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
