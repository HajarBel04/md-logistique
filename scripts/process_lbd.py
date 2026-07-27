#!/usr/bin/env python3
"""
MD-Logistique — Module A LBD Tracking (Abdelhakim)
Analyse les colis OSP MD3449 et colore selon le statut de livraison.

Statuts :
  VERT  = No Inbound Scan  — colis jamais arrivé physiquement au dépôt
  JAUNE = Retour dépôt     — chauffeur a pris puis ramené le colis
  ROUGE = Driver Error     — colis disparu / livré sans scan
  GRIS  = Future delivery  — livraison planifiée
"""

import os
import sys
from datetime import datetime
from io import BytesIO
from typing import Optional, Tuple

import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter

OSP_CODE = 'MD3449'

# Couleurs Excel (ARGB sans alpha)
BG_VERT  = 'C6EFCE'
BG_JAUNE = 'FFEB9C'
BG_ROUGE = 'FFC7CE'
BG_GRIS  = 'D9D9D9'

FG_VERT  = '006100'
FG_JAUNE = '9C6500'
FG_ROUGE = '9C0006'
FG_GRIS  = '595959'

STATUS_LABELS = {
    'vert':  'No Inbound Scan',
    'jaune': 'Retour dépôt',
    'rouge': 'Driver Error',
    'gris':  'Future delivery',
}

COLOR_MAP = {
    'vert':  (BG_VERT,  FG_VERT),
    'jaune': (BG_JAUNE, FG_JAUNE),
    'rouge': (BG_ROUGE, FG_ROUGE),
    'gris':  (BG_GRIS,  FG_GRIS),
}

# Ordre d'affichage dans le rapport
STATUS_ORDER = {'rouge': 0, 'jaune': 1, 'vert': 2, 'gris': 3}


# ─── Loaders ─────────────────────────────────────────────────────────────────

def _sheet_name_for_date(d: datetime) -> str:
    """2026-07-23 → '23jul'"""
    return f"{d.day}{d.strftime('%b').lower()}"


def _load_lbd(path: str, target_date: datetime) -> list:
    """Retourne les packages MD3449 du bon onglet."""
    wb = openpyxl.load_workbook(path, read_only=True)
    sheet_name = _sheet_name_for_date(target_date)

    if sheet_name not in wb.sheetnames:
        available = ', '.join(wb.sheetnames)
        wb.close()
        raise ValueError(
            f"Onglet '{sheet_name}' non trouvé dans {os.path.basename(path)}. "
            f"Disponibles : {available}"
        )

    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    if not rows:
        return []

    headers = [str(h).strip() if h is not None else '' for h in rows[0]]
    packages = []
    for row in rows[1:]:
        if not any(row):
            continue
        r = dict(zip(headers, row))
        if str(r.get('OSP', '')).strip() == OSP_CODE:
            packages.append(r)

    return packages


def _load_scanning(path: Optional[str]) -> set:
    """Tracking numbers du fichier SCANNING dépôt (1ère colonne, skip header)."""
    if not path or not os.path.exists(path):
        return set()
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb.active
    trackings = set()
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue  # ligne d'en-tête ('dépôt ', ...)
        val = row[0]
        if val and str(val).strip() not in ('', 'dépôt ', 'Tracking'):
            trackings.add(str(val).strip())
    wb.close()
    return trackings


def _load_kc(path: Optional[str]) -> set:
    """Tracking numbers KC (pas d'en-tête, toutes les lignes sont des trackings)."""
    if not path or not os.path.exists(path):
        return set()
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb.active
    trackings = {str(row[0]).strip() for row in ws.iter_rows(values_only=True)
                 if row[0] and str(row[0]).strip()}
    wb.close()
    return trackings


def _load_future(path: Optional[str]) -> set:
    """Tracking numbers Future (colonnes: ScanDate | Tracking | FutureDate)."""
    if not path or not os.path.exists(path):
        return set()
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb.active
    trackings = set()
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue  # skip header
        if row[1]:
            trackings.add(str(row[1]).strip())
    wb.close()
    return trackings


# ─── Logique métier ───────────────────────────────────────────────────────────

def _assign_status(tracking: str, scanning: set, kc_j1: set, future: set) -> str:
    """
    Priorité : GRIS > VERT > JAUNE > ROUGE
    VERT  = pas dans SCANNING (jamais arrivé au dépôt)
    JAUNE = dans SCANNING + dans KC J+1 (retourné et re-dispatché)
    ROUGE = dans SCANNING + absent de KC J+1 (disparu/non livré)
    GRIS  = dans Future (planifié)
    """
    if tracking in future:
        return 'gris'
    if tracking not in scanning:
        return 'vert'
    if tracking in kc_j1:
        return 'jaune'
    return 'rouge'


# ─── Génération Excel ─────────────────────────────────────────────────────────

def _fill(bg: str) -> PatternFill:
    return PatternFill(fill_type='solid', fgColor=bg)


def _font(fg: str, bold: bool = False) -> Font:
    return Font(color=fg, bold=bold)


def build_excel(
    packages: list,
    scanning: set,
    kc_j1: set,
    future: set,
    target_date: datetime,
) -> Tuple[bytes, dict]:
    """Construit le fichier Excel colorisé. Retourne (bytes, summary)."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"LBD {target_date.strftime('%d-%m-%Y')}"

    summary = {'total': 0, 'vert': 0, 'jaune': 0, 'rouge': 0, 'gris': 0}
    rows_data = []

    for pkg in packages:
        tracking = str(pkg.get('Trackingnumber', '')).strip()
        if not tracking:
            continue
        status = _assign_status(tracking, scanning, kc_j1, future)
        summary[status] += 1
        summary['total'] += 1

        street  = str(pkg.get('Street',   '') or '').strip()
        city    = str(pkg.get('City',     '') or '').strip()
        zip_    = str(pkg.get('Zip',      '') or '').strip()
        adresse = ', '.join(p for p in [street, f"{zip_} {city}".strip()] if p)

        rows_data.append({
            'tracking': tracking,
            'osp':      str(pkg.get('OSP',      '') or '').strip(),
            'adresse':  adresse,
            'client':   str(pkg.get('Customer', '') or '').strip(),
            'status':   status,
            'comment':  str(pkg.get('comment',  '') or '').strip(),
        })

    # ── Bloc résumé ────────────────────────────────────────────────────────────
    ws.append(['', f"RAPPORT LBD MD3449 — {target_date.strftime('%d/%m/%Y')}", '', '', '', ''])
    ws.cell(ws.max_row, 2).font = Font(bold=True, size=13)

    ws.append([])

    summary_rows = [
        ('Total',  '',                         summary['total'],  None),
        ('VERT',   STATUS_LABELS['vert'],       summary['vert'],   (BG_VERT,  FG_VERT)),
        ('JAUNE',  STATUS_LABELS['jaune'],      summary['jaune'],  (BG_JAUNE, FG_JAUNE)),
        ('ROUGE',  STATUS_LABELS['rouge'],      summary['rouge'],  (BG_ROUGE, FG_ROUGE)),
        ('GRIS',   STATUS_LABELS['gris'],       summary['gris'],   (BG_GRIS,  FG_GRIS)),
    ]
    for label, desc, count, colors in summary_rows:
        ws.append(['', label, desc, count, '', ''])
        row_idx = ws.max_row
        if colors:
            bg, fg = colors
            ws.cell(row_idx, 2).fill = _fill(bg)
            ws.cell(row_idx, 2).font = _font(fg, bold=True)
            ws.cell(row_idx, 3).fill = _fill(bg)
            ws.cell(row_idx, 3).font = _font(fg)
        else:
            ws.cell(row_idx, 2).font = Font(bold=True)

    ws.append([])

    # ── En-tête colonnes ───────────────────────────────────────────────────────
    col_headers = ['Tracking', 'OSP', 'Adresse', 'Client', 'Statut', 'Commentaire']
    ws.append(col_headers)
    hdr_row = ws.max_row
    for col, _ in enumerate(col_headers, 1):
        cell = ws.cell(hdr_row, col)
        cell.font      = Font(bold=True, color='FFFFFF')
        cell.fill      = PatternFill(fill_type='solid', fgColor='2F4F4F')
        cell.alignment = Alignment(horizontal='center')

    # ── Données ────────────────────────────────────────────────────────────────
    for r in sorted(rows_data, key=lambda x: STATUS_ORDER[x['status']]):
        bg, fg = COLOR_MAP[r['status']]
        ws.append([
            r['tracking'],
            r['osp'],
            r['adresse'],
            r['client'],
            STATUS_LABELS[r['status']],
            r['comment'],
        ])
        data_row = ws.max_row
        for col in range(1, 7):
            ws.cell(data_row, col).fill = _fill(bg)
            ws.cell(data_row, col).font = _font(fg)

    # ── Largeurs colonnes ──────────────────────────────────────────────────────
    for i, w in enumerate([26, 10, 45, 32, 20, 22], 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue(), summary


# ─── Point d'entrée principal ─────────────────────────────────────────────────

def process_lbd(
    lbd_path: str,
    scanning_path: Optional[str],
    kc_j_path: Optional[str],
    kc_j1_path: Optional[str],
    future_path: Optional[str],
    target_date_str: str,
    output_path: Optional[str] = None,
) -> dict:
    """
    Traite les fichiers LBD pour la date cible.
    Retourne {'summary': {...}, 'excel_bytes': bytes}.
    """
    target_date = datetime.strptime(target_date_str, '%Y-%m-%d')

    packages = _load_lbd(lbd_path, target_date)
    scanning = _load_scanning(scanning_path)
    _load_kc(kc_j_path)          # KC J chargé pour usage futur
    kc_j1    = _load_kc(kc_j1_path)
    future   = _load_future(future_path)

    excel_bytes, summary = build_excel(packages, scanning, kc_j1, future, target_date)

    if output_path:
        out_dir = os.path.dirname(output_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(excel_bytes)

    return {'summary': summary, 'excel_bytes': excel_bytes}


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    BASE    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    HAKIM   = os.path.join(BASE, 'samples', 'hakim')
    OUTPUTS = os.path.join(BASE, 'outputs')
    os.makedirs(OUTPUTS, exist_ok=True)

    target = sys.argv[1] if len(sys.argv) > 1 else '2026-07-23'

    result = process_lbd(
        lbd_path        = os.path.join(HAKIM, 'LBD  22-230726.xlsx'),
        scanning_path   = os.path.join(HAKIM, 'SCANNING 240726.xlsx'),
        kc_j_path       = os.path.join(HAKIM, 'KC 230726.xlsx'),
        kc_j1_path      = os.path.join(HAKIM, 'KC 240726.xlsx'),
        future_path     = os.path.join(HAKIM, 'Future summer 2026.xlsx'),
        target_date_str = target,
        output_path     = os.path.join(OUTPUTS, f'LBD_rapport_{target}.xlsx'),
    )

    s = result['summary']
    print(f"\n{'='*52}")
    print(f"  RÉSUMÉ LBD MD3449 — {target}")
    print(f"{'='*52}")
    print(f"  Total  : {s['total']}")
    print(f"  VERT   : {s['vert']:>3}  — {STATUS_LABELS['vert']}")
    print(f"  JAUNE  : {s['jaune']:>3}  — {STATUS_LABELS['jaune']}")
    print(f"  ROUGE  : {s['rouge']:>3}  — {STATUS_LABELS['rouge']}")
    print(f"  GRIS   : {s['gris']:>3}  — {STATUS_LABELS['gris']}")
    print(f"{'='*52}")
    print(f"  Rapport → outputs/LBD_rapport_{target}.xlsx")
