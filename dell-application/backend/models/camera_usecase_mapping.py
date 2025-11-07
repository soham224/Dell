from sqlalchemy import Column, Integer, Boolean, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from sqlalchemy.types import Time
from db.base_class import Base


class CameraUseCaseMapping(Base):
    __tablename__ = "camera_usecase_mapping"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("camera_manager.id"))
    usecase_id = Column(Integer, ForeignKey("usecase.id"))
    roi = Column(JSON, nullable=True)
    roi_type = Column(String(255), nullable=True)
    # line_roi = Column(JSON, nullable=True)
    usecase_timeout = Column(Integer, nullable=True)
    second_before_event = Column(Integer, nullable=True)
    second_after_event = Column(Integer, nullable=True)
    start_time_utc = Column(Time, nullable=True)
    end_time_utc = Column(Time, nullable=True)
    start_time_local = Column(Time, nullable=True)
    end_time_local = Column(Time, nullable=True)
    # usecase_video_time = Column(Integer, nullable=False)
    labels = Column(JSON, nullable=True)
    roi_image_path = Column(String(255), nullable=True)
    status = Column(Boolean, nullable=True)

    camera_details = relationship("CameraManager", uselist=False)
    usecase_details = relationship("UseCase", uselist=False)
