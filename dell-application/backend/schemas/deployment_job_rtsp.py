from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from schemas.pagination import PaginationResponse

from schemas.user import User
from schemas.location import LocationNameRead


# Shared properties
class DeploymentJobRTSPManagerBase(BaseModel):
    rtsp_url: str
    camera_name: str
    camera_resolution: str
    process_fps: int
    location_id: int
    camera_ip: Optional[str]
    is_active: bool
    is_processing: bool
    deployment_job_rtsp_id: int
    is_tcp: Optional[bool]

    class Config:
        orm_mode = True


class DeploymentJobRTSPManagerRead(BaseModel):
    id: int
    camera_name: str

    class Config:
        orm_mode = True


class CameraLabelMappingRead(BaseModel):
    camera_id: int
    labels: Optional[list]

    class Config:
        orm_mode = True
