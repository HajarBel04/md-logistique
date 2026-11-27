import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { flotteApi } from '../../flotte/api';
import CropperModal from '../../flotte/CropperModal';
import {
  copyDocumentImage, downloadBlob, isPdf, printDocument, toPdfBlob,
} from '../../flotte/docTools';
import {
  Button, Card, CopyIcon, DownloadIcon, ErrorBanner, Field, PrintIcon, ScissorsIcon, Tabs, UploadIcon,
  inputClass, useToast,
} from '../../flotte/ui';
import { SLOTS, SLOT_BY_KEY, slotsFor, slugify } from '../../flotte/utils';

function DropZone({ onFile, label, disabled }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && ref.current?.click()}
      onKeyDown={(e) => !disabled && e.key === 'Enter' && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) onFile(e.dataTransfer.files?.[0]); }}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
        disabled ? 'cursor-not-allowed border-slate-200 opacity-60 dark:border-slate-800'
          : over ? 'cursor-pointer border-orange-500 bg-orange-50 dark:bg-orange-500/10'
            : 'cursor-pointer border-slate-300 hover:border-orange-400 hover:bg-orange-50/40 dark:border-slate-700 dark:hover:bg-slate-800/50'
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"><UploadIcon className="h-6 w-6" /></span>
      <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">PDF, JPEG ou PNG — scan A4, photo de téléphone…</p>
      <input ref={ref} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

/* ─── Classer un document dans un dossier ────────────────────────────── */

function FileIntoRecord() {
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [target, setTarget] = useState('driver');
  const [driverId, setDriverId] = useState('');
  const [slot, setSlot] = useState('PERMIS_CONDUIRE');
  const [vehicleId, setVehicleId] = useState('');
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [last, setLast] = useState(null);

  useEffect(() => {
    Promise.all([flotteApi.drivers(), flotteApi.vehicles()])
      .then(([d, v]) => { setDrivers(d.filter((x) => x.statut !== 'INACTIF')); setVehicles(v); })
      .catch((e) => setError(e.message));
  }, []);

  const driver = drivers.find((d) => d.id === driverId);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const ready = target === 'driver' ? Boolean(driver) : Boolean(vehicle);
  const slotMeta = SLOT_BY_KEY[slot];

  const save = async (file, cropped) => {
    if (target === 'driver') {
      await flotteApi.uploadDriverDoc(driver.id, slot, file, cropped);
      toast(`${slotMeta.label} classé dans le dossier de ${driver.nomComplet}`);
      setLast({ label: `${driver.nomComplet} — ${slotMeta.label}`, to: `/chauffeurs?id=${driver.id}` });
    } else {
      await flotteApi.uploadInsurance(vehicle.id, file);
      toast(`Attestation d'assurance classée pour ${vehicle.plaque}`);
      setLast({ label: `${vehicle.plaque} — Assurance`, to: `/vehicules?id=${vehicle.id}` });
    }
    setPending(null);
  };

  const onFile = (file) => {
    if (!file || !ready) return;
    const isCard = target === 'driver' && slotMeta.card;
    if (!isCard && isPdf(file)) {
      save(file, false).catch((e) => toast(e.message, 'error'));
    } else {
      setPending({ file, isCard });
    }
  };

  return (
    <Card title="Classer un document" subtitle="Choisissez le dossier, déposez le fichier : il est recadré puis rangé au bon endroit.">
      <ErrorBanner message={error} />
      <div className="mb-4 grid gap-3 md:grid-cols-[auto_1fr_1fr]">
        <Field label="Dossier">
          <Tabs value={target} onChange={setTarget} tabs={[{ value: 'driver', label: 'Chauffeur' }, { value: 'vehicle', label: 'Véhicule' }]} />
        </Field>
        {target === 'driver' ? (
          <>
            <Field label="Chauffeur">
              <select className={inputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">— Choisir —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.nom} {d.prenom}</option>)}
              </select>
            </Field>
            <Field label="Emplacement">
              <select className={inputClass} value={slot} onChange={(e) => setSlot(e.target.value)}>
                {(driver ? slotsFor(driver.typeChauffeur) : SLOTS).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.num}. {s.label}{driver?.documentsPresent.includes(s.key) ? ' (remplacer)' : ''}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <Field label="Véhicule (attestation d'assurance)" className="md:col-span-2">
            <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">— Choisir —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plaque}{v.assuranceDocument ? ' (remplacer)' : ''}</option>)}
            </select>
          </Field>
        )}
      </div>
      <DropZone onFile={onFile} disabled={!ready} label={ready ? 'Déposez le document ici' : `Choisissez d'abord un ${target === 'driver' ? 'chauffeur' : 'véhicule'}`} />
      {last && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Dernier document classé : <Link className="font-semibold text-orange-600 hover:underline" to={last.to}>{last.label}</Link>
        </p>
      )}
      {pending && (
        <CropperModal
          source={pending.file}
          title={target === 'driver' ? `${driver.nomComplet} — ${slotMeta.label}` : `Assurance ${vehicle.plaque}`}
          defaultPreset={pending.isCard ? 'card' : 'free'}
          allowRectoVerso={pending.isCard}
          baseName={target === 'driver' ? `${driver.nomComplet} ${slotMeta.label}` : `${vehicle.plaque} assurance`}
          onCancel={() => setPending(null)}
          onSave={({ blob }) => save(blob, true)}
          onSaveOriginal={() => save(pending.file, false)}
        />
      )}
    </Card>
  );
}

/* ─── Outil rapide (sans enregistrement) ─────────────────────────────── */

function QuickTool() {
  const toast = useToast();
  const [source, setSource] = useState(null);
  const [result, setResult] = useState(null); // { file, url }
  const [busy, setBusy] = useState('');

  useEffect(() => () => result && URL.revokeObjectURL(result.url), [result]);

  const act = async (key, fn, msg) => {
    setBusy(key);
    try { await fn(); if (msg) toast(msg); } catch (e) { toast(e.message, 'error'); } finally { setBusy(''); }
  };

  const name = useMemo(() => slugify(result?.file.name.replace(/\.[^.]+$/, '') || 'document'), [result]);

  return (
    <Card title="Outil rapide" subtitle="Recadrer une carte et la copier ou l'imprimer, sans la ranger dans un dossier.">
      {!result ? (
        <DropZone onFile={(f) => f && setSource(f)} label="Déposez une carte ou un scan" />
      ) : (
        <div className="grid gap-5 md:grid-cols-[1fr_233px]">
          <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
            <img src={result.url} alt="Document recadré" className="max-h-[420px] rounded-md shadow-md ring-1 ring-slate-200 dark:ring-slate-700" />
          </div>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => act('copy', () => copyDocumentImage(async () => result.file), 'Document copié — prêt à coller')} disabled={busy === 'copy'}>
              <CopyIcon /> Copier
            </Button>
            <Button className="w-full" variant="secondary" disabled={busy === 'pdf'}
              onClick={() => act('pdf', async () => downloadBlob(await toPdfBlob(result.file, { cropped: true }), `${name}.pdf`))}>
              <DownloadIcon /> Télécharger PDF
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => downloadBlob(result.file, `${name}.jpg`)}>
              <DownloadIcon /> Télécharger l'image
            </Button>
            <Button className="w-full" variant="secondary" disabled={busy === 'print'}
              onClick={() => act('print', () => printDocument(result.file, { cropped: true, title: name }))}>
              <PrintIcon /> Imprimer
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => setResult(null)}><ScissorsIcon /> Nouveau document</Button>
          </div>
        </div>
      )}
      {source && (
        <CropperModal
          source={source}
          title="Recadrer"
          defaultPreset="card"
          baseName={source.name?.replace(/\.[^.]+$/, '') || 'document'}
          onCancel={() => setSource(null)}
          onSave={async ({ blob }) => { setResult({ file: blob, url: URL.createObjectURL(blob) }); setSource(null); }}
        />
      )}
    </Card>
  );
}

export default function OutilScan() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Documents</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">Documents & outil scan</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Fini les cartes minuscules au milieu d'une page A4 : le document est détouré, redressé et le recto/verso assemblé sur une seule image propre.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <FileIntoRecord />
        <QuickTool />
      </div>
    </div>
  );
}
