import { callTypes, UsecaseSlice } from "./UsecaseSlice";
import {
  addCameraUsecaseMapping, getAllCameraUsecaseMapping, getAllCameraUsecaseMappingById, updateCameraUsecaseMapping,
} from "./UsecaseAPI";
import {successToast, warningToast} from "../../../../../utils/ToastMessage";

const { actions } = UsecaseSlice;

export const getAllCameraUsecaseMappings = (userRole) => async (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.list }));
  getAllCameraUsecaseMapping(userRole)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.getAllCameraUsecaseMapping(response.data));
      }
    })
    .catch((error) => {
      error.clientMessage = "Can't find locations";
      if (error.detail) {
        console.log(error.detail);
      }
      dispatch(actions.catchError({ error, callType: callTypes.list }));
    });
};


export const getAllCameraUsecaseMappingByIdes = (id) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  return getAllCameraUsecaseMappingById(id)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.getAllCameraUsecaseMappingById(response.data));
      } else {
        throw new Error("Error getting location details");
      }
    })
    .catch((error) => {
      if (error.detail) {
        console.log(error.detail);
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const addCameraUsecaseMappings = (data) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  return addCameraUsecaseMapping(data)
    .then((response) => {
      if (response && response.isSuccess) {
        let data = response.data;
        dispatch(actions.addCameraUsecaseMapping(data));
        successToast("Camera UseCase Mapping Created Successfully");

      }
    })
    .catch((error) => {
      if (error.detail) {
        console.log(error.detail);
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const updateCameraUsecaseMappinges = (locationData) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));

  return updateCameraUsecaseMapping(locationData)
    .then((response) => {
      if (response && response.isSuccess) {
        let data = response.data;
        dispatch(actions.updateCameraUsecaseMapping(data));
        successToast(response.data?.message);
      }
    })
    .catch((error) => {
      if (error.detail) {
        console.log(error.detail);
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const clearUsecaseByIdAction = () => (dispatch) => {
  dispatch(actions.clearUsecaseById());
};