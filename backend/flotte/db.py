"""Connexion base de données.

En production (Railway) : DATABASE_URL fournie par le service Postgres.
En local : fichier SQLite dans outputs/flotte.db.
"""
import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _database_url() -> str:
    url = os.environ.get('DATABASE_URL', '').strip()
    if not url:
        os.makedirs(os.path.join(BASE_DIR, 'outputs'), exist_ok=True)
        return 'sqlite:///' + os.path.join(BASE_DIR, 'outputs', 'flotte.db')
    # Railway / Heroku donnent "postgres://" ; SQLAlchemy attend "postgresql+psycopg2://"
    if url.startswith('postgres://'):
        url = 'postgresql+psycopg2://' + url[len('postgres://'):]
    elif url.startswith('postgresql://'):
        url = 'postgresql+psycopg2://' + url[len('postgresql://'):]
    return url


DATABASE_URL = _database_url()
IS_SQLITE = DATABASE_URL.startswith('sqlite')

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={'check_same_thread': False} if IS_SQLITE else {},
)

if IS_SQLITE:
    @event.listens_for(engine, 'connect')
    def _sqlite_fk(dbapi_conn, _):
        dbapi_conn.execute('PRAGMA foreign_keys=ON')

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
