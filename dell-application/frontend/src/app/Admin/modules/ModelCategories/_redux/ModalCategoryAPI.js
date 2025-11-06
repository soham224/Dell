import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";

export async function getCameraUsecaseMAppingByUSeCaseId(usecaseId) {
  return await request({
    endpoint: "/camera_usecase_mapping/usecase_id" + `?company_id=1&usecase_id=${usecaseId}`,
    method: HttpRequest.GET
  });
}
