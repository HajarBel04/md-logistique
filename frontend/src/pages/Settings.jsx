import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

export default function Settings() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Paramètres"
        description="Configurez les règles, les zones et les options de MD Logistique dans un espace clair et premium."
        badge="Configuration"
      />

      <section className="grid gap-6 md:grid-cols-2">
        <GlassCard
          title="Adresses clients"
          description="Gérez les points de livraison les plus importants et les clients récurrents."
        >
          <div className="space-y-4">
            <div className="rounded-[28px] bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Rayon domicile</h3>
              <p className="mt-2 text-sm text-slate-600">15 km</p>
            </div>
            <div className="rounded-[28px] bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Adresses de base</h3>
              <p className="mt-2 text-sm text-slate-600">Bruxelles, Louvain, Herdecke</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          title="Règles de calcul"
          description="Ajustez les paramètres RH pour le calcul des heures de conduite, repos et disponibilité."
          action={<button type="button" className="btn-secondary">Modifier</button>}
        >
          <div className="grid gap-4">
            <div className="rounded-[28px] bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Période de calcul</h3>
              <p className="mt-2 text-sm text-slate-600">Hebdomadaire avec ajustement automatique.</p>
            </div>
            <div className="rounded-[28px] bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-900">Mode de validation</h3>
              <p className="mt-2 text-sm text-slate-600">Validation automatique des rapports importés.</p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
