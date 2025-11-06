import logging

import psutil
import crud
from db.session import SessionLocal
from datetime import datetime, timezone
from models import CameraUseCaseMapping

# from core.ai_utils import update_ai_details

# Prefer stdlib zoneinfo (3.9+), else backports on 3.8. If neither present, fallback to system local.
try:
    from zoneinfo import ZoneInfo  # type: ignore
except Exception:  # pragma: no cover - Python 3.8 without backport
    try:
        from backports.zoneinfo import ZoneInfo  # type: ignore
    except Exception:
        ZoneInfo = None  # type: ignore


def check_system_health():
    db = SessionLocal()
    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory().percent
        temp = None

        try:
            temps = psutil.sensors_temperatures()
            if "coretemp" in temps:
                # temp = max([t.current for t in temps["coretemp"] if t.current])
                temp_celsius = max([t.current for t in temps["coretemp"] if t.current])
                temp = (temp_celsius * 9 / 5) + 32  # convert to Fahrenheit
        except Exception:
            pass

        title = "Health Check"
        # description = f"CPU: {cpu}%, RAM: {ram}%, Temp: {temp}°C"
        description = (
            f"CPU: {cpu}%, RAM: {ram}%, Temp: {temp:.1f}°F"
            if temp
            else f"CPU: {cpu}%, RAM: {ram}%"
        )

        logging.info(f"{title} :: {description}")

        # Activity logging disabled
        # crud.activity_crud_obj.insert_activity_data(
        #     db=db,
        #     activity_type="SYSTEM_HEALTH_CHECK",
        #     title=title,
        #     description=description,
        # )
    except Exception as e:
        logging.error(f"Exception : check_system_health {e}")
    finally:
        db.close()


# def update_camera_usecase_status_by_time():
#     """
#     Set `CameraUseCaseMapping.status` to 1 if current local time is within
#     [start_time_local, end_time_local] window, else 0.
#
#     - Skips records where either start or end is null.
#     - Handles windows that cross midnight (start > end).
#     """
#     db = SessionLocal()
#     try:
#         # print("[scheduler] Enter update_camera_usecase_status_by_time()")
#         # Always evaluate against Manila time regardless of container TZ
#         if ZoneInfo is not None:
#             try:
#                 manila_tz = ZoneInfo("Asia/Manila")
#                 # print(f"[scheduler] Loaded timezone: {manila_tz}")
#                 # Start from UTC to avoid container-local TZ influence
#                 now = datetime.utcnow().replace(tzinfo=timezone.utc).astimezone(manila_tz).time()
#                 # print(f"[scheduler] Current Manila time (now) = {now}")
#             except Exception as tz_e:
#                 logging.warning("Failed to load Asia/Manila timezone; falling back to system local time")
#                 # print(f"[scheduler] Timezone load failed: {tz_e}")
#                 now = datetime.now().astimezone().time()
#                 # print(f"[scheduler] Fallback system local time (now) = {now}")
#         else:
#             logging.warning(
#                 "ZoneInfo not available; consider installing backports.zoneinfo on Python 3.8. Using system local time.")
#             # print("[scheduler] ZoneInfo not available; using system local time")
#             now = datetime.now().astimezone().time()
#             # print(f"[scheduler] System local time (now) = {now}")
#
#         mappings = db.query(CameraUseCaseMapping).all()
#         # print(f"[scheduler] Total mappings fetched: {len(mappings)}")
#
#         updated = 0
#         changed_camera_ids = []  # collect camera IDs whose status changed
#         for m in mappings:
#             logging.info(f"[scheduler] Evaluating mapping_id={m.id}, camera_id={m.camera_id}")
#             start_t = getattr(m, "start_time_local", None)
#             end_t = getattr(m, "end_time_local", None)
#             # print(f"[scheduler] start_time_local={start_t}, end_time_local={end_t}")
#             if not start_t or not end_t:
#                 logging.info("[scheduler] Skipping: missing start or end time")
#                 continue
#
#             # Determine if now is inside the window
#             if start_t <= end_t:
#                 # Normal same-day window
#                 in_window = start_t <= now <= end_t
#                 # print(f"[scheduler] Window same-day? True -> in_window={in_window}")
#             else:
#                 # Window crosses midnight, e.g., 22:00 -> 06:00
#                 in_window = (now >= start_t) or (now <= end_t)
#                 # print(f"[scheduler] Window crosses midnight -> in_window={in_window}")
#
#             new_status = 1 if in_window else 0
#             # print(f"[scheduler] Current status={m.status}, new_status={new_status}")
#             if m.status != new_status:
#                 logging.info(f"[scheduler] Status change detected for mapping_id={m.id}: {m.status} -> {new_status}")
#                 m.status = new_status
#                 updated += 1
#                 if m.camera_id is not None:
#                     # print(f"[scheduler] Queue camera_id for AI update: {m.camera_id}")
#                     changed_camera_ids.append(m.camera_id)
#             # else:
#             #     print(f"[scheduler] No status change for mapping_id={m.id}")
#
#         if updated:
#             db.commit()
#             # print(f"[scheduler] DB commit done for {updated} updated rows")
#         # else:
#         # print("[scheduler] No rows updated; skipping commit")
#         logging.info(f"update_camera_usecase_status_by_time: updated={updated}")
#
#         # Call AI update for each camera whose mapping status changed
#         # Use set() to avoid duplicate calls for the same camera
#         unique_cameras = set(changed_camera_ids)
#         # print(f"[scheduler] Unique camera_ids to update: {list(unique_cameras)}")
#         for camera_id in unique_cameras:
#             try:
#                 resp, status_code = update_ai_details(camera_id)
#                 # print(f"[scheduler] update_ai_details(camera_id={camera_id}) -> status={status_code}, resp={resp}")
#             except Exception as ai_e:
#                 logging.error(f"update_ai_details failed for camera_id={camera_id}: {ai_e}")
#                 # print(f"[scheduler] update_ai_details failed for camera_id={camera_id}: {ai_e}")
#     except Exception as e:
#         db.rollback()
#         logging.error(f"Exception : update_camera_usecase_status_by_time {e}")
#
#     finally:
#         db.close()
