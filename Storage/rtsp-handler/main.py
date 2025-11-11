from multiprocessing.context import Process
import sentry_sdk
from config import settings
from logger_config import setup_logger
import logging

from utils import frame_generator, set_notifier, create_dir, create_directories
from notifier import watch_db_changes

# sentry_sdk.init(
#     dsn=settings.SENTRY_DSN,
#     traces_sample_rate=settings.SENTRY_TIME_RATE,
# )

# Logger Setup
setup_logger()
logger = logging.getLogger()

if __name__ == "__main__":
    # print(f"settings: {settings.json()}")

    # Ensure directories exist BEFORE starting the notifier to avoid ENOENT
    try:
        create_dir(settings.FRAMES_ROOT_DIR)
        # Also create per-camera raw directories (may hit DB when CAM_SOURCE=="db")
        create_directories()
        logger.info(
            f"Startup: ensured frame directories exist under {settings.FRAMES_ROOT_DIR}/{settings.RAW_SUBDIR}"
        )
    except Exception as ex:
        logger.error(f"Startup: error ensuring directories before notifier: {ex}")

    # create a background process for notifier
    fs_notifier_process = Process(target=set_notifier, daemon=True)
    fs_notifier_process.start()
    logger.info(f"PID : fs_notifier : {fs_notifier_process.pid}")

    # create a background process for DB change watcher
    db_notifier_process = Process(target=watch_db_changes, daemon=True)
    db_notifier_process.start()
    logger.info(f"PID : db_notifier : {db_notifier_process.pid}")

    # start frame generation
    frame_generator()
