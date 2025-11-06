import json
import logging
import os
from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

import crud
import models
from api import deps
from core.result_utils import get_camera_id_list_by_location_list

from typing import Optional
import json

from crud.activity_crud import activity_crud_obj
from enums.error_enum import CommonErrorEnum

router = APIRouter()


# @router.get("/get_activity_type")
# def get_activity_type(
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     activity_type_list = json.loads(os.getenv("ACTIVITY_LOGS_TYPE", "[]"))
#     if crud.user.is_supervisor(current_user):
#         if "USER_LOGIN" in activity_type_list:
#             activity_type_list.remove("USER_LOGIN")
#         return activity_type_list
#     else:
#         return activity_type_list
#
#
# @router.post("/get_activity_logs")
# def get_activity_logs(
#     page_number: int,
#     activity_logs_list: List[str],
#     start_date: datetime,
#     end_date: datetime,
#     search_key: Optional[str] = "",
#     page_size: Optional[int] = 10,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_user),
# ) -> Any:
#     if crud.user.is_supervisor(current_user):
#
#         if current_user.locations:
#             location_id_list = [location.id for location in current_user.locations]
#         else:
#             raise HTTPException(
#                 status_code=404, detail=CommonErrorEnum.NO_LOCATION_FOUND_FOR_USER.value
#             )
#         camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)
#
#         if "-1" in activity_logs_list:
#             activity_logs_list = json.loads(os.getenv("ACTIVITY_LOGS_TYPE", "[]"))
#             if "USER_LOGIN" in activity_logs_list:
#                 activity_logs_list.remove("USER_LOGIN")
#
#     else:
#         location_obj = crud.location_crud_obj.get_all_company_enabled_location(
#             db, current_user.company_id
#         )
#         location_id_list = [location.id for location in location_obj]
#         camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)
#         if "-1" in activity_logs_list:
#             activity_logs_list = json.loads(os.getenv("ACTIVITY_LOGS_TYPE", "[]"))
#
#     data_list = activity_crud_obj.get_filter_data(
#         db,
#         search_key,
#         camera_id_list,
#         activity_logs_list,
#         start_date,
#         end_date,
#         page_number,
#         page_size,
#     )
#     return data_list
#
#
# @router.post("/get_superuser_activity_logs")
# def get_superuser_activity_logs(
#     company_id: int,
#     page_number: int,
#     activity_logs_list: List[str],
#     start_date: datetime,
#     end_date: datetime,
#     search_key: Optional[str] = "",
#     page_size: Optional[int] = 10,
#     db: Session = Depends(deps.get_db),
#     current_user: models.User = Depends(deps.get_current_active_superuser),
# ) -> Any:
#     location_obj = crud.location_crud_obj.get_all_company_enabled_location(
#         db, company_id
#     )
#     location_id_list = [location.id for location in location_obj]
#     camera_id_list = get_camera_id_list_by_location_list(location_id_list, db)
#
#     if "-1" in activity_logs_list:
#         activity_logs_list = json.loads(os.getenv("ACTIVITY_LOGS_TYPE", "[]"))
#
#     data_list = activity_crud_obj.get_filter_data(
#         db,
#         search_key,
#         camera_id_list,
#         activity_logs_list,
#         start_date,
#         end_date,
#         page_number,
#         page_size,
#     )
#     return data_list
