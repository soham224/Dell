"""Filter endpoints for analytics.

Provide filtered analytics views for superuser, admin, and supervisor,
including last-graph-step detail retrieval.

Category: API / Filters & Analytics
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from api import deps
import schemas
from core.result_utils import (
    get_camera_id_list_by_location_list,
    get_superuser_filter_mongo_data,
    get_supervisor_filter_mongo_data,
    get_data_of_last_graph_step_list,
)
from enums.error_enum import CommonErrorEnum
import crud

router = APIRouter()


@router.post("/get_filter_result_of_superuser")
def get_filter_result_of_superuser(
    company_id: int,
    filter_details: schemas.FilterCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    if filter_details:
        if not filter_details.camera_id or "-1" in filter_details.camera_id:
            if not filter_details.location_id or "-1" in filter_details.location_id:
                location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                    db, company_id
                )
                location_list = [location.id for location in location_obj]
            else:
                location_list = filter_details.location_id
            camera_list = get_camera_id_list_by_location_list(location_list, db)
        else:
            camera_list = filter_details.camera_id

        if (
            not filter_details.selected_model_labels_list
            or "-1" in filter_details.selected_model_labels_list
        ):
            labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
                db, camera_list
            )
            label_list = [
                label for label_obj in labels_obj for label in label_obj.labels
            ]
        else:
            label_list = filter_details.selected_model_labels_list
        if type(label_list) is list:
            label_list = ",".join(set(label_list))
        label_list = ",".join(set(label_list.split(",")))
        if label_list:
            if filter_details.initial_graph:
                data_list = get_superuser_filter_mongo_data(
                    camera_list,
                    filter_details.start_date,
                    filter_details.end_date,
                    label_list,
                    filter_details.duration_type,
                    filter_details.local_timezone,
                    filter_details.initial_graph,
                    filter_details.current_date,
                )
            else:
                data_list = get_superuser_filter_mongo_data(
                    camera_list,
                    filter_details.start_date,
                    filter_details.end_date,
                    label_list,
                    filter_details.duration_type,
                    filter_details.local_timezone,
                )
            return data_list
        else:
            logging.info("No Labels List Found")
            return []
    else:
        logging.info("No Filter Details Found")
        return []


@router.post("/get_filter_result_of_admin")
def get_filter_result_of_admin(
    filter_details: schemas.FilterCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    if filter_details:
        if not filter_details.camera_id or "-1" in filter_details.camera_id:
            if not filter_details.location_id or "-1" in filter_details.location_id:
                location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                    db, current_user.company_id
                )
                location_list = [location.id for location in location_obj]
            else:
                location_list = filter_details.location_id
            camera_list = get_camera_id_list_by_location_list(location_list, db)
        else:
            camera_list = filter_details.camera_id

        if (
            not filter_details.selected_model_labels_list
            or "-1" in filter_details.selected_model_labels_list
        ):
            labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
                db, camera_list
            )
            label_list = [
                label for label_obj in labels_obj for label in label_obj.labels
            ]
        else:
            label_list = filter_details.selected_model_labels_list
        if type(label_list) is list:
            label_list = ",".join(set(label_list))
        label_list = ",".join(set(label_list.split(",")))
        if label_list:
            if filter_details.initial_graph:
                data_list = get_supervisor_filter_mongo_data(
                    current_user.id,
                    camera_list,
                    filter_details.start_date,
                    filter_details.end_date,
                    label_list,
                    filter_details.duration_type,
                    filter_details.local_timezone,
                    filter_details.initial_graph,
                    filter_details.current_date,
                )
            else:
                data_list = get_supervisor_filter_mongo_data(
                    current_user.id,
                    camera_list,
                    filter_details.start_date,
                    filter_details.end_date,
                    label_list,
                    filter_details.duration_type,
                    filter_details.local_timezone,
                )
            return data_list
        else:
            logging.info("No Labels List Found")
            return []
    else:
        logging.info("No Filter Details Found")
        return []


@router.post("/get_filter_result_of_supervisor")
def get_filter_result_of_supervisor(
    filter_details: schemas.FilterCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if filter_details:
        company_admin = crud.user.get_company_admin_by_supervisor(
            db, current_user.company_id
        )
        if company_admin:
            if not filter_details.camera_id or "-1" in filter_details.camera_id:
                if not filter_details.location_id or "-1" in filter_details.location_id:
                    if current_user.locations:
                        location_list = [
                            location.id for location in current_user.locations
                        ]
                    else:
                        raise HTTPException(
                            status_code=404,
                            detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value,
                        )
                else:
                    location_list = filter_details.location_id
                camera_list = get_camera_id_list_by_location_list(location_list, db)
            else:
                camera_list = filter_details.camera_id

            if (
                not filter_details.selected_model_labels_list
                or "-1" in filter_details.selected_model_labels_list
            ):
                labels_obj = (
                    crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
                        db, camera_list
                    )
                )
                label_list = [
                    label for label_obj in labels_obj for label in label_obj.labels
                ]
            else:
                label_list = filter_details.selected_model_labels_list
            if type(label_list) is list:
                label_list = ",".join(set(label_list))
            label_list = ",".join(set(label_list.split(",")))
            if label_list:
                if filter_details.initial_graph:
                    data_list = get_supervisor_filter_mongo_data(
                        company_admin.id,
                        camera_list,
                        filter_details.start_date,
                        filter_details.end_date,
                        label_list,
                        filter_details.duration_type,
                        filter_details.local_timezone,
                        filter_details.initial_graph,
                        filter_details.current_date,
                    )
                else:
                    data_list = get_supervisor_filter_mongo_data(
                        company_admin.id,
                        camera_list,
                        filter_details.start_date,
                        filter_details.end_date,
                        label_list,
                        filter_details.duration_type,
                        filter_details.local_timezone,
                    )
                return data_list
            else:
                logging.info("No Labels List Found")
                return []
        else:
            logging.info("No Company Admin Found")
            return []
    else:
        logging.info("No Filter Details Found")
        return []


@router.get("/get_filter_result_of_last_graph_step")
def get_filter_result_of_last_graph_step(
    data_id: str,
    label: str = "",
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    data_list = json.loads(get_data_of_last_graph_step_list(data_id))
    if label:
        for index, data in enumerate(data_list):
            data_list[index]["counts"] = {
                key: value
                for key, value in data_list[index]["counts"].items()
                if key == label
            }
            data_list[index]["result"]["detection"] = [
                data
                for data in data_list[index]["result"]["detection"]
                if data["label"] == label
            ]
    return data_list
