import os
import logging
from datetime import datetime, timedelta
import re


class LineAndDateRotatingFileHandler(logging.Handler):
    """
    Custom log handler:
    - Rotates logs daily and after N lines (default 100)
    - Deletes logs older than `backup_days`

    Log file format:
    logs/15-07-2025_helmet_detection.log
    logs/15-07-2025_helmet_detection_1.log
    logs/16-07-2025_helmet_detection.log
    """

    def __init__(
        self, base_dir, base_filename, max_lines=100, encoding="utf-8", backup_days=30
    ):
        super().__init__()
        self.base_dir = base_dir
        self.base_filename = base_filename
        self.max_lines = max_lines
        self.encoding = encoding
        self.backup_days = backup_days

        self.current_date = datetime.now().strftime("%d-%m-%Y")
        self.line_count = 0
        self.file_index = 0
        self._open_new_log_file()

    def _get_log_filepath(self):
        suffix = f"_{self.file_index}" if self.file_index > 0 else ""
        return os.path.join(
            self.base_dir, f"{self.current_date}_{self.base_filename}{suffix}.log"
        )

    def _open_new_log_file(self):
        if hasattr(self, "stream") and not self.stream.closed:
            self.stream.close()

        today = datetime.now().strftime("%d-%m-%Y")
        if today != self.current_date:
            self.current_date = today
            self.file_index = 0
            self.line_count = 0

        self._cleanup_old_logs()

        self.log_filepath = self._get_log_filepath()
        os.makedirs(self.base_dir, exist_ok=True)
        self.stream = open(self.log_filepath, mode="a", encoding=self.encoding)
        self.line_count = 0
        self.file_index += 1

    def emit(self, record):
        if self.stream.closed:
            self._open_new_log_file()

        msg = self.format(record)
        self.stream.write(msg + "\n")
        self.line_count += 1
        self.stream.flush()

        if self.line_count >= self.max_lines:
            self._open_new_log_file()

    def close(self):
        if hasattr(self, "stream") and not self.stream.closed:
            self.stream.close()
        super().close()

    def _cleanup_old_logs(self):
        """
        Delete log files older than `self.backup_days` from the log directory.
        """
        cutoff_date = datetime.now() - timedelta(days=self.backup_days)
        pattern = re.compile(r"(\d{2}-\d{2}-\d{4})_" + re.escape(self.base_filename))

        for fname in os.listdir(self.base_dir):
            match = pattern.match(fname)
            if match:
                file_date_str = match.group(1)
                try:
                    file_date = datetime.strptime(file_date_str, "%d-%m-%Y")
                    if file_date < cutoff_date:
                        full_path = os.path.join(self.base_dir, fname)
                        os.remove(full_path)
                        print(f"[Logger Cleanup] Deleted old log file: {full_path}")
                except Exception as e:
                    print(f"[Logger Cleanup] Failed to parse date in: {fname} | {e}")


def setup_logger(name: str = "tusker_logger") -> logging.Logger:
    """
    Set up and return a configured logger instance with enhanced formatting.

    Environment:
    - Requires LOG_BASE_DIRECTORY to be set.

    Returns:
        logging.Logger: Configured logger instance.
    """
    log_base_directory = os.getenv("LOG_BASE_DIRECTORY")
    if not log_base_directory:
        raise EnvironmentError(
            "LOG_BASE_DIRECTORY is not set. Please export it before running."
        )

    log_directory = os.path.join(log_base_directory, "logs")
    os.makedirs(log_directory, exist_ok=True)

    # Enhanced log format with more detailed information
    log_format = (
        "%(asctime)s - [%(levelname)8s] - %(name)s - %(filename)s:%(lineno)d - "
        "%(funcName)s() - %(message)s"
    )
    date_format = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(fmt=log_format, datefmt=date_format)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    if logger.hasHandlers():
        logger.handlers.clear()

    # Custom file handler with daily + line rotation and retention
    file_handler = LineAndDateRotatingFileHandler(
        base_dir=log_directory,
        base_filename=name,
        max_lines=10000,  # Increased for better performance tracking
        backup_days=7,
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    # Console Handler with different level for production
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    # Set to INFO in production, DEBUG in development
    console_level = os.getenv("LOG_CONSOLE_LEVEL", "DEBUG").upper()
    console_handler.setLevel(getattr(logging, console_level, logging.INFO))

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.info("=" * 80)
    logger.info(f"Logger '{name}' initialized successfully")
    logger.info(f"Log directory: {log_directory}")
    logger.info(f"File log level: DEBUG, Console log level: {console_level}")
    logger.info(f"Log rotation: Daily + every 2000 lines, Retention: 30 days")
    logger.info("=" * 80)

    return logger


def setup_performance_logger(name: str = "performance_logger") -> logging.Logger:
    """
    Set up a dedicated performance logger for tracking processing times.

    Returns:
        logging.Logger: Performance logger instance.
    """
    log_base_directory = os.getenv("LOG_BASE_DIRECTORY")
    if not log_base_directory:
        raise EnvironmentError(
            "LOG_BASE_DIRECTORY is not set. Please export it before running."
        )

    log_directory = os.path.join(log_base_directory, "logs", "performance")
    os.makedirs(log_directory, exist_ok=True)

    # Performance-specific log format
    perf_format = "%(asctime)s - [PERF] - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S.%f"
    formatter = logging.Formatter(fmt=perf_format, datefmt=date_format)

    perf_logger = logging.getLogger(name)
    perf_logger.setLevel(logging.INFO)
    perf_logger.propagate = False

    if perf_logger.hasHandlers():
        perf_logger.handlers.clear()

    # Performance file handler
    perf_file_handler = LineAndDateRotatingFileHandler(
        base_dir=log_directory,
        base_filename="performance_metrics",
        max_lines=5000,  # More lines for performance data
        backup_days=7,  # Keep performance logs for 7 days
    )
    perf_file_handler.setFormatter(formatter)
    perf_file_handler.setLevel(logging.INFO)

    perf_logger.addHandler(perf_file_handler)

    perf_logger.info("Performance logger initialized")

    return perf_logger


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

# Usage Example

# export LOG_BASE_DIRECTORY=/path/to/logs_root

# from logger_config import setup_logger
#
# logger = setup_logger("helmet_detection")
#
# logger.info("App started.")
# logger.debug("Debugging details here.")
# logger.warning("Something might be wrong.")
# logger.error("Something went wrong.")
