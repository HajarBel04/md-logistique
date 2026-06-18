export default function UploadZone({ file, onSelectFile, onUpload, loading }) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-6 text-slate-700 shadow-premium">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Importer un fichier Webfleet</h2>
          <p className="mt-2 text-sm text-slate-600">Glissez votre fichier Excel ou sélectionnez-le pour lancer le calcul.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
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
            className={`inline-flex items-center justify-center rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 ${loading || !file ? 'opacity-60 cursor-not-allowed' : 'hover:bg-orange-700'}`}
          >
            {loading ? 'Import en cours...' : 'Importer'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {file ? (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-900">Fichier sélectionné :</span>
            <span>{file.name}</span>
          </div>
        ) : (
          <p>Déposez un fichier ici ou utilisez le bouton de sélection.</p>
        )}
      </div>
    </div>
  );
}
