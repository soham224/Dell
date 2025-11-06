from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from db.base_class import Base


class CameraManager(Base):
    __tablename__ = "camera_manager"
    id = Column(Integer, primary_key=True, index=True)
    rtsp_url = Column(String(255), nullable=False)
    process_fps = Column(Integer, nullable=False)
    is_tcp = Column(Boolean, nullable=True)
    camera_name = Column(String(255), nullable=False)
    camera_resolution = Column(String(255), nullable=False)
    location_id = Column(Integer, ForeignKey("location.id"))
    is_active = Column(Boolean, default=False, nullable=False)
    is_processing = Column(Boolean, default=False, nullable=False)
    created_date = Column(DateTime, nullable=False)
    updated_date = Column(DateTime, nullable=False)
    status = Column(Boolean, nullable=False)
    inference_url = Column(JSON)

    location_details = relationship("Location", uselist=False)
