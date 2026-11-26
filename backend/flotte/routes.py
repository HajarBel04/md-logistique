"""API /api/flotte : véhicules, chauffeurs, documents, échéances, alertes, messagerie, paramètres."""
import asyncio
import logging
import re
import secrets
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from . import compliance as C
import os

from .db import IS_SQLITE, Base, SessionLocal, engine, get_db
from .models import (
    ADR_VEHICLES, DOC_SLOTS, DRIVER_STATUTS, DRIVER_TYPES, MOTORISES, PERMIS_CATEGORIES,
    VEHICLE_CATEGORIES, AppSetting, ComplianceAlert, Driver, DriverDocument, Message,
    StoredFile, Vehicle,
)
from .notify import send_digest, smtp_configured
from .seed import seed_if_empty, seed_refs_if_empty

log = logging.getLogger('flotte')
router = APIRouter(prefix='/api/flotte', tags=['flotte'])

MAX_UPLOAD = 15 * 1024 * 1024
ALLOWED_MIME = {'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'}

SLOT_LABELS = {
    'CARTE_IDENTITE': "Carte d'identité / Séjour",
    'PERMIS_CONDUIRE': 'Permis de conduire',
    'CARTE_CHAUFFEUR': 'Carte conducteur (tachygraphe)',
    'SELECTION_MEDICALE': 'Sélection médicale',
    'CERTIFICAT_ADR': 'Certificat ADR',
    'FICHE_SIGNALETIQUE': 'Fiche signalétique',
    'CONTRAT_TRAVAIL': 'Contrat de travail',
    'DIMONA': 'Déclaration DIMONA',
    'CARTE_BANCAIRE': 'Carte bancaire / RIB',
    'BADGE_KOLN': 'Badge Köln',
    'ATTESTATION_CONDUCTEUR': 'Attestation conducteur',
}
CARD_SLOTS = {'CARTE_IDENTITE', 'PERMIS_CONDUIRE', 'CARTE_CHAUFFEUR', 'CARTE_BANCAIRE'}

# Type d'échéance → document justificatif
DOC_TYPE_SLOT = {
    'PERMIS': 'PERMIS_CONDUIRE',
    'CODE_95': 'PERMIS_CONDUIRE',
    'SELECTION_MEDICALE': 'SELECTION_MEDICALE',
    'CARTE_CONDUCTEUR': 'CARTE_CHAUFFEUR',
    'ADR_CHAUFFEUR': 'CERTIFICAT_ADR',
    'BADGE_KOLN': 'BADGE_KOLN',
    'ATTESTATION_CONDUCTEUR': 'ATTESTATION_CONDUCTEUR',
    'CARTE_IDENTITE': 'CARTE_IDENTITE',
}
VEHICLE_DATE_FIELDS = {
    'CONTROLE_TECHNIQUE': 'controle_technique_expiration',
    'ETALONNAGE_TACHYGRAPHE': 'etalonnage_tachygraphe_expiration',
    'CERTIFICAT_ADR_VEHICULE': 'certificat_adr_expiration',
    'ASSURANCE': 'assurance_expiration',
}
DRIVER_DATE_FIELDS = {
    'PERMIS': 'permis_expiration',
    'SELECTION_MEDICALE': 'selection_medicale_expiration',
    'CODE_95': 'code95_expiration',
    'CARTE_CONDUCTEUR': 'carte_conducteur_expiration',
    'ADR_CHAUFFEUR': 'adr_certificat_expiration',
    'CARTE_IDENTITE': 'cin_expiration',
    'BADGE_KOLN': 'badge_koln_expiration',
    'ATTESTATION_CONDUCTEUR': 'attestation_conducteur_expiration',
}

# camelCase (API) → (attribut, type)
VEHICLE_FIELDS = {
    'plaque': ('plaque', 'plaque'),
    'categorie': ('categorie', 'categorie'),
    'controleTechniqueExpiration': ('controle_technique_expiration', 'date'),
    'etalonnageTachygrapheExpiration': ('etalonnage_tachygraphe_expiration', 'date'),
    'certificatAdrExpiration': ('certificat_adr_expiration', 'date'),
    'assuranceExpiration': ('assurance_expiration', 'date'),
    'assuranceCompagnie': ('assurance_compagnie', 'str'),
    'assurancePolice': ('assurance_police', 'str'),
    'assuranceRemarque': ('assurance_remarque', 'text'),
    'remarque': ('remarque', 'text'),
    'typeVehiculeId': ('type_vehicule_id', 'ref_id'),
    'carburant': ('carburant', 'str'),
    'consommation': ('consommation', 'float'),
}
DRIVER_FIELDS = {
    'nom': ('nom', 'nom'),
    'prenom': ('prenom', 'str_req'),
    'dateNaissance': ('date_naissance', 'date'),
    'telephone': ('telephone', 'str'),
    'email': ('email', 'str'),
    'statut': ('statut', 'statut'),
    'typeChauffeur': ('type_chauffeur', 'type_chauffeur'),
    'permisNumero': ('permis_numero', 'str'),
    'permisCategories': ('permis_categories', 'permis_cats'),
    'permisExpiration': ('permis_expiration', 'date'),
    'selectionMedicaleExpiration': ('selection_medicale_expiration', 'date'),
    'code95Expiration': ('code95_expiration', 'date'),
    'carteConducteurNumero': ('carte_conducteur_numero', 'str'),
    'carteConducteurExpiration': ('carte_conducteur_expiration', 'date'),
    'adrCertificatExpiration': ('adr_certificat_expiration', 'date'),
    'adrCategories': ('adr_categories', 'list'),
    'adresse': ('adresse', 'text'),
    'cinNumero': ('cin_numero', 'str'),
    'cinExpiration': ('cin_expiration', 'date'),
    'permisDelivrance': ('permis_delivrance', 'date'),
    'carteConducteurDelivrance': ('carte_conducteur_delivrance', 'date'),
    'adrNumero': ('adr_numero', 'str'),
    'badgeKolnExpiration': ('badge_koln_expiration', 'date'),
    'attestationConducteurExpiration': ('attestation_conducteur_expiration', 'date'),
}


# ─── Conversion / validation ─────────────────────────────────────────────────

def _bad(msg: str):
    raise HTTPException(status_code=400, detail=msg)


def _convert(kind: str, value, label: str):
    if kind == 'date':
        if value in (None, ''):
            return None
        try:
            return date.fromisoformat(str(value)[:10])
        except ValueError:
            _bad(f'Date invalide pour « {label} ».')
    if kind in ('str', 'text'):
        if value is None:
            return None
        v = str(value).strip()
        return (v[:5000] if kind == 'text' else v[:200]) or None
    if kind == 'str_req':
        return str(value or '').strip()[:120]
    if kind == 'nom':
        v = str(value or '').strip().upper()
        if not v:
            _bad('Le nom est obligatoire.')
        return v[:120]
    if kind == 'plaque':
        v = re.sub(r'[\s\-.]', '', str(value or '')).upper()
        if not re.fullmatch(r'[A-Z0-9]{3,12}', v):
            _bad('Plaque invalide (lettres et chiffres uniquement, ex. 1XTP669).')
        return v
    if kind == 'categorie':
        if value not in VEHICLE_CATEGORIES:
            _bad('Catégorie de véhicule inconnue.')
        return value
    if kind == 'statut':
        if value not in DRIVER_STATUTS:
            _bad('Statut chauffeur inconnu.')
        return value
    if kind == 'type_chauffeur':
        if value not in DRIVER_TYPES:
            _bad('Type de chauffeur inconnu.')
        return value
    if kind == 'permis_cats':
        cats = [c for c in (value or []) if c in PERMIS_CATEGORIES]
        return [c for c in PERMIS_CATEGORIES if c in cats]
    if kind == 'ref_id':
        return value or None
    if kind == 'float':
        if value in (None, ''):
            return None
        try:
            return float(str(value).replace(',', '.'))
        except ValueError:
            _bad(f'« {label} » doit être un nombre.')
    if kind == 'list':
        return [str(x).strip()[:40] for x in (value or []) if str(x).strip()][:20]
    raise ValueError(kind)


def _apply(obj, payload: dict, fields: dict):
    for key, value in payload.items():
        if key in fields:
            attr, kind = fields[key]
            setattr(obj, attr, _convert(kind, value, key))


def _iso(d):
    return d.isoformat() if d else None


def _utc(dt):
    """Datetime UTC naïf → ISO avec « Z » (le navigateur le convertit en heure locale)."""
    return dt.isoformat() + 'Z' if dt else None


def _file_meta(f: StoredFile | None):
    if not f:
        return None
    return {'id': f.id, 'filename': f.filename, 'mimeType': f.mime_type, 'size': f.size,
            'url': f'/api/flotte/files/{f.id}'}


async def _read_upload(file: UploadFile) -> StoredFile:
    data = await file.read()
    if not data:
        _bad('Fichier vide.')
    if len(data) > MAX_UPLOAD:
        _bad('Fichier trop volumineux (15 Mo maximum).')
    mime = (file.content_type or '').lower()
    if mime == 'image/jpg':
        mime = 'image/jpeg'
    if mime not in ALLOWED_MIME:
        _bad('Format non accepté : PDF, PNG, JPEG ou WEBP uniquement.')
    name = re.sub(r'[^\w.\- ()À-ÿ]', '_', file.filename or 'document')[:200]
    return StoredFile(filename=name, mime_type=mime, size=len(data), data=data)


# ─── Sérialisation ───────────────────────────────────────────────────────────

def vehicle_out(v: Vehicle, settings: dict, ref: date) -> dict:
    items = C.vehicle_items(v, settings, ref)
    return {
        'id': v.id,
        'plaque': v.plaque,
        'categorie': v.categorie,
        'controleTechniqueExpiration': _iso(v.controle_technique_expiration),
        'etalonnageTachygrapheExpiration': _iso(v.etalonnage_tachygraphe_expiration),
        'certificatAdrExpiration': _iso(v.certificat_adr_expiration),
        'assuranceExpiration': _iso(v.assurance_expiration),
        'assuranceCompagnie': v.assurance_compagnie,
        'assurancePolice': v.assurance_police,
        'assuranceRemarque': v.assurance_remarque,
        'assuranceDocument': _file_meta(v.assurance_file),
        'remarque': v.remarque,
        'typeVehiculeId': v.type_vehicule_id,
        'carburant': v.carburant,
        'consommation': v.consommation,
        'updatedAt': _utc(v.updated_at),
        'compliance': items,
        'status': C.worst_status(items),
    }


def required_slots(d: Driver) -> list[str]:
    pl = d.type_chauffeur == 'POIDS_LOURD'
    slots = ['CARTE_IDENTITE', 'PERMIS_CONDUIRE']
    if pl:
        slots += ['CARTE_CHAUFFEUR', 'SELECTION_MEDICALE']
    if d.adr_categories or d.adr_certificat_expiration:
        slots.append('CERTIFICAT_ADR')
    slots += ['FICHE_SIGNALETIQUE', 'CONTRAT_TRAVAIL', 'DIMONA', 'CARTE_BANCAIRE']
    return slots


def driver_out(d: Driver, settings: dict, ref: date, unread: int = 0, full: bool = False) -> dict:
    items = C.driver_items(d, settings, ref)
    docs = {doc.slot_type: doc for doc in d.documents}
    req = required_slots(d)
    out = {
        'id': d.id,
        'nom': d.nom,
        'prenom': d.prenom,
        'nomComplet': C.driver_label(d),
        'dateNaissance': _iso(d.date_naissance),
        'telephone': d.telephone,
        'email': d.email,
        'statut': d.statut,
        'typeChauffeur': d.type_chauffeur,
        'permisNumero': d.permis_numero,
        'permisCategories': d.permis_categories or [],
        'permisExpiration': _iso(d.permis_expiration),
        'selectionMedicaleExpiration': _iso(d.selection_medicale_expiration),
        'code95Expiration': _iso(d.code95_expiration),
        'carteConducteurNumero': d.carte_conducteur_numero,
        'carteConducteurExpiration': _iso(d.carte_conducteur_expiration),
        'adrCertificatExpiration': _iso(d.adr_certificat_expiration),
        'adrCategories': d.adr_categories or [],
        'adresse': d.adresse,
        'cinNumero': d.cin_numero,
        'cinExpiration': _iso(d.cin_expiration),
        'permisDelivrance': _iso(d.permis_delivrance),
        'carteConducteurDelivrance': _iso(d.carte_conducteur_delivrance),
        'adrNumero': d.adr_numero,
        'badgeKolnExpiration': _iso(d.badge_koln_expiration),
        'attestationConducteurExpiration': _iso(d.attestation_conducteur_expiration),
        'compliance': items,
        'status': C.worst_status(items) if d.statut != 'INACTIF' else 'na',
        'documentsRequired': req,
        'documentsPresent': [s for s in DOC_SLOTS if s in docs],
        'documentsCount': sum(1 for s in req if s in docs),
        'documentsTotal': len(req),
        'unreadMessages': unread,
    }
    if full:
        out['accessToken'] = d.access_token
        out['documents'] = {
            slot: {
                'slotType': slot,
                'label': SLOT_LABELS[slot],
                'isCroppedAndFormatted': doc.is_cropped_and_formatted,
                'uploadedByDriver': doc.uploaded_by_driver,
                'verifiedAt': _utc(doc.verified_at),
                'uploadedAt': _utc(doc.uploaded_at),
                'file': _file_meta(doc.file),
            }
            for slot, doc in docs.items()
        }
    return out


def _alert_out(a: ComplianceAlert) -> dict:
    return {
        'id': a.id, 'entityType': a.entity_type, 'entityId': a.entity_id,
        'targetLabel': a.target_label, 'documentType': a.document_type,
        'documentLabel': C.DOC_LABELS.get(a.document_type, a.document_type),
        'expirationDate': a.expiration_date.isoformat(), 'daysRemaining': a.days_remaining,
        'severity': a.severity, 'status': a.status, 'snoozedUntil': _iso(a.snoozed_until),
    }


def _message_out(m: Message) -> dict:
    return {
        'id': m.id, 'driverId': m.driver_id, 'sender': m.sender, 'body': m.body,
        'attachment': _file_meta(m.attachment),
        'readAt': _utc(m.read_at),
        'createdAt': _utc(m.created_at),
    }


def _get_vehicle(db: Session, vid: str) -> Vehicle:
    v = db.get(Vehicle, vid)
    if not v:
        raise HTTPException(404, 'Véhicule introuvable.')
    return v


def _get_driver(db: Session, did: str) -> Driver:
    d = db.scalars(
        select(Driver).where(Driver.id == did)
        .options(selectinload(Driver.documents).selectinload(DriverDocument.file))
    ).first()
    if not d:
        raise HTTPException(404, 'Chauffeur introuvable.')
    return d


def _unread_by_driver(db: Session) -> dict[str, int]:
    rows = db.execute(
        select(Message.driver_id, func.count())
        .where(Message.sender == 'CHAUFFEUR', Message.read_at.is_(None))
        .group_by(Message.driver_id)
    ).all()
    return {r[0]: r[1] for r in rows}


# ─── Métadonnées ─────────────────────────────────────────────────────────────

@router.get('/meta')
def meta():
    return {
        'vehicleCategories': VEHICLE_CATEGORIES,
        'motorises': sorted(MOTORISES),
        'adrVehicles': sorted(ADR_VEHICLES),
        'driverStatuts': DRIVER_STATUTS,
        'driverTypes': DRIVER_TYPES,
        'permisCategories': PERMIS_CATEGORIES,
        'slots': [{'key': s, 'label': SLOT_LABELS[s], 'card': s in CARD_SLOTS} for s in DOC_SLOTS],
        'docLabels': C.DOC_LABELS,
        'docTypeSlot': DOC_TYPE_SLOT,
    }


# ─── Fichiers ────────────────────────────────────────────────────────────────

@router.get('/files/{file_id}')
def get_file(file_id: str, request: Request, download: bool = False, db: Session = Depends(get_db)):
    from .exploitation import file_access_guard
    file_access_guard(request, db, file_id)
    return _file_response(db, file_id, download)


def _file_response(db: Session, file_id: str, download: bool = False):
    f = db.get(StoredFile, file_id)
    if not f:
        raise HTTPException(404, 'Fichier introuvable.')
    disp = 'attachment' if download else 'inline'
    safe = f.filename.encode('ascii', 'ignore').decode() or 'document'
    return Response(
        content=f.data, media_type=f.mime_type,
        headers={'Content-Disposition': f'{disp}; filename="{safe}"',
                 'Cache-Control': 'private, max-age=3600'},
    )


# ─── Véhicules ───────────────────────────────────────────────────────────────

def _vehicles_query():
    return select(Vehicle).options(selectinload(Vehicle.assurance_file)).order_by(Vehicle.categorie, Vehicle.plaque)


@router.get('/vehicles')
def list_vehicles(db: Session = Depends(get_db)):
    s, ref = C.get_settings(db), C.today()
    return [vehicle_out(v, s, ref) for v in db.scalars(_vehicles_query())]


@router.get('/vehicles/{vid}')
def get_vehicle(vid: str, db: Session = Depends(get_db)):
    return vehicle_out(_get_vehicle(db, vid), C.get_settings(db), C.today())


@router.post('/vehicles', status_code=201)
def create_vehicle(payload: dict, db: Session = Depends(get_db)):
    if not payload.get('plaque') or not payload.get('categorie'):
        _bad('Plaque et catégorie obligatoires.')
    v = Vehicle()
    _apply(v, payload, VEHICLE_FIELDS)
    db.add(v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        _bad(f'La plaque {v.plaque} existe déjà.')
    C.sync_alerts(db)
    return vehicle_out(v, C.get_settings(db), C.today())


@router.patch('/vehicles/{vid}')
def update_vehicle(vid: str, payload: dict, db: Session = Depends(get_db)):
    v = _get_vehicle(db, vid)
    _apply(v, payload, VEHICLE_FIELDS)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        _bad('Cette plaque est déjà utilisée par un autre véhicule.')
    C.sync_alerts(db)
    return vehicle_out(v, C.get_settings(db), C.today())


@router.delete('/vehicles/{vid}', status_code=204)
def delete_vehicle(vid: str, db: Session = Depends(get_db)):
    v = _get_vehicle(db, vid)
    file_id = v.assurance_file_id
    db.delete(v)
    db.commit()
    if file_id and (f := db.get(StoredFile, file_id)):
        db.delete(f)
        db.commit()
    C.sync_alerts(db)


@router.post('/vehicles/{vid}/assurance')
async def upload_vehicle_insurance(vid: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    v = _get_vehicle(db, vid)
    stored = await _read_upload(file)
    old = v.assurance_file_id
    db.add(stored)
    db.flush()
    v.assurance_file_id = stored.id
    db.commit()
    if old and (f := db.get(StoredFile, old)):
        db.delete(f)
        db.commit()
    return vehicle_out(v, C.get_settings(db), C.today())


@router.delete('/vehicles/{vid}/assurance')
def delete_vehicle_insurance(vid: str, db: Session = Depends(get_db)):
    v = _get_vehicle(db, vid)
    old = v.assurance_file_id
    v.assurance_file_id = None
    db.commit()
    if old and (f := db.get(StoredFile, old)):
        db.delete(f)
        db.commit()
    return vehicle_out(v, C.get_settings(db), C.today())


# ─── Chauffeurs ──────────────────────────────────────────────────────────────

@router.get('/drivers')
def list_drivers(db: Session = Depends(get_db)):
    s, ref = C.get_settings(db), C.today()
    unread = _unread_by_driver(db)
    q = select(Driver).options(selectinload(Driver.documents)).order_by(Driver.nom, Driver.prenom)
    return [driver_out(d, s, ref, unread.get(d.id, 0)) for d in db.scalars(q)]


@router.get('/drivers/{did}')
def get_driver(did: str, db: Session = Depends(get_db)):
    from .auth import user_out
    from .models import User
    d = _get_driver(db, did)
    out = driver_out(d, C.get_settings(db), C.today(), _unread_by_driver(db).get(d.id, 0), full=True)
    account = db.scalars(select(User).where(User.driver_id == d.id)).first()
    out['account'] = user_out(account) if account else None
    return out


@router.post('/drivers', status_code=201)
def create_driver(payload: dict, db: Session = Depends(get_db)):
    d = Driver(permis_categories=[], adr_categories=[])
    _apply(d, payload, DRIVER_FIELDS)
    if not d.nom:
        _bad('Le nom est obligatoire.')
    db.add(d)
    db.commit()
    C.sync_alerts(db)
    return get_driver(d.id, db)


@router.patch('/drivers/{did}')
def update_driver(did: str, payload: dict, db: Session = Depends(get_db)):
    d = _get_driver(db, did)
    _apply(d, payload, DRIVER_FIELDS)
    db.commit()
    C.sync_alerts(db)
    return get_driver(did, db)


@router.delete('/drivers/{did}', status_code=204)
def delete_driver(did: str, db: Session = Depends(get_db)):
    d = _get_driver(db, did)
    file_ids = [doc.file_id for doc in d.documents]
    file_ids += [m.attachment_file_id for m in d.messages if m.attachment_file_id]
    db.delete(d)
    db.commit()
    for fid in file_ids:
        if f := db.get(StoredFile, fid):
            db.delete(f)
    db.commit()
    C.sync_alerts(db)


@router.post('/drivers/{did}/token')
def regenerate_token(did: str, db: Session = Depends(get_db)):
    d = _get_driver(db, did)
    d.access_token = secrets.token_urlsafe(24)
    db.commit()
    return {'accessToken': d.access_token}


@router.post('/drivers/{did}/documents/{slot}')
async def upload_driver_document(
    did: str, slot: str,
    file: UploadFile = File(...),
    cropped: bool = Form(False),
    db: Session = Depends(get_db),
):
    if slot not in DOC_SLOTS:
        _bad('Emplacement de document inconnu.')
    d = _get_driver(db, did)
    stored = await _read_upload(file)
    db.add(stored)
    db.flush()
    existing = next((doc for doc in d.documents if doc.slot_type == slot), None)
    old_file = None
    if existing:
        old_file = existing.file_id
        existing.file_id = stored.id
        existing.is_cropped_and_formatted = cropped
        existing.uploaded_at = datetime.utcnow()
    else:
        db.add(DriverDocument(driver_id=d.id, slot_type=slot, file_id=stored.id,
                              is_cropped_and_formatted=cropped))
    db.commit()
    if old_file and (f := db.get(StoredFile, old_file)):
        db.delete(f)
        db.commit()
    db.expire_all()
    return get_driver(did, db)


@router.delete('/drivers/{did}/documents/{slot}')
def delete_driver_document(did: str, slot: str, db: Session = Depends(get_db)):
    d = _get_driver(db, did)
    doc = next((doc for doc in d.documents if doc.slot_type == slot), None)
    if not doc:
        raise HTTPException(404, 'Aucun document à cet emplacement.')
    fid = doc.file_id
    db.delete(doc)
    db.commit()
    if f := db.get(StoredFile, fid):
        db.delete(f)
        db.commit()
    db.expire_all()
    return get_driver(did, db)


# ─── Renouvellement rapide ───────────────────────────────────────────────────

@router.post('/renew')
def renew(payload: dict, db: Session = Depends(get_db)):
    entity, eid, doc_type = payload.get('entityType'), payload.get('entityId'), payload.get('docType')
    new_date = _convert('date', payload.get('date'), 'nouvelle date')
    if not new_date:
        _bad("Indiquez la nouvelle date d'expiration.")
    if entity == 'VEHICLE' and doc_type in VEHICLE_DATE_FIELDS:
        setattr(_get_vehicle(db, eid), VEHICLE_DATE_FIELDS[doc_type], new_date)
    elif entity == 'DRIVER' and doc_type in DRIVER_DATE_FIELDS:
        setattr(_get_driver(db, eid), DRIVER_DATE_FIELDS[doc_type], new_date)
    else:
        _bad('Échéance inconnue.')
    db.commit()
    C.sync_alerts(db)
    return {'ok': True}


# ─── Tableau de bord ─────────────────────────────────────────────────────────

MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
        'septembre', 'octobre', 'novembre', 'décembre']


@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db)):
    s, ref = C.get_settings(db), C.today()
    vehicles = list(db.scalars(_vehicles_query()))
    drivers = list(db.scalars(
        select(Driver).where(Driver.statut != 'INACTIF')
        .options(selectinload(Driver.documents))
    ))

    rows = []
    for v in vehicles:
        for it in C.vehicle_items(v, s, ref):
            if it['status'] in ('na', 'facultatif'):
                continue
            rows.append({
                **it, 'entityType': 'VEHICLE', 'entityId': v.id, 'name': v.plaque,
                'sub': v.categorie,
                'documentUrl': (f'/api/flotte/files/{v.assurance_file_id}'
                                if it['type'] == 'ASSURANCE' and v.assurance_file_id else None),
            })
    docs_complete = 0
    for d in drivers:
        docs = {doc.slot_type: doc for doc in d.documents}
        req = required_slots(d)
        if all(sl in docs for sl in req):
            docs_complete += 1
        for it in C.driver_items(d, s, ref):
            if it['status'] in ('na', 'facultatif'):
                continue
            slot = DOC_TYPE_SLOT.get(it['type'])
            doc = docs.get(slot) if slot else None
            rows.append({
                **it, 'entityType': 'DRIVER', 'entityId': d.id, 'name': C.driver_label(d),
                'sub': d.type_chauffeur,
                'documentUrl': f'/api/flotte/files/{doc.file_id}' if doc else None,
            })

    count = lambda st: sum(1 for r in rows if r['status'] == st)
    upcoming = sorted((r for r in rows if r['status'] in ('bientot', 'valide')
                       and 0 <= r['daysRemaining'] <= 90), key=lambda r: r['daysRemaining'])
    expired = sorted((r for r in rows if r['status'] == 'expire'), key=lambda r: r['daysRemaining'])
    missing = [r for r in rows if r['status'] == 'manquant']

    radar = []
    y, m = ref.year, ref.month
    for _ in range(4):
        bucket = [r for r in upcoming if r['date'][:7] == f'{y:04d}-{m:02d}']
        radar.append({'month': f'{y:04d}-{m:02d}', 'label': f'{MOIS[m - 1]} {y}',
                      'count': len(bucket),
                      'vehicles': sum(1 for r in bucket if r['entityType'] == 'VEHICLE'),
                      'drivers': sum(1 for r in bucket if r['entityType'] == 'DRIVER')})
        m += 1
        if m > 12:
            y, m = y + 1, 1

    unread = db.scalar(select(func.count()).select_from(Message)
                       .where(Message.sender == 'CHAUFFEUR', Message.read_at.is_(None)))
    return {
        'today': ref.isoformat(),
        # SQLite sur Railway = disque éphémère : tout serait perdu au prochain déploiement
        'ctSoon': sorted(
            [{'entityId': v.id, 'plaque': v.plaque, 'categorie': v.categorie,
              'date': v.controle_technique_expiration.isoformat(),
              'daysRemaining': (v.controle_technique_expiration - ref).days}
             for v in vehicles if v.controle_technique_expiration
             and 0 <= (v.controle_technique_expiration - ref).days <= 2],
            key=lambda x: x['daysRemaining']),
        'docsToVerify': db.scalar(select(func.count()).select_from(DriverDocument).where(
            DriverDocument.uploaded_by_driver.is_(True), DriverDocument.verified_at.is_(None))) or 0,
        'storageWarning': IS_SQLITE and bool(os.environ.get('RAILWAY_ENVIRONMENT')),
        'kpis': {
            'vehicles': len(vehicles),
            'drivers': len(drivers),
            'expired': count('expire'),
            'soon': count('bientot'),
            'missing': count('manquant'),
            'valid': count('valide'),
            'docsComplete': docs_complete,
            'unreadMessages': unread,
        },
        'expired': expired,
        'upcoming': upcoming,
        'missing': missing,
        'radar': radar,
    }


# ─── Alertes ─────────────────────────────────────────────────────────────────

@router.get('/alerts')
def list_alerts(status: str = 'ACTIVE', db: Session = Depends(get_db)):
    q = select(ComplianceAlert).order_by(ComplianceAlert.days_remaining)
    if status != 'ALL':
        q = q.where(ComplianceAlert.status == status)
    return [_alert_out(a) for a in db.scalars(q)]


@router.post('/alerts/sync')
def resync_alerts(db: Session = Depends(get_db)):
    return {'active': C.sync_alerts(db)}


@router.post('/alerts/{aid}/snooze')
def snooze_alert(aid: str, payload: dict, db: Session = Depends(get_db)):
    a = db.get(ComplianceAlert, aid)
    if not a:
        raise HTTPException(404, 'Alerte introuvable.')
    days = payload.get('days', 7)
    if not isinstance(days, int) or not 1 <= days <= 90:
        _bad('Durée de report invalide (1 à 90 jours).')
    a.status = 'SNOOZED'
    a.snoozed_until = C.today() + timedelta(days=days)
    db.commit()
    return _alert_out(a)


@router.post('/alerts/{aid}/reactivate')
def reactivate_alert(aid: str, db: Session = Depends(get_db)):
    a = db.get(ComplianceAlert, aid)
    if not a:
        raise HTTPException(404, 'Alerte introuvable.')
    if a.status == 'SNOOZED':
        a.status, a.snoozed_until = 'ACTIVE', None
        db.commit()
    return _alert_out(a)


# ─── Paramètres ──────────────────────────────────────────────────────────────

@router.get('/settings')
def get_settings_route(db: Session = Depends(get_db)):
    return {**C.get_settings(db), 'smtpConfigured': smtp_configured(), 'docLabels': C.DOC_LABELS}


@router.put('/settings')
def put_settings(payload: dict, db: Session = Depends(get_db)):
    C.save_settings(db, payload)
    C.sync_alerts(db)
    return get_settings_route(db)


@router.post('/settings/test-email')
def test_email(db: Session = Depends(get_db)):
    try:
        return send_digest(db, force=True)
    except Exception as e:  # noqa: BLE001 — message renvoyé à l'écran
        log.exception('Envoi email échoué')
        raise HTTPException(502, f"Échec de l'envoi : {e}")


# ─── Messagerie (côté bureau) ────────────────────────────────────────────────

@router.get('/conversations')
def conversations(db: Session = Depends(get_db)):
    unread = _unread_by_driver(db)
    last_rows = db.execute(
        select(Message.driver_id, func.max(Message.created_at)).group_by(Message.driver_id)
    ).all()
    last_at = {r[0]: r[1] for r in last_rows}
    out = []
    for d in db.scalars(select(Driver).order_by(Driver.nom)):
        last = None
        if d.id in last_at:
            m = db.scalars(select(Message).where(Message.driver_id == d.id)
                           .order_by(Message.created_at.desc()).limit(1)).first()
            last = {'body': m.body or ('📎 Pièce jointe' if m.attachment_file_id else ''),
                    'sender': m.sender, 'createdAt': _utc(m.created_at)}
        out.append({'driverId': d.id, 'nomComplet': C.driver_label(d), 'statut': d.statut,
                    'unread': unread.get(d.id, 0), 'last': last})
    out.sort(key=lambda c: (c['last'] is None, -(datetime.fromisoformat(c['last']['createdAt']).timestamp()
                                                 if c['last'] else 0), c['nomComplet']))
    return out


@router.get('/drivers/{did}/messages')
def driver_messages(did: str, db: Session = Depends(get_db)):
    d = _get_driver(db, did)
    now = datetime.utcnow()
    for m in d.messages:
        if m.sender == 'CHAUFFEUR' and m.read_at is None:
            m.read_at = now
    db.commit()
    return {'accessToken': d.access_token, 'messages': [_message_out(m) for m in d.messages]}


async def _post_message(db: Session, d: Driver, sender: str, body: str, file: UploadFile | None) -> Message:
    body = (body or '').strip()[:4000]
    stored = await _read_upload(file) if file and file.filename else None
    if not body and not stored:
        _bad('Message vide.')
    if stored:
        db.add(stored)
        db.flush()
    m = Message(driver_id=d.id, sender=sender, body=body,
                attachment_file_id=stored.id if stored else None)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.post('/drivers/{did}/messages', status_code=201)
async def send_admin_message(did: str, body: str = Form(''), file: UploadFile | None = File(None),
                             db: Session = Depends(get_db)):
    d = _get_driver(db, did)
    return _message_out(await _post_message(db, d, 'ADMIN', body, file))


# ─── Portail chauffeur (lien personnel, sans compte) ─────────────────────────

def _driver_by_token(db: Session, token: str) -> Driver:
    d = db.scalars(select(Driver).where(Driver.access_token == token)).first()
    if not d or d.statut == 'INACTIF':
        raise HTTPException(404, 'Lien invalide ou expiré.')
    return d


@router.get('/portail/{token}')
def portal(token: str, db: Session = Depends(get_db)):
    d = _driver_by_token(db, token)
    now = datetime.utcnow()
    for m in d.messages:
        if m.sender == 'ADMIN' and m.read_at is None:
            m.read_at = now
    db.commit()
    return {'prenom': d.prenom, 'nomComplet': C.driver_label(d),
            'messages': [_portal_message(token, m) for m in d.messages]}


def _portal_message(token: str, m: Message) -> dict:
    out = _message_out(m)
    if out['attachment']:
        out['attachment']['url'] = f"/api/flotte/portail/{token}/files/{m.attachment_file_id}"
    return out


@router.get('/portail/{token}/files/{file_id}')
def portal_file(token: str, file_id: str, db: Session = Depends(get_db)):
    d = _driver_by_token(db, token)
    if not any(m.attachment_file_id == file_id for m in d.messages):
        raise HTTPException(404, 'Fichier introuvable.')
    return _file_response(db, file_id)


@router.post('/portail/{token}/messages', status_code=201)
async def portal_send(token: str, body: str = Form(''), file: UploadFile | None = File(None),
                      db: Session = Depends(get_db)):
    d = _driver_by_token(db, token)
    return _portal_message(token, await _post_message(db, d, 'CHAUFFEUR', body, file))


# ─── Démarrage : tables, données initiales, tâche quotidienne ────────────────

def _daily_tick() -> None:
    db = SessionLocal()
    try:
        C.sync_alerts(db)
        settings = C.get_settings(db)
        email = settings['email']
        now = datetime.now(C.TZ)
        state = db.get(AppSetting, 'digest_state')
        last = (state.value or {}).get('lastSent') if state else None
        if email['enabled'] and now.hour >= email['hour'] and last != now.date().isoformat():
            result = send_digest(db)
            if state:
                state.value = {'lastSent': now.date().isoformat()}
            else:
                db.add(AppSetting(key='digest_state', value={'lastSent': now.date().isoformat()}))
            db.commit()
            log.info('Récapitulatif échéances : %s', result)
    except Exception:  # noqa: BLE001
        log.exception('Tâche quotidienne flotte en échec')
    finally:
        db.close()


async def _scheduler() -> None:
    while True:
        await run_in_threadpool(_daily_tick)
        await asyncio.sleep(30 * 60)


def init_flotte(app: FastAPI) -> None:
    """À appeler avant la route « catch-all » du frontend."""
    from .auth import access_middleware, router as auth_router, users_router
    from .exploitation import router as exploitation_router
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(exploitation_router)
    app.include_router(router)
    app.middleware('http')(access_middleware)
    previous = app.router.lifespan_context

    @asynccontextmanager
    async def lifespan(a):
        await run_in_threadpool(_init_db)
        task = asyncio.create_task(_scheduler())
        try:
            async with previous(a) as state:
                yield state
        finally:
            task.cancel()

    app.router.lifespan_context = lifespan


# Colonnes ajoutées après la première version : ajoutées à la volée si absentes
_ADDED_COLUMNS = {
    'flotte_driver': {
        'badge_koln_expiration': 'DATE', 'attestation_conducteur_expiration': 'DATE',
        'adresse': 'TEXT', 'cin_numero': 'VARCHAR(40)', 'cin_expiration': 'DATE',
        'permis_delivrance': 'DATE', 'carte_conducteur_delivrance': 'DATE', 'adr_numero': 'VARCHAR(40)',
    },
    'flotte_vehicle': {
        'type_vehicule_id': 'VARCHAR(36)', 'carburant': 'VARCHAR(20)', 'consommation': 'FLOAT',
    },
    'flotte_company': {'numero_client': 'VARCHAR(30)'},
    'flotte_trip': {
        'tour': 'INTEGER NOT NULL DEFAULT 1', 'cmr_file_id': 'VARCHAR(36)', 'cmr_numero': 'VARCHAR(40)',
        'vehicle_type': 'VARCHAR(80)', 'statut': "VARCHAR(10) NOT NULL DEFAULT 'CONFIRME'",
        'phase': "VARCHAR(10) NOT NULL DEFAULT 'TERMINE'", 'arrival_at': 'TIMESTAMP',
        'wait_minutes': 'INTEGER', 'return_cmr_numero': 'VARCHAR(40)', 'return_cmr_file_id': 'VARCHAR(36)',
    },
    'flotte_invoice': {
        'period_start': 'DATE', 'period_end': 'DATE', 'numero_client': 'VARCHAR(30)', 'section': 'VARCHAR(80)',
    },
    'flotte_driver_document': {
        'uploaded_by_driver': 'BOOLEAN NOT NULL DEFAULT FALSE', 'verified_at': 'TIMESTAMP',
    },
}


def _ensure_columns() -> None:
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    with engine.begin() as conn:
        if not IS_SQLITE:  # précision du taux carburant (5 décimales, ex. 0,02640 €/km)
            for table, col in (('flotte_trip', 'fuel_rate'), ('flotte_fuel_rate', 'rate')):
                if insp.has_table(table):
                    conn.execute(text(f'ALTER TABLE {table} ALTER COLUMN {col} TYPE NUMERIC(12, 5)'))
        for table, cols in _ADDED_COLUMNS.items():
            if not insp.has_table(table):
                continue
            existing = {c['name'] for c in insp.get_columns(table)}
            for col, ddl in cols.items():
                if col not in existing:
                    conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {col} {ddl}'))


def _init_db() -> None:
    if IS_SQLITE and os.environ.get('RAILWAY_ENVIRONMENT'):
        log.warning('Flotte : DATABASE_URL absente — base SQLite temporaire, données perdues au redéploiement.')
    Base.metadata.create_all(engine)
    _ensure_columns()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_refs_if_empty(db)
        C.sync_alerts(db)
    finally:
        db.close()
