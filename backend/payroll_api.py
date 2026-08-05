#!/usr/bin/env python3
"""
MD-Logistique — Payroll API (FastAPI)
POST /api/payroll/generate
GET  /api/payroll/download/{filename}
"""

import os
import sys
import json
import shutil
import zipfile
import tempfile
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Rendre le dossier scripts/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
from process_payroll import (
    driver_name_from_file,
    read_webfleet,
    calculate_day,
    find_driver_base_row,
    write_driver_block,
    generate_recap,
    load_wb,
)
from datetime import date
from collections import defaultdict

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="MD-Logistique Payroll API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
SAMPLES_DIR = os.path.join(BASE_DIR, 'samples')
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _load_config() -> dict:
    cfg_path = os.path.join(BASE_DIR, 'documents', 'config.json')
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            return json.load(f)
    return {'adresses_clients': [], 'domiciles_conducteurs': {}, 'rayon_domicile_km': 2.0}


def _process_one(wf_tmp_path: str, cp140_path: str, config: dict, month: int, year: int) -> dict:
    """Traite un fichier Webfleet et retourne le résumé conducteur."""
    from process_payroll import h

    name = driver_name_from_file(wf_tmp_path)
    activities = read_webfleet(wf_tmp_path)

    days_map = defaultdict(list)
    for act in activities:
        if act['debut']:
            days_map[act['debut'].date()].append(act)

    import calendar
    nb_days = calendar.monthrange(year, month)[1]
    day_results = []
    for d in range(1, nb_days + 1):
        dd = date(year, month, d)
        dr = calculate_day(dd, days_map.get(dd, []), config)
        day_results.append(dr)

    # Écriture CP140
    wb = load_wb(cp140_path)
    ws = wb['Etat de prestation']
    base_row = find_driver_base_row(ws, name)
    driver_found = base_row != -1
    if driver_found:
        write_driver_block(ws, base_row, day_results)
        wb.save(cp140_path)

    # Récap Excel
    slug = os.path.splitext(os.path.basename(wf_tmp_path))[0]
    recap_path = os.path.join(OUTPUTS_DIR, f'recap_{slug}.xlsx')
    totals = generate_recap(name, day_results, recap_path)

    all_anomalies = [
        f"{dr['date'].strftime('%d/%m')} : {a}"
        for dr in day_results
        for a in dr['anomalies']
    ]

    return {
        'nom':                   name,
        'driver_found':          driver_found,
        'jours_travailles':      totals['jours_travailles'],
        'total_heures_travail':  totals['total_travail_h'],
        'total_heures_service':  totals['total_service_h'],
        'anomalies':             all_anomalies,
        'status':                'ok' if driver_found else 'driver_not_found',
        'recap_file':            os.path.basename(recap_path),
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.post("/api/payroll/generate")
async def generate_payroll(
    webfleet_files: List[UploadFile] = File(...),
    mois:           int              = Form(5),
    annee:          int              = Form(2026),
    cp140_template: UploadFile       = File(None),
):
    """
    Génère le CP140 rempli et les récapitulatifs pour une liste de fichiers Webfleet.
    Retourne un résumé JSON + URLs de téléchargement.
    """
    config = _load_config()

    # CP140 template : utilisé le fichier uploadé ou le template par défaut
    with tempfile.TemporaryDirectory() as tmp_dir:
        if cp140_template and cp140_template.filename:
            cp140_tmp = os.path.join(tmp_dir, 'template.xlsx')
            content = await cp140_template.read()
            with open(cp140_tmp, 'wb') as f:
                f.write(content)
        else:
            cp140_default = os.path.join(SAMPLES_DIR, 'alex', 'PC140_991163 01-05-2026 - 31-05-2026.xlsx')
            if not os.path.exists(cp140_default):
                raise HTTPException(400, "Aucun template CP140 fourni et template par défaut introuvable.")
            cp140_tmp = cp140_default

        # Copie de travail
        cp140_out_name = f'CP140_rempli_{annee}_{mois:02d}.xlsx'
        cp140_out = os.path.join(OUTPUTS_DIR, cp140_out_name)
        shutil.copy2(cp140_tmp, cp140_out)

        # Traiter chaque fichier Webfleet
        results = []
        recap_files = []

        for upload in webfleet_files:
            wf_tmp = os.path.join(tmp_dir, upload.filename)
            content = await upload.read()
            with open(wf_tmp, 'wb') as f:
                f.write(content)

            result = _process_one(wf_tmp, cp140_out, config, mois, annee)
            results.append(result)
            if result.get('recap_file'):
                recap_files.append(result['recap_file'])

        # Archive ZIP des récaps
        recaps_zip_name = f'recaps_{annee}_{mois:02d}.zip'
        recaps_zip_path = os.path.join(OUTPUTS_DIR, recaps_zip_name)
        with zipfile.ZipFile(recaps_zip_path, 'w') as zf:
            for rf in recap_files:
                rf_path = os.path.join(OUTPUTS_DIR, rf)
                if os.path.exists(rf_path):
                    zf.write(rf_path, rf)

    return {
        'conducteurs':  results,
        'cp140_url':    f'/api/payroll/download/{cp140_out_name}',
        'recaps_url':   f'/api/payroll/download/{recaps_zip_name}',
        'mois':         mois,
        'annee':        annee,
    }


@app.get("/api/payroll/download/{filename}")
async def download_file(filename: str):
    """Télécharge un fichier généré (CP140 ou ZIP récaps)."""
    # Sécurité : pas de traversée de répertoire
    safe_name = os.path.basename(filename)
    file_path = os.path.join(OUTPUTS_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(404, f"Fichier '{safe_name}' introuvable.")
    return FileResponse(
        file_path,
        filename=safe_name,
        media_type='application/octet-stream',
    )


@app.get("/api/payroll/health")
async def health():
    return {"status": "ok", "service": "payroll"}


# ─── Module A — LBD Tracking (Abdelhakim) ────────────────────────────────────

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))
from process_lbd import process_lbd, filter_lbd_md3449, STATUS_LABELS

HAKIM_DIR = os.path.join(BASE_DIR, 'samples', 'hakim')


@app.post("/api/lbd/process")
async def lbd_process(
    lbd_file:          UploadFile       = File(...),
    scanning_j_files:  List[UploadFile] = File(default=[]),
    scanning_j1_files: List[UploadFile] = File(...),
    retour_files:      List[UploadFile] = File(...),
    kc_files:          List[UploadFile] = File(default=[]),
    future_file:       UploadFile       = File(...),
    target_date:       str              = Form(...),
):
    """
    scanning_j_files  : SCANNING jour J (livraison) — optionnel.
    scanning_j1_files : SCANNING jour J+1 (retours tour complet).
    retour_files      : Retours chariot chauffeur.
    """
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:

        async def save(upload: UploadFile, name: str) -> str:
            path = os.path.join(tmp, name)
            with open(path, 'wb') as f:
                f.write(await upload.read())
            return path

        lbd_path    = await save(lbd_file,    'lbd.xlsx')
        future_path = await save(future_file, 'future.xlsx')
        scanning_j_paths  = [await save(f, f'scanj_{i}.xlsx')  for i, f in enumerate(scanning_j_files)]
        scanning_j1_paths = [await save(f, f'scanj1_{i}.xlsx') for i, f in enumerate(scanning_j1_files)]
        retour_paths      = [await save(f, f'retour_{i}.xlsx') for i, f in enumerate(retour_files)]
        kc_paths          = [await save(f, f'kc_{i}.xlsx')     for i, f in enumerate(kc_files)]

        out_name = f"LBD_rapport_{target_date}.xlsx"
        out_path = os.path.join(OUTPUTS_DIR, out_name)

        try:
            result = process_lbd(
                lbd_path          = lbd_path,
                scanning_j_paths  = scanning_j_paths,
                scanning_j1_paths = scanning_j1_paths,
                retour_paths      = retour_paths,
                kc_paths          = kc_paths,
                future_path       = future_path,
                target_date_str   = target_date,
                output_path       = out_path,
            )
        except ValueError as e:
            raise HTTPException(400, str(e))

    rows = [
        {
            'tracking':    r['tracking'],
            'statut':      STATUS_LABELS[r['status']],
            'client':      r['client'],
            'adresse':     r['adresse'],
            'commentaire': r['comment'],
        }
        for r in result.get('rows', [])
    ]

    summary = result['summary']
    return {
        'summary':      summary,
        'rows':         rows,
        'download_url': f'/api/lbd/download/{out_name}',
        'target_date':  target_date,
    }


@app.get("/api/lbd/download/{filename}")
async def lbd_download(filename: str):
    safe = os.path.basename(filename)
    path = os.path.join(OUTPUTS_DIR, safe)
    if not os.path.exists(path):
        raise HTTPException(404, f"Fichier '{safe}' introuvable.")
    return FileResponse(path, filename=safe, media_type='application/octet-stream')


@app.post("/api/lbd/filter")
async def lbd_filter(lbd_file: UploadFile = File(...)):
    """Filtre le LBD pour ne garder que MD3449, en préservant les dropdowns."""
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'lbd.xlsx')
        with open(path, 'wb') as f:
            f.write(await lbd_file.read())
        try:
            excel_bytes = filter_lbd_md3449(path)
        except Exception as e:
            raise HTTPException(400, str(e))

    out_name = f"LBD_MD3449_filtre.xlsx"
    out_path = os.path.join(OUTPUTS_DIR, out_name)
    with open(out_path, 'wb') as f:
        f.write(excel_bytes)

    return FileResponse(
        out_path,
        filename=out_name,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


@app.get("/api/lbd/health")
async def lbd_health():
    return {"status": "ok", "service": "lbd"}


# ─── Module GPS Analysis ──────────────────────────────────────────────────────

from process_gps import process_gps

@app.post("/api/gps/process")
async def gps_process(
    gps_file: UploadFile = File(...),
    geocode:  str        = Form(default='false'),
):
    import tempfile
    do_geocode = geocode.lower() == 'true'

    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'gps.xlsx')
        with open(path, 'wb') as f:
            f.write(await gps_file.read())

        out_name = 'GPS_rapport.xlsx'
        out_path = os.path.join(OUTPUTS_DIR, out_name)

        try:
            result = process_gps(path, output_path=out_path, geocode=do_geocode)
        except Exception as e:
            raise HTTPException(400, str(e))

    rows = [
        {
            'barcode':      r['barcode'],
            'driver':       r['driver'],
            'date':         str(r['date'])[:10] if r['date'] else '',
            'commit_time':  r['commit_time'],
            'actual_time':  r['actual_time'],
            'is_late':      r['is_late'],
            'is_express':   r['is_express'],
            'status':       r['status'],
            'street':       r['street'],
            'city':         r['city'],
            'postal':       r['postal'],
            'consignee':    r['consignee'],
            'seq':          r['seq'],
            'loop':         r['loop'],
            'gps_lat':      str(r['gps_lat']) if r['gps_lat'] else '',
            'gps_lon':      str(r['gps_lon']) if r['gps_lon'] else '',
            'dist_m':       round(r['dist_m'], 1) if r['dist_m'] is not None else None,
            'streetview':   r['streetview'],
            'route':        r['route'],
        }
        for r in result['rows']
    ]

    return {
        'summary':      result['summary'],
        'rows':         rows,
        'download_url': f'/api/gps/download/{out_name}',
    }


@app.get("/api/gps/download/{filename}")
async def gps_download(filename: str):
    safe = os.path.basename(filename)
    path = os.path.join(OUTPUTS_DIR, safe)
    if not os.path.exists(path):
        raise HTTPException(404, f"Fichier '{safe}' introuvable.")
    return FileResponse(path, filename=safe, media_type='application/octet-stream')


@app.get("/api/gps/health")
async def gps_health():
    return {"status": "ok", "service": "gps"}


# ─── Frontend statique ────────────────────────────────────────────────────────

FRONTEND_DIST = os.path.join(BASE_DIR, 'frontend', 'dist')
if os.path.isdir(FRONTEND_DIST):
    from fastapi.responses import HTMLResponse

    app.mount('/assets', StaticFiles(directory=os.path.join(FRONTEND_DIST, 'assets')), name='assets')

    @app.get('/{full_path:path}', include_in_schema=False)
    async def serve_spa(full_path: str):
        index = os.path.join(FRONTEND_DIST, 'index.html')
        with open(index) as f:
            return HTMLResponse(f.read())


# ─── Lancement ────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
