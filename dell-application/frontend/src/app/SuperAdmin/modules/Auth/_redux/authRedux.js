import {persistReducer} from "redux-persist";
import storage from "redux-persist/lib/storage";
import {put, takeLatest} from "redux-saga/effects";
import {getUserByToken} from "./authCrud";
import Cookies from "universal-cookie";
import {ACCESS_TOKEN} from "../../../../../enums/auth.enums";

export const actionTypes = {
  Login: "[Login] Action",
  Logout: "[Logout] Action",
  Register: "[Register] Action",
  UserRequested: "[Request User] Action",
  UserLoaded: "[Load User] Auth API",
  SetUser: "[Set User] Action",
};

const initialAuthState = {
  user: null,
  authToken: undefined,
};

const cookies = new Cookies();
export const reducer = persistReducer(
    {storage, key: "v713-demo1-auth", whitelist: ["user", "authToken"]},
    (state = initialAuthState, action) => {
      switch (action.type) {
        case actionTypes.Login:
        case actionTypes.Register: {
          const {authToken} = action.payload;
          return {authToken, user: undefined};
        }

        case actionTypes.Logout: {
          cookies.remove(ACCESS_TOKEN, {httpOnly: false});
          cookies.remove('token_type', {httpOnly: false});
          return initialAuthState;
        }

        case actionTypes.UserLoaded:
        case actionTypes.SetUser: {
          const { user } = action.payload;
          return { ...state, user };
        }

        default:
          return state;
      }
    }
);

export const AuthAction = {
  login: (authToken) => ({ type: actionTypes.Login, payload: { authToken } }),
  register: (authToken) => ({
    type: actionTypes.Register,
    payload: { authToken },
  }),
  logout: () => ({ type: actionTypes.Logout }),
  requestUser: (user) => ({
    type: actionTypes.UserRequested,
    payload: { user },
  }),
  fulfillUser: (user) => ({ type: actionTypes.UserLoaded, payload: { user } }),
  setUser: (user) => ({ type: actionTypes.SetUser, payload: { user } }),
};

export function* saga() {
  yield takeLatest(actionTypes.Login, function* loginSaga() {
    yield put(AuthAction.requestUser());
  });

  yield takeLatest(actionTypes.Register, function* registerSaga() {
    yield put(AuthAction.requestUser());
  });

  yield takeLatest(actionTypes.UserRequested, function* userRequested() {
    const { data: user } = yield getUserByToken();

    yield put(AuthAction.fulfillUser(user));
  });
}
