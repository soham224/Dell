from fastapi import APIRouter

from api.api_v1.endpoints import (
    company_api,
    users,
    login,
    location_api,
    notification_api,
    camera_info_api,
    camera_usecase_mapping_api,
    usecase_api,
    result_handler,
    camera_label_mapping_api,
    widgets_api,
    filter_api,
    rtsp_down_odit_api,
    ai_people_footfall_api,
    # activity_api,
)


api_router = APIRouter()
api_router.include_router(company_api.router, tags=["company management"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(login.router, tags=["login"])
api_router.include_router(location_api.router, tags=["location"])
api_router.include_router(notification_api.router, tags=["Notification"])
api_router.include_router(camera_info_api.camera_router, tags=["Camera_info API"])
api_router.include_router(usecase_api.usecase_router, tags=["Use Case API"])

api_router.include_router(
    camera_usecase_mapping_api.usecase_mapping_router,
    tags=["Camera Usecase Mapping API"],
)
api_router.include_router(result_handler.router, tags=["Results handler"])
api_router.include_router(
    camera_label_mapping_api.router, tags=["Camera Label Mapping"]
)
api_router.include_router(widgets_api.router, tags=["Widgets"])
api_router.include_router(filter_api.router, tags=["Filter"])
api_router.include_router(rtsp_down_odit_api.router, tags=["RTSP Down Odit API"])
api_router.include_router(ai_people_footfall_api.router, tags=["AI Footfall"])
# api_router.include_router(activity_api.router, tags=["Activity API"])

