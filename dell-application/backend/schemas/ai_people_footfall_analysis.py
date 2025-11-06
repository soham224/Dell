"""
    Pydantic schemas for ai_people_footfall_analysis API contracts.

    - AiPeopleFootfallCreate: request body for inserting a record
    - AiPeopleFootfallRead: response body after creation

    Validation:
    - frame_analysis limited to 'IN' or 'OUT'
    - frame_count and total_count must be >= 0
    - frame_time is a datetime (UTC expected by convention)
    - Optional foreign key fields are accepted to associate the record with camera/user/location/usecase
    """

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional, List

from pydantic import BaseModel, Field, conint


class AiPeopleFootfallBase(BaseModel):
    """Shared attributes for AI people footfall entries.

    All fields are required for insert API to ensure complete records,
    except `total_count`, which is optional and computed by the backend if omitted.
    """

    frame_time: datetime = Field(..., description="UTC timestamp of the frame")
    frame_analysis: Literal["IN", "OUT"] = Field(
        ..., description="Direction/category determined by AI"
    )
    frame_count: conint(ge=0) = Field(
        ..., description="Count for the current frame (non-negative)"
    )
    # Optional so backend can manage daily accumulation/reset behavior
    total_count: Optional[conint(ge=0)] = Field(
        None, description="Cumulative total (non-negative); computed if omitted"
    )

    # Required FKs to link analytics to their domain entities
    camera_id: int = Field(
        ..., description="FK to camera_manager.id for the source camera"
    )
    user_id: int = Field(
        ..., description="FK to user.id for the responsible/requesting user"
    )
    location_id: int = Field(
        ..., description="FK to location.id where the camera is installed"
    )
    usecase_id: int = Field(
        ..., description="FK to usecase.id representing the AI use case"
    )


class AiPeopleFootfallCreate(AiPeopleFootfallBase):
    """Schema used for creating a new record."""

    pass


class AiPeopleFootfallRead(AiPeopleFootfallBase):
    """Schema returned after creating/fetching a record."""

    id: int

    class Config:
        orm_mode = True


class AiPeopleFootfallFilter(BaseModel):
    """Request body for filtering footfall results.

    Matches the body structure used by result APIs: three optional lists.
    Values may be strings; they are cast to integers where required.
    Include "-1" as a marker to ignore a filter.
    """

    camera_id_list: Optional[List[str]] = None
    label_list: Optional[List[str]] = None
    location_id_list: Optional[List[str]] = None


class CameraDetails(BaseModel):
    """Nested camera details to enrich footfall responses."""

    camera_id: int
    camera_name: str


class UsecaseDetails(BaseModel):
    """Nested usecase details to enrich footfall responses."""

    usecase_id: int
    usecase_name: str


class LocationDetails(BaseModel):
    """Nested location details to enrich footfall responses."""

    location_id: int
    location_name: str


class AiPeopleFootfallNestedRead(BaseModel):
    """Response schema including all table columns and nested FK details.

    This schema mirrors the table columns and adds nested dictionaries for
    camera/usecase/location where applicable. Fields are optional to keep
    backward compatibility with nullable foreign keys.
    """

    id: int
    frame_time: datetime
    frame_analysis: Literal["IN", "OUT"]
    frame_count: conint(ge=0)
    total_count: conint(ge=0)

    camera_details: Optional[CameraDetails] = None
    usecase_details: Optional[UsecaseDetails] = None
    location_details: Optional[LocationDetails] = None

    class Config:
        orm_mode = True


class AiPeopleFootfallPagedResponse(BaseModel):
    """Wrapper response for paginated footfall list results."""

    items: List[AiPeopleFootfallNestedRead]
    total: int
    page: int
    page_size: int
