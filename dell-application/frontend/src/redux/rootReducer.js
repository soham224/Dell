import { all } from "redux-saga/effects";
import { combineReducers } from "redux";

import * as auth from "../app/Admin/modules/Auth/_redux/authRedux";

import { MyResultSlice } from "../app/Admin/modules/MyResults/_redux/MyResultSlice";
import { LocationSlice } from "../app/Admin/modules/Locations/_redux/LocationSlice";

//result manager slices
import {CameraSlice} from "../app/Admin/modules/AllCameraTable/_redux/CameraSlice";
import {UsecaseSlice} from "../app/Admin/modules/Usecase/_redux/UsecaseSlice";
import {ModalCategorySlice} from "../app/Admin/modules/ModelCategories/_redux/ModalCategorySlice";

export const rootReducer = combineReducers({
  auth: auth.reducer,

  myResult: MyResultSlice.reducer,
  location: LocationSlice.reducer,
  camera: CameraSlice.reducer,
  useCase: UsecaseSlice.reducer,
  modalCategory:ModalCategorySlice.reducer,
});

export function* rootSaga() {
  yield all([auth.saga()]);
}
