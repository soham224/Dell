"""
Pydantic schemas for ai_people_footfall_analysis API contracts.

- AiPeopleFootfallCreate: request body for inserting a record
- AiPeopleFootfallRead: response body after creation

Validation:
- frame_analysis limited to 'IN' or 'OUT'
- frame_count and total_count must be >= 0
- frame_time is a datetime (UTC expected by convention)
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, conint


class AiPeopleFootfallBase(BaseModel):
    """Shared attributes for AI people footfall entries."""

    frame_time: datetime = Field(..., description="UTC timestamp of the frame")
    frame_analysis: Literal["IN", "OUT"] = Field(
        ..., description="Direction/category determined by AI"
    )
    frame_count: conint(ge=0) = Field(
        0, description="Count for the current frame (non-negative)"
    )
    total_count: conint(ge=0) = Field(0, description="Cumulative total (non-negative)")


class AiPeopleFootfallCreate(AiPeopleFootfallBase):
    """Schema used for creating a new record."""

    pass


class AiPeopleFootfallRead(AiPeopleFootfallBase):
    """Schema returned after creating/fetching a record."""

    id: int

    class Config:
        orm_mode = True
