"""User management endpoints.

Create users and supervisors, list supervisors, update supervisor status,
and manage supervisor-location mappings.

Category: API / Users
"""

import datetime
import logging
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_pagination import Page, paginate

import crud
import models
import schemas
from api import deps
from core.config import settings

router = APIRouter()


@router.post("/add_user", response_model=schemas.User)
def create_user(
    *, db: Session = Depends(deps.get_db), user_in: schemas.UserCreate
) -> Any:
    """Create a new user.

    Raises 403 if a user already exists with the same email.
    """
    user = crud.user.get_by_email(db, email=user_in.user_email)
    if user:
        logging.warning("user already registered")
        raise HTTPException(
            status_code=403,
            detail="The user with this email already exists in the system.",
        )

    user_in.user_status = True
    user = crud.user.create(db, obj_in=user_in)
    return user


@router.post("/add_supervisor", response_model=schemas.User)
def create_supervisor(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a new supervisor in the current user's company.

    If `company_id` is not provided in the payload, it defaults to the
    current user's company. Raises 400 if company_id cannot be determined.
    """
    # If company_id is not provided in the request, use the company_id from current_user
    company_id = user_in.company_id if user_in.company_id else current_user.company_id

    if not company_id:
        raise HTTPException(
            status_code=400,
            detail="Company ID is required. Either pass it in the request or it should be available in the current user.",
        )
    user = crud.user.get_by_email(db, email=user_in.user_email)
    if user:
        logging.warning("user already registered")
        raise HTTPException(
            status_code=403,
            detail="The user with this email already exists in the system.",
        )

    user = crud.user.create_supervisor(db, obj_in=user_in, company_id=company_id)

    return user


@router.get("/get_current_company_supervisor", response_model=List[schemas.User])
def get_current_company_supervisor(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """List all supervisors belonging to the current user's company."""
    user = crud.user.get_all_supervisor_by_company_id(db, current_user.company_id)
    return user


@router.get("/get_all_supervisor", response_model=List[schemas.User])
def get_all_supervisor(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """List all supervisors (superuser-only)."""
    user = crud.user.get_all_supervisor(db)
    return user


@router.post("/update_supervisor_status")
def update_supervisor_status(
    *,
    db: Session = Depends(deps.get_db),
    user_status: bool,
    user_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Enable or disable a supervisor account by id.

    Returns a confirmation message or 404 if user not found.
    """
    user = crud.user.update_supervisor_status(db, user_id, user_status)

    if not user:
        logging.warning("User not found")
        raise HTTPException(
            status_code=404,
            detail="No User found, User Status Not Updated",
        )
    else:
        return "Supervisor Status Updated"


@router.post("/remove_assigned_locations", response_model=schemas.User)
def get_all_location(
    user_id: int,
    location_id_list: list,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """Remove a set of location mappings from the provided user id.

    Raises 400 if the user does not exist or list is empty.
    """
    user = crud.user.get_by_id(db, user_id=user_id)
    if user and location_id_list:
        for location_id in location_id_list:
            response = crud.user.remove_location_mapping(db, user_id, location_id)
        return response
    else:
        raise HTTPException(
            status_code=400,
            detail="User not found to assign the location",
        )
