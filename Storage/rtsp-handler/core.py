import logging
import urllib.parse
from typing import List, Optional, Tuple

import pymysql
import pymysql.cursors
import datetime as dt

from config import settings
from datetime import time as dtime

logger = logging.getLogger(__name__)


def _db_conn():
    return pymysql.connect(
        host=settings.DB_HOST,
        user=settings.DB_USERNAME,
        password=settings.ORI_DB_PASS,
        db=settings.DB_NAME,
        port=settings.DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
    )


def quote_identifier(path: str) -> str:
    """Safely quote a potentially dotted identifier like db.table using backticks.
    This allows database names with special characters (e.g., hyphens) to be used safely.
    """
    parts = [p.strip() for p in path.split(".") if p.strip()]
    return ".".join([f"`{p}`" for p in parts]) if parts else path


def update_db_flags(
    camera_id: int,
    *,
    is_active: Optional[int] = None,
    is_processing: Optional[int] = None,
) -> None:
    """Update status flags for a camera.
    - is_active: 1 if RTSP connection is functioning, else 0
    - is_processing: 1 if frames are being captured (ffmpeg running), else 0
    """
    try:
        if settings.CAM_SOURCE != "db":
            return
        table_ref = quote_identifier(settings.CAMERA_RTSP_TABLE)
        updates = []
        if is_active is not None:
            updates.append(f"{settings.IS_ACTIVE_COLUMN}={int(is_active)}")
        if is_processing is not None:
            updates.append(f"{settings.IS_PROCESSING_COLUMN}={int(is_processing)}")
        updates.append(
            f"{settings.UPDATED_DATE_COLUMN}='{dt.datetime.utcnow().replace(microsecond=0)}'"
        )
        set_clause = ", ".join(updates)
        query = (
            f"UPDATE {table_ref} SET {set_clause} WHERE {settings.CAMERA_ID_COLUMN}=%s"
        )
        with _db_conn() as conn:
            cur = conn.cursor()
            cur.execute(query, (camera_id,))
            conn.commit()
        logger.info(
            f"update_db_flags: Updated flags for camera_id={camera_id} -> {set_clause}"
        )
    except Exception as e:
        logger.error(f"update_db_flags: error for camera_id={camera_id}: {e}")


def fetch_camera_status(camera_id: int) -> Optional[int]:
    """Fetch `status` flag for a camera (1=enabled, 0=disabled)."""
    try:
        table_ref = quote_identifier(settings.CAMERA_RTSP_TABLE)
        with _db_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT {settings.STATUS_COLUMN} AS s FROM {table_ref} WHERE {settings.CAMERA_ID_COLUMN}=%s",
                (camera_id,),
            )
            row = cur.fetchone()
        return int(row["s"]) if row and row.get("s") is not None else None
    except Exception as e:
        logger.error(f"fetch_camera_status: error for camera_id={camera_id}: {e}")
        return None


def fetch_camera_windows(camera_id: int) -> List[Tuple[dtime, dtime]]:
    """Fetch allowed UTC windows for a camera.
    Returns list of (start_time, end_time) as datetime.time objects.
    """
    windows: List[Tuple[dtime, dtime]] = []
    try:
        table_ref = quote_identifier(settings.CAMERA_USECASE_MAPPING_TABLE)
        with _db_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT {settings.START_TIME_COLUMN} AS st, {settings.END_TIME_COLUMN} AS et FROM {table_ref} WHERE {settings.MAPPING_CAMERA_ID_COLUMN}=%s",
                (camera_id,),
            )
            rows = cur.fetchall()
        for r in rows:
            st = r.get("st")
            et = r.get("et")
            # Accept either time or datetime; normalize to time
            if isinstance(st, dt.datetime):
                st = st.time()
            if isinstance(et, dt.datetime):
                et = et.time()
            if isinstance(st, dt.time):
                st = dtime(st.hour, st.minute, st.second)
            if isinstance(et, dt.time):
                et = dtime(et.hour, et.minute, et.second)
            if isinstance(st, dtime) and isinstance(et, dtime):
                windows.append((st, et))
        return windows
    except Exception as e:
        logger.error(f"fetch_camera_windows: error for camera_id={camera_id}: {e}")
        return windows


def now_utc_time() -> dtime:
    return dt.datetime.utcnow().time()


def is_time_in_any_window(now_t: dtime, windows: List[Tuple[dtime, dtime]]) -> bool:
    """Check if now_t is within any of the [start,end) windows; supports windows crossing midnight."""
    for start, end in windows:
        if start <= end:
            if start <= now_t < end:
                return True
        else:
            # crosses midnight
            if now_t >= start or now_t < end:
                return True
    return False


def fetch_camera_fps(camera_id: int) -> Optional[int]:
    """Fetch latest process_fps. Returns None on error/not found."""
    try:
        table_ref = quote_identifier(settings.CAMERA_RTSP_TABLE)
        with _db_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                f"SELECT {settings.FPS_COLUMN} AS fps FROM {table_ref} WHERE {settings.CAMERA_ID_COLUMN}=%s",
                (camera_id,),
            )
            row = cur.fetchone()
        if row and row.get("fps") is not None:
            return int(row["fps"])
        return None
    except Exception as e:
        logger.error(f"fetch_camera_fps: error for camera_id={camera_id}: {e}")
        return None
