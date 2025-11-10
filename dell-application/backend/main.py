"""FastAPI application entrypoint.

 This module wires together configuration, middleware (CORS), API routers,
 logging, pagination, Sentry, and an optional APScheduler for background tasks.

 Category: API / Application Bootstrap
 """

import os

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from api.api_v1.api import api_router
from core.config import settings
from applogging.applogger import read_logging_config, setup_logging
from fastapi_pagination import add_pagination
import sentry_sdk
from sentry_sdk.integrations.logging import ignore_logger

# from core.scheduler_utils import check_system_health, update_camera_usecase_status_by_time
from core.scheduler_utils import check_system_health

from db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.PROJECT_ENV in ["development", "production"]:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        environment=settings.PROJECT_ENV,
    )
    ignore_logger("sentry_logger")

app.include_router(api_router, prefix=settings.API_V1_STR)

# Structured logging configuration
log_config_dict = read_logging_config("log_config.yml")
setup_logging(log_config_dict)

# Enable pagination utilities for List endpoints
add_pagination(app)

# Background scheduler for periodic maintenance tasks
scheduler = BackgroundScheduler()

# NOTE: The scheduler is kept commented to avoid unwanted background tasks
# when running locally or in certain deployments. Keep this block for future
# enablement without changing core logic.
# @app.on_event("startup")
# def start_scheduler():
#     scheduler.add_job(
#         check_system_health,
#         trigger=IntervalTrigger(
#             minutes=int(os.getenv("SYSTEM_CHECK_SCHEDULE_TIME", 15))
#         ),
#         id="15min_job",
#         replace_existing=True,
#     )
#     scheduler.add_job(
#         update_camera_usecase_status_by_time,
#         trigger=IntervalTrigger(
#             minutes=int(os.getenv("UPDATE_CAMERA_USECASE_CHECK_SCHEDULE_TIME", 15))
#         ),
#         id="usecase_status_job",
#         replace_existing=True,
#     )
#     scheduler.start()
#     print("Scheduler started")
# print(f"UPDATE_CAMERA_USECASE_CHECK_SCHEDULE_TIME :: {os.getenv('UPDATE_CAMERA_USECASE_CHECK_SCHEDULE_TIME')}")
# print(f"SYSTEM_CHECK_SCHEDULE_TIME :: {os.getenv('SYSTEM_CHECK_SCHEDULE_TIME', 15)}")
