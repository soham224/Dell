import logging
import os
from datetime import datetime
from logger_config import setup_logger, setup_performance_logger

# model configs
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE"))
DEVICE = os.getenv("DEVICE", "0")  # '0' for GPU:0 if available, or 'cpu'

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

USECASE_ID = os.getenv("USECASE_ID", "3")

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

# People In/Out counts API
PEOPLE_COUNTS_API_URL = os.getenv(
    "PEOPLE_COUNTS_API_URL", "http://192.168.11.97:8005/ai_people_footfall/add"
)

# ===================== Tracking (Deep SORT) configuration =====================
# ReID checkpoint path (default to bundled model)
REID_CKPT = os.getenv(
    "REID_CKPT",
    os.path.join(
        os.path.dirname(__file__),
        "tracking/deep_sort_pytorch/deep_sort/deep/checkpoint/ckpt.t7",
    ),
)

# Deep SORT hyper-params (sane defaults; override via env if needed)
MAX_DIST = float(os.getenv("MAX_DIST", 0.2))
MIN_CONFIDENCE = float(os.getenv("MIN_CONFIDENCE", 0.3))
NMS_MAX_OVERLAP = float(os.getenv("NMS_MAX_OVERLAP", 0.5))
MAX_IOU_DISTANCE = float(os.getenv("MAX_IOU_DISTANCE", 0.7))
MAX_AGE = int(os.getenv("MAX_AGE", 30))
N_INIT = int(os.getenv("N_INIT", 3))
NN_BUDGET = int(os.getenv("NN_BUDGET", 100))

# ===================== People In/Out geometry configuration =====================
# Per-camera virtual line and ROI rectangle definitions.
# Populate these maps with your camera IDs. Example format:
# PEOPLE_LINE_CONFIG = {
#     12: {"p1": [0, 360], "p2": [1280, 360]},  # horizontal line y=360
# }
# PEOPLE_ROI_CONFIG = {
#     12: {"roi": [x1, y1, x2, y2]},
# }
PEOPLE_LINE_CONFIG = {}
PEOPLE_ROI_CONFIG = {}

# ================================== Logger Configurations ==================================
# Use custom logger setup from logger_config.py. Requires LOG_BASE_DIRECTORY to be set.
log_base_directory = os.getenv("LOG_BASE_DIRECTORY")
if not log_base_directory:
    raise EnvironmentError(
        "LOG_BASE_DIRECTORY is not set. Please export it before running."
    )

# ===================== Visualization configuration =====================
# VISUALIZE: enable annotated image dumps when set to truthy values (1, true, yes)
# OUTPUTS_DIR: where annotated images are stored; defaults to PWD/outputs
VISUALIZE = str(os.getenv("VISUALIZE", "1")).strip().lower() in {"1", "true", "yes", "on"}
OUTPUTS_DIR = os.getenv("OUTPUTS_DIR", os.path.join(os.getcwd(), "outputs"))

# App logger and performance logger
logger: logging.Logger = setup_logger("people_inout")
perf_logger: logging.Logger = setup_performance_logger("people_inout_performance")

# Initial log
logger.debug(
    "Config loaded. IMAGE_SIZE=%s, RESULT_TYPE_ID=%s, MODEL_CONF=%s, MODEL_IOU=%s",
    IMAGE_SIZE,
    RESULT_TYPE_ID,
    MODEL_CONF,
    MODEL_IOU,
)
logger.debug("DB table config: CAMERA_TABLE_NAME=%s", CAMERA_TABLE_NAME)
logger.debug("DB table config: RESULT_MAPPING_TABLE_NAME=%s", RESULT_MAPPING_TABLE_NAME)
