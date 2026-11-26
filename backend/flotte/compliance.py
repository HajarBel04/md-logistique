"""Moteur d'échéances : statut de chaque date réglementaire + synchronisation des alertes."""
from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import ADR_VEHICLES, MOTORISES, AppSetting, ComplianceAlert, Driver, Vehicle

TZ = ZoneInfo('Europe/Brussels')

DOC_LABELS = {
    # Véhicules
    'CONTROLE_TECHNIQUE': 'Contrôle technique',
    'ETALONNAGE_TACHYGRAPHE': 'Étalonnage tachygraphe',
    'CERTIFICAT_ADR_VEHICULE': 'Certificat ADR véhicule',
    'ASSURANCE': 'Assurance',
    # Chauffeurs
    'PERMIS': 'Permis de conduire',
    'SELECTION_MEDICALE': 'Sélection médicale',
    'CODE_95': 'Code 95',
    'CARTE_CONDUCTEUR': 'Carte conducteur',
    'ADR_CHAUFFEUR': 'Certificat ADR',
    'CARTE_IDENTITE': "Carte d'identité",
    'BADGE_KOLN': 'Badge Köln',
    'ATTESTATION_CONDUCTEUR': 'Attestation conducteur',
}

DEFAULT_SETTINGS = {
    # Fenêtre d'alerte (jours avant expiration) par type de document
    'thresholds': {
        'CODE_95': 90,
        'CARTE_CONDUCTEUR': 90,
        'PERMIS': 90,
        'SELECTION_MEDICALE': 60,
        'ADR_CHAUFFEUR': 60,
        'CARTE_IDENTITE': 60,
        'BADGE_KOLN': 60,
        'ATTESTATION_CONDUCTEUR': 60,
        'CONTROLE_TECHNIQUE': 60,
        'ETALONNAGE_TACHYGRAPHE': 60,
        'CERTIFICAT_ADR_VEHICULE': 60,
        'ASSURANCE': 60,
    },
    # En dessous de ce nombre de jours : alerte « urgente » (WARNING_30J)
    'criticalDays': 30,
    'email': {
        'enabled': False,
        'recipients': [],
        'hour': 7,
        'includeInfo': True,
    },
}


def today() -> date:
    return datetime.now(TZ).date()


# ─── Paramètres ──────────────────────────────────────────────────────────────

def get_settings(db: Session) -> dict:
    row = db.get(AppSetting, 'alerts')
    merged = {
        'thresholds': dict(DEFAULT_SETTINGS['thresholds']),
        'criticalDays': DEFAULT_SETTINGS['criticalDays'],
        'email': dict(DEFAULT_SETTINGS['email']),
    }
    if row and isinstance(row.value, dict):
        merged['thresholds'].update(row.value.get('thresholds') or {})
        merged['email'].update(row.value.get('email') or {})
        if isinstance(row.value.get('criticalDays'), int):
            merged['criticalDays'] = row.value['criticalDays']
    return merged


def save_settings(db: Session, value: dict) -> dict:
    current = get_settings(db)
    if 'thresholds' in value:
        for k, v in (value['thresholds'] or {}).items():
            if k in DOC_LABELS and isinstance(v, int) and 0 <= v <= 730:
                current['thresholds'][k] = v
    if isinstance(value.get('criticalDays'), int) and 0 <= value['criticalDays'] <= 365:
        current['criticalDays'] = value['criticalDays']
    if 'email' in value:
        e = value['email'] or {}
        if 'enabled' in e:
            current['email']['enabled'] = bool(e['enabled'])
        if 'recipients' in e:
            current['email']['recipients'] = [
                r.strip() for r in (e['recipients'] or []) if isinstance(r, str) and '@' in r
            ][:20]
        if isinstance(e.get('hour'), int) and 0 <= e['hour'] <= 23:
            current['email']['hour'] = e['hour']
        if 'includeInfo' in e:
            current['email']['includeInfo'] = bool(e['includeInfo'])
    row = db.get(AppSetting, 'alerts')
    if row:
        row.value = current
    else:
        db.add(AppSetting(key='alerts', value=current))
    db.commit()
    return current


# ─── Évaluation d'une date ───────────────────────────────────────────────────

def evaluate(doc_type: str, exp: date | None, required: bool, applicable: bool,
             settings: dict, ref: date) -> dict:
    """statut ∈ na | manquant | expire | bientot | valide (+ facultatif si non requis et vide)."""
    item = {
        'type': doc_type,
        'label': DOC_LABELS[doc_type],
        'date': exp.isoformat() if exp else None,
        'required': required,
        'daysRemaining': None,
        'status': 'na',
        'severity': None,
    }
    if not applicable:
        return item
    if exp is None:
        item['status'] = 'manquant' if required else 'facultatif'
        return item
    days = (exp - ref).days
    item['daysRemaining'] = days
    window = settings['thresholds'].get(doc_type, 60)
    if days < 0:
        item['status'], item['severity'] = 'expire', 'CRITICAL_EXPIRED'
    elif days <= window:
        item['status'] = 'bientot'
        item['severity'] = 'WARNING_30J' if days <= settings['criticalDays'] else 'INFO_90J'
    else:
        item['status'] = 'valide'
    return item


def vehicle_items(v: Vehicle, settings: dict, ref: date) -> list[dict]:
    motorise = v.categorie in MOTORISES
    adr = v.categorie in ADR_VEHICLES
    return [
        evaluate('CONTROLE_TECHNIQUE', v.controle_technique_expiration, True, True, settings, ref),
        evaluate('ETALONNAGE_TACHYGRAPHE', v.etalonnage_tachygraphe_expiration, True, motorise, settings, ref),
        evaluate('CERTIFICAT_ADR_VEHICULE', v.certificat_adr_expiration, True,
                 adr or v.certificat_adr_expiration is not None, settings, ref),
        evaluate('ASSURANCE', v.assurance_expiration, True, True, settings, ref),
    ]


def driver_items(d: Driver, settings: dict, ref: date) -> list[dict]:
    pl = d.type_chauffeur == 'POIDS_LOURD'
    adr_requis = bool(d.adr_categories)
    return [
        evaluate('CARTE_IDENTITE', d.cin_expiration, False, True, settings, ref),
        evaluate('PERMIS', d.permis_expiration, True, True, settings, ref),
        evaluate('SELECTION_MEDICALE', d.selection_medicale_expiration, pl, True, settings, ref),
        evaluate('CODE_95', d.code95_expiration, pl, pl, settings, ref),
        evaluate('CARTE_CONDUCTEUR', d.carte_conducteur_expiration, pl, pl, settings, ref),
        evaluate('ADR_CHAUFFEUR', d.adr_certificat_expiration, adr_requis, True, settings, ref),
        # Facultatifs : surveillés seulement quand une date est saisie
        evaluate('BADGE_KOLN', d.badge_koln_expiration, False, pl, settings, ref),
        evaluate('ATTESTATION_CONDUCTEUR', d.attestation_conducteur_expiration, False, not pl, settings, ref),
    ]


STATUS_RANK = {'expire': 4, 'manquant': 3, 'bientot': 2, 'valide': 1, 'facultatif': 0, 'na': 0}


def worst_status(items: list[dict]) -> str:
    ranked = [i['status'] for i in items if STATUS_RANK[i['status']] > 0]
    return max(ranked, key=STATUS_RANK.get) if ranked else 'valide'


def driver_label(d: Driver) -> str:
    return f"{d.prenom} {d.nom}".strip()


# ─── Synchronisation des alertes ─────────────────────────────────────────────

def sync_alerts(db: Session) -> int:
    """Crée / met à jour / résout les alertes à partir des dates actuelles. Retourne le nb d'alertes actives."""
    settings = get_settings(db)
    ref = today()
    wanted: dict[tuple, dict] = {}

    for v in db.scalars(select(Vehicle)):
        for it in vehicle_items(v, settings, ref):
            if it['status'] in ('expire', 'bientot'):
                key = ('VEHICLE', v.id, it['type'], date.fromisoformat(it['date']))
                wanted[key] = {**it, 'label_full': f"{v.plaque} — {it['label']}"}

    for d in db.scalars(select(Driver).where(Driver.statut != 'INACTIF')):
        for it in driver_items(d, settings, ref):
            if it['status'] in ('expire', 'bientot'):
                key = ('DRIVER', d.id, it['type'], date.fromisoformat(it['date']))
                wanted[key] = {**it, 'label_full': f"{driver_label(d)} — {it['label']}"}

    existing = {
        (a.entity_type, a.entity_id, a.document_type, a.expiration_date): a
        for a in db.scalars(select(ComplianceAlert))
    }

    for key, it in wanted.items():
        a = existing.get(key)
        if a is None:
            db.add(ComplianceAlert(
                entity_type=key[0], entity_id=key[1], document_type=key[2], expiration_date=key[3],
                target_label=it['label_full'], days_remaining=it['daysRemaining'],
                severity=it['severity'], status='ACTIVE',
            ))
            continue
        escalated = a.severity != it['severity']
        a.target_label = it['label_full']
        a.days_remaining = it['daysRemaining']
        a.severity = it['severity']
        if a.status == 'RESOLVED':
            a.status = 'ACTIVE'
        elif a.status == 'SNOOZED' and (escalated or (a.snoozed_until and a.snoozed_until <= ref)):
            a.status, a.snoozed_until = 'ACTIVE', None

    for key, a in existing.items():
        if key not in wanted and a.status != 'RESOLVED':
            a.status = 'RESOLVED'
            a.snoozed_until = None

    db.commit()
    return sum(1 for a in db.scalars(select(ComplianceAlert).where(ComplianceAlert.status == 'ACTIVE')))
