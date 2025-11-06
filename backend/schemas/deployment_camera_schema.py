from datetime import datetime
from typing import Optional, List, Union, Dict

from pydantic import BaseModel
from schemas.location import LocationNameRead
from schemas.pagination import PaginationResponse


class DeploymentCameraBase(BaseModel):
    rtsp_url: str
    process_fps: Optional[int] = None
    is_tcp: Optional[bool] = None
    camera_name: str
    camera_resolution: Optional[str] = None
    location_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_processing: Optional[bool] = None
    status: Optional[bool] = True
    inference_url: Optional[Union[Dict, List]]

    class Config:
        orm_mode = True


class DeploymentCameraCreate(DeploymentCameraBase):
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None


class DeploymentCameraUpdate(DeploymentCameraCreate):
    id: int
    updated_date: Optional[datetime] = None


class DeploymentCameraRead(DeploymentCameraBase):
    id: int
    status: bool
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None

    class Config:
        orm_mode = True


class CameraRead(DeploymentCameraBase):
    id: int
    status: bool
    created_date: Optional[datetime]
    updated_date: Optional[datetime]

    class Config:
        orm_mode = True


class CameraUpdateResponece(CameraRead):
    message: str


class CameraUpdate(DeploymentCameraCreate):
    id: int
    updated_date: Optional[datetime]


class LocationRead(BaseModel):
    location_name: str
    id: int

    class Config:
        orm_mode = True


class LocationStatus(LocationRead):
    created_date: datetime
    updated_date: datetime
    status: bool

    class Config:
        orm_mode = True


class LocationReadCompany(LocationRead):
    company_id: int

    class Config:
        orm_mode = True


class CameraLocationRead(DeploymentCameraRead):
    location_details: LocationReadCompany

    class Config:
        orm_mode = True


class CameraFilter(BaseModel):
    page_number: int = 1
    page_size: int = 10


class CameraBaseResponse(BaseModel):
    id: int
    camera_name: str
    is_active: bool
    location_details: LocationNameRead

    class Config:
        orm_mode = True


class CameraPaginateResponse(BaseModel):
    items: List[CameraBaseResponse]
    page_info: PaginationResponse
