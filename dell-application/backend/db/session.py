"""SQLAlchemy engine and session configuration.

Constructs the MySQL connection URI from `core.config.settings` and exposes a
lazily-created `SessionLocal` factory for request-scoped database sessions.

Category: Database / Session
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings

# Build the DSN from environment-backed settings. Credentials are not logged
# anywhere for security reasons.
SQL_ALCHEMY_DATABASE_URI = "mysql+pymysql://{}:{}@{}:{}/{}".format(
    settings.MYSQL_USERNAME,
    settings.MYSQL_PASS,
    settings.MYSQL_HOSTNAME,
    settings.MYSQL_PORT,
    settings.MYSQL_DB_NAME,
)

engine = create_engine(
    SQL_ALCHEMY_DATABASE_URI,
    pool_pre_ping=settings.MYSQL_POOL_PRE_PING,
    pool_size=settings.MYSQL_POOL_SIZE,
    max_overflow=settings.MYSQL_MAX_OVERFLOW,
    pool_timeout=settings.MYSQL_POOL_TIMEOUT,
    connect_args={
        "connect_timeout": 5,
        "read_timeout": 10,
        "write_timeout": 10,
        "init_command": "SET SESSION max_execution_time=10000",
    },
)
# Session factory to be used per-request via dependency injection.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
