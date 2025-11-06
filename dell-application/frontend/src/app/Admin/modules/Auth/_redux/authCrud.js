import axios from "axios";
import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";

export const LOGIN_URL = "/login/access-token";
export const LOGIN_TEST_URL = "/login/test-token";

export const REGISTER_COMPANY_URL = "/add_company";
export const REGISTER_USER_URL = "/add_user";
export const REQUEST_PASSWORD_URL = "api-superadmin/auth/forgot-password";

export function login(data) {
  return request({
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    endpoint: LOGIN_URL,
    method: HttpRequest.POST,
    body: data,
  });
}

export function getCurrentUser() {
  return request({
    endpoint: LOGIN_TEST_URL,
    method: HttpRequest.POST,
  });
}

export function registerCompany(data) {
  return request({
    endpoint: REGISTER_COMPANY_URL,
    method: HttpRequest.POST,
    body: data,
  });
}

export function registerUser(data) {
  return request({
    endpoint: REGISTER_USER_URL,
    method: HttpRequest.POST,
    body: data,
  });
}

export function requestPassword(email) {
  return axios.post(REQUEST_PASSWORD_URL, { email });
}
