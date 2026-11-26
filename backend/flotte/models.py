"""Modèles : Véhicule, Chauffeur, Document, Alerte, Messagerie, Paramètres."""
import secrets
import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, LargeBinary, Numeric, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


# ─── Constantes métier ────────────────────────────────────────────────────────

VEHICLE_CATEGORIES = ['TRACTEUR', 'REMORQUE', 'CAMION', 'CAMION_ADR', 'REMORQUE_ADR']
MOTORISES = {'TRACTEUR', 'CAMION', 'CAMION_ADR'}
ADR_VEHICLES = {'CAMION_ADR', 'REMORQUE_ADR'}

DRIVER_STATUTS = ['ACTIF', 'INACTIF', 'EN_COURS_EMBAUCHE']
DRIVER_TYPES = ['POIDS_LOURD', 'CAMIONNETTE']
PERMIS_CATEGORIES = ['AM', 'B', 'C1', 'C', 'D1', 'D', 'BE', 'C1E', 'CE', 'D1E', 'DE', 'G']

DOC_SLOTS = [
    'CARTE_IDENTITE', 'PERMIS_CONDUIRE', 'CARTE_CHAUFFEUR', 'SELECTION_MEDICALE',
    'CERTIFICAT_ADR', 'FICHE_SIGNALETIQUE', 'CONTRAT_TRAVAIL', 'DIMONA', 'CARTE_BANCAIRE',
    'BADGE_KOLN', 'ATTESTATION_CONDUCTEUR',
]


# ─── Fichiers (stockés en base : survivent aux redéploiements) ────────────────

class StoredFile(Base):
    __tablename__ = 'flotte_file'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    data: Mapped[bytes] = mapped_column(LargeBinary)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


# ─── Véhicule ────────────────────────────────────────────────────────────────

class Vehicle(Base):
    __tablename__ = 'flotte_vehicle'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    plaque: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    categorie: Mapped[str] = mapped_column(String(20))
    controle_technique_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    etalonnage_tachygraphe_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    certificat_adr_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    assurance_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    assurance_compagnie: Mapped[str | None] = mapped_column(String(120), nullable=True)
    assurance_police: Mapped[str | None] = mapped_column(String(80), nullable=True)
    assurance_remarque: Mapped[str | None] = mapped_column(Text, nullable=True)
    assurance_file_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_file.id', ondelete='SET NULL'), nullable=True)
    remarque: Mapped[str | None] = mapped_column(Text, nullable=True)
    type_vehicule_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_vehicle_type.id', ondelete='SET NULL'), nullable=True)
    carburant: Mapped[str | None] = mapped_column(String(20), nullable=True)
    consommation: Mapped[float | None] = mapped_column(Float, nullable=True)  # L/100 km
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    assurance_file: Mapped[StoredFile | None] = relationship()


# ─── Chauffeur ───────────────────────────────────────────────────────────────

class Driver(Base):
    __tablename__ = 'flotte_driver'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nom: Mapped[str] = mapped_column(String(120))
    prenom: Mapped[str] = mapped_column(String(120), default='')
    date_naissance: Mapped[date | None] = mapped_column(Date, nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    statut: Mapped[str] = mapped_column(String(20), default='ACTIF')
    type_chauffeur: Mapped[str] = mapped_column(String(20), default='POIDS_LOURD')

    permis_numero: Mapped[str | None] = mapped_column(String(40), nullable=True)
    permis_categories: Mapped[list] = mapped_column(JSON, default=list)
    permis_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    selection_medicale_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    code95_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    carte_conducteur_numero: Mapped[str | None] = mapped_column(String(40), nullable=True)
    carte_conducteur_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    adr_certificat_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    adr_categories: Mapped[list] = mapped_column(JSON, default=list)
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    cin_numero: Mapped[str | None] = mapped_column(String(40), nullable=True)
    cin_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    permis_delivrance: Mapped[date | None] = mapped_column(Date, nullable=True)
    carte_conducteur_delivrance: Mapped[date | None] = mapped_column(Date, nullable=True)
    adr_numero: Mapped[str | None] = mapped_column(String(40), nullable=True)
    badge_koln_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)
    attestation_conducteur_expiration: Mapped[date | None] = mapped_column(Date, nullable=True)

    access_token: Mapped[str] = mapped_column(
        String(64), unique=True, default=lambda: secrets.token_urlsafe(24))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    documents: Mapped[list['DriverDocument']] = relationship(
        back_populates='driver', cascade='all, delete-orphan')
    messages: Mapped[list['Message']] = relationship(
        back_populates='driver', cascade='all, delete-orphan', order_by='Message.created_at')


class DriverDocument(Base):
    __tablename__ = 'flotte_driver_document'
    __table_args__ = (UniqueConstraint('driver_id', 'slot_type'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    driver_id: Mapped[str] = mapped_column(ForeignKey('flotte_driver.id', ondelete='CASCADE'))
    slot_type: Mapped[str] = mapped_column(String(30))
    file_id: Mapped[str] = mapped_column(ForeignKey('flotte_file.id'))
    is_cropped_and_formatted: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    uploaded_by_driver: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    driver: Mapped[Driver] = relationship(back_populates='documents')
    file: Mapped[StoredFile] = relationship()


# ─── Alertes ─────────────────────────────────────────────────────────────────

class ComplianceAlert(Base):
    __tablename__ = 'flotte_alert'
    __table_args__ = (
        UniqueConstraint('entity_type', 'entity_id', 'document_type', 'expiration_date'),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    entity_type: Mapped[str] = mapped_column(String(10))          # VEHICLE | DRIVER
    entity_id: Mapped[str] = mapped_column(String(36), index=True)
    target_label: Mapped[str] = mapped_column(String(255))
    document_type: Mapped[str] = mapped_column(String(40))
    expiration_date: Mapped[date] = mapped_column(Date)
    days_remaining: Mapped[int] = mapped_column(Integer)
    severity: Mapped[str] = mapped_column(String(20))             # INFO_90J | WARNING_30J | CRITICAL_EXPIRED
    status: Mapped[str] = mapped_column(String(10), default='ACTIVE')  # ACTIVE | SNOOZED | RESOLVED
    snoozed_until: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


# ─── Messagerie (un fil par chauffeur) ───────────────────────────────────────

class Message(Base):
    __tablename__ = 'flotte_message'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    driver_id: Mapped[str] = mapped_column(
        ForeignKey('flotte_driver.id', ondelete='CASCADE'), index=True)
    sender: Mapped[str] = mapped_column(String(10))               # ADMIN | CHAUFFEUR
    body: Mapped[str] = mapped_column(Text, default='')
    attachment_file_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_file.id', ondelete='SET NULL'), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    driver: Mapped[Driver] = relationship(back_populates='messages')
    attachment: Mapped[StoredFile | None] = relationship()


# ─── Paramètres (clé → JSON) ─────────────────────────────────────────────────

class AppSetting(Base):
    __tablename__ = 'flotte_setting'

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON)


# ─── Comptes utilisateurs (admin / chauffeur) ────────────────────────────────

class User(Base):
    __tablename__ = 'flotte_user'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nom: Mapped[str] = mapped_column(String(160), default='')
    email: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(40), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(10))  # ADMIN | CHAUFFEUR
    driver_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_driver.id', ondelete='CASCADE'), unique=True, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    token_version: Mapped[int] = mapped_column(Integer, default=1)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    driver: Mapped[Driver | None] = relationship()


# ─── Référentiels exploitation ───────────────────────────────────────────────

class Company(Base):
    """Société cliente (UPS, DHL…)."""
    __tablename__ = 'flotte_company'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nom: Mapped[str] = mapped_column(String(120), unique=True)
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    tva: Mapped[str | None] = mapped_column(String(40), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class TransportRoute(Base):
    """Route prédéfinie, ex. BRU1 = BRUBE - LUMBE - KLNAP - BRUBE, 447 km."""
    __tablename__ = 'flotte_route'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    itineraire: Mapped[str] = mapped_column(String(255), default='')
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    company_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_company.id', ondelete='SET NULL'), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    company: Mapped[Company | None] = relationship()


class VehicleType(Base):
    __tablename__ = 'flotte_vehicle_type'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nom: Mapped[str] = mapped_column(String(80), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class BreakdownType(Base):
    __tablename__ = 'flotte_breakdown_type'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nom: Mapped[str] = mapped_column(String(80), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


# ─── Formulaires chauffeurs (trajets) & facturation ──────────────────────────

class FuelRate(Base):
    """Taux de surcharge carburant du mois (€/km)."""
    __tablename__ = 'flotte_fuel_rate'

    month: Mapped[str] = mapped_column(String(7), primary_key=True)  # AAAA-MM
    rate: Mapped[float] = mapped_column(Numeric(10, 4))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


class Invoice(Base):
    __tablename__ = 'flotte_invoice'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    numero: Mapped[str] = mapped_column(String(30), unique=True)
    company_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_company.id', ondelete='SET NULL'), nullable=True)
    client: Mapped[dict] = mapped_column(JSON)       # copie des coordonnées du client
    emetteur: Mapped[dict] = mapped_column(JSON)     # copie des coordonnées MD Logistique
    month: Mapped[str] = mapped_column(String(7))
    date_emission: Mapped[date] = mapped_column(Date)
    vat_rate: Mapped[float] = mapped_column(Numeric(5, 2))
    total_base: Mapped[float] = mapped_column(Numeric(12, 2))
    total_surcharge: Mapped[float] = mapped_column(Numeric(12, 2))
    total_ht: Mapped[float] = mapped_column(Numeric(12, 2))
    total_tva: Mapped[float] = mapped_column(Numeric(12, 2))
    total_ttc: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(12), default='BROUILLON')  # BROUILLON | EMISE | PAYEE
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Trip(Base):
    """Formulaire chauffeur : une route effectuée un jour donné."""
    __tablename__ = 'flotte_trip'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    numero: Mapped[str] = mapped_column(String(20), unique=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    driver_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_driver.id', ondelete='SET NULL'), nullable=True, index=True)
    driver_nom: Mapped[str] = mapped_column(String(200), default='')
    route_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_route.id', ondelete='SET NULL'), nullable=True)
    route_code: Mapped[str] = mapped_column(String(40))
    itineraire: Mapped[str] = mapped_column(String(255), default='')
    distance_km: Mapped[float] = mapped_column(Float)
    company_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_company.id', ondelete='SET NULL'), nullable=True, index=True)
    vehicle_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_vehicle.id', ondelete='SET NULL'), nullable=True)
    trailer_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_vehicle.id', ondelete='SET NULL'), nullable=True)
    vehicle_plaque: Mapped[str | None] = mapped_column(String(20), nullable=True)
    trailer_plaque: Mapped[str | None] = mapped_column(String(20), nullable=True)
    breakdown_type_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_breakdown_type.id', ondelete='SET NULL'), nullable=True)
    remarque: Mapped[str | None] = mapped_column(Text, nullable=True)
    ct_warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    fuel_rate: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)  # figé à la facturation
    surcharge: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)  # figé à la facturation
    invoice_id: Mapped[str | None] = mapped_column(
        ForeignKey('flotte_invoice.id', ondelete='SET NULL'), nullable=True, index=True)
    created_by_role: Mapped[str] = mapped_column(String(10), default='CHAUFFEUR')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    company: Mapped[Company | None] = relationship()
    breakdown_type: Mapped[BreakdownType | None] = relationship()
