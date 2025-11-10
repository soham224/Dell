from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel

from .location import LocationRead


# Shared properties
class CameraBase(BaseModel):
    camera_name: str
    nvr_id: str
    status: bool = True
    deleted: bool = False
    # location_id: int


class CameraCreate(CameraBase):
    location_id: int
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None


class CameraUpdate(CameraBase):
    id: int
    location_id: int
    updated_date: Optional[datetime]


class CameraRead(CameraBase):
    id: int
    created_date: datetime
    updated_date: datetime
    # location_id: int
    locations: LocationRead

    class Config:
        orm_mode = True


class CameraStatus(BaseModel):
    id: int
    status: bool = True
    updated_date: Optional[datetime]


class CameraRtspBase(BaseModel):
    """Schema aligned to models.camera_manager.CameraManager.
    Only fields present on the model are defined here to prevent ORM create/update errors.
    """

    camera_name: str
    rtsp_url: str
    camera_resolution: str
    process_fps: int
    location_id: int
    is_active: bool
    is_processing: bool
    status: bool = True
    is_tcp: Optional[bool]
    inference_url: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


class CameraRtspCreate(CameraRtspBase):
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None


class CameraRtspUpdate(CameraRtspBase):
    id: int
    updated_date: Optional[datetime]


class CameraRtspResultTypeUpdate(BaseModel):
    id: int
    result_types: List[int] = []


class ResultTypeRead(BaseModel):
    id: int
    result_type: str

    class Config:
        orm_mode = True


class CameraRtspRead(CameraRtspBase):
    id: int
    created_date: datetime
    updated_date: datetime
    location_details: LocationRead

    class Config:
        orm_mode = True


class CameraRtspStatus(BaseModel):
    id: int
    status: bool = True
    updated_date: Optional[datetime]


class LocationID(BaseModel):
    location_id: List[int]


class CameraRoiGet(BaseModel):
    """ROI fetch request payload using usecase mapping."""

    camera_id: int
    usecase_id: int


class CameraRoiUpdate(CameraRoiGet):
    """ROI update request payload using usecase mapping."""

    roi_list: list
