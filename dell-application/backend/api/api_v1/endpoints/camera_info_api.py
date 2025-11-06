from datetime import datetime
from typing import List, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from api import deps
from core.camera_utils import get_current_user_location
from crud.deployment_camera_crud import deployment_camera_crud_obj

# from core.ai_utils import update_ai_details
import crud
from enums.error_enum import CommonErrorEnum

camera_router = APIRouter()


@camera_router.post(
    "/add_deployment_cameras",
    response_model=schemas.deployment_camera_schema.DeploymentCameraRead,
)
def add_deployment_cameras(
    cam_settings: schemas.deployment_camera_schema.DeploymentCameraCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    camera_obj = deployment_camera_crud_obj.get_by_name_and_location_id(
        db, cam_settings.camera_name, cam_settings.location_id
    )

    if camera_obj:
        raise HTTPException(status_code=403, detail="Camera name already exists")

    inserted_data = deployment_camera_crud_obj.insert_deployment_camera(
        cam_settings, db
    )

    return inserted_data


@camera_router.get(
    "/get_all_current_company_deployment_camera",
    response_model=List[schemas.deployment_camera_schema.CameraLocationRead],
)
def get_all_current_company_deployment_camera(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    try:
        location_list = get_current_user_location(db, current_user, [])
        return deployment_camera_crud_obj.get_total_cameras_by_location(
            db=db, location_list=location_list
        )
    except Exception:
        raise HTTPException(
            status_code=500, detail="No Camera Found For Current Company"
        )


@camera_router.get(
    "/get_all_deployment_camera",
    response_model=List[schemas.deployment_camera_schema.CameraLocationRead],
)
def get_all_camera(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    try:
        return deployment_camera_crud_obj.get_total_cameras(db=db)
    except Exception:
        raise HTTPException(status_code=500, detail="No Camera Found For Super Admin")


@camera_router.get(
    "/get_all_deployment_camera_by_location",
    response_model=List[schemas.deployment_camera_schema.CameraLocationRead],
)
def get_all_deployment_camera_by_location(
    location_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    try:
        return deployment_camera_crud_obj.get_total_cameras_by_location_id(
            db=db, location_id=location_id
        )
    except Exception:
        raise HTTPException(status_code=500, detail="No Camera Found For Location")


# @camera_router.post("/update_rtsp_status")
# def update_rtsp_status(
#     camera_id: int,
#     status_type: str,
#     status_value: bool,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_superuser),
# ) -> Any:
#     rtsp_man_obj = deployment_camera_crud_obj.get(db=db, id=camera_id)
#
#     if not rtsp_man_obj:
#         raise HTTPException(status_code=500, detail="RTSP  Not Added")
#     camera_dict = deployment_camera_crud_obj.update_rtsp_status(
#         db=db, status_type=status_type, status_val=status_value, db_obj=rtsp_man_obj
#     ).__dict__

# responce_detail, responce_code = update_ai_details(camera_dict["id"])
#
# if responce_code == 200:
#     return {
#         "id": camera_dict["id"],
#         "status": camera_dict["status"],
#         "is_active": camera_dict["is_active"],
#         "is_processing": camera_dict["is_processing"],
#         "message": "Update Camera Successfully",
#     }
# else:
#     return {
#         "id": camera_dict["id"],
#         "status": camera_dict["status"],
#         "is_active": camera_dict["is_active"],
#         "is_processing": camera_dict["is_processing"],
#         "message": "AI system requires attention. Please contact your administrator for assistance.",
#     }


@camera_router.get(
    "/get_deployment_camera",
    response_model=schemas.deployment_camera_schema.CameraLocationRead,
)
def get_camera_roi_by_id(
    deployment_camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = deployment_camera_crud_obj.get(db, deployment_camera_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="No Data Found For ID")
    return db_obj


# @camera_router.post(
#     "/update_deployment_cameras",
#     response_model=schemas.deployment_camera_schema.CameraUpdateResponece,
# )
# def update_deployment_cameras(
#     deployment_cameras_details: schemas.deployment_camera_schema.CameraUpdate,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_superuser),
# ) -> Any:
#     db_obj = deployment_camera_crud_obj.get(db, deployment_cameras_details.id)
#     if not db_obj:
#         raise HTTPException(status_code=404, detail="No Data Found For Update")
#
#     camera_obj = crud.deployment_camera_crud_obj.get_by_name_location_id_and_id(
#         db=db,
#         camera_name=deployment_cameras_details.camera_name,
#         location_id=deployment_cameras_details.location_id,
#         camera_id=deployment_cameras_details.id,
#     )
#
#     if camera_obj:
#         raise HTTPException(status_code=403, detail="Camera already exist")
#
#     deployment_cameras_details.updated_date = datetime.now().replace(microsecond=0)
#     camera_dict = deployment_camera_crud_obj.update(
#         db=db, db_obj=db_obj, obj_in=deployment_cameras_details
#     ).__dict__
#
#     responce_detail, responce_code = update_ai_details(camera_dict["id"])
#
#     if responce_code == 200:
#         camera_dict["message"] = "Update Camera Successfully"
#         return camera_dict
#     else:
#         camera_dict["message"] = (
#             "AI system requires attention. Please contact your administrator for assistance."
#         )
#         return camera_dict


@camera_router.post(
    "/get_all_filter_camera", response_model=schemas.CameraPaginateResponse
)
def get_all_camera_location_model(
    camera_filter: schemas.CameraFilter,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    try:
        location_list = []
        if crud.user.is_supervisor(current_user) and current_user.locations:
            for location_obj in current_user.locations:
                location_list.append(location_obj.__dict__["id"])

        return crud.deployment_camera_crud_obj.get_total_filter_cameras_details(
            db=db,
            camera_filter=camera_filter,
            location_list=location_list,
        )

    except Exception:
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)


@camera_router.post(
    "/get_all_filter_camera_company_id", response_model=schemas.CameraPaginateResponse
)
def get_all_filter_camera_company_id(
    company_id: int,
    camera_filter: schemas.CameraFilter,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    try:
        location_list = []
        return crud.deployment_camera_crud_obj.get_total_filter_cameras_details(
            db=db,
            camera_filter=camera_filter,
            location_list=location_list,
        )

    except Exception:
        raise HTTPException(status_code=500, detail="No Camera Found")
