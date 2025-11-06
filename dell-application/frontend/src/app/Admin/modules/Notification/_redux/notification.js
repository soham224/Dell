import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";

const ADD_NOTIFICATION = "/add_notification";
const GET_ALL_NOTIFICATION = "/get_all_notification_of_current_user";
const UPDATE_NOTIFICATION = "/update_is_unread_by_id";

export async function getCameraNotification(notiData) {
  return await request({
    endpoint: GET_ALL_NOTIFICATION,
    method: HttpRequest.GET,
    body: notiData,
  });
}


export async function updateCameraNotification(notiData) {
  return await request({
    endpoint: UPDATE_NOTIFICATION,
    method: HttpRequest.POST,
    body: notiData,
  });
}

export async function addNotification(notiData) {
  return await request({
    endpoint: ADD_NOTIFICATION,
    method: HttpRequest.POST,
    body: notiData,
  });
}
