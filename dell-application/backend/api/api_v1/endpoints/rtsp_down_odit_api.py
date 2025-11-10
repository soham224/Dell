"""RTSP down ODIT endpoints.

Provides paginated queries for RTSP down ODIT records for current user and
superuser scope.

Category: API / RTSP / ODIT
"""

import models
from api import deps
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import schemas
from enums.error_enum import CommonErrorEnum

router = APIRouter()


@router.post(
    "/get_rtsp_down_odit_data", response_model=schemas.RtspDownOditPaginationBase
)
def get_rtsp_down_odit_data(
    db_filter: schemas.RtspDownOditFilter,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    db_obj = crud.rtsp_down_odit_crud_object.get_filter_rtsp_down_odit_data(
        db=db, company_id=current_user.company_id, db_filter=db_filter
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)
    return db_obj


@router.post(
    "/get_rtsp_down_odit_data_by_company_id",
    response_model=schemas.RtspDownOditPaginationBase,
)
def get_rtsp_down_odit_data_by_company_id(
    company_id: int,
    db_filter: schemas.RtspDownOditFilter,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    db_obj = crud.rtsp_down_odit_crud_object.get_filter_rtsp_down_odit_data(
        db=db, company_id=company_id, db_filter=db_filter
    )
    if not db_obj:
        raise HTTPException(status_code=404, detail=CommonErrorEnum.NO_DATA_FOUND.value)
    return db_obj
