from schemas.location import LocationCreate, LocationUpdate
from sqlalchemy.orm import Session

from crud.base import CRUDBase
from models.location import Location, UserLocation
from models.user import Company
from schemas.location import *


class CRUDLocation(CRUDBase[Location, LocationCreate, LocationUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def get_all_locations(self, db: Session):
        return (
            db.query(Location, Company)
            .join(Company, Location.company_id == Company.id)
            .all()
        )

    def get_by_name(
        self, db: Session, name: str, company_id: int
    ) -> Optional[Location]:
        return (
            db.query(Location)
            .filter(Location.location_name == name)
            .filter(Location.company_id == company_id)
            .first()
        )

    def get_by_name_excude_current_id(
        self, db: Session, name: str, company_id: int, location_id: int
    ) -> Optional[Location]:
        return (
            db.query(Location)
            .filter(Location.id != location_id)
            .filter(Location.location_name == name)
            .filter(Location.company_id == company_id)
            .first()
        )

    def get_all_company_location(self, db: Session, company_id: int):
        return db.query(Location).filter(Location.company_id == company_id).all()

    def get_all_company_enabled_location(self, db: Session, company_id: int):
        return (
            db.query(Location)
            .filter(Location.company_id == company_id)
            .filter(Location.status == True)
            .all()
        )

    def get_total_enabled_locations_obj(self, db: Session, location_list: list):
        return (
            db.query(Location)
            .filter(Location.id.in_(location_list))
            .filter(Location.status == True)
            .all()
        )


location_crud_obj = CRUDLocation(Location)
