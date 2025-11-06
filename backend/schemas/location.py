from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


# Shared properties
class LocationBase(BaseModel):
    location_name: str
    company_id: Optional[int]
    # Optional list of user IDs to assign this location to upon creation.
    # Using Optional[List[int]] to avoid mutable default pitfalls.
    assign_user_ids: Optional[List[int]] = None


class LocationCreate(LocationBase):
    created_date: Optional[datetime]
    updated_date: Optional[datetime]


class LocationUpdate(LocationBase):
    id: int
    company_id: int


class LocationRead(LocationBase):
    id: int
    created_date: datetime
    updated_date: datetime

    class Config:
        orm_mode = True


class LocationStatusUpdate(LocationBase):
    status: bool


class LocationWithStatus(LocationRead):
    status: bool


class LocationWithCompanyName(LocationWithStatus):
    company_name: str


class LocationNameRead(BaseModel):
    location_name: str

    class Config:
        orm_mode = True
