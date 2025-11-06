import { HttpRequest } from "../../../../../enums/http.methods";
import { request } from "../../../../../utils/APIRequestService";
import {ADMIN_ROLE, SUPER_ADMIN_ROLE, SUPERVISOR_ROLE} from "../../../../../enums/constant";
import moment from "moment-timezone";

const GET_FILTER_GRAPH_DATA_ADMIN = "/get_filter_result_of_admin";
const GET_FILTER_GRAPH_DATA_SUPERVISOR = "/get_filter_result_of_supervisor";
const GET_FILTER_GRAPH_DATA_SUPERUSER = "/get_filter_result_of_superuser";
const GET_WIDGETS_DATA_ADMIN = "/get_admin_widgets";
const GET_WIDGETS_DATA_SUPERVISOR = "/get_supervisor_widgets";
const GET_WIDGETS_DATA_SUPERUSER = "/get_superuser_widgets";
const GET_TABLE_DATA_FROM_ID = "/get_filter_result_of_last_graph_step";
const GET_FILTER_EVENT_OF_ADMIN = "/get_filter_event_of_admin";
const GET_FILTER_EVENT_OF_SUPERVISOR = "/get_filter_event_of_supervisor";
const GET_FILTER_EVENT_OF_LAST_GRAPH_STEP =
    "/get_filter_event_of_last_graph_step";
const GET_EVENT_TYPE_BY_CAMERA_ID = "/get_event_type_by_camera_id";
const GET_CURRENT_USER_TOTAL_CAMERAS_BY_LOCATION_ID ="/get_current_user_total_cameras_by_location_id";
const GET_FILTER_RESULT_OF_ADMIN_PERCENTAGE ="/get_filter_result_of_admin_percentage";

export async function getWidgetsDataForAdmin(data) {
  return await request({
    endpoint: GET_WIDGETS_DATA_ADMIN,
    method: HttpRequest.POST,
    body: data,
  });
}

export async function getWidgetsDataForSupervisor(data) {
  return await request({
    endpoint: GET_WIDGETS_DATA_SUPERVISOR,
    method: HttpRequest.POST,
    body: data,
  });
}
export async function getWidgetsDataForSuperuser(data) {
  return await request({
    endpoint: GET_WIDGETS_DATA_SUPERUSER + "?company_id=" + "1",
    method: HttpRequest.POST,
    body: data,
  });
}


export async function getFilterGraphData(data, userRole, name) {
  let DATA_URL = "";
  if (userRole === ADMIN_ROLE && name === "Label") {
    DATA_URL = GET_FILTER_GRAPH_DATA_ADMIN;
  } else if (userRole === ADMIN_ROLE && name === "Event") {
    DATA_URL = GET_FILTER_EVENT_OF_ADMIN;
  } else if (userRole === SUPERVISOR_ROLE && name === "Label") {
    DATA_URL = GET_FILTER_GRAPH_DATA_SUPERVISOR;
  } else if (userRole === SUPERVISOR_ROLE && name === "Event") {
    DATA_URL = GET_FILTER_EVENT_OF_SUPERVISOR;
  }
  else if (userRole === SUPER_ADMIN_ROLE && name === "Label") {
    DATA_URL = GET_FILTER_GRAPH_DATA_SUPERUSER + "?company_id=" + "1";
  } else if (userRole === SUPER_ADMIN_ROLE && name === "Event") {
    DATA_URL = GET_FILTER_GRAPH_DATA_SUPERUSER + "?company_id=" + "1";
  }

  const userTimeZone = moment.tz.guess();

  return await request({
    endpoint: DATA_URL,
    method: HttpRequest.POST,
    body: {
      ...data,
      time_zone: userTimeZone,
    },
  });
}

export async function getOneTableDataFromBar(uniqueId, labelName, name) {
  const baseURL = name === "Label" ? GET_TABLE_DATA_FROM_ID : GET_FILTER_EVENT_OF_LAST_GRAPH_STEP;

  // Construct the URL parameters
  const params = new URLSearchParams({ data_id: uniqueId });
  if (labelName) {
    params.append('label', labelName);
  }

  return await request({
    endpoint: `${baseURL}?${params.toString()}`,
    method: HttpRequest.GET,
  });
}

export async function getDiffEventsByCameraId(body) {
  return await request({
    endpoint: GET_EVENT_TYPE_BY_CAMERA_ID,
    method: HttpRequest.POST,
    body: JSON.stringify(body),
  });
}

export async function getTotalCamerasByLocationId(data,userRole) {
  return await request({
    endpoint: userRole === SUPER_ADMIN_ROLE ? "/get_superuser_total_cameras_by_location_id?company_id=" +"1" :GET_CURRENT_USER_TOTAL_CAMERAS_BY_LOCATION_ID,
    method: HttpRequest.POST,
    body: JSON.stringify(data),
  });
}


export async function getActivityType() {
  return await request({
    endpoint: '/get_activity_type',
    method:HttpRequest.GET,
  });
}
