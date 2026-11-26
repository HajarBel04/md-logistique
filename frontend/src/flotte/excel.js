// Export Excel (.xlsx) des formulaires chauffeurs — chargé à la demande.
export async function exportTripsXlsx(trips, filename) {
  const XLSX = await import('xlsx');
  const rows = trips.map((t) => ({
    'N°': t.numero,
    Date: t.date.split('-').reverse().join('/'),
    Chauffeur: t.driverNom,
    Route: t.routeCode,
    Itinéraire: t.itineraire,
    'Distance (km)': t.distanceKm,
    Camion: t.vehiclePlaque || '',
    Remorque: t.trailerPlaque || '',
    Client: t.companyNom || '',
    Panne: t.breakdownNom || '',
    Remarque: t.remarque || '',
    'Alerte CT': t.ctWarning || '',
    'Taux carburant (€/km)': t.fuelRate ?? '',
    'Surcharge carburant (€)': t.surcharge ?? '',
    'Prix de base (€)': t.basePrice ?? '',
    'Total HT (€)': t.total ?? '',
    Statut: t.invoiceId ? 'Facturé' : 'À facturer',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || { a: 1 }).map((k) => ({ wch: Math.max(10, k.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Formulaires');
  XLSX.writeFile(wb, filename);
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const EUR = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });
export const euro = (v) => (v == null ? '—' : EUR.format(v));
export const monthLabel = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('fr-BE', { month: 'long', year: 'numeric' });
};
