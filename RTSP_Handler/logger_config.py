import os
import logging
from logging import handlers
from datetime import datetime


def setup_logger():
    """
    Set up and return a configured logger instance.

    Features:
    - Uses LOG_BASE_DIRECTORY environment variable to determine where logs are stored.
    - Creates a 'logs' subfolder if it doesn't exist.
    - Generates daily rotating log files with names formatted as 'DD-MM-YYYY_vfs_ai_occupancy_logs_file.log'.
    - Applies a detailed log format including timestamps, log levels, file names, line numbers, and function names.
    - Outputs logs to both file and console (INFO+).

    Raises:
        EnvironmentError: If LOG_BASE_DIRECTORY is not set in the environment.

    Returns:
        logging.Logger: A fully configured logger instance.
    """

    # ===================================== ENVIRONMENT CONFIG =====================================
    # Get base log directory from environment
    log_base_directory = os.getenv("LOG_BASE_DIRECTORY")
    if not log_base_directory:
        raise EnvironmentError(
            "LOG_BASE_DIRECTORY is not set. Please export it before running."
        )

    # Construct log directory path: <LOG_BASE_DIRECTORY>/logs/
    log_directory = os.path.join(log_base_directory, "logs")
    os.makedirs(
        log_directory, exist_ok=True
    )  # Create the logs directory if it doesn't exist

    # ====================================== LOG FILE NAMING =======================================
    # Format current date as DD-MM-YYYY
    today_date_str = datetime.now().strftime("%d-%m-%Y")

    # Define final log file name
    log_filename = f"{today_date_str}_vfs_tusker_rtsp_handler.log"
    full_log_path = os.path.join(log_directory, log_filename)

    # ===================================== HANDLER RESET ==========================================
    # Remove any pre-existing handlers attached to the root logger
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    # ======================================= FORMATTER =============================================
    # Define custom formatter with filename, line number, function, etc.
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s() : %(message)s",
        datefmt="%m/%d/%Y %I:%M:%S %p",
    )

    # ====================================== FILE HANDLER ==========================================
    # Set up a rotating file handler: rotates at midnight, keeps last 30 days
    file_handler = handlers.TimedRotatingFileHandler(
        full_log_path, when="midnight", interval=1, backupCount=30
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    # ===================================== CONSOLE HANDLER =========================================
    # Print logs to console as well (INFO level and above)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG)

    # ===================================== ROOT LOGGER CONFIG ======================================
    # Set global logging level
    logging.basicConfig(level=logging.DEBUG)

    # Initialize the custom logger
    logger = logging.getLogger("vfs_rtsp_handler")
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    logger.propagate = False

    # Replace root logger's handlers too
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # ==================================== DEBUG MESSAGES ===========================================
    logger.debug("Logger setup started.")
    logger.debug("LOG_BASE_DIRECTORY is set to: %s", log_base_directory)
    logger.debug("Log files will be stored in: %s", log_directory)
    logger.debug("Current log file name: %s", log_filename)
    logger.debug("Log format: timestamp | level | file:line | function | message")
    logger.debug("File handler and console handler attached to logger.")
    logger.debug("Logger initialization complete.")

    return logger


"""
====================================================================================
 Logging Levels Reference
====================================================================================

| Level Name | Numeric Value | Description                                      |
|------------|----------------|--------------------------------------------------|
| NOTSET     | 0              | Captures everything (rarely used explicitly).    |
| DEBUG      | 10             | Detailed information, used for debugging.        |
| INFO       | 20             | General info about application progress.         |
| WARNING    | 30             | Something unexpected happened, but not an error. |
| ERROR      | 40             | A serious problem occurred that needs attention. |
| CRITICAL   | 50             | Very serious error, often application crash.     |

Usage Tip:
- Set `console_handler` to INFO or higher in production to reduce noise.
- Use DEBUG during development to see everything.
====================================================================================
"""
