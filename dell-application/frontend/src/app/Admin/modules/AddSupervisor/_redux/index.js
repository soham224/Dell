import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";
import {ADMIN_ROLE, SUPER_ADMIN_ROLE, SUPERVISOR_ROLE} from "../../../../../enums/constant";

const GET_CURRENT_COMPANY_SUPERVISOR = "/get_current_company_supervisor";
const ADD_SUPERVISOR = "/add_supervisor";
const GET_ALL_COMPANIES = "/get_all_companies";
const UPDATE_SUPERVISOR_STATUS = "/update_supervisor_status";
const GET_ALL_LOCATIONS = "/get_enabled_locations_by_company_id";
const GET_ENABLED_LOCATIONS = "/get_current_company_enabled_locations";
const ASSIGN_LOCATION_TO_SUPERVISOR = "/assign_locations";
const REMOVED_ASSIGN_LOCATIONS = "/remove_assigned_locations";
const GET_SUPERVISOR_ENABLED_LOCATIONS ="/get_supervisor_enabled_locations";


export async function getSupervisorList(userRole) {

  return await request({
    endpoint: userRole === SUPER_ADMIN_ROLE ?  "/get_all_supervisor" :GET_CURRENT_COMPANY_SUPERVISOR,
    method: HttpRequest.GET,
  });
}

export async function getCompaniesList() {
  return await request({
    endpoint: GET_ALL_COMPANIES,
    method: HttpRequest.GET,
  });
}

export async function getLocationList(userRole) {
  return await request({
    endpoint: userRole === SUPER_ADMIN_ROLE ?  GET_ALL_LOCATIONS + "?company_id=1" :GET_ENABLED_LOCATIONS,
    method: HttpRequest.GET,
  });
}

export async function getEnabledLocationList(userRole) {
  let URL = "";
  if(userRole === ADMIN_ROLE){
    URL = GET_ENABLED_LOCATIONS
  }else if(userRole === SUPERVISOR_ROLE){
    URL = GET_SUPERVISOR_ENABLED_LOCATIONS
  }else{
    URL = GET_ALL_LOCATIONS + "?company_id=1"
  }
  return await request({
    endpoint: URL,
    method: HttpRequest.GET,
  });
}

export async function addSupervisor(parameters) {
  return await request({
    endpoint: ADD_SUPERVISOR,
    method: HttpRequest.POST,
    body: parameters,
  });
}

export async function updateSupervisorStatus(parameters) {
  return await request({
    endpoint:
        UPDATE_SUPERVISOR_STATUS +
        "?user_status=" +
        parameters.user_status +
        "&user_id=" +
        parameters.user_id,
    method: HttpRequest.POST,
  });
}

export async function assignLocationToSupervisor(parameters, user_id) {
  return await request({
    endpoint: ASSIGN_LOCATION_TO_SUPERVISOR + "?user_id=" + user_id,
    method: HttpRequest.POST,
    body: parameters.location_list,
  });
}

export async function deleteUserLocationById(parameters, user_id) {
  return await request({
    endpoint: REMOVED_ASSIGN_LOCATIONS + "?user_id=" + user_id,
    method: HttpRequest.POST,
    body: parameters.location_list,
  });
}
