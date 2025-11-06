"""
SQLAlchemy model for the ai_people_footfall_analysis table.

This table records per-frame people footfall analytics with:
- id: primary key
- frame_time: UTC datetime when the frame was processed
- frame_analysis: categorical analysis result with allowed values 'IN' or 'OUT'
- frame_count: integer number of entities detected in the frame contributing to the analysis
- total_count: cumulative total up to and including this frame

Notes:
- We use a SQLAlchemy Enum which maps to a native MySQL ENUM for strict value enforcement.
- frame_time is stored as naive UTC DateTime in MySQL; ensure callers provide UTC.
- Defaults for counts are set to 0 and are non-nullable.

Design decisions:
- Using native MySQL ENUM improves integrity and performance over a separate lookup table for this simple binary state.
- We avoid CHECK constraints for broad MySQL compatibility (older versions ignored them).
"""
from __future__ import annotations

from sqlalchemy import Column, DateTime, Enum, Integer

from db.base_class import Base


class AiPeopleFootfallAnalysis(Base):
    """Model for `ai_people_footfall_analysis`.

    The `__tablename__` is explicitly set to match the required table name.
    """

    __tablename__ = "ai_people_footfall_analysis"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    # Store timestamps in UTC; application layer must ensure UTC inputs.
    frame_time = Column(DateTime, nullable=False, index=True)

    # Strictly allow only 'IN' or 'OUT'. Use native MySQL ENUM for enforcement.
    frame_analysis = Column(
        Enum("IN", "OUT", name="frame_analysis_enum", native_enum=True),
        nullable=False,
        index=True,
    )

    # Per-frame count and running total. Defaults to 0 to avoid NULLs.
    frame_count = Column(Integer, nullable=False, default=0)
    total_count = Column(Integer, nullable=False, default=0)
