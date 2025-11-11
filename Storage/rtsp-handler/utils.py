import json
import logging
import os
import time
import pyinotify
import asyncio
import subprocess
import boto3
import datetime as dt
import ffmpeg
import pymysql
import pymysql.cursors
from config import settings
from logger_config import setup_logger
from datetime import datetime, timedelta, time as dtime
from typing import Dict, Any, List, Optional, Tuple
from persistqueue import SQLiteQueue
from core import (
    quote_identifier as _quote_identifier,
    update_db_flags,
    fetch_camera_status as _fetch_camera_status,
    fetch_camera_windows as _fetch_camera_windows,
    now_utc_time as _now_utc_time,
    is_time_in_any_window as _is_time_in_any_window,
    fetch_camera_fps as _fetch_camera_fps,
)


# quote_identifier is imported from core as _quote_identifier


# Logger Setup
setup_logger()
logger = logging.getLogger()

# Track processes per camera for independent control
all_processes = []
camera_processes: Dict[int, Optional[asyncio.subprocess.Process]] = {}
camera_tasks: Dict[int, Optional[asyncio.Task]] = {}
s3_client = boto3.client("s3")

# db settings
if settings.CAM_SOURCE == "db":
    logger.info(f"Selected CAM source: {settings.CAM_SOURCE}")
    try:
        db_mysql = pymysql.connect(
            host=settings.DB_HOST,
            user=settings.DB_USERNAME,
            password=settings.ORI_DB_PASS,
            db=settings.DB_NAME,
            port=settings.DB_PORT,
            cursorclass=pymysql.cursors.DictCursor,
        )
        logger.info("Connected to the database successfully")
    except pymysql.MySQLError as e:
        logger.error(f"Error connecting to MySQL: {e}")

# persist queue settings
if settings.FRAME_STORAGE_TYPE == "dbq":
    if settings.DB_TYPE == "mysql":
        logger.info(
            f"Selected FRAME_STORAGE_TYPE :: {settings.FRAME_STORAGE_TYPE} & Selected DB_TYPE :: {settings.DB_TYPE}"
        )
        db_conf = {
            "host": settings.DB_HOST,
            "user": settings.DB_USERNAME,
            "password": settings.ORI_DB_PASS,
            "db": settings.DB_NAME,
            "port": settings.DB_PORT,
            "cursorclass": pymysql.cursors.DictCursor,
        }
        conn = pymysql.connect(**db_conf)
        cursor = conn.cursor()

        # SQL to create table if it doesn't exist
        create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {settings.QUEUE_NAME} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                frame_data BLOB NOT NULL,
                frame_time DATETIME NOT NULL,
                camera_id INT NOT NULL,
                camera_status JSON NULL
            );
            """
        cursor.execute(create_table_sql)
        logger.info(f"Created table {settings.QUEUE_NAME} successfully")
        conn.commit()

        # Close connection
        cursor.close()
        conn.close()

    elif settings.DB_TYPE == "sqlite":
        logger.info(f"Selected DB_TYPE :: {settings.DB_TYPE}")
        frames_queue = SQLiteQueue(settings.QUEUE_NAME, auto_commit=True)


def suffix_filter(event: str) -> bool:
    """
    This function checks the suffix of the file
    It returns True if suffix is present in settings.SUFFIXES else False
    """
    try:
        if event.name:
            return os.path.splitext(event.name)[1] not in settings.SUFFIXES
        else:
            return False
    except Exception as ex:
        logger.error(f"Exception in suffix_filter: {ex}")
        return False


def create_dir(dir_name: str) -> None:
    """
    This function creates the directories if not already present.
    """
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)


def upload_image_to_s3(file_name: str) -> bool:
    try:
        if os.path.exists(file_name):
            s3_client.upload_file(file_name, settings.FRAMES_STORAGE_BUCKET, file_name)
        else:
            logger.warning(f"upload_image_to_s3: frame path not found: {file_name}")
    except Exception as e:
        logger.error(f"upload_image_to_s3: Exception during S3 upload: {e}")


def get_cameras_from_db() -> dict:
    """ """
    try:
        cursor = db_mysql.cursor()
        # Validate table name and user id before building query
        if not getattr(settings, "CAMERA_RTSP_TABLE", None):
            logger.error(
                "get_cameras_from_db: CAMERA_RTSP_TABLE is not configured. Set env var CAMERA_RTSP_TABLE or ensure default applies."
            )
            return {}
        if not getattr(settings, "USER_ID", None):
            logger.error(
                "get_cameras_from_db: USER_ID is not configured. Set env var USER_ID."
            )
            return {}

        table_ref = _quote_identifier(settings.CAMERA_RTSP_TABLE)
        logger.debug(f"get_cameras_from_db: using camera table {table_ref}")
        ul = _quote_identifier(settings.USER_LOCATION_TABLE)
        loc = _quote_identifier(settings.LOCATION_TABLE)
        usr = _quote_identifier(settings.USER_TABLE)
        # Note: Expecting {table_ref} to be the camera manager table (e.g., camera_manager)
        query = f"""
            SELECT camera_rtsp.* FROM {table_ref} AS camera_rtsp
            INNER JOIN {ul} ON {ul}.{settings.UL_LOCATION_ID_COLUMN} = camera_rtsp.{settings.LOCATION_ID_COLUMN}
            INNER JOIN {loc} ON {loc}.{settings.LOCATION_ID_PK_COLUMN} = {ul}.{settings.UL_LOCATION_ID_COLUMN}
            INNER JOIN {usr} ON {usr}.{settings.USER_ID_COLUMN} = {ul}.{settings.UL_USER_ID_COLUMN}
            WHERE {usr}.{settings.USER_ID_COLUMN} = %s;
        """
        logger.debug(f"get_cameras_from_db: query -> {query}")
        cursor.execute(query, (settings.USER_ID,))
        data = cursor.fetchall()
        logger.debug(f"get_cameras_from_db: fetched {len(data)} rows")
        cursor.close()
        for data_item in data:
            logger.info(f"In Function get_cameras_from_db :: Data_Item :: {data_item}")
        data_dict = {}
        for data_item in data:
            try:
                scale = int(
                    str(
                        data_item.get(settings.CAMERA_RESOLUTION_COLUMN, "640:640")
                    ).split(":")[0]
                )
            except Exception:
                scale = 640
            data_dict[data_item[settings.CAMERA_ID_COLUMN]] = {
                "camera_name": data_item.get(settings.CAMERA_NAME_COLUMN),
                "camera_rtsp_url": data_item.get(settings.RTSP_URL_COLUMN),
                "camera_status": data_item.get(settings.STATUS_COLUMN, 0),
                "camera_fps": data_item.get(settings.FPS_COLUMN, 60),
                "scale": scale,
            }
        return data_dict
    except Exception as e:
        logger.error(f"Exception in get_cameras_from_db : {e}")
        # Return empty dict to avoid NoneType errors downstream
        return {}


# update_db_flags is imported from core


def set_notifier():
    """
    This is file system watcher, it notifies if some file with the
    specific suffix is getting created
    """
    try:
        while True:
            wm = pyinotify.WatchManager()
            logger.info(
                f"In Function set_notifier :: pyinotify.IN_CLOSE_WRITE :: {pyinotify.IN_CLOSE_WRITE}"
            )

            # Ensure the base directories exist before adding the watch to avoid ENOENT
            try:
                # Create root dir if needed
                create_dir(settings.FRAMES_ROOT_DIR)
                # Create RAW_SUBDIR under root
                watch_path = os.path.join(settings.FRAMES_ROOT_DIR, settings.RAW_SUBDIR)
                os.makedirs(watch_path, exist_ok=True)
                logger.debug(f"set_notifier: ensured watch path exists: {watch_path}")
            except Exception as dex:
                logger.error(f"set_notifier: error ensuring directories: {dex}")

            # Retry attaching the watch a few times if it fails initially
            watch_attached = False
            watch_path = os.path.join(settings.FRAMES_ROOT_DIR, settings.RAW_SUBDIR)
            for attempt in range(1, 11):  # ~10 attempts
                try:
                    wm.add_watch(
                        [watch_path],
                        pyinotify.IN_CLOSE_WRITE,
                        rec=True,
                        auto_add=True,
                    )
                    watch_attached = True
                    logger.info(f"set_notifier: watch attached on {watch_path} (attempt {attempt})")
                    break
                except Exception as wex:
                    logger.warning(
                        f"set_notifier: add_watch failed on {watch_path} (attempt {attempt}); will retry: {wex}"
                    )
                    time.sleep(1)

            if not watch_attached:
                logger.error(
                    f"set_notifier: failed to attach watch on {watch_path} after multiple attempts; will retry later"
                )
                time.sleep(5)
                continue

            eh = CustomEventHandler()
            notifier = pyinotify.Notifier(wm, eh)
            logger.info("In Function set_notifier :: notifier start")
            try:
                notifier.loop()
            except Exception as loop_ex:
                logger.error(f"set_notifier: notifier loop error: {loop_ex}")
            finally:
                try:
                    notifier.stop()
                except Exception:
                    pass
                logger.info("In Function set_notifier :: notifier stop; restarting in 2s")
                time.sleep(2)
    except Exception as e:
        logger.error(f"In Function set_notifier :: Exception in set_notifier : {e} ")


def get_command_for_frames(camera_id: str, config: dict) -> list:
    """
    This fucntion for rtsp to frames convert command

    :camera_id : camera id
    :config : RTSP config details like rtsp url

    :return : list of rtsp to rtsp command

    """
    # Build filter chain based on FRAME_SIZE_MODE
    fps_part = f"fps=1/{config.get('camera_fps')}"
    if getattr(settings, "FRAME_SIZE_MODE", "original") == "640x640":
        # Append a scale filter to force 640x640 output for each frame
        scale_part = f",scale={settings.TARGET_FRAME_SIZE}:{settings.TARGET_FRAME_SIZE}"
    else:
        scale_part = ""

    vf_filter = f"{fps_part}{scale_part}"

    return [
        f"ffmpeg -rtsp_transport tcp -hide_banner -i '{config.get('camera_rtsp_url')}'"
        f" -vf '{vf_filter}'"
        f" -start_number $(date +%s)"
        f" {settings.FRAMES_ROOT_DIR}{os.sep}{settings.RAW_SUBDIR}{os.sep}{str(camera_id)}/%08d_frame.{settings.FRAME_SUFFIX}"
    ]


def seconds_to_standard_time() -> str:
    """
    This function convert seconds or minutes format to 00:00:00 format for Video RTSP command

    :return: string 'hour:minute:seconds' format
    """
    # timedelta used for convert minute or seconds to datetime object format hour:minute:second
    return (
        datetime.timedelta(seconds=int(given_time[:-1]) * 60)
        if "m" in given_time
        else datetime.timedelta(seconds=int(given_time[:-1]))
    )


def get_command_for_videos(camera_id: str, config: dict) -> list:
    """
    This fucntion for rtsp to video convert command

    :camera_id : camera id
    :config : RTSP config details like rtsp url

    :return : list of rtsp to video command
    """
    return [
        f"ffmpeg -i {config.get('camera_rtsp_url')} "
        f"-c copy -map 0 -segment_time {seconds_to_standard_time()} -f segment -strftime 1 -reset_timestamps 1 "
        f"{settings.FRAMES_ROOT_DIR}{os.sep}{settings.RAW_SUBDIR}{os.sep}{str(camera_id)}/'video_%Y%m%d_%H%M%S.mp4'"
    ]


def check_duration_time_video(max_time: int, given_time: str) -> bool:
    """
    This function verifies the user-provided time duration with 5 minutes for Video.
    'm' for minute 's' for second
    False if it is more than 5 minutes else True

    max_time : Maximum time of video duration limit
    given_time : Actual video duration time

    return : Boolean value True or False
    """
    # if m in the given it will convert minute to seconds
    video_time_in_seconds = (
        int(given_time[:-1]) * 60 if "m" in given_time else int(given_time[:-1])
    )
    return True if video_time_in_seconds <= max_time else False


def insert_frame_data(frame_path, timestamp):
    db_conf = {
        "host": settings.DB_HOST,
        "user": settings.DB_USERNAME,
        "password": settings.ORI_DB_PASS,
        "db": settings.DB_NAME,
        "port": settings.DB_PORT,
    }

    try:
        # Connect to the database
        conn = pymysql.connect(**db_conf)
        cursor = conn.cursor()

        camera_id = int(frame_path.split("/")[-2])
        logger.info(f"In insert_frame_data Function :: Camera ID :: {camera_id}")

        # camera_status = json.dumps(1)  # Converts int 1 to a JSON-compatible string "1"

        # # Insert SQL
        # insert_sql = f"""
        #     INSERT INTO {settings.QUEUE_NAME} (frame_data, frame_time, camera_id, camera_status)
        #     VALUES (%s, %s, %s, %s);
        #     """

        # Insert SQL
        insert_sql = f"""
                    INSERT INTO {settings.QUEUE_NAME} (frame_data, frame_time, camera_id)
                    VALUES (%s, %s, %s);
                    """

        cursor.execute(
            # insert_sql, (frame_path, timestamp, int(camera_id), camera_status)
            insert_sql,
            (frame_path, timestamp, int(camera_id)),
        )
        conn.commit()

        logger.info("In insert_frame_data Function :: Data inserted successfully.")

    except pymysql.MySQLError as e:
        logger.error(f"In insert_frame_data Function :: Error inserting data: {e}")

    finally:
        # Ensure resources are cleaned up
        if "cursor" in locals() and cursor:
            cursor.close()
        if "conn" in locals() and conn:
            conn.close()


class CustomEventHandler(pyinotify.ProcessEvent):
    def __call__(self, event):
        if not suffix_filter(event):
            super(CustomEventHandler, self).__call__(event)

    def process_IN_CLOSE_WRITE(self, event):
        frame_path = event.pathname
        if settings.REPLACE_FOR_FTP:
            frame_path = frame_path.replace(settings.FRAMES_ROOT_DIR, settings.FTP_URL)

        # Filter out any paths not under configured RAW_SUBDIR
        if f"{os.sep}{settings.RAW_SUBDIR}{os.sep}" not in frame_path:
            logger.debug(
                f"process_IN_CLOSE_WRITE: Skipping non-{settings.RAW_SUBDIR} path: {frame_path}"
            )
            return

        logger.info(
            f"In process_IN_CLOSE_WRITE function :: image get frame_path: {frame_path}"
        )

        if settings.FRAME_STORAGE_TYPE == "dbq":
            # save in queue
            current_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            # frame_data = {
            #     "frame_path": frame_path,
            #     "current_time": current_time,
            # }
            # frames_queue.put(frame_data)
            insert_frame_data(frame_path, current_time)

        elif settings.FRAME_STORAGE_TYPE == "s3":
            # upload to s3
            upload_image_to_s3(frame_path)

        if settings.DELETE_FRAMES:
            logger.info(
                f"In process_IN_CLOSE_WRITE function :: image delete frames: {frame_path}"
            )
            # delete the frame from local system
            os.remove(event.pathname)


def create_directories() -> None:
    """
    This function creates initial required directories.
    """
    if settings.CAM_SOURCE == "config":
        cam_config = settings.CAM_CONFIG
    elif settings.CAM_SOURCE == "db":
        cam_config = get_cameras_from_db()

    if not cam_config:
        logger.error(
            "fetch_rtsps_command: No camera configuration available. Skipping command generation."
        )
        return []

    if not cam_config:
        logger.error(
            "create_directories: No camera configuration found. Check DB tables or set CAM_SOURCE='config'."
        )
        return

    for camera_id, config in cam_config.items():
        if config.get("camera_status"):
            # e.g. /home/mihir/client/<RAW_SUBDIR>/0
            dir_path = (
                settings.FRAMES_ROOT_DIR
                + os.sep
                + settings.RAW_SUBDIR
                + os.sep
                + str(camera_id)
            )

            if not os.path.exists(dir_path):
                logger.info(
                    f"In create_directories function :: Creating dir : {dir_path}"
                )
                os.makedirs(dir_path)
            else:
                logger.info(
                    f"In create_directories function :: Deleting : {os.listdir(dir_path)}"
                )
                for file in os.listdir(dir_path):
                    if file.endswith(".jpg"):
                        os.remove(f"{dir_path}/{file}")


def check_rtsp(rtsp: str, camera_id: int):
    file_name = f"{int(time.time())}.png"
    logger.info(
        f"In check_rtsp Function :: Checking status for : {rtsp} || {file_name}"
    )
    if rtsp:
        # fetch and the first frame from rtsp
        try:
            # command for fetch one frame from rtsp
            cmd = [f"ffmpeg -i '{rtsp}' -vframes 1 {file_name}"]
            # run ffmpeg command using subprocess
            subprocess.run(cmd, capture_output=True, check=True, shell=True, timeout=15)
        except subprocess.TimeoutExpired as e:
            logger.error(f"TimeoutExpired Exception in check_rtsp : {e}")
        except subprocess.CalledProcessError as e:
            logger.error(f"CalledProcessError Exception in check_rtsp : {e}")
        except Exception as e:
            logger.error(f"Exception in check_rtsp : {e}")

        # check if frame is stored or not
        if os.path.isfile(file_name):
            os.remove(file_name)
            rtsp_status = True
            logger.info("check_rtsp: Rtsp working.")
        else:
            logger.info("check_rtsp: Rtsp not working.")
            rtsp_status = False
        if settings.CAM_SOURCE == "db":
            # Update only is_active based on RTSP health; processing handled separately
            update_db_flags(camera_id=camera_id, is_active=1 if rtsp_status else 0)
        return rtsp_status
    else:
        logger.info("check_rtsp: Rtsp not found.")
        return False


async def run_command_shell(command):
    # create subprocess
    process = await asyncio.create_subprocess_shell(
        command, stderr=asyncio.subprocess.PIPE
    )
    all_processes.append(process)

    logger.info(
        f"In run_command_shell Function :: Done: {command} || pid = {str(process.pid)}"
    )

    # wait for the subprocess to finish
    stdout, stderr = await process.communicate()
    logger.info(
        f"In run_command_shell Function :: [{command!r} exited with {process.returncode}]"
    )

    # if process completes without any erros, i.e. exit code 0
    if stdout:
        logger.info(
            f"In run_command_shell Function :: if process completes without any erros"
        )
        logger.info(
            f"In run_command_shell Function :: Done : {command} || pid = {str(process.pid)}"
        )

    # if process fails
    if stderr:
        logger.info(
            f"In run_command_shell Function :: Failed : {command} || pid = {str(process.pid)}"
        )
        logger.info(
            f"In run_command_shell Function :: process failed, sleeping for {settings.SLEEP_WHEN_RTSP_DOWN} seconds"
        )
        await asyncio.sleep(settings.SLEEP_WHEN_RTSP_DOWN)
        logger.info(f"In run_command_shell Function :: checking status...")
        check_rtsp(
            rtsp=command.split("'")[1],
            camera_id=int(
                command.split(f"{settings.RAW_SUBDIR}/")[-1].split(os.sep)[0]
            ),
        )
        await run_command_shell(command)


def run_asyncio_commands(tasks) -> None:
    """
    Run tasks asynchronously using asyncio and return results
    """
    loop = asyncio.get_event_loop()
    commands = asyncio.gather(*tasks)
    loop.run_until_complete(commands)
    loop.close()


def fetch_rtsps_command() -> list:
    """
    This function fetches all the camera rtsps from config and
    generates the command to generate the frames.
    """
    command_list = list()

    if settings.CAM_SOURCE == "config":
        cam_config = settings.CAM_CONFIG
    elif settings.CAM_SOURCE == "db":
        cam_config = get_cameras_from_db()

    for camera_id, config in cam_config.items():
        if settings.RTSP_STORAGE_TYPE == "image":
            command_list.append(get_command_for_frames(camera_id, config))
        elif settings.RTSP_STORAGE_TYPE == "video":
            if check_duration_time_video(
                settings.MAX_DURATION, settings.USER_VIDEO_DURATION
            ):
                command_list.append(get_command_for_videos(camera_id, config))
    return command_list


def start_processing():
    """
    This function starts the processing of cameras.
    """
    # fetch all the rtsps cmd
    logger.info("In start_processing Function :: start_processing")
    commands_list = fetch_rtsps_command()
    logger.info(f"In start_processing Function :: commands_list : {commands_list}")

    # start async processing for all
    if not commands_list:
        logger.error("start_processing: No commands to execute. Nothing to process.")
        return
    tasks = [run_command_shell(*command) for command in commands_list]
    run_asyncio_commands(tasks)


def frame_generator():
    try:
        # create root and cam dirs
        create_dir(settings.FRAMES_ROOT_DIR)
        create_directories()

        # start per-camera supervisor instead of one-shot processing
        start_supervisor()
    except Exception as e:
        logger.error(f"Exception in frame_generator : {e}")


# ==== New scheduling and supervision utilities ====
# _fetch_camera_status is imported from core


# _fetch_camera_windows is imported from core


_now_utc_time  # imported from core as _now_utc_time


# _is_time_in_any_window is imported from core


async def _start_ffmpeg(
    camera_id: int, config: Dict[str, Any]
) -> asyncio.subprocess.Process:
    """Start ffmpeg for a camera and return the process handle."""
    cmd = get_command_for_frames(camera_id, config)[0]
    logger.info(f"_start_ffmpeg: starting ffmpeg for camera_id={camera_id}: {cmd}")
    proc = await asyncio.create_subprocess_shell(cmd, stderr=asyncio.subprocess.PIPE)
    camera_processes[camera_id] = proc
    update_db_flags(camera_id, is_processing=1)
    return proc


async def _stop_ffmpeg(camera_id: int) -> None:
    proc = camera_processes.get(camera_id)
    if proc is None:
        return
    try:
        logger.info(
            f"_stop_ffmpeg: terminating ffmpeg for camera_id={camera_id}, pid={proc.pid}"
        )
        proc.terminate()
        try:
            await asyncio.wait_for(proc.wait(), timeout=10)
        except asyncio.TimeoutError:
            logger.warning(
                f"_stop_ffmpeg: kill ffmpeg for camera_id={camera_id} after timeout"
            )
            proc.kill()
            await proc.wait()
    except Exception as e:
        logger.error(
            f"_stop_ffmpeg: error stopping ffmpeg for camera_id={camera_id}: {e}"
        )
    finally:
        camera_processes[camera_id] = None
        update_db_flags(camera_id, is_processing=0)


async def camera_worker(camera_id: int, config: Dict[str, Any]) -> None:
    """
    DEPRECATED SHIM: camera_worker has moved to notifier.camera_worker. This shim forwards the call.
    """
    # Local import to avoid circular import at module load time
    from notifier import camera_worker as notifier_camera_worker

    await notifier_camera_worker(camera_id, config)


def start_supervisor() -> None:
    """Start per-camera asyncio workers for independent control."""
    cam_config = get_cameras_from_db()
    if not cam_config:
        logger.error("start_supervisor: No cameras found. Exiting supervisor.")
        return

    async def _runner():
        tasks = []
        for cam_id, cfg in cam_config.items():
            # create per-camera directory proactively
            dir_path = f"{settings.FRAMES_ROOT_DIR}{os.sep}{settings.RAW_SUBDIR}{os.sep}{str(cam_id)}"
            if not os.path.exists(dir_path):
                os.makedirs(dir_path, exist_ok=True)
            # Import notifier.camera_worker lazily to avoid circular import
            from notifier import camera_worker as notifier_camera_worker

            t = asyncio.create_task(notifier_camera_worker(cam_id, cfg))
            camera_tasks[cam_id] = t
            tasks.append(t)
        logger.info(f"start_supervisor: started {len(tasks)} camera workers")
        await asyncio.gather(*tasks)

    loop = asyncio.get_event_loop()
    loop.run_until_complete(_runner())


# _fetch_camera_fps is imported from core
