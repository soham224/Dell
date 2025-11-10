from typing import Optional
from sqlalchemy import join, select
from sqlalchemy.orm import Session, joinedload

from crud.base import CRUDBase
from models.camera_manager import CameraManager
from models.camera_usecase_mapping import CameraUseCaseMapping
from models.location import Location, UserLocation
from models.user import User
from schemas.camera import *


class CRUDCameraRTSP(CRUDBase[CameraManager, CameraRtspCreate, CameraRtspUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def get_by_name(self, db: Session, *, name: str) -> Optional[CameraManager]:
        return db.query(CameraManager).filter(CameraManager.camera_name == name).first()

    def get_all_camera(self, db: Session):
        return db.query(CameraManager).all()

    def get_cameras_rtsp_by_location(self, db: Session, location_id: int) -> object:
        return (
            db.query(CameraManager)
            .filter(CameraManager.location_id == location_id)
            .all()
        )

    def get_location(self, db: Session, location_id: int):
        # Eager load the related location for cameras in a location
        return (
            db.query(CameraManager)
            .options(joinedload(CameraManager.location_details))
            .filter(CameraManager.location_id == location_id)
            .all()
        )

    def get_all_cameras_by_user_id(self, db: Session, user_id: int):
        return (
            db.query(CameraManager)
            .join(UserLocation, UserLocation.c.location_id == CameraManager.location_id)
            .join(Location, Location.id == UserLocation.c.location_id)
            .join(User, User.id == UserLocation.c.user_id)
            .filter(User.id == user_id)
            .all()
        )

    def get_by_name_for_update(
        self, db: Session, name: str, _id: int
    ) -> Optional[CameraManager]:
        return (
            db.query(CameraManager)
            .filter(CameraManager.camera_name == name)
            .filter(CameraManager.id != _id)
            .first()
        )

    # ROI helpers based on CameraUseCaseMapping (camera_id + usecase_id)
    def update_camera_usecase_roi_value(
        self, db: Session, camera_id: int, usecase_id: int, roi_list: list
    ) -> None:
        """Upsert ROI: update if mapping exists; create otherwise."""
        mapping = (
            db.query(CameraUseCaseMapping)
            .filter(CameraUseCaseMapping.camera_id == camera_id)
            .filter(CameraUseCaseMapping.usecase_id == usecase_id)
            .first()
        )
        if mapping:
            mapping.roi = {"location": roi_list}
            db.add(mapping)
        else:
            mapping = CameraUseCaseMapping(
                camera_id=camera_id,
                usecase_id=usecase_id,
                roi={"location": roi_list},
                # Safe defaults for DBs that enforce NOT NULL on these fields
                usecase_timeout=30,
                second_before_event=1,
                second_after_event=1,
                roi_type=None,
                status=True,
            )
            db.add(mapping)
        db.commit()
        db.refresh(mapping)

    def get_camera_usecase_roi_value(
        self, db: Session, camera_id: int, usecase_id: int
    ) -> Optional[CameraUseCaseMapping]:
        return (
            db.query(CameraUseCaseMapping)
            .filter(CameraUseCaseMapping.camera_id == camera_id)
            .filter(CameraUseCaseMapping.usecase_id == usecase_id)
            .first()
        )


camera_rtsp_crud_obj = CRUDCameraRTSP(CameraManager)
