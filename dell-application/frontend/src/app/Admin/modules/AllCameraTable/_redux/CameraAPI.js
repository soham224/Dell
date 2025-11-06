import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";
import {SUPER_ADMIN_ROLE} from "../../../../../enums/constant";

const GET_ALL_DEPLOYMENT_CAMERA = "/get_all_deployment_camera";
const GET_CAMERA_BY_ID = "/get_deployment_camera";
const ADD_DEPLOYMENT_CAMERAS = "/add_deployment_cameras";
const UPDATE_DEPLOYMENT_CAMERAS = "/update_deployment_cameras";
const UPDATE_RTSP_STATUS="/update_rtsp_status"

export async function getAllCamera(userRole) {
  return await request({
    endpoint: userRole === SUPER_ADMIN_ROLE ? GET_ALL_DEPLOYMENT_CAMERA :"/get_all_current_company_deployment_camera",
    method: HttpRequest.GET
  });
}

export async function getCameraRoiById(cameraId) {
  return await request({
    endpoint: GET_CAMERA_BY_ID + `?deployment_camera_id=${cameraId}`,
    method: HttpRequest.GET
  });
}

export async function addDeploymentRtspJob(data) {
  return await request({
    endpoint: ADD_DEPLOYMENT_CAMERAS,
    method: HttpRequest.POST,
    body: data
  });
}

export async function updateDeploymentCameras(location) {
  return await request({
    endpoint: UPDATE_DEPLOYMENT_CAMERAS,
    method: HttpRequest.POST,
    body: location
  });
}

export async function updateRtspStatus(cameraId,statusType,statusValue) {
  return await request({
    endpoint: UPDATE_RTSP_STATUS +`?camera_id=${cameraId}&status_type=${statusType}&status_value=${statusValue}`,
    method: HttpRequest.POST,
  });
}
