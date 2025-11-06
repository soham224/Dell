"""
FastAPI endpoints for AI People Footfall Analysis inserts.

This endpoint is intended to be called by AI services to persist per-frame
footfall analytics data into MySQL.

Behavior:
- Validates payload via Pydantic
- Normalizes frame_time to UTC (naive) to match DB convention
- Enforces 'IN'/'OUT' via both Pydantic and DB ENUM
"""
from __future__ import annotations

from datetime import timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api import deps
import crud
import schemas

router = APIRouter()


@router.post(
    "/ai_people_footfall/add",
    response_model=schemas.AiPeopleFootfallRead,
    tags=["AI Footfall"],
)
def add_ai_people_footfall(
    payload: schemas.AiPeopleFootfallCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Insert a new AI people footfall record.

    - Converts `frame_time` to UTC and removes tzinfo before saving.
    - Upper-cases `frame_analysis` defensively (validated by schema anyway).
    """
    try:
        data = payload.dict(exclude_unset=True)

        # Normalize frame_time to UTC naive
        ft = data.get("frame_time")
        if ft is not None:
            if ft.tzinfo is not None:
                ft = ft.astimezone(timezone.utc).replace(tzinfo=None)
            data["frame_time"] = ft

        # Defensive upper-case on frame_analysis
        if "frame_analysis" in data and isinstance(data["frame_analysis"], str):
            data["frame_analysis"] = data["frame_analysis"].upper()

        created = crud.ai_people_footfall_crud.create(db=db, obj_in=data)
        if not created:
            raise HTTPException(status_code=500, detail="Insert failed")
        return created
    except HTTPException:
        raise
    except Exception:
        # Avoid leaking internal details
        raise HTTPException(status_code=500, detail="Internal Server Error")
