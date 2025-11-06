import json
import os
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    DDL,
    event,
    PrimaryKeyConstraint,
)
from db.base_class import Base


class ActivityLogs(Base):
    __tablename__ = "activity_logs"

    # Composite primary key with autoincrement id for uniqueness per activity_type
    id = Column(Integer, autoincrement=True, index=True)
    activity_type = Column(String(255), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    camera_id = Column(Integer)
    title = Column(String(255), nullable=False)
    description = Column(String(255))

    __table_args__ = (PrimaryKeyConstraint("id", "activity_type"),)


# Build the partition SQL dynamically only if env is provided
activity_types = []
try:
    activity_types = json.loads(os.getenv("ACTIVITY_LOGS_TYPE", "[]"))
except Exception:
    # If env var is malformed, skip partitioning
    activity_types = []

if activity_types:
    partition_sql = ",\n    ".join(
        [f"PARTITION p_{typ.lower()} VALUES IN ('{typ}')" for typ in activity_types]
    )

    ddl_sql = f"""
ALTER TABLE activity_logs
PARTITION BY LIST COLUMNS(activity_type) (
    {partition_sql}
);
"""

    # Register the DDL only when we have valid partitions
    partitioning_ddl = DDL(ddl_sql)
    event.listen(ActivityLogs.__table__, "after_create", partitioning_ddl)
