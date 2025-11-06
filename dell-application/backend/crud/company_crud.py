from sqlalchemy.orm import Session

from crud.base import CRUDBase
from models.user import Company
from schemas.user import *


class CRUDCompany(CRUDBase[Company, CompanyCreate, CompanyUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def get_present_employee_by_company_id(self, db, company_id, start_date, end_date):
        return db.query(Company).filter(Company.id == company_id).all()


company_crud_obj = CRUDCompany(Company)
