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

from datetime import timezone, datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from api import deps
import crud
import schemas
from models.ai_people_footfall_analysis import AiPeopleFootfallAnalysis
from models.camera_manager import CameraManager
from models.user import User
from models.location import Location
from models.usecase import UseCase

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
    - Does not require authentication context for setting user_id.
    """
    try:
        data = payload.dict(exclude_unset=True)

        # Normalize and validate frame_time as UTC naive
        ft = data.get("frame_time")
        if ft is not None:
            # If timezone-aware, convert to UTC and strip tzinfo. If naive, treat as UTC already.
            if ft.tzinfo is not None:
                ft = ft.astimezone(timezone.utc).replace(tzinfo=None)
            data["frame_time"] = ft
        else:
            raise HTTPException(status_code=400, detail="frame_time is required")

        # Defensive upper-case on frame_analysis
        if "frame_analysis" in data and isinstance(data["frame_analysis"], str):
            data["frame_analysis"] = data["frame_analysis"].upper()
            if data["frame_analysis"] not in {"IN", "OUT"}:
                raise HTTPException(
                    status_code=400, detail="frame_analysis must be 'IN' or 'OUT'"
                )

        # Validate required numeric fields (total_count is optional; computed if omitted)
        required_int_fields = [
            "frame_count",
            "camera_id",
            "user_id",
            "location_id",
            "usecase_id",
        ]
        for f in required_int_fields:
            if f not in data:
                raise HTTPException(status_code=400, detail=f"{f} is required")
            try:
                data[f] = int(data[f])
            except Exception:
                raise HTTPException(status_code=400, detail=f"{f} must be an integer")

        # If total_count not provided, compute running total for the IST day by summing frame_count
        if data.get("total_count") is None:
            try:
                # Determine IST day window for the provided frame_time (UTC naive)
                ist_offset = timedelta(hours=5, minutes=30)
                ft_utc = data["frame_time"]  # naive UTC
                ft_ist = ft_utc + ist_offset
                ist_day_start = datetime(ft_ist.year, ft_ist.month, ft_ist.day, 0, 0, 0)
                ist_next_day_start = ist_day_start + timedelta(days=1)

                # Convert IST window back to UTC naive bounds [start, next_start)
                utc_day_start = ist_day_start - ist_offset
                utc_next_day_start = ist_next_day_start - ist_offset

                # Sum all prior frame_count for same group within the IST day
                prior_sum = (
                    db.query(
                        func.coalesce(func.sum(AiPeopleFootfallAnalysis.frame_count), 0)
                    )
                    .filter(AiPeopleFootfallAnalysis.frame_time >= utc_day_start)
                    .filter(
                        AiPeopleFootfallAnalysis.frame_time
                        < min(utc_next_day_start, ft_utc)
                    )
                    .filter(AiPeopleFootfallAnalysis.camera_id == data["camera_id"])
                    .filter(AiPeopleFootfallAnalysis.user_id == data["user_id"])
                    .filter(AiPeopleFootfallAnalysis.location_id == data["location_id"])
                    .filter(AiPeopleFootfallAnalysis.usecase_id == data["usecase_id"])
                    .scalar()
                )

                # Current total is prior_sum + this frame_count
                data["total_count"] = int(prior_sum) + data["frame_count"]
            except HTTPException:
                raise
            except Exception:
                # If computation fails, fallback to using provided frame_count as total for the day
                data["total_count"] = data["frame_count"]

        # Validate foreign key existence
        cam = (
            db.query(CameraManager)
            .filter(CameraManager.id == data["camera_id"])
            .first()
        )
        if cam is None:
            raise HTTPException(
                status_code=400,
                detail="camera_id does not reference an existing camera",
            )

        usr = db.query(User).filter(User.id == data["user_id"]).first()
        if usr is None:
            raise HTTPException(
                status_code=400, detail="user_id does not reference an existing user"
            )

        loc = db.query(Location).filter(Location.id == data["location_id"]).first()
        if loc is None:
            raise HTTPException(
                status_code=400,
                detail="location_id does not reference an existing location",
            )

        uc = db.query(UseCase).filter(UseCase.id == data["usecase_id"]).first()
        if uc is None:
            raise HTTPException(
                status_code=400,
                detail="usecase_id does not reference an existing usecase",
            )

        created = crud.ai_people_footfall_crud.create(db=db, obj_in=data)
        if not created:
            raise HTTPException(status_code=500, detail="Insert failed")
        return created
    except HTTPException:
        raise
    except Exception:
        # Avoid leaking internal details
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/get_people_count_data",
    response_model=schemas.AiPeopleFootfallPagedResponse,
    tags=["AI Footfall"],
)
def get_people_count_data(
    *,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user),
    page_number: int = Query(..., ge=1, description="Page number (1-based)"),
    page_size: Optional[int] = Query(10, ge=1, le=1000, description="Page size"),
    filter_body: schemas.AiPeopleFootfallFilter = None,
    start_date: Optional[datetime] = Query(
        None, description="Start datetime (inclusive) in ISO 8601"
    ),
    end_date: Optional[datetime] = Query(
        None, description="End datetime (inclusive) in ISO 8601"
    ),
) -> Any:
    """Return all `ai_people_footfall_analysis` rows for the current active user.

    based on the model relationships. Eager loading is used to avoid N+1 queries.
    """
    try:
        # Normalize datetimes (if provided) to UTC naive to match DB convention
        if start_date is not None and start_date.tzinfo is not None:
            start_date = start_date.astimezone(timezone.utc).replace(tzinfo=None)
        if end_date is not None and end_date.tzinfo is not None:
            end_date = end_date.astimezone(timezone.utc).replace(tzinfo=None)

        # Validate time window if both provided
        if start_date is not None and end_date is not None and start_date > end_date:
            raise HTTPException(
                status_code=400, detail="start_date must be <= end_date"
            )

        # Base query filtered by user and optional frame_time window (inclusive)
        q = (
            db.query(AiPeopleFootfallAnalysis)
            .options(
                joinedload(AiPeopleFootfallAnalysis.camera),
                joinedload(AiPeopleFootfallAnalysis.usecase),
                joinedload(AiPeopleFootfallAnalysis.location),
            )
            .filter(AiPeopleFootfallAnalysis.user_id == current_user.id)
        )
        if start_date is not None:
            q = q.filter(AiPeopleFootfallAnalysis.frame_time >= start_date)
        if end_date is not None:
            q = q.filter(AiPeopleFootfallAnalysis.frame_time <= end_date)

        # Apply optional filters from body; ignore if marker -1 is present
        if filter_body is not None:
            location_id_list = filter_body.location_id_list
            camera_id_list = filter_body.camera_id_list
            # label_list present for parity but not used

            if location_id_list is not None and ("-1" not in location_id_list):
                if len(location_id_list) > 0:
                    try:
                        loc_ids = [int(x) for x in location_id_list]
                        q = q.filter(AiPeopleFootfallAnalysis.location_id.in_(loc_ids))
                    except Exception:
                        pass
            if camera_id_list is not None and ("-1" not in camera_id_list):
                if len(camera_id_list) > 0:
                    try:
                        cam_ids = [int(x) for x in camera_id_list]
                        q = q.filter(AiPeopleFootfallAnalysis.camera_id.in_(cam_ids))
                    except Exception:
                        pass

        # Order by frame_time then id for stable pagination
        q = q.order_by(
            AiPeopleFootfallAnalysis.frame_time.asc(), AiPeopleFootfallAnalysis.id.asc()
        )

        # Total before pagination
        total = q.count()

        # Pagination
        offset = (page_number - 1) * page_size
        q = q.offset(offset).limit(page_size)

        rows = q.all()

        resp: List[schemas.AiPeopleFootfallNestedRead] = []
        for r in rows:
            camera_details = None
            if r.camera is not None:
                camera_details = schemas.CameraDetails(
                    camera_id=r.camera.id,
                    camera_name=r.camera.camera_name,
                )

            usecase_details = None
            if r.usecase is not None:
                # models.usecase has field `usecase` for name
                usecase_details = schemas.UsecaseDetails(
                    usecase_id=r.usecase.id,
                    usecase_name=r.usecase.usecase,
                )

            location_details = None
            if r.location is not None:
                location_details = schemas.LocationDetails(
                    location_id=r.location.id,
                    location_name=r.location.location_name,
                )

            resp.append(
                schemas.AiPeopleFootfallNestedRead(
                    id=r.id,
                    frame_time=r.frame_time,
                    frame_analysis=r.frame_analysis,
                    frame_count=r.frame_count,
                    total_count=r.total_count,
                    camera_details=camera_details,
                    usecase_details=usecase_details,
                    location_details=location_details,
                )
            )
        return {
            "items": resp,
            "total": total,
            "page": page_number,
            "page_size": page_size,
        }
    except HTTPException:
        raise
    except Exception:
        # Avoid leaking internal details
        raise HTTPException(status_code=500, detail="Internal Server Error")
