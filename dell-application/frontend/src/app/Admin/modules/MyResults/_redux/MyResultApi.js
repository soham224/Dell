import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";
import {SUPER_ADMIN_ROLE} from "../../../../../enums/constant";

const GET_RESULT_METADATA = "/get_result_metadata";
const GET_RESULTS = "/get_result";

export async function getResultMetadata(
    startDate,
    endDate,
    selectedLabel,
    selctedcameraid,
    locationIdList,
    pageSize,
    userRole
) {
  if(userRole === SUPER_ADMIN_ROLE){
    if (startDate && endDate) {
      return await request({
        endpoint:
            "/get_superuser_result_metadata?company_id=" + "1" +
            `&start_date=${startDate}&end_date=${endDate}&page_size=${pageSize}`,
        method: HttpRequest.POST,
        body: {
          camera_id_list: selctedcameraid,
          label_list: selectedLabel,
          location_id_list: locationIdList
        }
      });
    } else {
      return await request({
        endpoint: "/get_superuser_result_metadata?company_id=" + "1",
        method: HttpRequest.POST,
        body: {
          camera_id_list: selctedcameraid,
          label_list: selectedLabel,
          location_id_list: locationIdList
        }
      });
    }
  }
  else {
    if (startDate && endDate) {
      return await request({
        endpoint:
            GET_RESULT_METADATA +
            `?start_date=${startDate}&end_date=${endDate}&page_size=${pageSize}`,
        method: HttpRequest.POST,
        body: {
          camera_id_list: selctedcameraid,
          label_list: selectedLabel,
          location_id_list: locationIdList
        }
      });
    } else {
      return await request({
        endpoint: GET_RESULT_METADATA,
        method: HttpRequest.POST,
        body: {
          camera_id_list: selctedcameraid,
          label_list: selectedLabel,
          location_id_list: locationIdList
        }
      });
    }
  }

}
export async function getResults(
    params
) {
  const {
    pageSize,
    pageNo,
    jobId,
    startDate,
    endDate,
    selctedcameraid,
    selectedLabel,
    locationIdList,userRole
  } = params;
  if (userRole === SUPER_ADMIN_ROLE) {
    const params = new URLSearchParams({
      company_id: "1",
      page_number: pageNo,
      job_id: jobId,
      page_size: pageSize
    });

    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    return await request({
      endpoint: `/get_superuser_result?${params.toString()}`,
      method: HttpRequest.POST,
      body: {
        camera_id_list: selctedcameraid,
        label_list: selectedLabel,
        location_id_list: locationIdList
      }
    });
  }

  else {
    if (startDate && endDate) {
      return await request({
        endpoint:
            GET_RESULTS +
            `?page_number=${pageNo}&job_id=${jobId}&start_date=${startDate}&end_date=${endDate}&page_size=${pageSize}`,
        method: HttpRequest.POST,
        body: {
          camera_id_list: selctedcameraid,
          label_list: selectedLabel,
          location_id_list: locationIdList
        }
      });
    } else {
      return await request({
        endpoint:
            GET_RESULTS +
            `?page_number=${pageNo}&job_id=${jobId}&page_size=${pageSize}`,
        method: HttpRequest.POST,
        body: {
          camera_id_list: selctedcameraid,
          label_list: selectedLabel,
          location_id_list: locationIdList
        }
      });
    }
  }
}
