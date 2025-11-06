import datetime
from typing import Any, List
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from api import deps
from core.result_utils import raise_notification

router = APIRouter()


@router.post("/add_notification", response_model=schemas.NotificationRead)
def add_notification(
    notification_details: schemas.NotificationCreate, db: Session = Depends(deps.get_db)
) -> Any:
    notification_details.created_date = datetime.datetime.now().replace(microsecond=0)
    notification_details.updated_date = datetime.datetime.now().replace(microsecond=0)
    out_obj = raise_notification(notification_details, db)
    if not out_obj:
        raise HTTPException(status_code=500, detail="Data Not Recorded!")
    return out_obj


@router.post("/add_notification_by_superuser", response_model=schemas.NotificationRead)
def add_notification_by_superuser(
    notification_details: schemas.NotificationCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    notification_details.created_date = datetime.datetime.now().replace(microsecond=0)
    notification_details.updated_date = datetime.datetime.now().replace(microsecond=0)
    out_obj = raise_notification(notification_details, db)
    if not out_obj:
        raise HTTPException(status_code=500, detail="Data Not Recorded!")
    return out_obj


@router.post("/update_notification", response_model=schemas.NotificationRead)
def update_notification(
    notification_details: schemas.NotificationUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    db_obj = crud.notification_crud_obj.get(db, notification_details.id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="No Data Found For Update")

    notification_details.updated_date = datetime.datetime.now().replace(microsecond=0)
    return crud.notification_crud_obj.update(
        db=db, db_obj=db_obj, obj_in=notification_details
    )


@router.post("/update_is_unread_by_id", response_model=List[schemas.NotificationRead])
def update_is_unread_by_id(
    notification_id_list: list,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    updated_list = []
    for notification_id in notification_id_list:
        db_obj = crud.notification_crud_obj.get(db, notification_id)
        if not db_obj:
            raise HTTPException(status_code=404, detail="No Data Found For Update")
        notification_details = schemas.NotificationUpdate(
            id=db_obj.id,
            notification_message=db_obj.notification_message,
            type_of_notification=db_obj.type_of_notification,
            user_id=db_obj.user_id,
            status=db_obj.status,
            is_unread=False,
            created_date=db_obj.created_date,
            updated_date=datetime.datetime.now().replace(microsecond=0),
        )
        obj_out = crud.notification_crud_obj.update(
            db=db, db_obj=db_obj, obj_in=notification_details
        )
        updated_list.append(obj_out)
    return updated_list


@router.get(
    "/get_all_notification_of_current_user",
    response_model=List[schemas.NotificationRead],
)
def get_all_notification_of_current_user(
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
            logging.info("No Admin Found For That User")
            return []

    else:
        user_id = current_user.id
    notification_list = crud.notification_crud_obj.get_by_user_id(
        db=db, user_id=user_id
    )
    if not notification_list:
        raise HTTPException(status_code=404, detail="No Data Found For Requested ID")
    return notification_list


@router.get(
    "/get_all_unread_notification_of_current_user",
    response_model=List[schemas.NotificationRead],
)
def get_all_unread_notification_of_current_user(
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
            logging.info("No Admin Found For That User")
            return []

    else:
        user_id = current_user.id
    notification_list = crud.notification_crud_obj.get_unread_by_user_id(
        db=db, user_id=user_id
    )
    if not notification_list:
        return []
    return notification_list


@router.get("/get_notification_type_of_current_user_by_date")
def get_notification_type_of_current_user_by_date(
    user_date: datetime.date,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    start_time = datetime.datetime.min.time()
    end_time = datetime.datetime.max.time()
    start_date = datetime.datetime.combine(user_date, start_time).replace(microsecond=0)
    end_date = datetime.datetime.combine(user_date, end_time).replace(microsecond=0)
    notification_type_list = (
        crud.notification_crud_obj.get_notification_type_by_date_user_id(
            db=db, user_id=current_user.id, start_date=start_date, end_date=end_date
        )
    )
    logging.info(notification_type_list)
    if not notification_type_list:
        raise HTTPException(
            status_code=404, detail="No Notification Type Found For Requested Date"
        )

    notification_type_list = [
        item for sub_list in notification_type_list for item in sub_list
    ]
    return notification_type_list


@router.get(
    "/get_notification_data_of_current_user_by_date_type",
    response_model=List[schemas.NotificationRead],
)
def get_notification_data_of_current_user_by_date_type(
    user_date: datetime.date,
    user_notification_type: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    start_time = datetime.datetime.min.time()
    end_time = datetime.datetime.max.time()
    start_date = datetime.datetime.combine(user_date, start_time).replace(microsecond=0)
    end_date = datetime.datetime.combine(user_date, end_time).replace(microsecond=0)
    notification_list = (
        crud.notification_crud_obj.get_notification_data_by_date_user_id_type(
            db=db,
            user_id=current_user.id,
            user_notification_type=user_notification_type,
            start_date=start_date,
            end_date=end_date,
        )
    )
    if not notification_list:
        raise HTTPException(
            status_code=404,
            detail="No Notification Data Found For Requested Date & Type",
        )
    return notification_list
