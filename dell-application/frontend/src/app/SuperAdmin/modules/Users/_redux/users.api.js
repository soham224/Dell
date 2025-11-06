import { request } from "../../../../../utils/APIRequestService";

export const GET_ALL_USERS_FOR_RESULT_MANAGER =
  "/get_all_users_for_result_manager";
export const GET_INTERVAL = "/get_interval";

export async function getAllUsersResultManager() {
  return await request({
    endpoint: GET_ALL_USERS_FOR_RESULT_MANAGER,
    method: "POST",
  });
}

export async function getInterval() {
  return await request({
    endpoint: GET_INTERVAL,
    method: "POST",
  });
}