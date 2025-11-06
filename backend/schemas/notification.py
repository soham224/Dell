from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# Shared properties
class NotificationBase(BaseModel):
    notification_message: str
    type_of_notification: Optional[str]


class NotificationCreate(NotificationBase):
    created_date: Optional[datetime]
    updated_date: Optional[datetime]
    user_id: int
    status: bool = True
    is_unread: bool = True


class NotificationUpdate(NotificationCreate):
    id: int
    updated_date: Optional[datetime]


class NotificationRead(NotificationUpdate):
    id: int
    created_date: datetime
    updated_date: datetime

    class Config:
        orm_mode = True
