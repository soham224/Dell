import { request } from "../../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../../enums/http.methods";
import {ADMIN_ROLE, SUPER_ADMIN_ROLE, SUPERVISOR_ROLE} from "../../../../../../enums/constant";

const GET_ALL_CAMERA_LABELS_BY_USER_ID =
  "/get_all_camera_labels_by_user_id_result_manager";
const GET_ALL_LABELS_FROM_LIST_OF_CAMERA_ID =
  "/get_camera_label_mapping_by_list_of_camera_id";
const GET_ALL_LABELS_FROM_LIST_OF_CAMERA_ID_SUPERVISOR =
  "/get_camera_label_mapping_by_list_of_camera_id_supervisor";
const GET_RESULT_FOR_RESULT_EXCEL = "/get_result_for_result_excel";


export async function getAllLabelsFromListOfCameraId(body, userRole) {
  if (userRole === ADMIN_ROLE) {
    return await request({
      endpoint:
        GET_ALL_LABELS_FROM_LIST_OF_CAMERA_ID,
      method: HttpRequest.POST,
      body: JSON.stringify(body),
    });
  } else if (userRole === SUPERVISOR_ROLE){
    return await request({
      endpoint:
        GET_ALL_LABELS_FROM_LIST_OF_CAMERA_ID_SUPERVISOR ,
      method: HttpRequest.POST,
      body: JSON.stringify(body),
    });
  }
  else {
    return await request({
      endpoint:
      "/get_superuser_camera_label_mapping_by_list_of_camera_id?company_id=" +"1" ,
      method: HttpRequest.POST,
      body: JSON.stringify(body),
    });
  }
}

export async function getAllLabelsFromUserId(user_id) {
    return await request({
      endpoint: GET_ALL_CAMERA_LABELS_BY_USER_ID + "?user_id=" + user_id,
      method: HttpRequest.GET,
    });

}


export async function getResultForResultExcel(data,userRole) {
  return await request({
    endpoint: userRole=== SUPER_ADMIN_ROLE ? "/get_superuser_result_for_result_excel?company_id=" +"1":GET_RESULT_FOR_RESULT_EXCEL,
    method: HttpRequest.POST,
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",  // Make sure you are sending JSON in the body
    },
    responseType: 'blob',  // Ensures the response is treated as binary data (Blob)
  });
}
