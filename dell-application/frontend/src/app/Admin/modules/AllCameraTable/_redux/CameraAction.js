import { callTypes, CameraSlice } from "./CameraSlice";
import {
  addDeploymentRtspJob, getAllCamera, updateDeploymentCameras, getCameraRoiById,
} from "./CameraAPI";
import { successToast, warningToast } from "../../../../../utils/ToastMessage";
import { addNotification } from "../../Notification/_redux/notification";

const { actions } = CameraSlice;

export const getAllCameras = (userRole) => async (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.list }));
  getAllCamera(userRole)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.getAllCamera(response.data));
      }
    })
    .catch((error) => {
      error.clientMessage = "Can't find locations";
      if (error.detail) {
        warningToast(error.detail);
      } else {
        warningToast("Something went Wrong");
      }
      dispatch(actions.catchError({ error, callType: callTypes.list }));
    });
};

export const getCameraRoiByIdes = (id) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  return getCameraRoiById(id)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.getCameraRoiById(response.data));
      } else {
        throw new Error("Error getting location details");
      }
    })
    .catch((error) => {
      if (error.detail) {
        warningToast(error.detail);
      } else {
        warningToast("Something went Wrong");
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const createLocation = (locationData, user_id) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  return addDeploymentRtspJob(locationData)
    .then((response) => {
      if (response && response.isSuccess) {
        let data = response.data;
        dispatch(actions.addDeploymentRtspJob(data));

        let data1 = {
          notification_message: "Camera Added : " + locationData.cameraName,
          user_id: user_id,
          type_of_notification: "string",
          status: true,
          is_unread: true,
        };
        addNotification(data1).then((response) => {
          if (response && response.isSuccess) {
            successToast("Camera Added Successfully");
          }
        });
      }
    })
    .catch((error) => {
      if (error.detail) {
        warningToast(error.detail);
      } else {
        warningToast("something went wrong");
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const updateDeploymentCameraes = (locationData) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));

  return updateDeploymentCameras(locationData)
    .then((response) => {
      if (response && response.isSuccess) {
        let data = response.data;
        dispatch(actions.updateDeploymentCameras(data));
        successToast(response.data?.message);
      }
    })
    .catch((error) => {
      if (error.detail) {
        warningToast(error.detail);
      } else {
        warningToast("Something went Wrong");
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const clearCameraByIdAction = () => (dispatch) => {
  dispatch(actions.clearCameraById());
};