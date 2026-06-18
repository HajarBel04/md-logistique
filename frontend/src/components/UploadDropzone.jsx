export default function UploadDropzone({ file, onSelectFile, onUpload, loading }) {
  return (
    <div className="surface-card border-dashed border-orange-200/70 bg-orange-50/60 p-6 shadow-card transition duration-200 hover:border-orange-400 dark:border-orange-500/60 dark:bg-orange-500/10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-orange-600 shadow-sm dark:bg-orange-500/15 dark:text-orange-200">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v12m0 0l4-4m-4 4l-4-4" />
              <path d="M5 21h14" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Glissez votre fichier Webfleet ici</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Ou sélectionnez-le pour générer instantanément les totaux.
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

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-300">
        {file ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Fichier sélectionné</p>
              <p className="truncate text-slate-500 dark:text-slate-400">{file.name}</p>
            </div>
            <div className="rounded-full bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
              Prêt à importer
            </div>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Aucun fichier sélectionné pour le moment. Glissez-le ici ou utilisez le bouton « Sélectionner ».</p>
        )}
      </div>
    </div>
  );
}
