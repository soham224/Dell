import React, {useMemo} from "react";
import {AsideMenuList} from "./AsideMenuList";
import {useHtmlClassService} from "../../../_core/MetronicLayout";
import {shallowEqual, useSelector} from "react-redux";
import {UserAsideMenuList} from "./UserAsideMenuList";
import {SuperAdminMenuList} from "./SuperAdminMenuList";

export function AsideMenu({disableScroll}) {
    const uiService = useHtmlClassService();
    const layoutProps = useMemo(() => {
        return {
            layoutConfig: uiService.config,
            asideMenuAttr: uiService.getAttributes("aside_menu"),
            ulClasses: uiService.getClasses("aside_menu_nav", true),
            asideClassesFromConfig: uiService.getClasses("aside_menu", true)
        };
    }, [uiService]);

    const {userRole} = useSelector(
        ({auth}) => ({
            userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
        }),
        shallowEqual
    );

    // Determine which menu list to render based on userRole
    const renderMenuList = () => {
        switch (userRole) {
            case "admin":
                return <AsideMenuList layoutProps={layoutProps} />;
            case "superadmin":
                return <SuperAdminMenuList layoutProps={layoutProps} />;
            default:
                return <UserAsideMenuList layoutProps={layoutProps} />;
        }
    };

    return (
        <>
            {/* begin::Menu Container */}
            <div
                id="kt_aside_menu"
                data-menu-vertical="1"
                className={`aside-menu my-4 ${layoutProps.asideClassesFromConfig}`}
                {...layoutProps.asideMenuAttr}
            >
                {renderMenuList()}
            </div>
            {/* end::Menu Container */}
        </>
    );
}
