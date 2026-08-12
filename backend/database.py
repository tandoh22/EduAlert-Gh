try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import declarative_base
    from sqlalchemy.orm import sessionmaker
except ImportError as e:
    raise ImportError(
        "sqlalchemy is not installed. Install it with: pip install sqlalchemy"
    ) from e
from core.config import settings

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        pass
except Exception:
    engine = create_engine("sqlite:///./edualert.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()