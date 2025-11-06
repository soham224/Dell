import { callTypes, LocationSlice } from "./LocationSlice";
import {
  getAllLocation,
  getLocationById,
  addLocation,
  updateLocation,
} from "./LocationAPI";
import { successToast, warningToast } from "../../../../../utils/ToastMessage";
import { addNotification } from "../../Notification/_redux/notification";

export const { actions } = LocationSlice;

export const fetchLocation = (userRole) => async (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.list }));
  getAllLocation(userRole)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.locationFetched(response.data));
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

export const fetchLocationById = (id) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  return getLocationById(id)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.locationFetchedById(response.data));
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

export const createLocation = (locationData, user_id) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  const data = {
    location_name: locationData.locationName,
    company_id: locationData.companyId,
  };

  return addLocation(data)
    .then((response) => {
      if (response && response.isSuccess) {
        let data = response.data;
        dispatch(actions.addNewLocation(data));

        let data1 = {
          notification_message: "Location Added : " + locationData.locationName,
          user_id: user_id,
          type_of_notification: "string",
          status: true,
          is_unread: true,
        };
        addNotification(data1).then((response) => {
          if (response && response.isSuccess) {
            successToast("Location Added Successfully");
          }
        });
      }
    })
    .catch((error) => {
      if (error.detail) {
        console.log(error.detail);
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const locationUpdate = (locationData, user_id) => (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.action }));
  const data = {
    location_name: locationData.locationName || locationData.location_name,
    company_id: locationData.companyId,
    id: locationData.id,
  };

  return updateLocation(data)
    .then((response) => {
      if (response && response.isSuccess) {
        let data = response.data;
        dispatch(actions.updatedExistingLocation(data));
        successToast("Location Updated Successfully");
      }
    })
    .catch((error) => {
      if (error.detail) {
        console.log(error.detail);
      }
      dispatch(actions.catchError({ error, callType: callTypes.action }));
    });
};

export const clearPopupDataAction = () => (dispatch) => {
  dispatch(actions.clearPopupData());
};
