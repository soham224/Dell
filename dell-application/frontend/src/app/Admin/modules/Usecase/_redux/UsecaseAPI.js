import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";
import {SUPER_ADMIN_ROLE} from "../../../../../enums/constant";


const GET_ALL_USECASES = "/get_all_usecases";
const GET_ALL_DEPLOYMENT_CAMERA = "/get_all_deployment_camera_by_location";
const ADD_CAMERA_USECASE_MAPPING = "/camera_usecase_mapping/add";
const GET_ALL_CAMERA_USECASE_MAPPING = "/camera_usecase_mapping";
const GET_ALL_CAMERA_USECASE_MAPPING_BY_ID = "/camera_usecase_mapping/id";
const UPDATE_CAMERA_USECASE_MAPPING = "/cameras_usecase_mapping/update";


export async function getAllCamera(locationId) {
  return await request({
    endpoint: GET_ALL_DEPLOYMENT_CAMERA + "?location_id=" +locationId,
    method: HttpRequest.GET
  });
}

export async function getAllUsecase() {
  return await request({
    endpoint: GET_ALL_USECASES,
    method: HttpRequest.GET
  });
}

export async function addCameraUsecaseMapping(data) {
  return await request({
    endpoint: ADD_CAMERA_USECASE_MAPPING,
    method: HttpRequest.POST,
    body: data
  });
}


export async function getAllCameraUsecaseMapping(userRole) {
  return await request({
    endpoint: userRole === SUPER_ADMIN_ROLE ?  GET_ALL_CAMERA_USECASE_MAPPING :"/camera_usecase_mapping/current_company",
    method: HttpRequest.GET
  });
}

export async function getAllCameraUsecaseMappingById(usecaseId) {
  return await request({
    endpoint: GET_ALL_CAMERA_USECASE_MAPPING_BY_ID + `?camera_usecase_mapping_id=${usecaseId}`,
    method: HttpRequest.GET
  });
}



export async function updateCameraUsecaseMapping(usecaseData) {
  return await request({
    endpoint: UPDATE_CAMERA_USECASE_MAPPING,
    method: HttpRequest.POST,
    body: usecaseData
  });
}


