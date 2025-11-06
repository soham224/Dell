from fastapi import HTTPException
from sqlalchemy.orm import Session

from crud.base import CRUDBase
from models.usecase import UseCase
from schemas.usecase import *


class CRUDUseCase(CRUDBase[UseCase, UseCaseCreate, UseCaseUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def get_all_available_usecase(self, db: Session):
        return db.query(UseCase).all()

    def insert_usecase(
        self,
        usecase,
        db,
    ):
        try:
            usecase_obj = UseCase(usecase=usecase)
            db.add(usecase_obj)
            db.commit()
            db.refresh(usecase_obj)
            print("in insert_identity {}".format(usecase_obj))
            return usecase_obj
        except Exception as e:
            print("error in insert_identity {}".format(e))
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def get_usecase_by_id(self, identity_id: int, db: Session):
        try:
            return db.query(UseCase).filter(UseCase.id == identity_id).first()
        except Exception as e:
            print("Exception : ", e)
            raise HTTPException(
                status_code=500, detail="INTERNAL SERVER ERROR : {}".format(e)
            )

    def update_usecase(
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
                db.query(UseCase)
                .filter(UseCase.id == id)
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

    def get_all_identity_count(self, db):
        return db.query(UseCase).count()


usecase_crud_obj = CRUDUseCase(UseCase)
