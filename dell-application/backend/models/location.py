from sqlalchemy import Column, Integer, String, DateTime, Table, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from db.base_class import Base

UserLocation = Table(
    "user_location",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id")),
    Column("location_id", Integer, ForeignKey("location.id")),
)


class Location(Base):
    __tablename__ = "location"
    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(255), nullable=False)
    created_date = Column(DateTime, nullable=False)
    updated_date = Column(DateTime, nullable=False)
    status = Column(Boolean, nullable=False)
    company_id = Column(Integer, ForeignKey("company.id"))
    location = relationship("User", secondary=UserLocation)
