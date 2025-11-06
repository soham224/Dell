from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.sql.sqltypes import String

from db.base_class import Base


class Notification(Base):
    __tablename__ = "notification"
    id = Column(Integer, primary_key=True, index=True)
    notification_message = Column(String(255), nullable=False)
    type_of_notification = Column(String(255), nullable=True)
    status = Column(Boolean, nullable=False)
    is_unread = Column(Boolean, nullable=False)
    created_date = Column(DateTime, nullable=False)
    updated_date = Column(DateTime, nullable=False)

    user_id = Column(Integer, ForeignKey("user.id"))
