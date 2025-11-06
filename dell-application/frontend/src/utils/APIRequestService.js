import Cookies from "universal-cookie";
import { appConfigs } from "./AppConfigs";
import axios from "axios";

const buildHeaders = (customHeaders = {}) => {
  const cookies = new Cookies();
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = cookies.get("access_token");
  const tokenType = cookies.get("token_type");

  if (token && tokenType) {
    headers["Authorization"] = `${tokenType} ${token}`;
  }

  return headers;
};

const buildConfig = (options) => ({
  method: options.method,
  url: options.url || appConfigs.API_HOST + options.endpoint,
  headers: buildHeaders(options.headers),
  data: options.body,
  ...(options.responseType && { responseType: options.responseType }),
});

export function request(options) {
  const config = buildConfig(options);

  return axios
      .request(config)
      .then((response) => ({
        data: response.request.status === 200 ? response.data : null,
        isStatus: false,
        isSuccess: response.request.status === 200,
        failureStatus: false,
      }))
      .catch((error) => handleError(error));
}

function handleError(error) {
  if (!error.response) throw error;

  const { status, data } = error.response;

  if (status === 401) {
    // Import store and actions only when needed
    const store = require("../redux/store").default;
    const { actions } = require("../app/Admin/modules/Auth/_redux/authRedux");
    store.dispatch(actions.logout());
    return {
      data: null,
      isStatus: false,
      isSuccess: false,
      failureStatus: true,
      error: data || error.message,
    };
  }

  throw data || error;
}
