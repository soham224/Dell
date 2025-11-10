"""Application logging helpers.

Provides utilities to read a YAML logging configuration and configure the
 Python logging system accordingly.

 Category: Infrastructure / Logging
 """

import logging.config
import os

import yaml


def read_logging_config(default_path="logging.yml", env_key="LOG_CFG"):
    """Read logging configuration from YAML file.

    The path can be overridden via the environment variable specified by
    `env_key`. If the file is not found, returns `None` and the caller can
    decide to fall back to basicConfig.

    Parameters
    ----------
    default_path : str
        Default path to the YAML file containing the logging configuration.
    env_key : str
        Environment variable name to override the configuration path.

    Returns
    -------
    dict | None
        Parsed logging configuration dictionary or None if file not found.
    """
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
    """Configure the logging subsystem.

    Parameters
    ----------
    logging_config : dict | None
        If provided, a dictConfig-compatible dictionary to configure logging.
    default_level : int
        Fallback level for `logging.basicConfig` when config is not provided.
    """
    if logging_config:
        logging.config.dictConfig(logging_config)
    else:
        logging.basicConfig(level=default_level)
