export default function UploadDropzone({ file, onSelectFile, onUpload, loading }) {
  return (
    <div className="surface-card border-orange-200/70 bg-orange-50/60 p-6 shadow-card transition duration-200 hover:border-orange-300 border-slate-700 bg-slate-900/75">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
            Webfleet Excel
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Importer votre rapport</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Glissez-déposez votre fichier ou sélectionnez-le pour générer instantanément les totaux.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Sélectionner
            <input
              type="file"
              accept=".xlsx, .xls"
              className="sr-only"
              onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={onUpload}
            disabled={!file || loading}
            className={`inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 ${loading || !file ? 'cursor-not-allowed opacity-60' : 'hover:bg-orange-700'}`}
          >
            {loading ? 'Import en cours...' : 'Importer'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 shadow-sm">
        {file ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Fichier sélectionné</p>
              <p className="truncate text-slate-500">{file.name}</p>
            </div>
            <div className="rounded-full bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-600 shadow-sm">
              Prêt à importer
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Aucun fichier sélectionné pour le moment. Glissez-le ici ou utilisez le bouton « Sélectionner ».</p>
        )}
      </div>
    </div>
  );
}
