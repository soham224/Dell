import os
from pydantic import BaseSettings
import urllib.parse


class Settings(BaseSettings):
    # rtsp storage type that include image or video
    RTSP_STORAGE_TYPE = "image"

    # notifier will be triggered for the files only with these extensions
    SUFFIXES = {".jpg"}

    # generated frames or video will have this suffix
    if RTSP_STORAGE_TYPE == "image":
        FRAME_SUFFIX = "jpg"
    else:
        VIDEO_SUFFIX = "mp4"
        MAX_DURATION = 300  # maximum duration 300 seconds (5 minutes)
        USER_VIDEO_DURATION = os.getenv(
            "USER_VIDEO_DURATION"
        )  # video storage duration by User 1m for minutes or 1s for seconds

    # this id will act as a company admin id
    USER_ID = os.getenv("USER_ID")  # id, os.getenv('USER_ID')

    # the root directory where all the frames will be stored
    FRAMES_ROOT_DIR = os.getenv("FRAMES_ROOT_DIR")

    # frame storage type, dbq = mysql queue, filesystem = local system, s3 = aws s3
    FRAME_STORAGE_TYPE = "dbq"
    REPLACE_FOR_FTP = False

    # this will be used to delete the frames from the local system
    DELETE_FRAMES = False

    # this is the time interval for retrying the rtsp stream if it goes down
    SLEEP_WHEN_RTSP_DOWN = 120  # unit: seconds

    # this is for the camera source, config = from config.py, db = from database
    CAM_SOURCE = "db"  # config, db

    # sentry configration
    # SENTRY_DSN = "https://7976e64e2d6947f6901f34dc10b211e5@o4505078832693248.ingest.sentry.io/4505126196019200"
    # SENTRY_TIME_RATE = 1.0

    # DB config
    if CAM_SOURCE == "db" or FRAME_STORAGE_TYPE == "dbq":
        DB_TYPE = os.getenv("DB_TYPE")  # mysql,sqlite
        if DB_TYPE == "mysql":
            DB_HOST = os.getenv("DB_HOST")
            DB_USERNAME = os.getenv("DB_USERNAME")
            ORI_DB_PASS = os.getenv("DB_PASS")
            # URL encode the password
            DB_PASS = urllib.parse.quote(ORI_DB_PASS)
            # print(f"Encoded password (URL encoding): {DB_PASS}")
            DB_NAME = os.getenv("DB_NAME")
            DB_PORT = int(os.getenv("DB_PORT"))
            # Configurable camera table name (can be fully qualified like db.schema.table)
            # Note: os.getenv with a default will still return an empty string if the env var is set to "".
            # Using "or" ensures we fallback to the default when the variable is empty or None.
            CAMERA_RTSP_TABLE = os.getenv("CAMERA_RTSP_TABLE") or "camera_rtsp"
        if FRAME_STORAGE_TYPE == "dbq":
            QUEUE_NAME = os.getenv("QUEUE_NAME")

    if FRAME_STORAGE_TYPE == "s3":
        FRAMES_STORAGE_BUCKET = "tusker-baps-video-bucket"

    if REPLACE_FOR_FTP:
        # this is the ftp server url for the replacement
        FTP_URL = "http://192.168.0.204"

    if CAM_SOURCE == "config":
        # camera configuration
        CAM_CONFIG = {
            0: {
                "camera_name": "test_cam0",
                "camera_location": "psm0",
                "camera_rtsp_url": "rtsp://admin:aip1.0@cctv@115.244.149.106:554/unicast/c3/s0/live",
                "camera_status": True,
                "camera_fps": 1,
                "scale": 640,
            },
            1: {
                "camera_name": "test_cam1",
                "camera_location": "psm1",
                "camera_rtsp_url": "rtsp://admin:aip1.0@cctv@115.244.149.106:554/unicast/c3/s0/live",
                "camera_status": True,
                "camera_fps": 1,
                "scale": 640,
            },
        }

    class Config:
        case_sensitive = True


settings = Settings()
