"""Camera RTSP endpoints.

Endpoints to manage camera ROI linked to use-cases and to (optionally)
check/operate on RTSP streams. Several endpoints are intentionally kept
commented for future enablement; do not remove them.

Category: API / Camera / RTSP
"""

import base64
import logging
import os
import subprocess
import time
from datetime import datetime, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from api import deps
from utils import check_rtsp_new

router = APIRouter()


# @router.post("/check_rtsp_status")
# def check_rtsp_status(
#     rtsp_url: str,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     return check_rtsp_new(rtsp=rtsp_url)


# @router.post("/add_camera_rtsp", response_model=schemas.CameraRtspRead)
# def add_camera_rtsp(
#     camera_rtsp_details: schemas.CameraRtspCreate,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_admin),
# ) -> Any:
#     # Default status true; CameraManager has no 'deleted' flag
#     camera_rtsp_details.status = True
#     camera_rtsp_details.created_date = (
#         datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")
#     )
#
#     camera_rtsp_details.updated_date = (
#         datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")
#     )
#     if isinstance(camera_rtsp_details, dict):
#         camera_rtsp_details_obj = camera_rtsp_details
#     else:
#         camera_rtsp_details_obj = camera_rtsp_details.dict(exclude_unset=True)
#     obj_out = crud.camera_rtsp_crud_obj.create(db=db, obj_in=camera_rtsp_details_obj)
#     if not obj_out:
#         raise HTTPException(status_code=500, detail="Device Not Added")
#     return obj_out


# @router.post("/update_camera_rtsp", response_model=schemas.CameraRtspRead)
# def update_camera_rtsp(
#     camera_rtsp_details: schemas.CameraRtspUpdate,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     camera_rtsp_details.updated_date = (
#         datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")
#     )
#     db_obj = crud.camera_rtsp_crud_obj.get(db, camera_rtsp_details.id)
#     if not db_obj:
#         logging.warning("Data Not Found")
#         raise HTTPException(status_code=404, detail="Data Not Found")
#     camera_rtsp = crud.camera_rtsp_crud_obj.get_by_name_for_update(
#         db, name=camera_rtsp_details.camera_name, _id=camera_rtsp_details.id
#     )
#     if camera_rtsp:
#         logging.warning("location name already taken")
#         raise HTTPException(
#             status_code=400,
#             detail="The location name already exists in the system.",
#         )
#     return crud.camera_rtsp_crud_obj.update(
#         db=db, db_obj=db_obj, obj_in=camera_rtsp_details
#     )
#     # if camera_rtsp_details.result_types:
#     #     result_details.result_types = result_details.result_types
#     #     results = crud.result_type_crud_obj.get_by_id_list(
#     #         db, camera_rtsp_details.result_types
#     #     )
#     #     result_details.result_types = results
#     #
#     # db.commit()
#     # db.refresh(result_details)
#     # return result_details


# @router.post("/update_camera_result_type", response_model=schemas.CameraRtspRead)
# def update_camera_result_type(
#     camera_rtsp_details: schemas.CameraRtspResultTypeUpdate,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     # CameraManager model does not support 'result_types'. Return explicit error.
#     raise HTTPException(
#         status_code=400,
#         detail="Updating result types is not supported for CameraManager model.",
#     )


@router.post("/get_camera_roi")
def get_camera_roi(
    camera_rtsp_details: schemas.CameraRoiGet,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """Return the ROI list for a given camera/usecase pair.

    Reads ROI from `CameraUseCaseMapping` using `camera_id` and `usecase_id`.

    Raises 404 when no mapping is found.
    """
    # Fetch ROI from CameraUseCaseMapping using camera_id + usecase_id
    db_object = crud.camera_rtsp_crud_obj.get_camera_usecase_roi_value(
        db=db,
        camera_id=camera_rtsp_details.camera_id,
        usecase_id=camera_rtsp_details.usecase_id,
    )
    if not db_object:
        raise HTTPException(status_code=404, detail="Data Not Found")
    return db_object.roi


@router.post("/update_camera_roi")
def update_camera_roi(
    camera_rtsp_details: schemas.CameraRoiUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """Update ROI list for camera/usecase mapping.

    Overwrites ROI for the specified `camera_id` and `usecase_id`.
    Returns a success message upon completion.
    """
    # Update ROI on CameraUseCaseMapping
    crud.camera_rtsp_crud_obj.update_camera_usecase_roi_value(
        db=db,
        camera_id=camera_rtsp_details.camera_id,
        usecase_id=camera_rtsp_details.usecase_id,
        roi_list=camera_rtsp_details.roi_list,
    )
    return "Result ROI Updated Successfully"


# @router.post("/update_camera_rtsp_status", response_model=schemas.CameraRtspRead)
# def update_camera_rtsp_status(
#     camera_rtsp_details: schemas.CameraRtspStatus,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     camera_rtsp_details.updated_date = (
#         datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%d %H:%M:%S")
#     )
#     db_obj = crud.camera_rtsp_crud_obj.get_by_id(db, camera_rtsp_details.id)
#     if not db_obj:
#         logging.warning("Data Not Found")
#         raise HTTPException(status_code=404, detail="Data Not Found")
#     return crud.camera_rtsp_crud_obj.update(
#         db=db,
#         db_obj=db_obj,
#         obj_in={
#             "status": camera_rtsp_details.status,
#             "updated_date": camera_rtsp_details.updated_date,
#         },
#     )


@router.get("/get_camera_rtsp_by_id", response_model=schemas.CameraRtspRead)
def get_camera_rtsp_by_id(
    camera_rtsp_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = crud.camera_rtsp_crud_obj.get_by_id(db, camera_rtsp_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="No Data Found")
    return db_obj


# @router.get("/get_all_camera_rtsp", response_model=List[schemas.CameraRtspRead])
# def get_all_camera_rtsp(
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_admin),
# ) -> Any:
#     db_obj = crud.camera_rtsp_crud_obj.get_all_cameras_by_user_id(
#         db=db, user_id=current_user.id
#     )
#     if not db_obj:
#         logging.warning("Data Not Found")
#         return []
#     return db_obj


# @router.get("/delete_camera_rtsp", response_model=schemas.CameraRtspRead)
# def delete_camera_rtsp(
#     camera_rtsp_id: int,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     db_obj = crud.camera_rtsp_crud_obj.get_by_id(db, camera_rtsp_id)
#     if not db_obj:
#         logging.warning("Data Not Found")
#         raise HTTPException(status_code=404, detail="Data Not Found")
#     # Soft delete: set status=False and update timestamp
#     soft_delete_payload = {
#         "status": False,
#         "updated_date": datetime.now(timezone.utc)
#         .replace(microsecond=0)
#         .strftime("%Y-%m-%d %H:%M:%S"),
#     }
#     return crud.camera_rtsp_crud_obj.update(
#         db=db, db_obj=db_obj, obj_in=soft_delete_payload
#     )


# @router.post(
#     "/get_cameras_rtsp_by_location_id", response_model=List[schemas.CameraRtspRead]
# )
# def get_cameras_rtsp_by_location_id(
#     location_ids: schemas.LocationID,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     db_objs = []
#     for location_id in location_ids.location_id:
#         db_objs.extend(
#             crud.camera_rtsp_crud_obj.get_cameras_rtsp_by_location(db, location_id)
#         )
#     return db_objs


@router.post("/get_latest_frame_by_rtsp")
def get_latest_frame_by_rtsp(rtsp_link: str):
    file_name = f"{time.time()}.png"
    try:
        if rtsp_link:
            try:
                cmd = [f"ffmpeg -i '{rtsp_link}' -vframes 1 {file_name}"]
                subprocess.run(
                    cmd, capture_output=True, check=True, shell=True, timeout=10
                )
            except subprocess.TimeoutExpired as e:
                return ""
            except subprocess.CalledProcessError as e:
                return ""
            except Exception as e:
                return ""

        if os.path.isfile(file_name):
            with open(file_name, "rb") as img_file:
                my_string = base64.b64encode(img_file.read())
            os.remove(file_name)
            return my_string
        return ""
    except Exception as e:
        return ""
    finally:
        if os.path.exists(file_name):
            os.remove(file_name)
