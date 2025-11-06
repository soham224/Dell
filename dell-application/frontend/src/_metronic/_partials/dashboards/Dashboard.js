import React, { useMemo } from "react";
import objectPath from "object-path";
import { useHtmlClassService } from "../../layout";
import Demo2Dashboard from "./Demo2Dashboard";
import { shallowEqual, useSelector } from "react-redux";

function Dashboard() {
    const uiService = useHtmlClassService();

    const layoutProps = useMemo(() => {
        return {
            demo: objectPath.get(uiService.config, "demo"),
        };
    }, [uiService]);

    const { user } = useSelector(
        ({ auth }) => ({
            user: auth.user,
        }),
        shallowEqual
    );

    if (!user) {
        return <div>Loading...</div>; // Show loading if user data is not yet available
    }

    try {
        return <>{layoutProps.demo === "demo1" && <Demo2Dashboard />}</>;
    } catch (error) {
        console.error('Error rendering dashboard:', error);
        return <div>Something went wrong.</div>; // Error fallback if rendering fails
    }
}

export default Dashboard;
