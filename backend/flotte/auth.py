"""Connexion et rôles (ADMIN / CHAUFFEUR).

- Mots de passe : scrypt (bibliothèque standard), sel aléatoire.
- Session : cookie HttpOnly signé HMAC (30 jours), invalidé au changement de mot de passe.
- Toutes les routes /api/* exigent un compte admin, sauf la liste PUBLIC et l'espace chauffeur.
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .db import SessionLocal, get_db
from .models import AppSetting, Driver, User

COOKIE = 'md_session'
SESSION_DAYS = 30

router = APIRouter(prefix='/api/auth', tags=['auth'])

# Routes accessibles sans connexion
PUBLIC_PREFIXES = ('/api/auth/login', '/api/auth/status', '/api/auth/setup', '/api/auth/logout',
                   '/api/flotte/portail/')
PUBLIC_SUFFIXES = ('/health',)
# Routes accessibles à un chauffeur connecté (le reste est réservé aux admins)
DRIVER_PREFIXES = ('/api/auth/', '/api/flotte/me', '/api/flotte/files/')


# ─── Mots de passe ───────────────────────────────────────────────────────────

def hash_password(pw: str) -> str:
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return f'scrypt${salt.hex()}${h.hex()}'


def check_password(pw: str, stored: str) -> bool:
    try:
        _, salt, h = stored.split('$')
        got = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(got.hex(), h)
    except (ValueError, TypeError):
        return False


def validate_password(pw: str) -> None:
    if not isinstance(pw, str) or len(pw) < 8:
        raise HTTPException(400, 'Le mot de passe doit contenir au moins 8 caractères.')


def normalize_phone(p: str | None) -> str | None:
    if not p:
        return None
    digits = re.sub(r'[^\d+]', '', p)
    if digits.startswith('00'):
        digits = '+' + digits[2:]
    if digits.startswith('0') and not digits.startswith('+'):
        digits = '+32' + digits[1:]  # numéro belge saisi sans indicatif
    return digits or None


# ─── Jeton de session ────────────────────────────────────────────────────────

_secret_cache: bytes | None = None


def _secret() -> bytes:
    global _secret_cache
    if _secret_cache:
        return _secret_cache
    env = os.environ.get('SECRET_KEY')
    if env:
        _secret_cache = env.encode()
        return _secret_cache
    db = SessionLocal()
    try:
        row = db.get(AppSetting, 'secret')
        if not row:
            row = AppSetting(key='secret', value={'key': secrets.token_hex(32)})
            db.add(row)
            db.commit()
        _secret_cache = row.value['key'].encode()
        return _secret_cache
    finally:
        db.close()


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip('=')


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))


def make_token(user: User) -> str:
    payload = _b64(json.dumps({'u': user.id, 'v': user.token_version,
                               'e': int(time.time()) + SESSION_DAYS * 86400}).encode())
    sig = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    return f'{payload}.{sig}'


def read_token(token: str | None) -> dict | None:
    if not token or '.' not in token:
        return None
    payload, sig = token.rsplit('.', 1)
    expected = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        data = json.loads(_unb64(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    return data if data.get('e', 0) > time.time() else None


def user_from_request(request: Request, db: Session) -> User | None:
    data = read_token(request.cookies.get(COOKIE))
    if not data:
        return None
    user = db.get(User, data['u'])
    if not user or not user.active or user.token_version != data.get('v'):
        return None
    return user


def set_cookie(response: Response, request: Request, user: User) -> None:
    secure = request.headers.get('x-forwarded-proto', request.url.scheme) == 'https'
    response.set_cookie(COOKIE, make_token(user), max_age=SESSION_DAYS * 86400,
                        httponly=True, samesite='lax', secure=secure, path='/')


# ─── Middleware : contrôle d'accès sur /api/* ────────────────────────────────

def _is_public(path: str) -> bool:
    return path.startswith(PUBLIC_PREFIXES) or path.endswith(PUBLIC_SUFFIXES)


async def access_middleware(request: Request, call_next):
    path = request.url.path
    if request.method == 'OPTIONS' or not path.startswith('/api/') or _is_public(path):
        return await call_next(request)
    db = SessionLocal()
    try:
        user = user_from_request(request, db)
        if user:
            db.expunge(user)
    finally:
        db.close()
    if not user:
        return JSONResponse({'detail': 'Connexion requise.'}, status_code=401)
    if user.role != 'ADMIN' and not path.startswith(DRIVER_PREFIXES):
        return JSONResponse({'detail': 'Accès réservé aux administrateurs.'}, status_code=403)
    request.state.user = user
    return await call_next(request)


def current_user(request: Request) -> User:
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(401, 'Connexion requise.')
    return user


def current_driver_user(request: Request) -> User:
    user = current_user(request)
    if user.role != 'CHAUFFEUR' or not user.driver_id:
        raise HTTPException(403, 'Espace réservé aux chauffeurs.')
    return user


# ─── Anti-force brute (en mémoire, par identifiant et par IP) ────────────────

_attempts: dict[str, deque] = defaultdict(deque)
MAX_ATTEMPTS, WINDOW = 8, 15 * 60


def _throttle(key: str) -> None:
    q = _attempts[key]
    now = time.time()
    while q and q[0] < now - WINDOW:
        q.popleft()
    if len(q) >= MAX_ATTEMPTS:
        raise HTTPException(429, 'Trop de tentatives. Réessayez dans 15 minutes.')


def _fail(key: str) -> None:
    _attempts[key].append(time.time())


# ─── Routes ──────────────────────────────────────────────────────────────────

def user_out(u: User) -> dict:
    out = {'id': u.id, 'nom': u.nom, 'email': u.email, 'telephone': u.telephone, 'role': u.role,
           'driverId': u.driver_id, 'active': u.active,
           'lastLogin': u.last_login.isoformat() + 'Z' if u.last_login else None}
    if u.driver_id and u.driver:
        out['nom'] = f'{u.driver.prenom} {u.driver.nom}'.strip()
    return out


def _admin_count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.role == 'ADMIN')) or 0


@router.get('/status')
def status(db: Session = Depends(get_db)):
    return {'needsSetup': _admin_count(db) == 0}


@router.post('/setup')
def setup(payload: dict, request: Request, response: Response, db: Session = Depends(get_db)):
    """Création du tout premier compte administrateur (une seule fois)."""
    if _admin_count(db) > 0:
        raise HTTPException(409, 'Un administrateur existe déjà.')
    email = (payload.get('email') or '').strip().lower()
    if '@' not in email:
        raise HTTPException(400, 'Adresse email invalide.')
    validate_password(payload.get('password'))
    user = User(nom=(payload.get('nom') or '').strip()[:160], email=email,
                password_hash=hash_password(payload['password']), role='ADMIN',
                last_login=datetime.utcnow())
    db.add(user)
    db.commit()
    set_cookie(response, request, user)
    return user_out(user)


@router.post('/login')
def login(payload: dict, request: Request, response: Response, db: Session = Depends(get_db)):
    ident = (payload.get('identifier') or '').strip()
    pw = payload.get('password') or ''
    ip = request.headers.get('x-forwarded-for', request.client.host if request.client else '?').split(',')[0]
    for key in (f'id:{ident.lower()}', f'ip:{ip}'):
        _throttle(key)
    if '@' in ident:
        cond = func.lower(User.email) == ident.lower()
    else:
        cond = User.telephone == normalize_phone(ident)
    user = db.scalars(select(User).where(cond)).first()
    if not user or not user.active or not check_password(pw, user.password_hash):
        _fail(f'id:{ident.lower()}')
        _fail(f'ip:{ip}')
        raise HTTPException(401, 'Identifiant ou mot de passe incorrect.')
    user.last_login = datetime.utcnow()
    db.commit()
    set_cookie(response, request, user)
    return user_out(user)


@router.post('/logout')
def logout(response: Response):
    response.delete_cookie(COOKIE, path='/')
    return {'ok': True}


@router.get('/me')
def me(request: Request, db: Session = Depends(get_db)):
    user = db.get(User, current_user(request).id)
    return user_out(user)


@router.post('/password')
def change_password(payload: dict, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.get(User, current_user(request).id)
    if not check_password(payload.get('current') or '', user.password_hash):
        raise HTTPException(400, 'Mot de passe actuel incorrect.')
    validate_password(payload.get('new'))
    user.password_hash = hash_password(payload['new'])
    user.token_version += 1  # déconnecte les autres appareils
    db.commit()
    set_cookie(response, request, user)
    return {'ok': True}


# ─── Gestion des comptes (admin) ─────────────────────────────────────────────

users_router = APIRouter(prefix='/api/flotte/users', tags=['users'])


def _check_unique(db: Session, email: str | None, tel: str | None, exclude: str | None = None) -> None:
    conds = []
    if email:
        conds.append(func.lower(User.email) == email)
    if tel:
        conds.append(User.telephone == tel)
    if not conds:
        return
    q = select(User).where(or_(*conds))
    if exclude:
        q = q.where(User.id != exclude)
    if db.scalars(q).first():
        raise HTTPException(400, 'Cet email ou ce téléphone est déjà utilisé par un autre compte.')


@users_router.get('')
def list_users(db: Session = Depends(get_db)):
    return [user_out(u) for u in db.scalars(select(User).order_by(User.role, User.created_at))]


@users_router.post('', status_code=201)
def create_user(payload: dict, db: Session = Depends(get_db)):
    role = payload.get('role')
    if role not in ('ADMIN', 'CHAUFFEUR'):
        raise HTTPException(400, 'Rôle inconnu.')
    email = (payload.get('email') or '').strip().lower() or None
    tel = normalize_phone(payload.get('telephone'))
    if not email and not tel:
        raise HTTPException(400, 'Indiquez un email ou un numéro de téléphone pour la connexion.')
    if email and '@' not in email:
        raise HTTPException(400, 'Adresse email invalide.')
    validate_password(payload.get('password'))
    _check_unique(db, email, tel)
    driver_id = payload.get('driverId')
    if role == 'CHAUFFEUR':
        if not driver_id or not db.get(Driver, driver_id):
            raise HTTPException(400, 'Choisissez le chauffeur à relier à ce compte.')
        if db.scalars(select(User).where(User.driver_id == driver_id)).first():
            raise HTTPException(400, 'Ce chauffeur a déjà un compte.')
    else:
        driver_id = None
    u = User(nom=(payload.get('nom') or '').strip()[:160], email=email, telephone=tel,
             password_hash=hash_password(payload['password']), role=role, driver_id=driver_id)
    db.add(u)
    db.commit()
    db.refresh(u)
    return user_out(u)


@users_router.patch('/{uid}')
def update_user(uid: str, payload: dict, request: Request, db: Session = Depends(get_db)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, 'Compte introuvable.')
    me_ = current_user(request)
    if 'email' in payload or 'telephone' in payload:
        email = (payload.get('email', u.email) or '').strip().lower() or None
        tel = normalize_phone(payload.get('telephone', u.telephone))
        if not email and not tel:
            raise HTTPException(400, 'Un email ou un téléphone est nécessaire pour la connexion.')
        _check_unique(db, email, tel, exclude=u.id)
        u.email, u.telephone = email, tel
    if 'nom' in payload:
        u.nom = (payload['nom'] or '').strip()[:160]
    if payload.get('password'):
        validate_password(payload['password'])
        u.password_hash = hash_password(payload['password'])
        u.token_version += 1
    if 'active' in payload:
        if u.id == me_.id and not payload['active']:
            raise HTTPException(400, 'Vous ne pouvez pas désactiver votre propre compte.')
        if u.role == 'ADMIN' and not payload['active'] and _active_admins(db) <= 1:
            raise HTTPException(400, 'Il doit rester au moins un administrateur actif.')
        u.active = bool(payload['active'])
        u.token_version += 1
    db.commit()
    return user_out(u)


def _active_admins(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)
                     .where(User.role == 'ADMIN', User.active.is_(True))) or 0


@users_router.delete('/{uid}', status_code=204)
def delete_user(uid: str, request: Request, db: Session = Depends(get_db)):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, 'Compte introuvable.')
    if u.id == current_user(request).id:
        raise HTTPException(400, 'Vous ne pouvez pas supprimer votre propre compte.')
    if u.role == 'ADMIN' and _active_admins(db) <= 1 and u.active:
        raise HTTPException(400, 'Il doit rester au moins un administrateur actif.')
    db.delete(u)
    db.commit()
