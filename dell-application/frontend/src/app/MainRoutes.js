import React, {lazy} from "react";
import ProtectedRoute from "./ProtectedRoute";
import Loadable from "../utils/Loadable";
import {Layout} from "../_metronic/layout";
import {ADMIN_ROLE, SUPER_ADMIN_ROLE, SUPERVISOR_ROLE} from "../enums/constant";
import {ErrorPage1} from "./Admin/modules/ErrorsExamples/ErrorPage1";

const MyResultsTabPage = Loadable(
    lazy( () =>  import("./Admin/pages/MyResultsTabPage")));

const Supervisor = Loadable(
    lazy( () =>  import("./Admin/pages/SupervisorPage")));


const CameraPage = Loadable(
    lazy( () =>  import("./Admin/pages/CameraPage"))
);

const Logout = Loadable(
    lazy( () =>  import("./Admin/modules/Auth/pages/Logout"))
);

const DashboardPage = Loadable(lazy( () =>  import("./Admin/pages/DashboardPage")))

const LocationPage = Loadable(
    lazy( () =>  import("./Admin/pages/LocationPage"))
);

const UseCasePage = Loadable(lazy( () =>  import("./Admin/pages/UsecasePage")))

const ActivityTabPage = Loadable(
    lazy( () =>  import("./Admin/pages/ActivityTabPage")));
const ModelCategoriesTabPage = Loadable(lazy( () =>  import("./Admin/pages/ModelCategoriesTabPage")))


const protectedRoute = (role, component) => (
    <ProtectedRoute routeRole={role}>{component}</ProtectedRoute>
);



const routes = [
    {
        path: "/admin/dashboard",
        element: protectedRoute([ADMIN_ROLE,SUPERVISOR_ROLE ,SUPER_ADMIN_ROLE], <DashboardPage/>)
    },
    {
        path: "/admin/addSupervisor",
        element: protectedRoute([ADMIN_ROLE ,SUPER_ADMIN_ROLE], <Supervisor/>)
    },

    {
        path: "/my-results",
        element: protectedRoute([ADMIN_ROLE,SUPERVISOR_ROLE ,SUPER_ADMIN_ROLE], <MyResultsTabPage/>)
    },
    {
        path: "/admin/locations/*",
        element: protectedRoute([ADMIN_ROLE,SUPER_ADMIN_ROLE], <LocationPage/>)
    },
    {
        path: "/admin/camera/*",
        element: protectedRoute([ADMIN_ROLE ,SUPER_ADMIN_ROLE], <CameraPage/>)
    },
    {
        path: "/logout",
        element: protectedRoute([ADMIN_ROLE,SUPERVISOR_ROLE ,SUPER_ADMIN_ROLE], <Logout/>)
    },
    {
        path: "/admin/usecase/*",
        element: protectedRoute([ADMIN_ROLE,SUPER_ADMIN_ROLE], <UseCasePage/>)
    },
    {
        path: "/activity",
        element: protectedRoute([ADMIN_ROLE,SUPERVISOR_ROLE,SUPER_ADMIN_ROLE], <ActivityTabPage/>)
    },
    {
        path: "/admin/model-categories/view/*",
        element: protectedRoute([ADMIN_ROLE,SUPERVISOR_ROLE,SUPER_ADMIN_ROLE], <ModelCategoriesTabPage/>)
    },
];


const MainRoutes = [
    {
        path: "/",
        element: <Layout/>,
        children: [
            ...routes.map((route, index) => ({...route, key: index})),
        ]
    },
    {
        path: "/error", // This catches all unmatched routes
        element: <ErrorPage1/>, // Your 404 component
        key: "not-found"
    },
];

export default MainRoutes;
