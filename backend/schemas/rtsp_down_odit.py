from datetime import datetime

from pydantic import BaseModel
from typing import List

from schemas.pagination import PaginationResponse


class RtspDownOditFilter(BaseModel):
    camera_id: List[int] = None
    rtsp_status: int = None
    page_number: int = 1
    page_size: int = 10
    order_by: str = "desc"
    start_date: datetime = None
    end_date: datetime = None


class CameraBase(BaseModel):
    camera_name: str

    class Config:
        orm_mode = True


class RtspDownOditBase(BaseModel):
    id: int
    camera_id: int
    rtsp_status: bool
    created_date: datetime
    camera_detail: CameraBase

    class Config:
        orm_mode = True


class RtspDownOditPaginationBase(BaseModel):
    items: List[RtspDownOditBase]
    page_info: PaginationResponse
