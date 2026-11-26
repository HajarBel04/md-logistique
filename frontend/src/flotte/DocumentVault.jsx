// Dossier documents d'un chauffeur : 9 emplacements numérotés, avec recadrage, copie, PDF, impression.
import { useRef, useState } from 'react';
import { flotteApi, fileUrl } from './api';
import CropperModal from './CropperModal';
import { copyDocumentImage, downloadBlob, fetchBlob, isPdf, printDocument, toPdfBlob } from './docTools';
import {
  Button, CheckIcon, CopyIcon, DownloadIcon, EyeIcon, IconButton, PrintIcon, TrashIcon, UploadIcon, useToast,
} from './ui';
import { formatDateTime, slotsFor, slugify } from './utils';

/** Actions sur un document enregistré (réutilisées dans le tableau de bord, la messagerie…). */
export function useDocumentActions() {
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      if (success) toast(success);
    } catch (e) {
      toast(e.message || 'Action impossible.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return {
    busy,
    copy: (file) => run('copy', () => copyDocumentImage(() => fetchBlob(fileUrl(file.url))), 'Document copié — prêt à coller'),
    downloadPdf: (file, name, cropped) => run('pdf', async () => {
      const blob = await fetchBlob(fileUrl(file.url));
      downloadBlob(await toPdfBlob(blob, { cropped }), `${slugify(name)}.pdf`);
    }),
    print: (file, name, cropped) => run('print', async () => {
      const blob = await fetchBlob(fileUrl(file.url));
      await printDocument(blob, { cropped, title: name });
    }),
  };
}

export function DocumentActions({ file, name, cropped, compact = false }) {
  const { busy, copy, downloadPdf, print } = useDocumentActions();
  return (
    <div className="flex items-center gap-0.5">
      <IconButton label="Voir" onClick={() => window.open(fileUrl(file.url), '_blank', 'noopener')}><EyeIcon /></IconButton>
      <IconButton label="Copier (coller ensuite dans un email ou un portail)" onClick={() => copy(file)} disabled={busy === 'copy'}>
        {busy === 'copy' ? <Spinner /> : <CopyIcon />}
      </IconButton>
      <IconButton label="Télécharger en PDF" onClick={() => downloadPdf(file, name, cropped)} disabled={busy === 'pdf'}>
        {busy === 'pdf' ? <Spinner /> : <DownloadIcon />}
      </IconButton>
      {!compact && (
        <IconButton label="Imprimer" onClick={() => print(file, name, cropped)} disabled={busy === 'print'}>
          {busy === 'print' ? <Spinner /> : <PrintIcon />}
        </IconButton>
      )}
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-orange-600" />;
}

/**
 * Prise en charge d'un fichier pour un emplacement : ouvre le recadreur quand c'est utile,
 * sinon enregistre directement (PDF multi-pages d'un contrat, DIMONA…).
 */
export function useSlotUpload({ driverId, driverName, onUploaded, uploadFn }) {
  const toast = useToast();
  const [pending, setPending] = useState(null); // { file, slot }

  const uploadRaw = async (slot, file, cropped) => {
    const updated = uploadFn
      ? await uploadFn(slot.key, file, cropped)
      : await flotteApi.uploadDriverDoc(driverId, slot.key, file, cropped);
    toast(`${slot.label} enregistré`);
    onUploaded?.(updated);
  };

  const start = (slot, file) => {
    if (!file) return;
    if (!slot.card && isPdf(file)) {
      uploadRaw(slot, file, false).catch((e) => toast(e.message, 'error'));
      return;
    }
    setPending({ file, slot });
  };

  const modal = pending && (
    <CropperModal
      source={pending.file}
      title={`${pending.slot.num}. ${pending.slot.label}`}
      defaultPreset={pending.slot.card ? 'card' : 'free'}
      allowRectoVerso={pending.slot.card}
      baseName={`${driverName} ${pending.slot.label}`}
      onCancel={() => setPending(null)}
      onSave={async ({ blob }) => { await uploadRaw(pending.slot, blob, true); setPending(null); }}
      onSaveOriginal={async () => { await uploadRaw(pending.slot, pending.file, false); setPending(null); }}
    />
  );

  return { start, modal };
}

/**
 * mode « admin » : ajout, remplacement, suppression, validation des documents envoyés par le chauffeur.
 * mode « driver » : le chauffeur envoie ou remplace ses propres documents.
 * only / exclude : restreindre les emplacements affichés.
 */
export default function DocumentVault({ driver, onChange, mode = 'admin', only, exclude }) {
  const isDriver = mode === 'driver';
  const toast = useToast();
  const inputs = useRef({});
  const { start, modal } = useSlotUpload({
    driverId: driver.id, driverName: driver.nomComplet, onUploaded: onChange,
    uploadFn: isDriver ? (slot, file, cropped) => flotteApi.uploadMyDoc(slot, file, cropped) : undefined,
  });
  const [dragOver, setDragOver] = useState(null);

  const remove = async (slot) => {
    if (!window.confirm(`Supprimer « ${slot.label} » du dossier de ${driver.nomComplet} ?`)) return;
    try {
      onChange(await flotteApi.deleteDriverDoc(driver.id, slot.key));
      toast('Document supprimé');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const verify = async (slot) => {
    try {
      await flotteApi.verifyDoc(driver.id, slot.key);
      toast(`${slot.label} validé`);
      onChange(await flotteApi.driver(driver.id));
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const required = new Set(driver.documentsRequired);
  const slots = slotsFor(driver.typeChauffeur, driver.documents)
    .filter((s) => (!only || only.includes(s.key)) && (!exclude || !exclude.includes(s.key)));

  return (
    <>
      <div className="grid gap-2.5">
        {slots.map((slot) => {
          const doc = driver.documents?.[slot.key];
          const isRequired = required.has(slot.key);
          const pendingCheck = doc?.uploadedByDriver && !doc?.verifiedAt;
          return (
            <div
              key={slot.key}
              onDragOver={(e) => { e.preventDefault(); setDragOver(slot.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); start(slot, e.dataTransfer.files?.[0]); }}
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                dragOver === slot.key
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-500/10'
                  : doc
                    ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    : isRequired
                      ? 'border-dashed border-red-300 bg-red-50/40 dark:border-red-500/40 dark:bg-red-500/5'
                      : 'border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                doc ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>{slot.num}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{slot.label}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {doc
                    ? `${doc.isCroppedAndFormatted ? 'Recadré' : 'Original'} · ${formatDateTime(doc.uploadedAt)}${doc.uploadedByDriver ? ' · envoyé par le chauffeur' : ''}`
                    : isRequired ? 'Manquant — glissez un fichier ici' : 'Facultatif'}
                </p>
                {pendingCheck && (
                  <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    {isDriver ? 'En attente de vérification par le bureau' : 'À vérifier'}
                  </span>
                )}
              </div>
              {pendingCheck && !isDriver && <Button size="sm" variant="secondary" onClick={() => verify(slot)}><CheckIcon /> Valider</Button>}
              {doc && (isDriver
                ? <IconButton label="Voir" onClick={() => window.open(fileUrl(doc.file.url), '_blank', 'noopener')}><EyeIcon /></IconButton>
                : <DocumentActions file={doc.file} name={`${driver.nomComplet} ${slot.label}`} cropped={doc.isCroppedAndFormatted} />)}
              <IconButton label={doc ? 'Remplacer' : 'Ajouter'} onClick={() => inputs.current[slot.key]?.click()}><UploadIcon /></IconButton>
              {doc && !isDriver && <IconButton label="Supprimer" onClick={() => remove(slot)} className="hover:!text-red-600"><TrashIcon /></IconButton>}
              <input
                ref={(el) => { inputs.current[slot.key] = el; }}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { start(slot, e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>
          );
        })}
      </div>
      {modal}
    </>
  );
}
