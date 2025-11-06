from sqlalchemy import Boolean, Column, Integer, String, Table, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .location import UserLocation
from db.base_class import Base

UserRoles = Table(
    "user_role",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id")),
    Column("role_id", Integer, ForeignKey("role.id")),
)


# role
class Role(Base):
    __tablename__ = "role"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(255), nullable=False)
    company = relationship("User", secondary=UserRoles)


# company user
class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.id"))
    user_email = Column(String(255), unique=True, index=True)
    user_password = Column(String(255), nullable=False)
    user_status = Column(Boolean, default=False, nullable=False)
    created_date = Column(DateTime, nullable=False)
    updated_date = Column(DateTime, nullable=False)
    roles = relationship("Role", secondary=UserRoles)
    locations = relationship("Location", secondary=UserLocation)
    company = relationship("Company", uselist=False)


class Company(Base):
    __tablename__ = "company"
    id = Column(Integer, primary_key=True, index=True)
    company_email = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    company_description = Column(String(255))
    company_address = Column(String(255), nullable=False)
    company_pin_code = Column(String(255), nullable=False)
    company_website = Column(String(255), nullable=False)
    company_contact = Column(String(255), nullable=False)
    company_poc = Column(String(255), nullable=False)
    company_poc_contact = Column(String(255), nullable=False)
    company_status = Column(Boolean, default=True, nullable=False)
    deployment_region = Column(String(255), nullable=False)
    created_date = Column(DateTime, nullable=False)
    updated_date = Column(DateTime, nullable=False)
