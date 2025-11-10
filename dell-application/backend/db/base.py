"""SQLAlchemy base registration.

Imports all SQLAlchemy model modules so that `Base.metadata` is aware of them
when running migrations or creating tables.

Category: Database / ORM Base
"""

from sqlalchemy.ext.declarative import as_declarative

from db.base_class import Base

# import all models
# NOTE: These imports are intentionally unused in this module. They ensure that
# model classes are registered with SQLAlchemy's metadata.
from models import user
from models import ai_people_footfall_analysis
from models import activity
