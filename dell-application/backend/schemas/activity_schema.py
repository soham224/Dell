from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel
from schemas.pagination import PaginationResponse


class ActivityBase(BaseModel):
    activity_type: Optional[str] = None
    timestamp: Optional[datetime] = None
    camera_id: Optional[int] = None
    camera_status: Optional[bool] = None
    title: Optional[str] = None
    description: Optional[str] = None
    activity_event_timestamp: Optional[bool] = None
    activity_url: Optional[bool] = None

    class Config:
        orm_mode = True


class ActivityCreate(ActivityBase):
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None


class ActivityUpdate(ActivityBase):
    id: int
    updated_date: Optional[datetime] = None
