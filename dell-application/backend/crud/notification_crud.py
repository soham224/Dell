from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from crud.base import CRUDBase
from models.notification import Notification
from schemas.notification import NotificationCreate, NotificationUpdate


class CRUDNotification(CRUDBase[Notification, NotificationCreate, NotificationUpdate]):
    def get_by_id(self, db: Session, _id: int):
        return super().get(db, _id)

    def get_by_user_id(self, db: Session, user_id: int):
        return db.query(Notification).filter(Notification.user_id == user_id).all()

    def get_by_user_id_type(self, db: Session, user_id: int):
        return (
            db.query(
                Notification.type_of_notification,
                func.group_concat(
                    Notification.notification_message, "#", Notification.created_date
                ),
            )
            .filter(Notification.user_id == user_id)
            .group_by(Notification.type_of_notification)
            .all()
        )

    def get_unread_by_user_id(self, db: Session, user_id: int):
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .filter(Notification.is_unread == True)
            .all()
        )

    def get_notification_type_by_date_user_id(
        self,
        db: Session,
        user_id: int,
        start_date: NotificationUpdate,
        end_date: NotificationUpdate,
    ):
        return (
            db.query(distinct(Notification.type_of_notification))
            .filter(Notification.created_date.between(start_date, end_date))
            .filter(Notification.user_id == user_id)
            .all()
        )

    def get_notification_data_by_date_user_id_type(
        self,
        db: Session,
        user_id: int,
        user_notification_type: str,
        start_date: NotificationUpdate,
        end_date: NotificationUpdate,
    ):
        return (
            db.query(Notification)
            .filter(Notification.created_date.between(start_date, end_date))
            .filter(Notification.type_of_notification == user_notification_type)
            .filter(Notification.user_id == user_id)
            .all()
        )


notification_crud_obj = CRUDNotification(Notification)
