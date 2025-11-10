"""Dashboard widgets endpoints.

Compute summary metrics (total cameras, active cameras, total usecases)
 for admin, superuser, and supervisor scopes.

Category: API / Widgets & Dashboard
"""

import threading
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas

import models
from api import deps
from core.result_utils import *
from enums.error_enum import CommonErrorEnum

router = APIRouter()


@router.post("/get_admin_widgets")
def get_admin_widgets(
    filter_details: schemas.FilterCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    try:
        if not filter_details.location_id or "-1" in filter_details.location_id:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, current_user.company_id
            )

            location_list = [location.id for location in location_obj]
        else:
            location_list = filter_details.location_id

        if not filter_details.camera_id or "-1" in filter_details.camera_id:
            camera_obj = crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                db, location_list
            )
            camera_list = [camera.id for camera in camera_obj]
        else:
            camera_list = [str(camera) for camera in filter_details.camera_id]

        widgets_result = {
            "total_cameras": 0,
            "total_active_cameras": 0,
            "total_usecase": 0,
        }

        def sql_data_get_admin(db, location_id, user_id, camera_id):
            widgets_result["total_cameras"] = len(
                crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                    db, location_id
                )
            )

            widgets_result["total_active_cameras"] = len(
                crud.deployment_camera_crud_obj.get_total_active_cameras_by_location(
                    db, location_id
                )
            )
            widgets_result["total_usecase"] = len(crud.usecase_crud_obj.get_all(db))

        thread_for_sql = threading.Thread(
            target=sql_data_get_admin,
            args=(db, location_list, current_user.id, camera_list),
        )
        thread_for_sql.start()
        thread_for_sql.join()

        return widgets_result
    except Exception as e:
        logging.info("Exception in get_admin_widgets : {} ".format(e))
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)


@router.post("/get_superuser_widgets")
def get_superuser_widgets(
    company_id: str,
    filter_details: schemas.FilterCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    try:
        if not filter_details.location_id or "-1" in filter_details.location_id:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, company_id
            )

            location_list = [location.id for location in location_obj]
        else:
            location_list = filter_details.location_id

        if not filter_details.camera_id or "-1" in filter_details.camera_id:
            camera_obj = crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                db, location_list
            )
            camera_list = [camera.id for camera in camera_obj]
        else:
            camera_list = [str(camera) for camera in filter_details.camera_id]

        widgets_result = {
            "total_cameras": 0,
            "total_active_cameras": 0,
            "total_usecase": 0,
        }

        def sql_data_get_admin(db, location_id, user_id, camera_id):
            widgets_result["total_cameras"] = len(
                crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                    db, location_id
                )
            )

            widgets_result["total_active_cameras"] = len(
                crud.deployment_camera_crud_obj.get_total_active_cameras_by_location(
                    db, location_id
                )
            )
            widgets_result["total_usecase"] = len(crud.usecase_crud_obj.get_all(db))

        thread_for_sql = threading.Thread(
            target=sql_data_get_admin,
            args=(db, location_list, current_user.id, camera_list),
        )
        thread_for_sql.start()
        thread_for_sql.join()

        return widgets_result
    except Exception as e:
        logging.info("Exception in get_admin_widgets : {} ".format(e))
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)


@router.post("/get_supervisor_widgets")
def get_supervisor_widgets(
    filter_details: schemas.FilterCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    try:
        company_admin = crud.user.get_company_admin_by_supervisor(
            db, current_user.company_id
        )

        widgets_result = {
            "total_cameras": 0,
            "total_active_cameras": 0,
            "total_usecase": 0,
        }

        if company_admin:
            location_list = []
            if current_user.locations:
                if not filter_details.location_id or "-1" in filter_details.location_id:
                    location_list = [
                        location_obj.id for location_obj in current_user.locations
                    ]
                else:
                    location_list = filter_details.location_id

            if not location_list:
                raise HTTPException(
                    status_code=404,
                    detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value,
                )

            def sql_data_get_supervisor(db, user_id, location_id, camera_id):
                widgets_result["total_cameras"] = len(
                    crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                        db, location_id
                    )
                )
                widgets_result["total_active_cameras"] = len(
                    crud.deployment_camera_crud_obj.get_total_active_cameras_by_location(
                        db, location_id
                    )
                )
                widgets_result["total_usecase"] = len(crud.usecase_crud_obj.get_all(db))

            if not filter_details.camera_id or "-1" in filter_details.camera_id:
                camera_list = get_camera_id_list_by_location_list(location_list, db)
            else:
                camera_list = [str(camera) for camera in filter_details.camera_id]

            thread_for_sql = threading.Thread(
                target=sql_data_get_supervisor,
                args=(db, company_admin.id, location_list, camera_list),
            )
            thread_for_sql.start()
            thread_for_sql.join()

        return widgets_result
    except Exception as e:
        logging.info("Exception in get_supervisor_widgets : {} ".format(e))
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)
