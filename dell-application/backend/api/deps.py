"""API dependency utilities.

This module centralizes FastAPI dependency providers for database sessions and
authenticated/authorized users. It is used across endpoint modules via
`Depends(...)` to enforce security and resource lifecycle consistency.

Category: API / Dependencies
"""

from typing import Generator

from core import security
from core.config import settings
from db.session import SessionLocal
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

import crud
import models
import schemas

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator:
    """Yield a SQLAlchemy session and guarantee its closure.

    Returns
    -------
    Generator
        A generator yielding a `Session` instance to be used in request scope.
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    """Resolve the current authenticated user from an OAuth2 Bearer token.

    Parameters
    ----------
    db : Session
        Database session injected via `get_db`.
    token : str
        Bearer token provided by the client via Authorization header.

    Returns
    -------
    models.User
        The user model for the token subject.

    Raises
    ------
    HTTPException
        401 if token is invalid/unverifiable; 404 if user not found.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = schemas.TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = crud.user.get(db, id=token_data.sub)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the current user account is active.

    Returns the same `current_user` if active; otherwise raises 400.
    """
    if not crud.user.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the current user has admin privileges."""
    if not crud.user.is_admin(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the current user has superuser privileges."""
    if not crud.user.is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_supervisor(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the current user has supervisor privileges."""
    if not crud.user.is_supervisor(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_resultmanager(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the current user has result manager privileges."""
    if not crud.user.is_resultmanager(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_demog_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the current user has demog admin privileges."""
    if not crud.user.is_demog_admin(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user
