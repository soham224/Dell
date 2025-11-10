"""Camera-usecase mapping endpoints.

Manage associations between cameras and usecases, including create and
various listing views with role-aware scoping.

Category: API / Camera / Usecase Mapping
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import traceback

import crud
import models
import schemas
from api import deps

# from core.ai_utils import update_ai_details
from crud.usecase_mapping_crud import usecase_mapping_crud_obj
from core.camera_utils import get_current_user_location
from enums.error_enum import CommonErrorEnum

usecase_mapping_router = APIRouter()


@usecase_mapping_router.post(
    "/camera_usecase_mapping/add",
)
def add_camera_usecase_camera_mapping(
    usecase_mapping_details: schemas.UsecaseMappingCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    try:
        db_obj = usecase_mapping_crud_obj.get_camera_usecase_mapping_by_usecase_id_and_camera_id(
            db=db,
            usecase_id=usecase_mapping_details.usecase_id,
            camera_id=usecase_mapping_details.camera_id,
        )

        if db_obj:
            raise HTTPException(
                status_code=409, detail="camera usecases mapping already exists."
            )

        db_obj = usecase_mapping_crud_obj.create(db=db, obj_in=usecase_mapping_details)

        if not db_obj:
            raise HTTPException(
                status_code=404, detail="No camera usecases mapping available."
            )

        return usecase_mapping_crud_obj.get_by_id(db, db_obj.id)

    except HTTPException as http_exc:
        raise http_exc  # Let FastAPI handle it as-is

    except Exception:
        # Optional: log the full traceback for debugging
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")


@usecase_mapping_router.get(
    "/camera_usecase_mapping/current_company",
)
def get_all_current_company_camera_usecase_mapping(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    try:

        location_list = get_current_user_location(db, current_user, [])

        return usecase_mapping_crud_obj.get_all_camera_usecase_mapping_by_location_list(
            db=db, location_list=location_list
        )

    except Exception:
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)


@usecase_mapping_router.get(
    "/camera_usecase_mapping",
)
def get_all_camera_usecase_mapping(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    try:
        return usecase_mapping_crud_obj.get_all_camera_usecase_mapping(db=db)

    except Exception:
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)


@usecase_mapping_router.get(
    "/camera_usecase_mapping/id",
)
def get_all_camera_usecase_mapping_by_id(
    camera_usecase_mapping_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    try:
        db_obj = usecase_mapping_crud_obj.get_by_id(
            db=db, _id=camera_usecase_mapping_id
        )
        if not db_obj:
            raise HTTPException(status_code=404, detail="No Data Found For ID")
        return db_obj

    except Exception:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@usecase_mapping_router.get(
    "/camera_usecase_mapping/usecase_id",
)
def get_all_camera_usecase_mapping_by_usecase_id(
    company_id: int,
    usecase_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if crud.user.is_supervisor(current_user):
        if current_user.locations:
            location_id_list = [location.id for location in current_user.locations]
        else:
            raise HTTPException(
                status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
            )
    elif crud.user.is_superuser(current_user):
        location_obj = crud.location_crud_obj.get_all_company_enabled_location(
            db, company_id
        )

        if location_obj:
            location_id_list = [location.id for location in location_obj]
        else:
            raise HTTPException(
                status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
            )
    else:
        location_obj = crud.location_crud_obj.get_all_company_enabled_location(
            db, current_user.company_id
        )

        if location_obj:
            location_id_list = [location.id for location in location_obj]
        else:
            raise HTTPException(
                status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
            )

    db_obj = usecase_mapping_crud_obj.get_by_usecase_id_and_location_list(
        db=db, usecase_id=usecase_id, location_list=location_id_list
    )

    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)
    return db_obj


# @usecase_mapping_router.post(
#     "/cameras_usecase_mapping/update",
# )
# def update_cameras_usecase_mapping(
#     usecase_mapping_details: schemas.UsecaseMappingUpdate,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     db_obj = usecase_mapping_crud_obj.get(db, usecase_mapping_details.id)
#     if not db_obj:
#         raise HTTPException(status_code=404, detail="No Data Found For Update")
#
#     usecase_mapping_dict = usecase_mapping_crud_obj.update(
#         db=db, db_obj=db_obj, obj_in=usecase_mapping_details
#     ).__dict__
#
#     responce_detail, responce_code = update_ai_details(usecase_mapping_dict["id"])
#
#     if responce_code == 200:
#         usecase_mapping_dict["message"] = "success"
#         return usecase_mapping_dict
#     else:
#         usecase_mapping_dict["message"] = (
#             "AI system requires attention. Please contact your administrator for assistance."
#         )
#         return usecase_mapping_dict
