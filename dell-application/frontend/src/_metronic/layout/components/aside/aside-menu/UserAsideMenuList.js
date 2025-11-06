import React from "react";
import {NavLink, useLocation} from "react-router-dom";
import SVG from "react-inlinesvg";
import {toAbsoluteUrl} from "../../../../_helpers";
import {ADMIN_URL} from "../../../../../enums/constant";

export function UserAsideMenuList({layoutProps}) {
    const location = useLocation();

    const getMenuItemActive = (paths, hasSubmenu = false, exactMatch = false) => {
        const pathsArray = Array.isArray(paths) ? paths : [paths];

        const isActive = exactMatch
            ? pathsArray.some(path => location.pathname === path)
            : pathsArray.some(path => location.pathname.startsWith(path));

        if (isActive) {
            if (hasSubmenu) {
                return "menu-item-open";
            } else {
                return "menu-item-active menu-item-open";
            }
        }
        return "";
    };
    return (
        <>
            {/* begin::Menu Nav */}
            <ul className={`menu-nav ${layoutProps.ulClasses}`}>

                    <>
                        {/*begin::1 Level*/}
                        <li
                            className={`menu-item menu-item-rel ${getMenuItemActive(
                                ADMIN_URL + "/dashboard",true
                            )}`}
                        >
                            <NavLink className="menu-link" to={ADMIN_URL + "/dashboard"}>
            <span className="svg-icon menu-icon">
              <SVG
                  title="View Dashboard"
                  src={toAbsoluteUrl("/media/svg/icons/Design/Layers.svg")}
              />
            </span>
                                <span className="menu-text">Dashboard</span>
                            </NavLink>
                        </li>


                        <li
                            className={`menu-item menu-item-rel ${getMenuItemActive(
                                "/my-results",true
                            )}`}
                        >
                            <NavLink className="menu-link" to={"/my-results"}>
            <span className="svg-icon menu-icon">
              <SVG
                  title="Add Results"
                  src={toAbsoluteUrl("/media/svg/icons/Files/Folder-check.svg")}
              />
            </span>
                                <span className="menu-text">Results</span>
                            </NavLink>
                        </li>
                        <li
                            className={`menu-item menu-item-rel ${getMenuItemActive(
                                "/activity",true
                            )}`}
                        >
                            <NavLink className="menu-link" to={"/activity"}>
              <span className="svg-icon menu-icon">
                <SVG
                    title="Activity"
                    src={toAbsoluteUrl("/media/svg/icons/Communication/Shield-user.svg")}
                />
              </span>
                                <span className="menu-text">Activity</span>
                            </NavLink>
                        </li>
                        <li
                            className={`menu-item menu-item-rel ${getMenuItemActive(
                                ADMIN_URL + "/model-categories/view",true
                            )}`}
                        >
                            <NavLink className="menu-link" to={ADMIN_URL + "/model-categories/view"}>
            <span className="svg-icon menu-icon">
              <SVG
                  title="View Model Catalogues"
                  src={toAbsoluteUrl("/media/svg/icons/Devices/Server.svg")}
              />
            </span>
                                <span className="menu-text">Marketplace</span>
                            </NavLink>
                        </li>
                    </>
            </ul>
        </>
    );
}
