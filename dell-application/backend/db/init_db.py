"""Database initialization entry.

 Ensures all SQLAlchemy models are registered and creates tables against the
 configured engine. Invoked on module import.

 Category: Database / Initialization
 """

from db import base
from db.session import engine


def init_db() -> None:
    base.Base.metadata.create_all(bind=engine)


init_db()
