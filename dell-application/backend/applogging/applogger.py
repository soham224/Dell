import logging.config
import os

import yaml


def read_logging_config(default_path="logging.yml", env_key="LOG_CFG"):
    path = default_path
    value = os.getenv(env_key, None)
    if value:
        path = value
    if os.path.exists(path):
        with open(path, "rt") as f:
            logging_config = yaml.safe_load(f.read())
        return logging_config
    else:
        return None


def setup_logging(logging_config, default_level=logging.INFO):
    if logging_config:
        logging.config.dictConfig(logging_config)
    else:
        logging.basicConfig(level=default_level)
