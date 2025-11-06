import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

import crud
import models
from api import deps
import schemas
from core.result_utils import collection

from core.excle_utils import create_excel_file
from core.result_utils import (
    get_camera_id_list_by_location_list,
    get_initial_info,
    get_paginated_result,
    get_result_by_ides,
    get_initial_info_by_user,
    get_paginated_result_by_user,
    get_result_popup_data,
)

from typing import Optional

from enums.error_enum import CommonErrorEnum
from schemas import ResultPopUpFilter

router = APIRouter()


@router.post("/add_result", response_model=schemas.ResultRead)
def add_result(
    result_details: schemas.ResultCreate,
    db: Session = Depends(deps.get_db),
    # current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Insert a result document into MongoDB.

    - Normalizes frame_time to UTC and sets frame_date (UTC) used by downstream queries.
    - Sets defaults for status, is_hide, created_date, updated_date.
    - Computes counts from result.detection if not provided.
    """
    try:
        now_utc = datetime.now(timezone.utc).replace(microsecond=0)

        # Prepare counts if not provided
        counts = {}
        if getattr(result_details, "result", None) and getattr(
            result_details.result, "detection", None
        ):
            for det in result_details.result.detection or []:
                try:
                    label = det.label
                    if label:
                        counts[label] = counts.get(label, 0) + 1
                except Exception:
                    continue

        # Normalize frame_time -> frame_date (UTC)
        frame_time = result_details.frame_time or now_utc
        if frame_time.tzinfo is None:
            frame_time = frame_time.replace(tzinfo=timezone.utc)
        frame_time = frame_time.astimezone(timezone.utc).replace(microsecond=0)

        # Build document for MongoDB
        doc = result_details.dict(by_alias=True, exclude_unset=True)
        doc["frame_date"] = doc.get("frame_date") or frame_time
        doc["created_date"] = doc.get("created_date") or now_utc
        doc["updated_date"] = now_utc
        doc["status"] = True if doc.get("status") is None else doc["status"]
        doc["is_hide"] = False if doc.get("is_hide") is None else doc["is_hide"]
        # store counts if absent
        if not doc.get("counts"):
            doc["counts"] = counts
        # Do not store frame_time separately; we keep frame_date in UTC
        if "frame_time" in doc:
            del doc["frame_time"]

        insert_res = collection.insert_one(doc)
        saved = collection.find_one({"_id": insert_res.inserted_id})
        if not saved:
            raise HTTPException(status_code=500, detail="Insert failed")
        # Convert ObjectId to string for response model compatibility
        saved["_id"] = str(saved["_id"])  # type: ignore
        return saved
    except HTTPException:
        raise
    except Exception:
        logging.exception("Error inserting result into MongoDB")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/get_result_metadata")
def get_result_metadata(
    page_size: Optional[int] = 10,
    location_id_list: Optional[list] = None,
    camera_id_list: Optional[list] = None,
    label_list: Optional[list] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if crud.user.is_supervisor(current_user):
        company_admin = crud.user.get_company_admin_by_supervisor(
            db, current_user.company_id
        )
        if company_admin:
            user_id = company_admin.id
        else:
            logging.info("no admin found for that user")
            return []

        if not camera_id_list or "-1" in camera_id_list:
            if not location_id_list or "-1" in location_id_list:
                if current_user.locations:
                    location_id_list = [
                        location.id for location in current_user.locations
                    ]
                else:
                    raise HTTPException(
                        status_code=404,
                        detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value,
                    )
            camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)
    else:
        user_id = current_user.id

        if not camera_id_list or "-1" in camera_id_list:
            if not location_id_list or "-1" in location_id_list:
                location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                    db, current_user.company_id
                )
                location_id_list = [location.id for location in location_obj]
            camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    if not label_list or "-1" in label_list:
        labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
            db, camera_id_list
        )
        label_list = [
            label
            for label_obj in labels_obj
            if label_obj.labels
            for label in label_obj.labels
        ]

    return get_initial_info_by_user(
        user_id, camera_id_list, list(set(label_list)), start_date, end_date, page_size
    )


@router.post("/get_superuser_result_metadata")
def get_superuser_result_metadata(
    company_id: int,
    page_size: Optional[int] = 10,
    location_id_list: Optional[list] = None,
    camera_id_list: Optional[list] = None,
    label_list: Optional[list] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:

    if not camera_id_list or "-1" in camera_id_list:
        if not location_id_list or "-1" in location_id_list:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, company_id
            )
            location_id_list = [location.id for location in location_obj]
        camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    if not label_list or "-1" in label_list:
        labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
            db, camera_id_list
        )
        label_list = [
            label
            for label_obj in labels_obj
            if label_obj.labels
            for label in label_obj.labels
        ]

    return get_initial_info(
        camera_id_list, list(set(label_list)), start_date, end_date, page_size
    )


@router.post("/get_result")
def get_result(
    page_number: int,
    job_id: int,
    page_size: Optional[int] = 10,
    camera_id_list: Optional[list] = None,
    label_list: Optional[list] = None,
    location_id_list: Optional[list] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if crud.user.is_supervisor(current_user):
        company_admin = crud.user.get_company_admin_by_supervisor(
            db, current_user.company_id
        )
        if company_admin:
            user_id = company_admin.id
        else:
            logging.info("no admin found for that user")
            return []

        if not camera_id_list or "-1" in camera_id_list:
            if not location_id_list or "-1" in location_id_list:
                if current_user.locations:
                    location_id_list = [
                        location.id for location in current_user.locations
                    ]
                else:
                    raise HTTPException(
                        status_code=404,
                        detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value,
                    )
            camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    else:
        user_id = current_user.id

        if not camera_id_list or "-1" in camera_id_list:
            if not location_id_list or "-1" in location_id_list:
                location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                    db, current_user.company_id
                )
                location_id_list = [location.id for location in location_obj]
            camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    if not label_list or "-1" in label_list:
        labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
            db, camera_id_list
        )
        label_list = [
            label
            for label_obj in labels_obj
            if label_obj.labels
            for label in label_obj.labels
        ]

    data_list = json.loads(
        get_paginated_result_by_user(
            user_id=user_id,
            camera_id_list=camera_id_list,
            page_number=page_number,
            label_list=list(set(label_list)),
            start_date=start_date,
            end_date=end_date,
            page_size=page_size,
        )
    )
    # Enrich each record with camera_name and location_name
    try:
        deployment_camera_list = (
            crud.deployment_camera_crud_obj.get_all_camera_by_company_id(
                db, company_id=current_user.company_id
            )
        )
        camera_name_dict = {
            camera_detail.id: [
                camera_detail.camera_name,
                camera_detail.location_details.location_name,
            ]
            for camera_detail in deployment_camera_list
        }
        for item in data_list:
            try:
                cam_id_raw = item.get("camera_id")
                cam_id = int(cam_id_raw) if isinstance(cam_id_raw, str) else cam_id_raw
                if cam_id in camera_name_dict:
                    item["camera_name"] = camera_name_dict[cam_id][0]
                    item["location_name"] = camera_name_dict[cam_id][1]
            except Exception:
                # Skip enrichment for malformed items
                pass
    except Exception:
        # If enrichment fails, still return the base data
        pass
    return data_list


@router.post("/get_superuser_result")
def get_superuser_result(
    company_id: int,
    page_number: int,
    job_id: int,
    page_size: Optional[int] = 10,
    camera_id_list: Optional[list] = None,
    label_list: Optional[list] = None,
    location_id_list: Optional[list] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if not camera_id_list or "-1" in camera_id_list:
        if not location_id_list or "-1" in location_id_list:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, company_id
            )
            location_id_list = [location.id for location in location_obj]
        camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    if not label_list or "-1" in label_list:
        labels_obj = crud.usecase_mapping_crud_obj.get_labels_by_list_of_camera_id(
            db, camera_id_list
        )

        label_list = [
            label
            for label_obj in labels_obj
            if label_obj.labels
            for label in label_obj.labels
        ]

    data_list = json.loads(
        get_paginated_result(
            camera_id_list=camera_id_list,
            page_number=page_number,
            label_list=list(set(label_list)),
            start_date=start_date,
            end_date=end_date,
            page_size=page_size,
        )
    )
    return data_list


@router.post("/get_result_for_result_excel")
def get_result_for_result_excel(
    id_list: List[str],
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if len(id_list) == 0:
        raise HTTPException(status_code=404, detail="Data Not Found")
    deployment_camera_list = (
        crud.deployment_camera_crud_obj.get_all_camera_by_company_id(
            db, company_id=current_user.company_id
        )
    )
    camera_name_dict = {
        camera_detail.id: [
            camera_detail.camera_name,
            camera_detail.location_details.location_name,
        ]
        for camera_detail in deployment_camera_list
    }
    data_list = get_result_by_ides(id_list)
    output_file = create_excel_file(
        data_list=data_list, camera_name_dict=camera_name_dict
    )
    return StreamingResponse(
        output_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=job_results.xlsx"},
    )


@router.post("/get_superuser_result_for_result_excel")
def get_superuser_result_for_result_excel(
    company_id: int,
    id_list: List[str],
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    if len(id_list) == 0:
        raise HTTPException(status_code=404, detail="Data Not Found")
    deployment_camera_list = (
        crud.deployment_camera_crud_obj.get_all_camera_by_company_id(db, company_id)
    )
    camera_name_dict = {
        camera_detail.id: [
            camera_detail.camera_name,
            camera_detail.location_details.location_name,
        ]
        for camera_detail in deployment_camera_list
    }
    data_list = get_result_by_ides(id_list)
    output_file = create_excel_file(
        data_list=data_list, camera_name_dict=camera_name_dict
    )
    return StreamingResponse(
        output_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=job_results.xlsx"},
    )


@router.post("/get_popup_data")
def get_popup_data(
    result_filter: ResultPopUpFilter,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    if crud.user.is_supervisor(current_user):
        company_admin = crud.user.get_company_admin_by_supervisor(
            db, current_user.company_id
        )
        if company_admin:
            user_id = company_admin.id
        else:
            logging.info("no admin found for that user")
            return []

        if current_user.locations:
            location_id_list = [location.id for location in current_user.locations]
        else:
            raise HTTPException(
                status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
            )
        camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    elif crud.user.is_superuser(current_user):
        company_admin = crud.user.get_company_admin_by_supervisor(db, 1)
        if company_admin:
            user_id = company_admin.id
        else:
            logging.info("no admin found for that user")
            return []

        location_obj = crud.location_crud_obj.get_all_company_enabled_location(db, 1)
        if location_obj:
            location_id_list = [location.id for location in location_obj]
        else:
            raise HTTPException(
                status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
            )
        camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    else:
        user_id = current_user.id
        location_obj = crud.location_crud_obj.get_all_company_enabled_location(
            db, current_user.company_id
        )
        if location_obj:
            location_id_list = [location.id for location in location_obj]
        else:
            raise HTTPException(
                status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
            )
        camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)

    if camera_id_list:
        end_data = datetime.utcnow()
        start_date = end_data - timedelta(minutes=result_filter.time_period)
        final_result = json.loads(
            get_result_popup_data(
                user_id=user_id,
                start_date=start_date,
                end_date=end_data,
                label_list=result_filter.label_list,
                camera_list=camera_id_list,
            )
        )

        for result in final_result:
            result_count = {}
            for detection in result["result"]:
                result_count[detection["label"]] = (
                    result_count.get(detection["label"], 0) + 1
                )
            result["counts"] = result_count
            result["result"] = {"detection": result["result"]}
        return final_result
    else:
        raise HTTPException(status_code=404, detail="No Camera Found For This User")
