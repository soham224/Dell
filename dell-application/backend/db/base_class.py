"""Shared SQLAlchemy declarative base class.

Provides a project-wide base `Base` with automatic `__tablename__`
generation and a convenience `as_dict()` helper for serialization.

Category: Database / ORM Base
"""

from typing import Any
from sqlalchemy import inspect
from sqlalchemy.ext.declarative import as_declarative, declared_attr


@as_declarative()
class Base:
    """Declarative base for all ORM models.

    Attributes
    ----------
    id : Any
        Primary key placeholder; actual type is defined in concrete models.
    __name__ : str
        Class name used to derive `__tablename__` by default.
    """

    id: Any
    __name__: str

    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        """Derive the table name from the class name in lowercase."""
        return cls.__name__.lower()

    def as_dict(self) -> dict:
        """Serialize model columns to a plain dictionary.

        Returns
        -------
        dict
            Mapping of column keys to their current values on the instance.
        """
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
