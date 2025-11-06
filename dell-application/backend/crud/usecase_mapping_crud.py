from fastapi import HTTPException
from sqlalchemy.orm import Session

from crud.base import CRUDBase
from models.camera_usecase_mapping import CameraUseCaseMapping
from models.camera_manager import CameraManager
from models.usecase import UseCase
from models.location import Location
from schemas.usecase import *


class CRUDUseCaseMapping(CRUDBase[CameraUseCaseMapping, UseCaseCreate, UseCaseUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return (
            db.query(
                CameraUseCaseMapping,
                CameraManager,
                UseCase,
                Location,
            )
            .filter(CameraUseCaseMapping.id == _id)
            .join(CameraManager, CameraUseCaseMapping.camera_id == CameraManager.id)
            .join(UseCase, UseCase.id == CameraUseCaseMapping.usecase_id)
            .join(Location, Location.id == CameraManager.location_id)
            .first()
        )

    def get_by_usecase_id_and_company_id(
        self, db: Session, usecase_id: int, company_id: int
    ):
        return (
            db.query(
                CameraUseCaseMapping,
                CameraManager,
                UseCase,
                Location,
            )
            .filter(UseCase.id == usecase_id)
            .filter(Location.company_id == company_id)
            .join(CameraManager, CameraUseCaseMapping.camera_id == CameraManager.id)
            .join(UseCase, UseCase.id == CameraUseCaseMapping.usecase_id)
            .join(Location, Location.id == CameraManager.location_id)
            .all()
        )

    def get_by_usecase_id_and_location_list(
        self, db: Session, usecase_id: int, location_list: list
    ):
        return (
            db.query(
                CameraUseCaseMapping,
                CameraManager,
                UseCase,
                Location,
            )
            .filter(UseCase.id == usecase_id)
            .filter(CameraManager.location_id.in_(location_list))
            .join(CameraManager, CameraUseCaseMapping.camera_id == CameraManager.id)
            .join(UseCase, UseCase.id == CameraUseCaseMapping.usecase_id)
            .join(Location, Location.id == CameraManager.location_id)
            .all()
        )

    def get_all_available_camera_usecase_mapping(self, db: Session):
        return db.query(CameraUseCaseMapping).all()

    def get_all_camera_usecase_mapping_by_location_list(
        self, db: Session, location_list: list
    ):
        return (
            db.query(
                CameraUseCaseMapping,
                CameraManager,
                UseCase,
                Location,
            )
            .join(CameraManager, CameraUseCaseMapping.camera_id == CameraManager.id)
            .join(UseCase, UseCase.id == CameraUseCaseMapping.usecase_id)
            .join(Location, Location.id == CameraManager.location_id)
            .filter(CameraManager.location_id.in_(location_list))
            .all()
        )

    def get_all_camera_usecase_mapping(self, db: Session):
        return (
            db.query(
                CameraUseCaseMapping,
                CameraManager,
                UseCase,
                Location,
            )
            .join(CameraManager, CameraUseCaseMapping.camera_id == CameraManager.id)
            .join(UseCase, UseCase.id == CameraUseCaseMapping.usecase_id)
            .join(Location, Location.id == CameraManager.location_id)
            .all()
        )

    def insert_camera_usecase_mapping(
        self,
        usecase_mapping_details,
        db,
    ):
        try:
            camera_usecase_mapping_obj = CameraUseCaseMapping(
                camera_id=usecase_mapping_details.camera_id,
                usecase_id=usecase_mapping_details.usecase_id,
                usecase_timeout=usecase_mapping_details.usecase_timeout,
                second_before_event=usecase_mapping_details.second_before_event,
                second_after_event=usecase_mapping_details.second_after_event,
                # usecase_video_time=usecase_mapping_details.usecase_video_time,
            )
            db.add(camera_usecase_mapping_obj)
            db.commit()
            db.refresh(camera_usecase_mapping_obj)
            print("in insert_identity {}".format(camera_usecase_mapping_obj))
            return camera_usecase_mapping_obj
        except Exception as e:
            print("error in insert_identity {}".format(e))
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def get_camera_usecase_mapping_by_id(self, identity_id: int, db: Session):
        try:
            return (
                db.query(CameraUseCaseMapping)
                .filter(CameraUseCaseMapping.id == identity_id)
                .first()
            )
        except Exception as e:
            print("Exception : ", e)
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def get_camera_usecase_mapping_by_usecase_id_and_camera_id(
        self, db: Session, usecase_id: int, camera_id: int
    ):
        try:
            return (
                db.query(CameraUseCaseMapping)
                .filter(CameraUseCaseMapping.usecase_id == usecase_id)
                .filter(CameraUseCaseMapping.camera_id == camera_id)
                .first()
            )
        except Exception as e:
            print("Exception : ", e)
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def get_labels_by_list_of_camera_id(self, db: Session, camera_id: list):
        return (
            db.query(CameraUseCaseMapping)
            .filter(CameraUseCaseMapping.camera_id.in_(camera_id))
            .filter(CameraUseCaseMapping.labels != None)
            .all()
        )

    def update_camera_usecase_mapping(
        self,
        id,
        i_name,
        i_profession,
        contact_no,
        employee_id,
        location_id,
        db,
    ):
        try:
            db_identity = (
                db.query(CameraUseCaseMapping)
                .filter(CameraUseCaseMapping.id == id)
                .update(
                    dict(
                        i_name=i_name,
                        i_profession=i_profession,
                        contact_no=contact_no,
                        employee_id=employee_id,
                        location_id=location_id,
                    )
                )
            )
            db.commit()
            if db_identity > 0:
                return True
            else:
                return False
        except Exception as e:
            print("Exception : ", e)
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def get_all_camera_usecase_mapping_count(self, db):
        return db.query(CameraUseCaseMapping).count()


usecase_mapping_crud_obj = CRUDUseCaseMapping(CameraUseCaseMapping)
