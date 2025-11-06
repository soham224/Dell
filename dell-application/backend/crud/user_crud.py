import datetime
from typing import Any, Dict, Optional, Union

from sqlalchemy.orm import Session

from core.security import get_password_hash, verify_password
from crud.base import CRUDBase
from models.user import User, Role
from schemas.user import UserCreate, UserUpdate
from .location_crud import location_crud_obj


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.user_email == email).first()

    def get_by_id(self, db: Session, *, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_result_manager_by_id(self, db: Session, _id: int):
        return db.query(User).filter(User.id == _id).all()

    def get_admin_of_current_user_by_company_id(
        self, db: Session, company_id: int
    ) -> Optional[User]:
        return (
            db.query(User)
            .filter(User.company_id == company_id, User.roles.any(Role.role == "admin"))
            .all()
        )

    def create_supervisor(
        self, db: Session, *, obj_in: UserCreate, company_id: int
    ) -> User:
        role_obj = self.get_role_by_id(db=db, role_id=3)
        db_obj = User(
            user_email=obj_in.user_email,
            company_id=company_id,
            user_password=get_password_hash(obj_in.user_password),
            created_date=datetime.datetime.now(),
            updated_date=datetime.datetime.now(),
        )
        db_obj.roles.append(role_obj)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        role_obj = self.get_role_by_id(db=db, role_id=2)
        db_obj = User(
            user_email=obj_in.user_email,
            company_id=obj_in.company_id,
            user_password=get_password_hash(obj_in.user_password),
            created_date=datetime.datetime.now(),
            updated_date=datetime.datetime.now(),
        )
        db_obj.roles.append(role_obj)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_demog(self, db: Session, *, obj_in: UserCreate, company_id: int) -> User:
        self.get_role_by_id(db=db, role_id=6)

    def create_demog_admin(self, db: Session, *, obj_in: UserCreate) -> User:
        role_obj = self.get_role_by_id(db=db, role_id=5)
        db_obj = User(
            user_email=obj_in.user_email,
            company_id=obj_in.company_id,
            user_password=get_password_hash(obj_in.user_password),
            user_status=obj_in.user_status,
            created_date=datetime.datetime.now(),
            updated_date=datetime.datetime.now(),
        )
        db_obj.roles.append(role_obj)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.user_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.user_status

    def get_role_by_id(self, db: Session, role_id: int) -> Optional[Role]:
        return db.query(Role).filter(Role.id == role_id).first()

    def is_admin(self, user: User) -> bool:
        for role in user.roles:
            if role.role == "admin":
                return True

    def is_superuser(self, user: User) -> bool:
        for role in user.roles:
            if role.role == "superadmin":
                return True

    def is_supervisor(self, user: User) -> bool:
        for role in user.roles:
            if role.role == "supervisor":
                return True

    def is_resultmanager(self, user: User) -> bool:
        for role in user.roles:
            if role.role == "resultmanager":
                return True

    def is_demog_admin(self, user: User) -> bool:
        for role in user.roles:
            if role.role == "demog_admin":
                return True

    def get_all_users(self, db: Session, search):
        search = "%{}%".format(search)
        return db.query(User).filter(User.user_email.like(search)).all()

    def get_all_supervisor_by_company_id(self, db: Session, company_id: int):
        return (
            db.query(User)
            .filter(
                User.company_id == company_id, User.roles.any(Role.role == "supervisor")
            )
            .all()
        )

    def get_all_supervisor(self, db: Session):
        return db.query(User).filter(User.roles.any(Role.role == "supervisor")).all()

    def get_all_enabled_supervisor(self, db: Session, company_id: int):
        return (
            db.query(User)
            .filter(
                User.company_id == company_id, User.roles.any(Role.role == "supervisor")
            )
            .filter(User.user_status == True)
            .all()
        )

    def update_user_status(self, db, user_id, user_status):
        user_obj = self.get_by_id(db=db, user_id=user_id)
        user_obj.user_status = user_status
        db.add(user_obj)
        db.commit()
        db.refresh(user_obj)
        if user_obj.user_status == user_status:
            return user_obj
        else:
            return False

    def update_supervisor_status(self, db, user_id, user_status):
        user_obj = self.get_by_id(db=db, user_id=user_id)
        if user_obj and user_obj.roles[0].role == "supervisor":
            user_obj.user_status = user_status
            db.add(user_obj)
            db.commit()
            db.refresh(user_obj)
            if user_obj.user_status == user_status:
                return user_obj
            else:
                return False
        else:
            return False

    def add_location_mapping(self, db: Session, user_id: int, location_obj_list: list):
        user_db_obj = self.get_by_id(db=db, user_id=user_id)
        user_db_obj.locations = location_obj_list
        db.add(user_db_obj)
        db.commit()
        db.refresh(user_db_obj)
        return user_db_obj

    def remove_location_mapping(self, db: Session, user_id: int, location_id: int):
        location_obj = location_crud_obj.get_by_id(db=db, _id=location_id)
        user_db_obj = self.get_by_id(db=db, user_id=user_id)
        user_db_obj.locations.remove(location_obj)
        db.add(user_db_obj)
        db.commit()
        db.refresh(user_db_obj)
        return user_db_obj

    def get_company_admin_by_supervisor(self, db: Session, company_id: int) -> object:
        if len(
            db.query(User)
            .filter(User.company_id == company_id, User.roles.any(Role.role == "admin"))
            .all()
        ):
            return (
                db.query(User)
                .filter(
                    User.company_id == company_id, User.roles.any(Role.role == "admin")
                )
                .one()
            )
        else:
            return None

    def get_user_by_company_id(self, db: Session, company_id: int) -> object:
        return db.query(User).filter(User.company_id == company_id).all()

    def get_users_by_user_status(
        self, db: Session, user_status: bool, search
    ) -> object:
        search = "%{}%".format(search)
        return (
            db.query(User)
            .filter(User.user_status == user_status)
            .filter(User.user_email.like(search))
            .all()
        )

    def get_users_by_user_role(self, db: Session, role_id: int, search: str) -> object:
        search = "%{}%".format(search)
        return (
            db.query(User)
            .filter(User.roles.any(Role.id == role_id))
            .filter(User.user_email.like(search))
            .all()
        )


user = CRUDUser(User)
