"""Données initiales : flotte reprise du fichier Excel « Véhicule » et liste des chauffeurs actifs.

Exécuté une seule fois, quand les tables sont vides. Les dates absentes de l'Excel restent vides
(statut « Manquant ») : elles sont à compléter dans l'application.
"""
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import BreakdownType, Company, Driver, TransportRoute, Vehicle, VehicleType


def _d(s: str | None) -> date | None:
    if not s:
        return None
    j, m, a = s.split('/')
    return date(int(a), int(m), int(j))


# (plaque, catégorie, contrôle technique, étalonnage tachygraphe, remarque)
VEHICLES = [
    ('1PZP598', 'TRACTEUR', '10/02/2025', '23/04/2026', None),
    ('2BGS551', 'TRACTEUR', '23/11/2026', '04/03/2026', None),
    ('2BVE310', 'TRACTEUR', '20/04/2027', '15/04/2028', None),
    ('2CEU750', 'TRACTEUR', '19/09/2026', '28/08/2026', None),
    ('2CAW176', 'TRACTEUR', '24/05/2027', '26/08/2026', None),
    ('1LFY743', 'TRACTEUR', '22/09/2026', '29/04/2026', None),
    ('1THT562', 'TRACTEUR', '27/03/2027', '28/03/2028', None),
    ('1UWB820', 'TRACTEUR', '28/08/2026', '15/08/2026', None),
    ('QASB986', 'REMORQUE', None, None, None),
    ('QASD237', 'REMORQUE', None, None, None),
    ('QAPX340', 'REMORQUE', None, None, None),
    ('QAQK797', 'REMORQUE', None, None, None),
    ('QAPH543', 'REMORQUE', None, None, None),
    ('QARL469', 'REMORQUE', None, None, None),
    ('1FYL849', 'CAMION', '30/05/2027', '28/06/2027', None),
    ('1GGR183', 'CAMION', None, '04/05/2027', "Date de contrôle technique illisible dans l'Excel (case rouge) — à vérifier."),
]

# (nom complet « NOM Prénom », type)
DRIVERS = [
    ('ADIB Abderazak', 'POIDS_LOURD'),
    ('ALLOUCHI Abdelmajid', 'POIDS_LOURD'),
    ('AMGHAR Youssef', 'POIDS_LOURD'),
    ('BEKKALI Faouzi', 'POIDS_LOURD'),
    ('BELKHATIR Tayeb', 'POIDS_LOURD'),
    ('BELYAYEV Oleg', 'POIDS_LOURD'),
    ('BENDADA Mohamed', 'POIDS_LOURD'),
    ('BOUHTALA OUCHEN Hamid', 'POIDS_LOURD'),
    ('DAHMANI Mohamed', 'POIDS_LOURD'),
    ('DIDOUCHE Mohamed', 'POIDS_LOURD'),
    ('EL GHAMMAT CHAKOUR Abdessamad', 'POIDS_LOURD'),
    ('MECHATE Noureddine', 'POIDS_LOURD'),
    ('OUKIL Houssam', 'POIDS_LOURD'),
    ('OULAD BELLECHKAR Gellel', 'POIDS_LOURD'),
    ('PIRVULESCU Sorin Gabriel', 'POIDS_LOURD'),
    ('SIDIBE SIDIBE Mohamed', 'POIDS_LOURD'),
    ('TEMSAMANI Jawad', 'POIDS_LOURD'),
    ('VURAL Sami', 'POIDS_LOURD'),
    ('ALOUACHE Chaouki', 'CAMIONNETTE'),
    ('ANNOURI Jamal', 'CAMIONNETTE'),
    ('BERRUHO BERROUHO Imad', 'CAMIONNETTE'),
    ('EL FEKRI Nabil', 'CAMIONNETTE'),
    ('FARATTO Karim', 'CAMIONNETTE'),
    ('RAWEK Antoan', 'CAMIONNETTE'),
    ('RIAHI Karim', 'CAMIONNETTE'),
    ('SADOK Abdeladim', 'CAMIONNETTE'),
]


def _split_name(full: str) -> tuple[str, str]:
    words = full.split()
    nom = [w for w in words if w.isupper()]
    prenom = [w for w in words if not w.isupper()]
    return ' '.join(nom), ' '.join(prenom)


def seed_if_empty(db: Session) -> None:
    if not db.scalar(select(func.count()).select_from(Vehicle)):
        for plaque, cat, ct, tachy, rem in VEHICLES:
            db.add(Vehicle(
                plaque=plaque, categorie=cat,
                controle_technique_expiration=_d(ct),
                etalonnage_tachygraphe_expiration=_d(tachy),
                remarque=rem,
            ))
    if not db.scalar(select(func.count()).select_from(Driver)):
        for full, typ in DRIVERS:
            nom, prenom = _split_name(full)
            db.add(Driver(
                nom=nom, prenom=prenom, type_chauffeur=typ, statut='ACTIF', permis_categories=[],
            ))
    db.commit()


# Référentiels relevés sur l'ancienne application du client (modifiables dans « Référentiels »)
COMPANIES = ['UPS', 'DHL', 'Scalian', 'BB']
ROUTES = [  # (code, itinéraire, km — None = à compléter)
    ('BRU1', 'BRUBE - LUMBE - KLNAP - BRUBE', 447),
    ('LBE1', 'LUMBE - BRUBE - EDNNL - BRUBE', 330),
    ('BRU7', 'BRUBE - KLNAP - BRUBE', 447),
    ('BH04', 'BRUBE - HERDE - BRUBE', 517),
    ('BRU3', 'BRUBE - KLANP - BRUBE', 447),
    ('GYM1', 'BRUBE - GYMBE - KLNAP - BRUBE', None),
    ('MD CT EDNNL', 'BRUBE - MDL - BRUBE', 82),
]
VEHICLE_TYPES = ['CAMION - REMORQUE', 'TRACTEUR - SEMI', 'FOND MOUVANT', 'PORTE CONTENEUR', 'SPRINTER']
BREAKDOWN_TYPES = ['Crevaison', 'Panne moteur', 'Freins', 'Batterie', 'Éclairage', 'Accident', 'Autre']


def seed_refs_if_empty(db: Session) -> None:
    if not db.scalar(select(func.count()).select_from(Company)):
        for nom in COMPANIES:
            db.add(Company(nom=nom))
    if not db.scalar(select(func.count()).select_from(TransportRoute)):
        for code, it, km in ROUTES:
            db.add(TransportRoute(code=code, itineraire=it, distance_km=km))
    if not db.scalar(select(func.count()).select_from(VehicleType)):
        for nom in VEHICLE_TYPES:
            db.add(VehicleType(nom=nom))
    if not db.scalar(select(func.count()).select_from(BreakdownType)):
        for nom in BREAKDOWN_TYPES:
            db.add(BreakdownType(nom=nom))
    db.commit()
