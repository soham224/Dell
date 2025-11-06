import {persistReducer} from "redux-persist";
import storage from "redux-persist/lib/storage";
import {put, takeLatest} from "redux-saga/effects";
import {getCurrentUser} from "./authCrud";
import Cookies from 'universal-cookie';
import {ACCESS_TOKEN, TOKEN_TYPE} from "../../../../../enums/auth.enums";

export const actionTypes = {
    Login: "[Login] Action",
    Logout: "[Logout] Action",
    Register: "[Register] Action",
    UserRequested: "[Request User] Action",
    UserLoaded: "[Load User] Auth API",
    SetUser: "[Set User] Action",
};

export const actions = {
    login: (authToken) => ({type: actionTypes.Login, payload: {authToken}}),
    register: (authToken) => ({
        type: actionTypes.Register,
        payload: {authToken},
    }),
    logout: () => ({type: actionTypes.Logout}),
    requestUser: (user) => ({
        type: actionTypes.UserRequested,
        payload: {user},
    }),
    fulfillUser: (user) => ({type: actionTypes.UserLoaded, payload: {user}}),
    setUser: (user) => ({type: actionTypes.SetUser, payload: {user}}),
};

const initialAuthState = {
    user: undefined,
    authToken: undefined,
};

const cookies = new Cookies();
export const reducer = persistReducer(
    {storage, key: "v713-demo1-auth-user-asu", whitelist: ["user", "authToken"]},
    (state = initialAuthState, action) => {
        switch (action.type) {
            case actionTypes.Login:
            case actionTypes.Register: {
                const { authToken } = action.payload;
                return { authToken, user: undefined };
            }

            case actionTypes.Logout: {
                cookies.remove(ACCESS_TOKEN, {httpOnly: false});
                cookies.remove(TOKEN_TYPE, {httpOnly: false});
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

export function* saga() {
    yield takeLatest(actionTypes.Login, function* loginSaga() {
        yield put(actions.requestUser());
    });

    yield takeLatest(actionTypes.Register, function* registerSaga() {
        yield put(actions.requestUser());
    });

    yield takeLatest(actionTypes.UserRequested, function* userRequested() {
        const {data: user} = yield getCurrentUser();
        yield put(actions.fulfillUser(user));
    });
}
