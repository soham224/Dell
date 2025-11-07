from typing import Optional, List
from pydantic import BaseModel


class CameraUseCaseResponse(BaseModel):
    usecase_id: int
    usecase_name: str
    camera_id: int
    camera_name: str


class CameraUseCaseListResponse(BaseModel):
    data: List[CameraUseCaseResponse]


class UsecaseMappingCreate(BaseModel):
    usecase_id: int
    camera_id: int
    usecase_timeout: Optional[int] = 0
    second_before_event: Optional[int] = 0
    second_after_event: Optional[int] = 0


class UsecaseMappingUpdate(BaseModel):
    id: int
    camera_id: Optional[int]
    usecase_id: Optional[int]
    roi: Optional[list]
    roi_type: Optional[str]
    line_roi: Optional[list]
    usecase_timeout: Optional[int]
    second_before_event: Optional[int]
    second_after_event: Optional[int]
    labels: Optional[list]
    roi_labels: Optional[str]
    status: Optional[bool]
