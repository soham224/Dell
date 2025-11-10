"""Application configuration settings.

Centralized configuration powered by Pydantic `BaseSettings`. Values are
primarily sourced from environment variables, enabling safe and flexible
deployment across environments.

Security note: Several defaults and constants here include credentials or
external endpoints. In production, prefer injecting all secrets via
environment variables or a secret manager. Do not log secret values.

Category: Core / Configuration
"""

import json
import secrets
from typing import List
import os
from pydantic import AnyHttpUrl, BaseSettings


class Settings(BaseSettings):
    """Strongly-typed application settings.

    This class defines all configuration knobs used by the service, including
    API metadata, database connections (MySQL and MongoDB), logging/monitoring
    integrations, AWS resources, and miscellaneous constants. Values are read
    from environment variables where specified.

    Instances of this class should be treated as read-only and imported from
    `core.config` as `settings`.
    """

    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8 * 1
    SERVER_NAME: str = "server"
    SERVER_HOST: AnyHttpUrl = "http://localhost"
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    FEEDBACK_FILE_LIMIT = 10

    PROJECT_NAME: str = "Auto Serving REST"

    PROJECT_ENV = os.environ["PROJECT_ENV"]

    MODEL_TEST_USER_CREDIT: int = 100
    SENTRY_DSN = "https://af362aab1f4346868a0bc171514d6695@o4505078832693248.ingest.sentry.io/4505078994960384"
    SENTRY_TRACES_SAMPLE_RATE = 0.1

    # email settings
    MAIL_USER = "pythondemodonotreply@gmail.com"
    MAIL_PASS = "qazwsxedcrfvtgb1234567890"

    ENABLE_USER_SUBJECT = "Account Activated"
    USER_REGISTRATION_SUBJECT = "Welcome to the AUTO-AI-serving"
    USER_REGISTRATION_SUBJECT_ADMIN = "User On-board"
    USER_ADD_JOB_SUBJECT = "Deployment Request Processing"
    HOSTED_SITE_URL = "www.login.com"

    SUPER_ADMIN_MAIL_LIST: list = ["mihir.softvan@gmail.com"]

    # Rekognition
    GENERIC_COLLECTION_NAME = "tusker-fr-coll"
    FACES_STORE_BUCKET = ""

    MYSQL_HOSTNAME = os.environ["MYSQL_HOSTNAME"]
    MYSQL_USERNAME = os.environ["MYSQL_USERNAME"]
    MYSQL_PASS = os.environ["MYSQL_PASS"]
    MYSQL_PORT: int = os.environ["MYSQL_PORT"]
    MYSQL_DB_NAME = os.environ["MYSQL_DB_NAME"]
    MYSQL_POOL_SIZE = int(os.environ["MYSQL_POOL_SIZE"])
    MYSQL_MAX_OVERFLOW = int(os.environ["MYSQL_MAX_OVERFLOW"])
    MYSQL_POOL_TIMEOUT = int(os.environ["MYSQL_POOL_TIMEOUT"])
    MYSQL_POOL_PRE_PING = os.environ["MYSQL_POOL_PRE_PING"]
    MYSQL_POOL_RECYCLE = int(os.environ["MYSQL_POOL_RECYCLE"])
    # for result db storage
    MONGO_HOST = os.environ["MONGO_HOST"]
    MONGO_USER = os.environ["MONGO_USER"]
    MONGO_PASS = os.environ["MONGO_PASS"]
    MONGO_DB = os.environ["MONGO_DB_NAME"]
    MONGO_PORT: int = os.environ["MONGO_PORT"]
    MONGO_AUTH_DB_NAME = os.environ["MONGO_AUTH_DB_NAME"]
    MONGO_COLL_NAME = os.environ["MONGO_COLL_NAME"]

    # ROI_API_ENDPOINT = os.environ["ROI_API_ENDPOINT"]
    MODEL_TEST_API_URL: str = (
        "https://k9hyxica2b.execute-api.ap-south-1.amazonaws.com/prod/infer"
    )

    TEST_IMG_STORAGE_BUCKET: str = "tusker-testing-images-storage"
    MODEL_STORAGE_BUCKET: str = "tusker-model-storage"
    # LOCAL_TEST_IMG_STORAGE_BUCKET: str = "tusker-marketplace-hiro"

    AWS_DEFAULT_REGION = "ap-south-1"
    DEFAULT_IMG_SIZE = "640"
    DEFAULT_CONF = "0.3"
    DEFAULT_IOU = "0.5"

    FRAME_EXTRACTOR_URI = (
        "437476783934.dkr.ecr.ap-south-1.amazonaws.com/tusker-rtsp-handler:latest"
    )
    FUNCTION_DEPLOY_URI = (
        "437476783934.dkr.ecr.ap-south-1.amazonaws.com/gen-model-deploy:latest"
    )

    API_EXAMPLE_URL = ""
    FRAME_GENERATOR_URI = ""
    ATTENDANCE_REPORT_URI = ""
    VIOLATION_REPORT_URI = ""

    TD_TASK_ROLE_ARN = "arn:aws:iam::437476783934:role/ecs-tasks-s3"
    TD_EXECUTION_ROLE_ARN = "arn:aws:iam::437476783934:role/ecsTaskExecutionRole"
    FUNCTION_DEPLOY_ROLE_ARN = "arn:aws:iam::437476783934:role/lambda-s3-access"

    ECS_SERVICE_SG = ["sg-008d9a78f8be2117c"]
    ECS_SERVICE_SUBNETS = ["subnet-079b22bc794e5f76e", "subnet-0740c3c7d9577b589"]

    NOTIFICATION_SEND_PASS = "ufqrxlfacxbaxgdx"
    NOTIFICATION_SEND_EMAIL = "tuskerai.noreply@gmail.com"

    LOGO_VIDEO_TABLE = "tusker-logo-detection"

    LOGO_MODEL_TABLE = "tusker-logo-model-details"

    LOGO_DETECTION_STORAGE_BUCKET = "tusker-img-storage-logo-detection"
    RPG_COMPANY_ID = 79
    INTERVAL_CONFIG = {
        "All": 0,
        "1 Minute": 1,
        "2 Minute": 2,
        "3 Minute": 3,
        "5 Minute": 5,
        "10 Minute": 10,
        "15 Minute": 15,
        "20 Minute": 20,
        "30 Minute": 30,
        "60 Minute": 60,
    }

    IMAGE_EXTENSION = ["png", "jpeg", "jpg"]
    VIDEO_EXTENSION = ["mp4", "avi"]

    MARKETPLACE_LOITERING_SQS = (
        "https://sqs.ap-south-1.amazonaws.com/437476783934/marketplace-loitering-sqs"
    )
    MARKETPLACE_VIOLENCE_SQS = (
        "https://sqs.ap-south-1.amazonaws.com/437476783934/marketplace-violence-sqs"
    )

    class Config:
        case_sensitive = True


settings = Settings()
