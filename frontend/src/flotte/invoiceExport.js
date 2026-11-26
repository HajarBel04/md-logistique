// Facture au format M-D logistique.com sprl : PDF (jsPDF) et Excel (.xlsx).
import logoUrl from '../assets/logo1.png';

const d2 = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const fr = (n, dec) => Number(n || 0).toLocaleString('fr-BE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const eur2 = (n) => (n == null ? '' : `${fr(n, 2)}€`);
export const eur5 = (n) => (n == null ? '' : `${fr(n, 5)}€`);

export const COLUMNS = [
  { key: 'date', label: 'Date', w: 20 },
  { key: 'job', label: 'Job# /Schedule#', w: 23 },
  { key: 'routing', label: 'Routing (city)', w: 46 },
  { key: 'km', label: 'km per job', w: 15, align: 'right' },
  { key: 'tour', label: 'Tour', w: 9, align: 'center' },
  { key: 'rate', label: 'Rate/Tour', w: 18, align: 'right' },
  { key: 'fuel', label: 'Fuel Surch/KM', w: 19, align: 'right' },
  { key: 'totFuel', label: 'Tot Fuel surch', w: 19, align: 'right' },
  { key: 'total', label: 'Total Rate', w: 17, align: 'right', bold: true },
];

export function invoiceRows(inv) {
  return inv.lines.map((t) => ({
    date: d2(t.date), job: t.routeCode, routing: t.itineraire, km: t.distanceKm, tour: t.tour || 1,
    rate: t.basePrice, fuel: t.fuelRate, totFuel: t.surcharge, total: t.total,
  }));
}

export function periodLabel(inv) {
  return inv.periodStart ? `${d2(inv.periodStart)} au ${d2(inv.periodEnd)}` : inv.month;
}

async function logoDataUrl() {
  const img = new Image();
  img.src = logoUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = Math.round((img.naturalHeight / img.naturalWidth) * 360);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/png'), ratio: c.height / c.width };
}

export async function buildInvoicePdf(inv) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const e = inv.emetteur || {};
  const c = inv.client || {};
  const L = 12;
  const R = 198;
  const line = (y) => { doc.setLineWidth(0.4); doc.line(L + 10, y, R - 10, y); };
  const labelValue = (label, value, xLabelRight, y, size = 7.5) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} :`, xLabelRight, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || ''), xLabelRight + 1.5, y);
  };

  // En-tête société
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(e.nom || 'M-D logistique.com sprl', 105, 16, { align: 'center' });
  line(19);
  labelValue('Adresse', e.adresse, 48, 27);
  labelValue('CP & Ville', e.cpVille, 48, 32);
  labelValue('Pays', e.pays, 48, 37);
  try {
    const logo = await logoDataUrl();
    doc.addImage(logo.data, 'PNG', 85, 23, 40, 40 * logo.ratio);
  } catch { /* logo indisponible : facture sans logo */ }
  labelValue('Téléphone', e.telephone, 158, 26);
  labelValue('E-mail', e.email, 158, 30.5);
  labelValue('Rekeningnummer', e.iban, 158, 35);
  labelValue('BTW nr', e.tva, 158, 39.5);
  line(46);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Facture', 105, 52, { align: 'center' });
  line(55);

  // Métadonnées + client
  labelValue('N° Facture', inv.numero, 52, 64, 8);
  labelValue('Date', d2(inv.dateEmission), 52, 69, 8);
  labelValue('N° Client', inv.numeroClient || c.numeroClient || '', 52, 74, 8);
  labelValue('Période', periodLabel(inv), 52, 79, 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(c.nom || '', 140, 64);
  doc.setFont('helvetica', 'normal');
  let cy = 69;
  (c.adresse || '').split('\n').filter(Boolean).forEach((l) => { doc.text(l, 140, cy); cy += 4.5; });
  doc.text(`BTW/T.V.A : ${c.tva || ''}`, 140, cy);

  if (inv.section) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(inv.section, 105, 92, { align: 'center' });
  }

  // Tableau
  const rows = invoiceRows(inv);
  const fmt = { km: (v) => fr(v, 0), tour: (v) => String(v), rate: eur2, fuel: eur5, totFuel: eur5, total: eur2 };
  const rowH = 5.4;
  let y = 97;
  const xs = [];
  let x = L;
  COLUMNS.forEach((col) => { xs.push(x); x += col.w; });
  const tableRight = x;
  const header = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setLineWidth(0.3);
    COLUMNS.forEach((col, i) => {
      doc.rect(xs[i], y, col.w, rowH);
      doc.text(col.label, xs[i] + 1, y + 3.7);
    });
    y += rowH;
  };
  header();
  const bodyTop = y;
  doc.setFont('helvetica', 'normal');
  rows.forEach((r) => {
    if (y + rowH > 262) {
      doc.rect(L, bodyTop, tableRight - L, y - bodyTop);
      doc.addPage();
      y = 15;
      header();
    }
    doc.setFontSize(7);
    COLUMNS.forEach((col, i) => {
      const raw = r[col.key];
      const v = raw == null ? '' : fmt[col.key] ? fmt[col.key](raw) : String(raw);
      doc.setFont('helvetica', col.bold ? 'bold' : 'normal');
      const text = doc.splitTextToSize(v, col.w - 2)[0] || '';
      if (col.align === 'right') doc.text(text, xs[i] + col.w - 1, y + 3.8, { align: 'right' });
      else if (col.align === 'center') doc.text(text, xs[i] + col.w / 2, y + 3.8, { align: 'center' });
      else doc.text(text, xs[i] + 1, y + 3.8);
    });
    y += rowH;
  });
  y = Math.max(y + 4, bodyTop + 40);
  doc.setLineWidth(0.4);
  doc.rect(L, bodyTop, tableRight - L, y - bodyTop);

  // Totaux
  const colX = (key) => { const i = COLUMNS.findIndex((cc) => cc.key === key); return xs[i] + COLUMNS[i].w - 1; };
  doc.setFontSize(8);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', xs[5], y);
  doc.text(eur2(inv.totalSurcharge), colX('totFuel'), y, { align: 'right' });
  doc.text(eur2(inv.totalHt), colX('total'), y, { align: 'right' });
  y += 5;
  doc.text(`TVA ${fr(inv.vatRate, inv.vatRate % 1 ? 2 : 0)} %`, xs[5], y);
  doc.text(eur2(inv.totalTva), colX('total'), y, { align: 'right' });
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Total', xs[5], y);
  doc.text(eur2(inv.totalTtc), colX('total'), y, { align: 'right' });

  const notes = [
    Number(inv.vatRate) === 0 ? 'TVA 0 % — autoliquidation par le preneur (art. 196 directive 2006/112/CE).' : '',
    inv.notes || '',
    e.conditions || '',
  ].filter(Boolean);
  if (notes.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(notes.join('\n'), 180), L, Math.min(y + 10, 285));
  }
  return doc.output('blob');
}

export async function exportInvoiceXlsx(inv) {
  const XLSX = await import('xlsx');
  const e = inv.emetteur || {};
  const c = inv.client || {};
  const aoa = [
    [e.nom || 'M-D logistique.com sprl'],
    [`Adresse : ${e.adresse || ''}`, '', '', '', '', `Téléphone : ${e.telephone || ''}`],
    [`CP & Ville : ${e.cpVille || ''}`, '', '', '', '', `E-mail : ${e.email || ''}`],
    [`Pays : ${e.pays || ''}`, '', '', '', '', `Rekeningnummer : ${e.iban || ''}`],
    ['', '', '', '', '', `BTW nr : ${e.tva || ''}`],
    [],
    ['Facture'],
    [`N° Facture : ${inv.numero}`, '', '', '', '', c.nom || ''],
    [`Date : ${d2(inv.dateEmission)}`, '', '', '', '', ...(c.adresse || '').split('\n').slice(0, 1)],
    [`N° Client : ${inv.numeroClient || ''}`, '', '', '', '', (c.adresse || '').split('\n')[1] || ''],
    [`Période : ${periodLabel(inv)}`, '', '', '', '', `BTW/T.V.A : ${c.tva || ''}`],
    [],
    [inv.section || ''],
    COLUMNS.map((col) => col.label),
  ];
  const headerRow = aoa.length;
  invoiceRows(inv).forEach((r) => aoa.push(COLUMNS.map((col) => r[col.key] ?? '')));
  aoa.push([]);
  aoa.push(['', '', '', '', '', 'Subtotal', '', inv.totalSurcharge, inv.totalHt]);
  aoa.push(['', '', '', '', '', `TVA ${inv.vatRate} %`, '', '', inv.totalTva]);
  aoa.push(['', '', '', '', '', 'Total', '', '', inv.totalTtc]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 36 }, { wch: 11 }, { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 13 }];
  const fmts = { 5: '#,##0.00"€"', 6: '0.00000"€"', 7: '0.00000"€"', 8: '#,##0.00"€"' };
  for (let r = headerRow; r < aoa.length; r += 1) {
    Object.entries(fmts).forEach(([ci, z]) => {
      const cell = ws[XLSX.utils.encode_cell({ r, c: Number(ci) })];
      if (cell && typeof cell.v === 'number') cell.z = z;
    });
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Facture');
  XLSX.writeFile(wb, `Facture-${inv.numero}.xlsx`);
}
