import logging
import os
from datetime import datetime
from logger_config import setup_logger, setup_performance_logger

# model configs
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE"))
PERSON_WEIGHT_PATH: str = os.getenv(
    "PERSON_WEIGHT_PATH", "pt_model/person_detection.pt"
)

ROOT_URL = os.getenv("ROOT_URL")
ROOT_PATH = os.getenv("ROOT_PATH")

SLEEP_TIME = int(os.getenv("SLEEP_TIME"))
# PERSON_CROWD_THRESHOLD = int(os.getenv("PERSON_GATHERING_THRESHOLD"))

# MYSQL Config
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASS = os.getenv("MYSQL_PASS")
MYSQL_DB_NAME = os.getenv("MYSQL_DB_NAME")
MYSQL_PORT = int(os.getenv("MYSQL_PORT"))

RESULT_TYPE_ID = int(os.getenv("RESULT_TYPE_ID"))

# User context
USER_ID = os.getenv("USER_ID")

# Database table names (configurable)
CAMERA_TABLE_NAME: str = os.getenv("CAMERA_TABLE_NAME", "camera_rtsp")
RESULT_MAPPING_TABLE_NAME: str = os.getenv(
    "RESULT_MAPPING_TABLE_NAME", "camera_rtsp_result_type_mapping"
)

# Model configs
MODEL_CONF = float(os.getenv("MODEL_CONF"))
MODEL_IOU = float(os.getenv("MODEL_IOU"))

# API endpoints from environment
FRAME_STATUS_URL = os.getenv("FRAME_STATUS_URL")
GET_FRAME_URL = os.getenv("GET_FRAME_URL")
COPY_IMAGES_URL = os.getenv("COPY_IMAGES_URL")
ADD_RESULT_URL = os.getenv("ADD_RESULT_URL")  # From Backend APIs
DELETE_SOURCE_IMAGE_URL = os.getenv("DELETE_SOURCE_IMAGE_URL")

# ================================== Logger Configurations ==================================
# Use custom logger setup from logger_config.py. Requires LOG_BASE_DIRECTORY to be set.
log_base_directory = os.getenv("LOG_BASE_DIRECTORY")
if not log_base_directory:
    raise EnvironmentError(
        "LOG_BASE_DIRECTORY is not set. Please export it before running."
    )

# App logger and performance logger
logger: logging.Logger = setup_logger("intrusion_detection")
perf_logger: logging.Logger = setup_performance_logger("intrusion_performance")

# Initial log
logger.debug(
    "Config loaded. IMAGE_SIZE=%s, RESULT_TYPE_ID=%s, MODEL_CONF=%s, MODEL_IOU=%s, PERSON_WEIGHT_PATH=%s",
    IMAGE_SIZE,
    RESULT_TYPE_ID,
    MODEL_CONF,
    MODEL_IOU,
    PERSON_WEIGHT_PATH,
)
logger.debug("DB table config: CAMERA_TABLE_NAME=%s", CAMERA_TABLE_NAME)
logger.debug("DB table config: RESULT_MAPPING_TABLE_NAME=%s", RESULT_MAPPING_TABLE_NAME)
