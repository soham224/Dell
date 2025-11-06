from multiprocessing.context import Process
import sentry_sdk
from config import settings
from logger_config import setup_logger
import logging

from utils import frame_generator, set_notifier

# sentry_sdk.init(
#     dsn=settings.SENTRY_DSN,
#     traces_sample_rate=settings.SENTRY_TIME_RATE,
# )

# Logger Setup
setup_logger()
logger = logging.getLogger()

if __name__ == "__main__":
    # print(f"settings: {settings.json()}")

    # create a background process for notifier
    notifier_process = Process(target=set_notifier, daemon=True)
    notifier_process.start()
    print("PID : notifier : ", notifier_process.pid)
    logger.info(("PID : notifier : ", notifier_process.pid))

    # start frame generation
    frame_generator()
