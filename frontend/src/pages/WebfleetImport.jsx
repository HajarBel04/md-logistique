import { useState } from 'react';
import { read, utils } from 'xlsx';
import UploadDropzone from '../components/UploadDropzone';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import { uploadWebfleet } from '../services/api';

const previewHeaders = ['Activité', 'Heure de début', 'Heure de fin', 'Durée', 'Distance', 'Véhicule'];

const previewColumns = previewHeaders.map((header) => ({
  header,
  accessor: (row) => row[header] ?? '',
}));

export default function WebfleetImport() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const loadPreview = async (selectedFile) => {
    if (!selectedFile) {
      setPreviewRows([]);
      return;
    }

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json(sheet, { defval: '' });
      setPreviewRows(rows.slice(0, 5));
    } catch {
      setPreviewRows([]);
    }
  };

  const handleSelectFile = (selectedFile) => {
    setError(null);
    setResult(null);
    setSuccessVisible(false);
    setFile(selectedFile);
    loadPreview(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessVisible(false);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadWebfleet(formData);
      const payload = response.data;
      const normalizedResult =
        payload.result ??
        (payload.saved?.summary
          ? {
              driverName: payload.saved.driver?.fullName,
              totals: payload.saved.summary,
            }
          : null);

      if (!normalizedResult) {
        throw new Error('Réponse serveur inattendue.');
      }

      setResult(normalizedResult);
      setSuccessVisible(true);
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.error ||
          uploadError.message ||
          'Impossible de joindre le backend ou le fichier est invalide.'
      );
    } finally {
      setLoading(false);
    }
  };

  const totals = result?.totals;
  const driverName = result?.driverName;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Webfleet"
        description="Chargez votre rapport Excel puis consultez les totaux calculés automatiquement."
        badge="Import"
      />

      <UploadDropzone
        file={file}
        onSelectFile={handleSelectFile}
        onUpload={handleUpload}
        loading={loading}
      />

      {error ? (
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-soft">
          {error}
        </div>
      ) : null}

      {result && successVisible ? (
        <div className="relative overflow-hidden rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 shadow-soft text-slate-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <button
            type="button"
            onClick={() => setSuccessVisible(false)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 transition hover:bg-white dark:bg-slate-900/80 dark:text-slate-200"
          >
            ×
          </button>
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-200">Import réussi</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Fichier importé avec succès</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[28px] border border-emerald-200 bg-white/90 p-4 text-sm text-slate-700 dark:border-emerald-400/25 dark:bg-slate-950/75 dark:text-slate-100">
                ✓ Chauffeur détecté
              </div>
              <div className="rounded-[28px] border border-emerald-200 bg-white/90 p-4 text-sm text-slate-700 dark:border-emerald-400/25 dark:bg-slate-950/75 dark:text-slate-100">
                ✓ Données sauvegardées
              </div>
              <div className="rounded-[28px] border border-emerald-200 bg-white/90 p-4 text-sm text-slate-700 dark:border-emerald-400/25 dark:bg-slate-950/75 dark:text-slate-100">
                <span className="font-semibold">{driverName ?? 'Chauffeur détecté'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <GlassCard
          title="Résultat de l'import"
          description="Synthèse des heures calculées et sauvegardées en base de données."
          tag="Succès"
        >
          <p className="mt-4 text-lg font-semibold text-slate-900">
            Chauffeur : {driverName ?? '-'}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Conduite', value: totals?.conduiteHeures },
              { label: 'Travail', value: totals?.travailHeures },
              { label: 'Heures travaillées', value: totals?.heuresTravaillees },
              { label: 'Repos', value: totals?.reposHeures },
              { label: 'Disponibilité', value: totals?.disponibiliteHeures },
              { label: 'Total', value: totals?.totalHeures },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-200"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {item.value ?? '-'} h
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <GlassCard
        title="Aperçu du fichier"
        description="Affichez un extrait des premières lignes de votre rapport importé."
      >
        {previewRows.length ? (
          <DataTable
            columns={previewColumns}
            data={previewRows}
            rowKey={(row, index) => index}
          />
        ) : (
          <EmptyState
            title="Aucun aperçu disponible"
            description="Sélectionnez un fichier Webfleet pour voir ses premières lignes ici."
            icon="📄"
          />
        )}
      </GlassCard>
    </div>
  );
}