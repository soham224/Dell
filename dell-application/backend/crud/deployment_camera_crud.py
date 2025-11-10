"""CRUD operations for deployment cameras.

Encapsulates common queries and mutations on `models.camera_manager.CameraManager`,
including location-scoped listings and paginated filters.

Category: Data Access / CRUD / Cameras
"""

import datetime

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from crud.base import CRUDBase
from models import Location
from models.camera_manager import CameraManager
from schemas.deployment_camera_schema import *
from core.pagination_utils import get_page_info


class CRUDDeploymentCameras(
    CRUDBase[CameraManager, DeploymentCameraCreate, DeploymentCameraUpdate]
):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def get_by_name_and_location_id(
        self, db: Session, camera_name: str, locattion_id: int
    ):
        return (
            db.query(CameraManager)
            .filter(CameraManager.camera_name == camera_name)
            .filter(CameraManager.location_id == locattion_id)
            .all()
        )

    def get_by_name_location_id_and_id(
        self, db: Session, camera_name: str, location_id: int, camera_id: int
    ):
        return (
            db.query(CameraManager)
            .filter(CameraManager.id != camera_id)
            .filter(CameraManager.camera_name == camera_name)
            .filter(CameraManager.location_id == location_id)
            .all()
        )

    def insert_deployment_camera(self, cam_settings, db):
        try:
            cam_settings.created_date = datetime.now().replace(microsecond=0)
            cam_settings.updated_date = datetime.now().replace(microsecond=0)
            cam_settings.status = True
            cam_settings.is_tcp = True
            cam_settings.is_active = True
            cam_settings.is_processing = True
            cam_settings.process_fps = 60
            cam_settings.camera_resolution = "640:640"

            if isinstance(cam_settings, dict):
                obj_in = cam_settings
            else:
                obj_in = cam_settings.dict(exclude_unset=True)

            obj_in_data = jsonable_encoder(obj_in)

            deployment_camera_obj = CameraManager(**obj_in_data)
            db.add(deployment_camera_obj)
            db.commit()
            db.refresh(deployment_camera_obj)
            print("in insert_identity {}".format(deployment_camera_obj))
            return deployment_camera_obj
        except Exception as e:
            print("error in insert_identity {}".format(e))
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def get_total_cameras_by_location(self, db: Session, location_list: list):
        return (
            db.query(CameraManager)
            .filter(CameraManager.location_id.in_(location_list))
            .all()
        )

    def get_total_active_cameras_by_location(self, db: Session, location_list: list):
        return (
            db.query(CameraManager)
            .filter(CameraManager.location_id.in_(location_list))
            .filter(CameraManager.is_active == 1)
            .all()
        )

    def get_total_cameras(self, db: Session):
        return db.query(CameraManager).all()

    def get_total_cameras_by_location_id(self, db: Session, location_id: int):
        print("location_id :: {}".format(location_id))
        return (
            db.query(CameraManager)
            .filter(CameraManager.location_id == location_id)
            .all()
        )

    def get_total_filter_cameras_details(
        self,
        db: Session,
        camera_filter: CameraFilter,
        location_list: list,
    ):
        """Return paginated camera items and page info for given filter.

        Applies optional filtering by `location_list`, orders by id for
        deterministic pagination, and computes total_count for page metadata.
        """
        query = db.query(CameraManager).join(Location)  # only one join here
        if location_list:
            query = query.filter(CameraManager.location_id.in_(location_list))

        total_count = query.count()

        query = query.order_by(CameraManager.id)
        query = query.offset((camera_filter.page_number - 1) * camera_filter.page_size)
        query = query.limit(camera_filter.page_size)

        items = query.all()

        return {
            "items": items,
            "page_info": get_page_info(
                total_count=total_count,
                page=camera_filter.page_number,
                page_size=camera_filter.page_size,
            ),
        }

    def get_all_camera_by_company_id(
        self, db: Session, company_id: int, add_filter=True
    ):
        from models.user import User

        queue = (
            db.query(CameraManager)
            .join(Location, CameraManager.location_id == Location.id)
            .filter(Location.company_id == company_id)
        )
        if add_filter:
            queue = queue.filter(CameraManager.status == True)
        print(queue)
        return queue.all()

    def update_rtsp_status(self, db: Session, status_type, status_val, db_obj):
        if status_type.lower() == "is_active":
            db_obj.is_active = status_val
        elif status_type.lower() == "is_processing":
            db_obj.is_processing = status_val
        elif status_type.lower() == "status":
            db_obj.status = status_val
        else:
            return db_obj
        db_obj.updated_date = datetime.now().replace(microsecond=0)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


deployment_camera_crud_obj = CRUDDeploymentCameras(CameraManager)
