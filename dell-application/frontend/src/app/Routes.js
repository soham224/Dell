import React from "react";
import {Navigate, useRoutes} from "react-router-dom";
import {shallowEqual, useSelector} from "react-redux";
import {ADMIN_ROLE, SUPERVISOR_ROLE} from "../enums/constant"; // Adjust roles accordingly
import LoginRoutes from "./LoginRoutes";
import MainRoutes from "./MainRoutes";
import Cookies from "universal-cookie";

function Router() {
    const {isAuthorized = false, user} = useSelector(
        ({auth}) => ({
            isAuthorized: auth.user?.id && new Cookies().get("access_token"),
            user: auth.user,
        }),
        shallowEqual
    );
    // Get the redirect path based on user role
    const getDashboardRoute = () => {
        if (!user) {
            return "/auth/login";
        }

        const role = user.roles[0]?.role;
        const overviewRoles = [ADMIN_ROLE, SUPERVISOR_ROLE];
        if (overviewRoles.includes(role)) {
            return "/admin/dashboard";
        }
        else {
            // Fallback route for undefined roles
            return "/auth/login";
        }

    };


    return useRoutes([
        {
            path: "/",
            element: isAuthorized ? (
                <Navigate to={getDashboardRoute()} replace/>
            ) : (
                <Navigate to="/auth" replace/>
            )
        },
        LoginRoutes,
        ...MainRoutes,
    ]);
}

export default Router;
