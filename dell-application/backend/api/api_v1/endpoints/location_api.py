"""Location management endpoints.

CRUD and listing operations for locations, including company-scoped and
supervisor-scoped queries and assignments.

Category: API / Location
"""

from typing import Any, List
import logging
from api import deps
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from datetime import datetime

from enums.error_enum import CommonErrorEnum

router = APIRouter()


@router.post("/add_location", response_model=schemas.LocationRead)
def add_location(
    location_details: schemas.LocationBase,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    if location_details.company_id is None:
        logging.warning("location name already taken")
        raise HTTPException(
            status_code=422,
            detail="Unprocessable Entity.",
        )

    location = crud.location_crud_obj.get_by_name(
        db, name=location_details.location_name, company_id=location_details.company_id
    )
    if location:
        logging.warning("location name already taken")
        raise HTTPException(
            status_code=403,
            detail="The location name already exists in the system.",
        )

    if isinstance(location_details, dict):
        obj_in = location_details
    else:
        obj_in = location_details.dict(exclude_unset=True)

    obj_in["created_date"] = datetime.utcnow().replace(microsecond=0)
    obj_in["updated_date"] = datetime.utcnow().replace(microsecond=0)
    obj_in["status"] = True

    db_obj = crud.location_crud_obj.create(db=db, obj_in=obj_in)
    if not db_obj:
        raise HTTPException(status_code=500, detail="Data Not Added")

    # Option B: assign the newly created location to provided users, without overwriting
    # existing user-location mappings. This creates rows in the user_location table.
    assign_user_ids = location_details.assign_user_ids or []
    if assign_user_ids:
        # Iterate over provided user IDs, skip invalid users, and avoid duplicate mapping
        for uid in assign_user_ids:
            try:
                uid_int = int(uid)
            except (TypeError, ValueError):
                # Silently skip non-integer IDs to keep endpoint behavior resilient
                continue
            user_obj = crud.user.get_by_id(db, user_id=uid_int)
            if not user_obj:
                # Skip invalid user ids (no such user)
                continue
            # Avoid duplicate relationship entry if already mapped
            if db_obj not in user_obj.locations:
                user_obj.locations.append(db_obj)
                db.add(user_obj)
        # Commit once after all appends for efficiency and atomicity
        db.commit()

    return db_obj


@router.get(
    "/get_current_company_locations", response_model=List[schemas.LocationStatus]
)
def get_current_company_locations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = crud.location_crud_obj.get_all_company_location(
        db, current_user.company_id
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)
    return db_obj


@router.get("/get_all_location", response_model=List[schemas.LocationWithCompanyName])
def get_all_location(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    db_obj = crud.location_crud_obj.get_all_locations(db)
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)
    return [
        schemas.LocationWithCompanyName(
            id=location.id,
            location_name=location.location_name,
            company_id=location.company_id,
            status=location.status,
            created_date=location.created_date,
            updated_date=location.updated_date,
            company_name=company.company_name,
        )
        for location, company in db_obj
    ]


@router.get("/get_location_by_id", response_model=schemas.LocationReadCompany)
def get_location_by_id(
    location_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    db_obj = crud.location_crud_obj.get_by_id(db, location_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)
    return db_obj


@router.post("/update_location", response_model=schemas.LocationRead)
def update_location(
    location_details: schemas.LocationUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    db_obj = crud.location_crud_obj.get(db, location_details.id)

    location_obj = crud.location_crud_obj.get_by_name_excude_current_id(
        db=db,
        name=location_details.location_name,
        company_id=location_details.company_id,
        location_id=location_details.id,
    )

    if location_obj:
        raise HTTPException(status_code=403, detail="Location already exist")

    if not db_obj:
        raise HTTPException(status_code=404, detail="Data Not Found")

    location_details = location_details.copy(
        update={"updated_date": datetime.utcnow().replace(microsecond=0)}
    )
    return crud.location_crud_obj.update(db=db, db_obj=db_obj, obj_in=location_details)


@router.post("/update_location_status", response_model=schemas.LocationRead)
def update_location(
    location_id: int,
    location_status: bool,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    db_obj = crud.location_crud_obj.get_by_id(db, location_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Data Not Found")
    location_details = schemas.LocationStatusUpdate(
        id=db_obj.id,
        location_name=db_obj.location_name,
        company_id=db_obj.company_id,
        status=location_status,
        created_date=db_obj.created_date,
        updated_date=datetime.utcnow().replace(microsecond=0),
    )
    return crud.location_crud_obj.update(db=db, db_obj=db_obj, obj_in=location_details)


@router.get(
    "/get_current_company_enabled_locations", response_model=List[schemas.LocationRead]
)
def get_current_company_enabled_locations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    print("current_user.company_id", current_user.company_id)

    db_obj = crud.location_crud_obj.get_all_company_enabled_location(
        db, current_user.company_id
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)

    return db_obj


@router.get(
    "/get_enabled_locations_by_company_id",
    response_model=List[schemas.LocationRead],
)
def get_enabled_locations_by_company_id(
    company_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    db_obj = crud.location_crud_obj.get_all_company_enabled_location(db, company_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)

    return db_obj


@router.post("/assign_locations", response_model=schemas.User)
def assign_locations(
    user_id: int,
    location_id_list: list,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    user = crud.user.get_by_id(db, user_id=user_id)
    if user and location_id_list:
        locations_list = []
        for location_id in location_id_list:
            locations_list.append(
                crud.location_crud_obj.get_by_id(db=db, _id=location_id)
            )
        response = crud.user.add_location_mapping(db, user_id, locations_list)
        return response

    else:
        raise HTTPException(
            status_code=404,
            detail="User not found to assign the location",
        )


@router.get(
    "/get_supervisor_enabled_locations", response_model=List[schemas.LocationRead]
)
def get_supervisor_enabled_locations(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    location_list = []
    if current_user.locations:
        for location_obj in current_user.locations:
            location_list.append(location_obj.__dict__["id"])
    if not location_list:
        raise HTTPException(status_code=404, detail="Data not found.")
    supervisor_location_list = crud.location_crud_obj.get_total_enabled_locations_obj(
        db, location_list
    )
    if not supervisor_location_list:
        return []
    return supervisor_location_list
