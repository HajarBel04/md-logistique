// Recadrage / rotation / détourage / assemblage recto-verso d'un document avant enregistrement.
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  CARD_RATIO, STACKED_RATIO, autoTrimRect, canvasToBlob, cropCanvas, isPdf, openSource,
  rotateCanvas, stitchVertical,
} from './docTools';
import { Button, Loader, Modal, RotateLeftIcon, RotateRightIcon, ScissorsIcon, inputClass } from './ui';
import { slugify } from './utils';

const PRESETS = [
  { key: 'card', label: 'Carte ID / Permis', hint: '85,6 × 54 mm', aspect: CARD_RATIO },
  { key: 'stacked', label: 'Recto + Verso empilés', hint: 'déjà sur une page', aspect: STACKED_RATIO },
  { key: 'free', label: 'Page libre', hint: 'sans contrainte', aspect: undefined },
];

/** Recadrage (en %) qui englobe le rectangle donné, élargi au format demandé et centré dessus. */
function cropAround(rect, natW, natH, aspect) {
  let { x, y, width, height } = rect || { x: 0, y: 0, width: natW, height: natH };
  if (aspect) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (width / height > aspect) height = width / aspect; else width = height * aspect;
    if (width > natW) { width = natW; height = width / aspect; }
    if (height > natH) { height = natH; width = height * aspect; }
    x = Math.min(Math.max(0, cx - width / 2), natW - width);
    y = Math.min(Math.max(0, cy - height / 2), natH - height);
  }
  return { unit: '%', x: (x / natW) * 100, y: (y / natH) * 100, width: (width / natW) * 100, height: (height / natH) * 100 };
}

/**
 * props:
 *  - source: File | Blob  (image ou PDF)
 *  - title, subtitle
 *  - defaultPreset: 'card' | 'free' | 'stacked'
 *  - allowRectoVerso: proposer l'ajout d'un verso
 *  - baseName: nom de fichier de sortie (sans extension)
 *  - onSave({ blob, filename, cropped }) — doit renvoyer une promesse
 *  - onSaveOriginal?(): enregistrer le fichier tel quel (sans retouche)
 */
export default function CropperModal({
  source, title = 'Recadrer le document', subtitle, defaultPreset = 'card', allowRectoVerso = true,
  baseName = 'document', onSave, onSaveOriginal, onCancel,
}) {
  const [src, setSrc] = useState(source);
  const [doc, setDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [preset, setPreset] = useState(defaultPreset);
  const [crop, setCrop] = useState(null);
  const [display, setDisplay] = useState(null); // { url, canvas }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recto, setRecto] = useState(null); // canvas du recto déjà recadré
  const [rectoUrl, setRectoUrl] = useState(null);
  const fileRef = useRef(null);
  const aspect = PRESETS.find((p) => p.key === preset)?.aspect;

  // Charger la source
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    openSource(src)
      .then((d) => { if (alive) { setDoc(d); setPage(1); setRotation(0); } })
      .catch((e) => { if (alive) { setError(e.message || 'Document illisible.'); setLoading(false); } });
    return () => { alive = false; };
  }, [src]);

  // Rendre la page + rotation, puis détourer automatiquement
  useEffect(() => {
    if (!doc) return undefined;
    let alive = true;
    let url = null;
    setLoading(true);
    (async () => {
      const base = await doc.renderPage(page);
      const canvas = rotateCanvas(base, rotation);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
      if (!alive) return;
      url = URL.createObjectURL(blob);
      setDisplay({ url, canvas });
      setCrop(cropAround(autoTrimRect(canvas), canvas.width, canvas.height, aspect));
      setLoading(false);
    })().catch((e) => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, page, rotation]);

  useEffect(() => () => rectoUrl && URL.revokeObjectURL(rectoUrl), [rectoUrl]);

  const changePreset = (key) => {
    setPreset(key);
    if (!display) return;
    const a = PRESETS.find((p) => p.key === key)?.aspect;
    const { canvas } = display;
    const current = crop && crop.width > 0 ? {
      x: (crop.x / 100) * canvas.width, y: (crop.y / 100) * canvas.height,
      width: (crop.width / 100) * canvas.width, height: (crop.height / 100) * canvas.height,
    } : null;
    setCrop(cropAround(current, canvas.width, canvas.height, a));
  };

  const autoTrim = () => {
    if (!display) return;
    const { canvas } = display;
    setCrop(cropAround(autoTrimRect(canvas), canvas.width, canvas.height, aspect));
  };

  const resetFull = () => {
    if (!display) return;
    const { canvas } = display;
    setCrop(aspect
      ? centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, canvas.width, canvas.height), canvas.width, canvas.height)
      : { unit: '%', x: 0, y: 0, width: 100, height: 100 });
  };

  const currentCropCanvas = useCallback(() => {
    const { canvas } = display;
    const c = crop && crop.width > 0 && crop.height > 0 ? crop : { x: 0, y: 0, width: 100, height: 100 };
    return cropCanvas(canvas, {
      x: (c.x / 100) * canvas.width, y: (c.y / 100) * canvas.height,
      width: (c.width / 100) * canvas.width, height: (c.height / 100) * canvas.height,
    });
  }, [display, crop]);

  const addVerso = async () => {
    const canvas = currentCropCanvas();
    setRecto(canvas);
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.8);
    setRectoUrl(URL.createObjectURL(blob));
    // Le verso est souvent sur la même page (scan A4) ou la page suivante d'un PDF
    if (doc && page < doc.pageCount) setPage(page + 1);
    else if (display) setCrop(cropAround(null, display.canvas.width, display.canvas.height, aspect));
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const current = currentCropCanvas();
      const final = recto ? stitchVertical([recto, current]) : current;
      const blob = await canvasToBlob(final, 'image/jpeg', 0.92);
      const filename = `${slugify(baseName)}${recto ? '-recto-verso' : ''}.jpg`;
      await onSave({ blob: new File([blob], filename, { type: 'image/jpeg' }), filename, cropped: true });
    } catch (e) {
      setError(e.message || "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  const saveOriginal = async () => {
    setBusy(true);
    setError('');
    try { await onSaveOriginal(); } catch (e) { setError(e.message || "Échec de l'enregistrement."); } finally { setBusy(false); }
  };

  return (
    <Modal
      title={recto ? `${title} — verso` : title}
      subtitle={subtitle || (recto ? 'Recadrez maintenant le verso : il sera placé sous le recto sur une seule image.' : 'Le document est détouré automatiquement. Ajustez le cadre si besoin.')}
      onClose={onCancel}
      size="xl"
      footer={
        <>
          {onSaveOriginal && !recto && (
            <Button variant="ghost" onClick={saveOriginal} disabled={busy} className="mr-auto">
              Enregistrer sans retouche
            </Button>
          )}
          <Button variant="secondary" onClick={onCancel} disabled={busy}>Annuler</Button>
          {allowRectoVerso && !recto && (
            <Button variant="dark" onClick={addVerso} disabled={busy || loading || !display}>Ajouter le verso</Button>
          )}
          <Button onClick={save} disabled={busy || loading || !display}>
            {busy ? 'Enregistrement…' : recto ? 'Assembler et enregistrer' : 'Enregistrer le document'}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_233px]">
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-3 dark:bg-slate-900">
          {error && <p className="max-w-sm text-center text-sm text-red-600 dark:text-red-300">{error}</p>}
          {!error && loading && <Loader label="Préparation du document…" />}
          {!error && !loading && display && (
            <ReactCrop crop={crop || undefined} onChange={(_, pct) => setCrop(pct)} aspect={aspect} keepSelection ruleOfThirds>
              <img src={display.url} alt="Document à recadrer" className="max-h-[60vh] w-auto object-contain" />
            </ReactCrop>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Format</p>
            <div className="space-y-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => changePreset(p.key)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ring-1 ring-inset transition ${
                    preset === p.key
                      ? 'bg-orange-50 font-semibold text-orange-800 ring-orange-300 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/40'
                      : 'text-slate-700 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-xs font-normal text-slate-400">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ajuster</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRotation((r) => r - 90)} disabled={loading}><RotateLeftIcon /> 90° gauche</Button>
              <Button variant="secondary" size="sm" onClick={() => setRotation((r) => r + 90)} disabled={loading}><RotateRightIcon /> 90° droite</Button>
              <Button variant="secondary" size="sm" onClick={autoTrim} disabled={loading} className="col-span-2"><ScissorsIcon /> Retirer les marges blanches</Button>
              <Button variant="ghost" size="sm" onClick={resetFull} disabled={loading} className="col-span-2">Réinitialiser le cadre</Button>
            </div>
          </div>

          {doc && doc.pageCount > 1 && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Page du PDF</span>
              <select className={inputClass} value={page} onChange={(e) => setPage(Number(e.target.value))}>
                {Array.from({ length: doc.pageCount }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Page {i + 1} / {doc.pageCount}</option>
                ))}
              </select>
            </label>
          )}

          {recto && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recto enregistré</p>
              {rectoUrl && <img src={rectoUrl} alt="Recto" className="w-full rounded-lg ring-1 ring-slate-200 dark:ring-slate-700" />}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Verso dans un autre fichier…</Button>
                <Button size="sm" variant="ghost" onClick={() => { setRecto(null); setRectoUrl(null); }}>Annuler le verso</Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setSrc(f); e.target.value = ''; }}
              />
            </div>
          )}

          {isPdf(src) && !recto && (
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              PDF de plusieurs pages (contrat, DIMONA…) ? Utilisez « Enregistrer sans retouche » pour garder le PDF complet.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
