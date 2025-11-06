import { callTypes, ModalCategorySlice } from "./ModalCategorySlice";
import {
  getCameraUsecaseMAppingByUSeCaseId,
} from "./ModalCategoryAPI";
import { warningToast } from "../../../../../utils/ToastMessage";

const { actions } = ModalCategorySlice;

export const getCameraUsecaseMAppingByUSeCaseIdes = (usecaseId) => async (dispatch) => {
  dispatch(actions.startCall({ callType: callTypes.list }));
  getCameraUsecaseMAppingByUSeCaseId(usecaseId)
    .then((response) => {
      if (response && response.isSuccess) {
        dispatch(actions.getCameraUsecaseMAppingByUSeCaseId(response.data));
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
