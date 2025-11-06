import React,{ lazy } from 'react';
import {Navigate} from "react-router-dom";
import {AuthPage} from "./Admin/modules/Auth";
import Loadable from "../utils/Loadable";

const AuthLogin = Loadable(lazy(() => import('./Admin/modules/Auth/pages/Login')));
const AuthRegister = Loadable(lazy(() => import('./Admin/modules/Auth/pages/Registration')));
const AuthUserRegister = Loadable(lazy(() => import('./Admin/modules/Auth/pages/RegistrationUser')));
const ForgotPassword = Loadable(lazy(() => import('./Admin/modules/Auth/pages/ForgotPassword')));

const LoginRoutes = {
    path: '/auth',
    element: <AuthPage />,
    children: [
        {
            path: '', // This is the default route
            element:<Navigate to={"login"} />
        },
        {
            path: 'login',
            element: <AuthLogin />
        },
        {
            path: 'registration',
            element: <AuthRegister />
        },
        {
            path: 'user-registration',
            element: <AuthUserRegister />
        },
        {
            path: 'forgot-password',
            element: <ForgotPassword />
        },

    ]
};

export default LoginRoutes;