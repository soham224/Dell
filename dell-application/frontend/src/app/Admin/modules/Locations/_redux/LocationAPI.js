import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";
import {SUPER_ADMIN_ROLE} from "../../../../../enums/constant";

const GET_ALL_LOCATION = "/get_current_company_locations";
const GET_LOCATION_BY_ID = "/get_location_by_id";
const ADD_LOCATION = "/add_location";
const UPDATE_LOCATION = "/update_location";
const UPDATE_LOCATION_STATUS="/update_location_status"


export async function getAllLocation(userRole) {
  const endpoint =
      userRole === SUPER_ADMIN_ROLE ? "/get_all_location" : GET_ALL_LOCATION;

  return await request({
    endpoint:endpoint,
    method: HttpRequest.GET
  });
}


export async function getAllCompany() {
  return await request({
    endpoint: "/get_all_companies",
    method: HttpRequest.GET
  });
}
export async function getLocationById(locationId) {
  return await request({
    endpoint: GET_LOCATION_BY_ID + `?location_id=${locationId}`,
    method: HttpRequest.GET
  });
}

export async function addLocation(location) {
  return await request({
    endpoint: ADD_LOCATION,
    method: HttpRequest.POST,
    body: location
  });
}

export async function updateLocation(location) {
  return await request({
    endpoint: UPDATE_LOCATION,
    method: HttpRequest.POST,
    body: location
  });
}

export async function updateLocationStatus(location_id,location_status) {
  return await request({
    endpoint: UPDATE_LOCATION_STATUS +`?location_id=${location_id}&location_status=${location_status}`,
    method: HttpRequest.POST,
  });
}
