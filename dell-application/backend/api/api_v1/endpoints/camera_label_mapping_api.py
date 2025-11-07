import logging
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from api import deps
from core.location_utils import _get_location_list_for_user
from enums.error_enum import CommonErrorEnum

router = APIRouter()


@router.post(
    "/get_camera_label_mapping_by_list_of_camera_id",
    response_model=List[schemas.CameraLabelMappingRead],
)
def get_camera_label_mapping_by_list_of_camera_id(
    camera_id: List[int],
    location_id: List[int],
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    # try:
    if not camera_id or -1 in camera_id:
        if not location_id or -1 in location_id:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, current_user.company_id
            )
            location_list = [location.id for location in location_obj]
        else:
            location_list = location_id

        camera_obj = crud.deployment_camera_crud_obj.get_total_cameras_by_location(
            db, location_list
        )
        camera_list = [camera.id for camera in camera_obj]
    else:
        camera_list = camera_id

    db_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
        db, camera_list
    )
    if not db_obj:
        logging.info(CommonErrorEnum.LABELS_NOT_FOUND.value)
        return []
    return db_obj


@router.post(
    "/get_superuser_camera_label_mapping_by_list_of_camera_id",
    response_model=List[schemas.CameraLabelMappingRead],
)
def get_superuser_camera_label_mapping_by_list_of_camera_id(
    camera_id: List[int],
    location_id: List[int],
    company_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    # try:
    if not camera_id or -1 in camera_id:
        if not location_id or -1 in location_id:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, company_id
            )
            location_list = [location.id for location in location_obj]
        else:
            location_list = location_id

        camera_obj = crud.deployment_camera_crud_obj.get_total_cameras_by_location(
            db, location_list
        )
        camera_list = [camera.id for camera in camera_obj]
    else:
        camera_list = camera_id

    db_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
        db, camera_list
    )
    if not db_obj:
        logging.info(CommonErrorEnum.LABELS_NOT_FOUND.value)
        return []
    return db_obj


@router.post(
    "/get_all_camera_label_mapping",
)
def get_all_camera_label_mapping(
    company_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    location_obj = crud.location_crud_obj.get_all_company_enabled_location(
        db, company_id
    )
    location_list = [location.id for location in location_obj]

    camera_obj = crud.deployment_camera_crud_obj.get_total_cameras_by_location(
        db, location_list
    )
    camera_list = [camera.id for camera in camera_obj]

    labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
        db, camera_list
    )
    if not labels_obj:
        logging.info(CommonErrorEnum.LABELS_NOT_FOUND.value)
        return []

    labels = [
        label
        for label_obj in labels_obj
        if label_obj.labels
        for label in label_obj.labels
    ]

    # Ensure JSON-serializable response (set is not serializable)
    return list(set(labels))


@router.post(
    "/get_current_user_total_cameras_by_location_id",
    response_model=List[schemas.DeploymentJobRTSPManagerRead],
)
def get_current_user_total_cameras_by_location_id(
    location_list: List[int],
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    try:
        if not location_list or -1 in location_list:
            location_list = _get_location_list_for_user(db, current_user)
            if not location_list:
                logging.info(CommonErrorEnum.NO_LOCATION_FOUND_CURRENT_USER.value)
                return []

        deployment_camera_list = (
            crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                db, location_list
            )
        )
        return deployment_camera_list
    except Exception as e:
        logging.error(
            "Exception in get_current_user_total_cameras_by_location_id: {}".format(e)
        )
        raise HTTPException(status_code=500, detail="No camera found for location")


@router.post(
    "/get_superuser_total_cameras_by_location_id",
    response_model=List[schemas.DeploymentJobRTSPManagerRead],
)
def get_superuser_total_cameras_by_location_id(
    location_list: List[int],
    company_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    try:
        if not location_list or -1 in location_list:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, company_id
            )
            if location_obj:
                location_list = [location.id for location in location_obj]
            else:
                logging.info(CommonErrorEnum.NO_LOCATION_FOUND_CURRENT_USER.value)
                return []

        deployment_camera_list = (
            crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                db, location_list
            )
        )
        return deployment_camera_list
    except Exception as e:
        logging.error(
            "Exception in get_current_user_total_cameras_by_location_id: {}".format(e)
        )
        return HTTPException(status_code=500, detail="No camera found for location")


@router.post(
    "/get_camera_label_mapping_by_list_of_camera_id_supervisor",
    response_model=List[schemas.CameraLabelMappingRead],
)
def get_camera_label_mapping_by_list_of_camera_id_supervisor(
    camera_id: List[int],
    location_id: List[int],
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_supervisor),
) -> Any:
    try:
        if not camera_id or -1 in camera_id:
            if not location_id or -1 in location_id:
                location_obj = current_user.locations
                location_list = [location.id for location in location_obj]
            else:
                location_list = location_id

            camera_obj = crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                db, location_list
            )
            camera_list = [camera.id for camera in camera_obj]
        else:
            camera_list = camera_id

        db_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
            db, camera_list
        )
        if not db_obj:
            logging.info(CommonErrorEnum.LABELS_NOT_FOUND.value)
            return []
        return db_obj

    except Exception as e:
        logging.info(
            "Exception in get_camera_label_mapping_by_list_of_camera_id_supervisor : {} ".format(
                e
            )
        )
        raise HTTPException(status_code=500, detail=CommonErrorEnum.NO_DATA_FOUND.value)
