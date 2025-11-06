from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class Detection(BaseModel):
    label: str
    location: Optional[List[float]] = None


class ResultBody(BaseModel):
    detection: Optional[List[Detection]] = None


class ResultBase(BaseModel):
    user_id: Optional[str] = None
    camera_id: Optional[str] = None
    image_name: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    result: Optional[ResultBody] = None
    counts: Optional[Dict[str, int]] = None
    is_hide: Optional[bool] = False
    status: Optional[bool] = True
    # Accept incoming frame_time (from producer) but store/return frame_date in DB
    frame_time: Optional[datetime] = None
    frame_date: Optional[datetime] = None
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None

    @validator("frame_time", pre=True, always=False)
    def _ensure_frame_time_tz(
        cls, v: Optional[Union[str, datetime]]
    ) -> Optional[datetime]:
        """Accept datetime or ISO8601 string, ensure tz-aware in UTC and strip microseconds."""
        if v is None:
            return v
        # Parse string inputs (support trailing 'Z')
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
            # Handle 'Z' suffix from many producers
            if v.endswith("Z"):
                v = v[:-1] + "+00:00"
            try:
                v = datetime.fromisoformat(v)
            except ValueError:
                # If parsing fails, let Pydantic try later; return as-is
                return v
        if isinstance(v, datetime):
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            return v.astimezone(timezone.utc).replace(microsecond=0)
        # For unexpected types, return as-is to let Pydantic handle/raise
        return v

    @validator("frame_date", pre=True, always=False)
    def _ensure_frame_date_tz(
        cls, v: Optional[Union[str, datetime]]
    ) -> Optional[datetime]:
        """Accept datetime or ISO8601 string, ensure tz-aware in UTC and strip microseconds."""
        if v is None:
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
            if v.endswith("Z"):
                v = v[:-1] + "+00:00"
            try:
                v = datetime.fromisoformat(v)
            except ValueError:
                return v
        if isinstance(v, datetime):
            if v.tzinfo is None:
                v = v.replace(tzinfo=timezone.utc)
            return v.astimezone(timezone.utc).replace(microsecond=0)
        return v


class ResultCreate(ResultBase):
    # For creation, at least camera_id and result should be provided typically,
    # but we keep them optional to match flexible producer inputs.
    pass


class ResultRead(ResultBase):
    id: Optional[str] = Field(None, alias="_id")

    class Config:
        allow_population_by_field_name = True
        orm_mode = True
