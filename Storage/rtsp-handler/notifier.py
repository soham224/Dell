import os
import time
import logging
import asyncio
from typing import Tuple, Optional, Dict, Any

import pymysql
import pymysql.cursors

from config import settings
from logger_config import setup_logger
import utils  # reuse helpers and state from utils

setup_logger()
logger = logging.getLogger()


def _db_conn():
    return pymysql.connect(
        host=settings.DB_HOST,
        user=settings.DB_USERNAME,
        password=settings.ORI_DB_PASS,
        db=settings.DB_NAME,
        port=settings.DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
    )


def _quote_identifier(path: str) -> str:
    parts = [p.strip() for p in path.split(".") if p.strip()]
    return ".".join([f"`{p}`" for p in parts]) if parts else path


def _camera_manager_change_token(conn) -> Tuple[int, Optional[str], Optional[int], Optional[int]]:
    """
    Return a change token derived from camera_manager-like table.
    Token = (count_rows, max_updated_date_str, max_fps, sum_fps)

    Rationale:
    - Some deployments may not update `updated_date` when `process_fps` changes.
    - Including aggregate FPS values ensures notifier reacts to FPS edits.
    """
    table_ref = _quote_identifier(settings.CAMERA_RTSP_TABLE)
    updated_col = settings.UPDATED_DATE_COLUMN
    fps_col = settings.FPS_COLUMN
    sql = (
        f"SELECT COUNT(*) AS c, MAX({updated_col}) AS m, "
        f"MAX({fps_col}) AS mf, SUM({fps_col}) AS sf FROM {table_ref}"
    )
    with conn.cursor() as cur:
        cur.execute(sql)
        row = cur.fetchone() or {}
        return (
            int(row.get("c", 0)),
            (row.get("m") if row and row.get("m") is not None else None),
            (int(row.get("mf")) if row and row.get("mf") is not None else None),
            (int(row.get("sf")) if row and row.get("sf") is not None else None),
        )


def _mapping_change_token(conn) -> Tuple[int, Optional[str], Optional[str]]:
    """
    Return a change token derived from mapping table rows.
    Token = (count_rows, max(start_time_utc), max(end_time_utc)) using configured columns.
    """
    table_ref = _quote_identifier(settings.CAMERA_USECASE_MAPPING_TABLE)
    start_col = settings.START_TIME_COLUMN
    end_col = settings.END_TIME_COLUMN
    cam_fk = settings.MAPPING_CAMERA_ID_COLUMN
    sql = f"SELECT COUNT(*) AS c, MAX({start_col}) AS ms, MAX({end_col}) AS me FROM {table_ref}"
    with conn.cursor() as cur:
        cur.execute(sql)
        row = cur.fetchone() or {}
        return (
            int(row.get("c", 0)),
            (row.get("ms") if row and row.get("ms") is not None else None),
            (row.get("me") if row and row.get("me") is not None else None),
        )


def _resolve_trigger_path(path: str) -> str:
    """Return absolute trigger path. If relative, place it under FRAMES_ROOT_DIR."""
    if not os.path.isabs(path):
        return os.path.join(settings.FRAMES_ROOT_DIR or os.getcwd(), path)
    return path


def _touch_trigger(path: str) -> None:
    # Normalize path under FRAMES_ROOT_DIR if relative
    path = _resolve_trigger_path(path)
    # Ensure directory exists
    base_dir = os.path.dirname(path)
    if base_dir and not os.path.exists(base_dir):
        os.makedirs(base_dir, exist_ok=True)
    with open(path, "a"):
        os.utime(path, None)


def watch_db_changes() -> None:
    """
    Poll camera tables for changes and touch a trigger file when a change is detected.
    Intended to be run as a daemon process from main.py

    Settings moved/ensured here (defaults if not in env/config):
    - FPS_REFRESH_INTERVAL_SECONDS=900
    - CAMERA_RTSP_TABLE=camera_manager
    - CAMERA_USECASE_MAPPING_TABLE=camera_usecase_mapping
    - IS_ACTIVE_COLUMN=is_active
    - IS_PROCESSING_COLUMN=is_processing
    - START_TIME_COLUMN=start_time_utc
    - END_TIME_COLUMN=end_time_utc
    """
    logger.info(
        f"notifier.watch_db_changes: polling every {settings.NOTIFIER_POLL_INTERVAL_SECONDS}s; trigger={settings.RELOAD_TRIGGER_FILE}"
    )

    last_cam_token: Tuple[int, Optional[str], Optional[int], Optional[int]] = (-1, None, None, None)
    last_map_token: Tuple[int, Optional[str], Optional[str]] = (-1, None, None)
    trigger_path = _resolve_trigger_path(settings.RELOAD_TRIGGER_FILE)

    while True:
        try:
            with _db_conn() as conn:
                cam_token = _camera_manager_change_token(conn)
                map_token = _mapping_change_token(conn)

            if cam_token != last_cam_token or map_token != last_map_token:
                # Build a human-readable diff for logs
                try:
                    if cam_token != last_cam_token:
                        logger.info(
                            "notifier.watch_db_changes: camera table change: "
                            f"rows {last_cam_token[0]} -> {cam_token[0]}, "
                            f"max({settings.UPDATED_DATE_COLUMN}) {last_cam_token[1]} -> {cam_token[1]}, "
                            f"max({settings.FPS_COLUMN}) {last_cam_token[2]} -> {cam_token[2]}, "
                            f"sum({settings.FPS_COLUMN}) {last_cam_token[3]} -> {cam_token[3]}"
                        )
                    if map_token != last_map_token:
                        logger.info(
                            "notifier.watch_db_changes: mapping table change: "
                            f"rows {last_map_token[0]} -> {map_token[0]}, "
                            f"max({settings.START_TIME_COLUMN}) {last_map_token[1]} -> {map_token[1]}, "
                            f"max({settings.END_TIME_COLUMN}) {last_map_token[2]} -> {map_token[2]}"
                        )
                except Exception as log_ex:
                    logger.error(
                        f"notifier.watch_db_changes: error building change log: {log_ex}"
                    )
                logger.info(
                    f"notifier.watch_db_changes: change detected; touching trigger to notify workers at {trigger_path}"
                )
                _touch_trigger(trigger_path)
                last_cam_token = cam_token
                last_map_token = map_token
            else:
                logger.debug("notifier.watch_db_changes: no change")
        except Exception as ex:
            logger.error(f"notifier.watch_db_changes: error while polling: {ex}")
        time.sleep(int(settings.NOTIFIER_POLL_INTERVAL_SECONDS))


# ===== Per-camera worker moved from utils.py =====
async def camera_worker(camera_id: int, config: Dict[str, Any]) -> None:
    """
    Per-camera async worker that:
    - checks camera_manager.status
    - checks time window from camera_usecase_mapping
    - starts/stops ffmpeg accordingly
    - updates is_active and is_processing
    - sleeps independently as needed
    - reacts to notifier trigger file for immediate refresh
    """
    utils.camera_processes[camera_id] = None
    sleep_30 = settings.DISABLED_RECHECK_SLEEP_SECONDS
    current_fps: int = int(config.get("camera_fps", 60))
    # Use absolute trigger path
    trigger_path = _resolve_trigger_path(settings.RELOAD_TRIGGER_FILE)
    last_trigger_mtime: Optional[float] = None
    # track last time we polled FPS in the inner monitoring loop
    last_fps_poll_ts: float = 0.0

    while True:
        try:
            # Refresh camera status and windows each iteration
            status = utils._fetch_camera_status(camera_id)
            windows = utils._fetch_camera_windows(camera_id)

            # Always fetch latest fps at the start of an iteration
            try:
                latest_fps = utils._fetch_camera_fps(camera_id)
                if latest_fps is not None and int(latest_fps) != int(current_fps):
                    logger.info(
                        f"camera_worker[{camera_id}]: detected new process_fps {current_fps} -> {latest_fps}"
                    )
                    current_fps = int(latest_fps)
                    config["camera_fps"] = current_fps
                    # If ffmpeg is already running, restart to apply FPS change
                    if (
                        utils.camera_processes.get(camera_id) is not None
                        and utils.camera_processes[camera_id].returncode is None
                    ):
                        await utils._stop_ffmpeg(camera_id)
            except Exception as ex:
                logger.error(f"camera_worker[{camera_id}]: error refreshing fps: {ex}")

            now_t = utils._now_utc_time()
            in_window = (
                utils._is_time_in_any_window(now_t, windows) if windows else True
            )

            if status is None:
                logger.warning(
                    f"camera_worker[{camera_id}]: camera not found in DB; sleeping 30 min"
                )
                await utils._stop_ffmpeg(camera_id)
                await asyncio.sleep(sleep_30)
                continue

            if status == 0:
                logger.info(
                    f"camera_worker[{camera_id}]: camera status false; sleeping 30 min"
                )
                await utils._stop_ffmpeg(camera_id)
                await asyncio.sleep(sleep_30)
                continue

            if not in_window:
                logger.info(
                    f"camera_worker[{camera_id}]: outside capture window at {now_t.isoformat()}; sleeping 30 min"
                )
                await utils._stop_ffmpeg(camera_id)
                await asyncio.sleep(sleep_30)
                continue

            # Within window and enabled
            rtsp_ok = utils.check_rtsp(config.get("camera_rtsp_url"), camera_id)
            # is_active set inside check_rtsp
            if not rtsp_ok:
                logger.warning(
                    f"camera_worker[{camera_id}]: RTSP not healthy; retry after {settings.SLEEP_WHEN_RTSP_DOWN}s"
                )
                await utils._stop_ffmpeg(camera_id)
                await asyncio.sleep(settings.SLEEP_WHEN_RTSP_DOWN)
                continue

            # Start ffmpeg if not running
            if utils.camera_processes.get(camera_id) is None or (
                utils.camera_processes[camera_id]
                and utils.camera_processes[camera_id].returncode is not None
            ):
                await utils._start_ffmpeg(camera_id, config)

            # Monitoring loop
            for _ in range(0, 6 * 60):  # up to ~60 minutes at ~10s tick
                proc = utils.camera_processes.get(camera_id)
                if proc is not None and proc.returncode is not None:
                    logger.warning(
                        f"camera_worker[{camera_id}]: ffmpeg exited with code {proc.returncode}; restarting after {settings.SLEEP_WHEN_RTSP_DOWN}s"
                    )
                    utils.update_db_flags(camera_id, is_processing=0)
                    await asyncio.sleep(settings.SLEEP_WHEN_RTSP_DOWN)
                    break

                # React to external reload trigger (DB change notifier)
                try:
                    if trigger_path and os.path.exists(trigger_path):
                        mtime = os.path.getmtime(trigger_path)
                        if last_trigger_mtime is None or mtime > last_trigger_mtime:
                            logger.info(
                                f"camera_worker[{camera_id}]: reload trigger detected at {trigger_path}; re-evaluating camera config"
                            )
                            last_trigger_mtime = mtime
                            # Immediately re-evaluate critical state and act
                            status = utils._fetch_camera_status(camera_id)
                            windows = utils._fetch_camera_windows(camera_id)
                            now_t = utils._now_utc_time()
                            in_window = (
                                utils._is_time_in_any_window(now_t, windows)
                                if windows
                                else True
                            )
                            if status in (0, None) or not in_window:
                                await utils._stop_ffmpeg(camera_id)
                            else:
                                # check fps change
                                nfps = utils._fetch_camera_fps(camera_id)
                                if nfps is not None and int(nfps) != int(current_fps):
                                    current_fps = int(nfps)
                                    config["camera_fps"] = current_fps
                                    await utils._stop_ffmpeg(camera_id)
                                    await utils._start_ffmpeg(camera_id, config)
                            # Continue outer loop
                            break
                except Exception as ex:
                    logger.error(
                        f"camera_worker[{camera_id}]: error checking reload trigger: {ex}"
                    )
                # Periodic FPS poll independent of trigger (DB-only mode)
                try:
                    if settings.CAM_SOURCE == "db":
                        now_ts = time.time()
                        if now_ts - last_fps_poll_ts >= settings.FPS_POLL_INTERVAL_SECONDS:
                            last_fps_poll_ts = now_ts
                            nfps = utils._fetch_camera_fps(camera_id)
                            if nfps is not None and int(nfps) != int(current_fps):
                                logger.info(
                                    f"camera_worker[{camera_id}]: periodic FPS change detected {current_fps} -> {nfps}; restarting ffmpeg"
                                )
                                current_fps = int(nfps)
                                config["camera_fps"] = current_fps
                                await utils._stop_ffmpeg(camera_id)
                                await utils._start_ffmpeg(camera_id, config)
                                break  # break inner loop to re-evaluate state immediately
                except Exception as ex:
                    logger.error(
                        f"camera_worker[{camera_id}]: error during periodic fps poll: {ex}"
                    )
                await asyncio.sleep(10)
        except Exception as e:
            logger.error(f"camera_worker[{camera_id}]: unexpected error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    watch_db_changes()
