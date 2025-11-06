from datetime import datetime
from typing import List

from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.activity import ActivityLogs
from schemas.activity_schema import ActivityCreate, ActivityUpdate
from sqlalchemy import or_
import math


class CRUDActivity(CRUDBase[ActivityLogs, ActivityCreate, ActivityUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def insert_activity_data(
        self,
        db: Session,
        activity_type: str,
        title: str,
        description: str,
    ):
        new_activity = ActivityLogs(
            activity_type=activity_type,
            title=title,
            description=description,
            timestamp=datetime.utcnow(),
        )
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        return new_activity

    def get_filter_data(
        self,
        db: Session,
        search_key,
        camera_id_list: List[int] = None,
        activity_type_list: List[str] = None,
        start_date: datetime = None,
        end_date: datetime = None,
        page_number: int = 1,
        page_size: int = 10,
    ):

        query = db.query(ActivityLogs)

        if camera_id_list:
            query = query.filter(
                or_(
                    ActivityLogs.camera_id == None,
                    ActivityLogs.camera_id.in_(camera_id_list),
                )
            )

        if activity_type_list:
            query = query.filter(ActivityLogs.activity_type.in_(activity_type_list))

        if start_date:
            query = query.filter(ActivityLogs.timestamp >= start_date)
        if end_date:
            query = query.filter(ActivityLogs.timestamp <= end_date)

        if search_key and len(search_key) > 2:
            query = query.filter(
                ActivityLogs.title.ilike(f"%{search_key}%"),
            )

        query = query.order_by(ActivityLogs.timestamp.desc())

        results_count = query.count()

        offset = (page_number - 1) * page_size
        query = query.offset(offset).limit(page_size)

        results = query.all()

        if results_count > 0:
            total_pages = math.ceil(results_count / page_size)
            return {
                "data": results,
                "page_size": page_size,
                "total_pages": total_pages,
                "total_count": results_count,
            }
        else:
            return {
                "data": results,
                "page_size": page_size,
                "total_pages": 0,
                "total_count": 0,
            }


activity_crud_obj = CRUDActivity(ActivityLogs)
