// Outils documents : rendu PDF, rotation, recadrage, détourage auto, assemblage recto/verso,
// export PDF, copie presse-papiers et impression. Tout se passe dans le navigateur.

const MAX_OUTPUT = 2200; // px — côté le plus long d'un document exporté
export const CARD_RATIO = 85.6 / 54; // format ID-1 (carte d'identité, permis, carte conducteur)
const STACK_GAP = 0.06; // espace entre recto et verso (fraction de la largeur)
export const STACKED_RATIO = 1 / (2 / CARD_RATIO + STACK_GAP);

let pdfjsPromise = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.js?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    });
  }
  return pdfjsPromise;
}

export function isPdf(blobOrMime) {
  const t = typeof blobOrMime === 'string' ? blobOrMime : blobOrMime?.type;
  return t === 'application/pdf';
}

export async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Impossible de charger le document.');
  return res.blob();
}

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

async function imageBlobToCanvas(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image illisible (format non pris en charge — utilisez JPEG, PNG ou PDF)."));
      el.src = url;
    });
    const c = newCanvas(img.naturalWidth, img.naturalHeight);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Ouvre une source (image ou PDF). Retourne { pageCount, renderPage(n) → canvas }.
 * Les PDF sont rendus à ~2000 px de large pour garder une bonne netteté une fois recadrés.
 */
export async function openSource(blob) {
  if (isPdf(blob)) {
    const pdfjs = await loadPdfjs();
    const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
    return {
      pageCount: pdf.numPages,
      async renderPage(n) {
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(4, 2000 / Math.max(base.width, base.height) * 1.4);
        const viewport = page.getViewport({ scale });
        const c = newCanvas(viewport.width, viewport.height);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        return c;
      },
    };
  }
  const canvas = await imageBlobToCanvas(blob);
  return { pageCount: 1, renderPage: async () => canvas };
}

export function rotateCanvas(src, degrees) {
  const d = ((degrees % 360) + 360) % 360;
  if (d === 0) return src;
  const swap = d === 90 || d === 270;
  const c = newCanvas(swap ? src.height : src.width, swap ? src.width : src.height);
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((d * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

export function cropCanvas(src, { x, y, width, height }) {
  const sx = Math.max(0, Math.round(x));
  const sy = Math.max(0, Math.round(y));
  const sw = Math.min(src.width - sx, Math.round(width));
  const sh = Math.min(src.height - sy, Math.round(height));
  const c = newCanvas(sw, sh);
  c.getContext('2d').drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}

function fitCanvas(src, maxSide = MAX_OUTPUT) {
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  if (scale === 1) return src;
  const c = newCanvas(src.width * scale, src.height * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/**
 * Détourage automatique : rectangle (en px) qui englobe le contenu non blanc.
 * Ignore les poussières de scan (lignes/colonnes avec très peu de pixels sombres).
 */
export function autoTrimRect(src, { threshold = 232, padding = 0.01 } = {}) {
  const scale = Math.min(1, 900 / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const c = newCanvas(w, h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const rows = new Uint32Array(h);
  const cols = new Uint32Array(w);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < threshold && data[i + 3] > 0) { rows[yy]++; cols[xx]++; }
    }
  }
  const minRow = Math.max(2, w * 0.006);
  const minCol = Math.max(2, h * 0.006);
  let top = rows.findIndex((v) => v > minRow);
  let left = cols.findIndex((v) => v > minCol);
  if (top < 0 || left < 0) return null;
  let bottom = h - 1;
  while (bottom > top && rows[bottom] <= minRow) bottom--;
  let right = w - 1;
  while (right > left && cols[right] <= minCol) right--;
  const pad = Math.round(Math.max(w, h) * padding);
  top = Math.max(0, top - pad);
  left = Math.max(0, left - pad);
  bottom = Math.min(h - 1, bottom + pad);
  right = Math.min(w - 1, right + pad);
  // Rien à détourer si le contenu occupe déjà presque toute la page
  if ((right - left) / w > 0.97 && (bottom - top) / h > 0.97) return null;
  return {
    x: left / scale,
    y: top / scale,
    width: (right - left + 1) / scale,
    height: (bottom - top + 1) / scale,
  };
}

/** Assemble recto + verso l'un sous l'autre, même largeur, centrés sur fond blanc. */
export function stitchVertical(canvases) {
  const width = Math.max(...canvases.map((c) => c.width));
  const gap = Math.round(width * STACK_GAP);
  const scaled = canvases.map((c) => ({ c, h: Math.round(c.height * (width / c.width)) }));
  const height = scaled.reduce((s, x) => s + x.h, 0) + gap * (canvases.length - 1);
  const out = newCanvas(width, height);
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  let y = 0;
  for (const { c, h } of scaled) {
    ctx.drawImage(c, 0, y, width, h);
    y += h + gap;
  }
  return out;
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  const fitted = fitCanvas(canvas);
  return new Promise((resolve, reject) =>
    fitted.toBlob((b) => (b ? resolve(b) : reject(new Error('Export image impossible.'))), type, quality),
  );
}

/** Rend n'importe quel document (image ou 1re page de PDF) en canvas. */
export async function documentToCanvas(blob) {
  const src = await openSource(blob);
  return src.renderPage(1);
}

/** Format physique déduit des proportions : carte seule, recto/verso empilés, ou page. */
export function guessLayout(width, height) {
  const r = width / height;
  if (r > 1.45 && r < 1.75) return 'card';
  if (r > 0.68 && r < 0.86) return 'stacked';
  return 'page';
}

function physicalSizeMm(canvas, cropped) {
  const layout = cropped ? guessLayout(canvas.width, canvas.height) : 'page';
  if (layout === 'card' || layout === 'stacked') {
    const w = 85.6;
    return { w, h: w * (canvas.height / canvas.width), layout };
  }
  const portrait = canvas.height >= canvas.width;
  const maxW = portrait ? 210 : 297;
  const maxH = portrait ? 297 : 210;
  const scale = Math.min(maxW / canvas.width, maxH / canvas.height);
  return { w: canvas.width * scale, h: canvas.height * scale, layout };
}

/**
 * PDF d'une page, sans marge (pleine page). Une carte recadrée garde sa taille réelle (85,6 mm).
 * Un PDF d'origine non retouché est renvoyé tel quel.
 */
export async function toPdfBlob(blob, { cropped = false } = {}) {
  if (isPdf(blob) && !cropped) return blob;
  const { jsPDF } = await import('jspdf');
  const canvas = await documentToCanvas(blob);
  const { w, h } = physicalSizeMm(canvas, cropped);
  const doc = new jsPDF({ unit: 'mm', format: [w, h], orientation: w > h ? 'landscape' : 'portrait', compress: true });
  const jpeg = fitCanvas(canvas).toDataURL('image/jpeg', 0.92);
  doc.addImage(jpeg, 'JPEG', 0, 0, w, h);
  return doc.output('blob');
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Copie l'image propre dans le presse-papiers (PNG).
 * La promesse est passée directement à ClipboardItem pour rester dans le geste utilisateur (Safari).
 */
export async function copyDocumentImage(getBlob) {
  if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
    throw new Error("Ce navigateur ne permet pas de copier une image. Utilisez Chrome, Edge ou Safari récents.");
  }
  const png = (async () => {
    const blob = await getBlob();
    const canvas = await documentToCanvas(blob);
    return canvasToBlob(canvas, 'image/png');
  })();
  await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': png })]);
}

/** Impression : carte à taille réelle centrée sur une feuille A4, page entière sinon. */
export async function printDocument(blob, { cropped = false, title = 'Document' } = {}) {
  const canvas = await documentToCanvas(blob);
  const { w, h, layout } = physicalSizeMm(canvas, cropped);
  const dataUrl = fitCanvas(canvas).toDataURL('image/jpeg', 0.95);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const sized = layout === 'page'
    ? 'max-width:100%;max-height:100%'
    : `width:${w}mm;height:${h}mm`;
  iframe.contentDocument.write(`<!doctype html><html><head><title>${title.replace(/</g, '')}</title>
    <style>@page{size:A4;margin:12mm}html,body{margin:0;height:100%}
    body{display:flex;align-items:${layout === 'page' ? 'center' : 'flex-start'};justify-content:center}
    img{${sized};display:block}</style></head>
    <body><img src="${dataUrl}"></body></html>`);
  iframe.contentDocument.close();
  const img = iframe.contentDocument.querySelector('img');
  await new Promise((r) => (img.complete ? r() : (img.onload = r)));
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => iframe.remove(), 60000);
}
