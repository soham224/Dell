import {REACT_APP_API_HOST_IP_Config, REACT_APP_IP_Config} from "./ipConfig";

export const appConfigs = {
  APP_ENV: process.env.REACT_APP_ENV,
  APP_IP: process.env.REACT_APP_IP,
  API_HOST: process.env.REACT_APP_API_HOST,
  // APP_IP: REACT_APP_IP_Config,
  // API_HOST: REACT_APP_API_HOST_IP_Config,
  APP_TITLE_PREFIX: "tuskerai",
};
