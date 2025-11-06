/* eslint-disable */
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import objectPath from "object-path";
import { useHtmlClassService } from "../../_core/MetronicLayout";
import { QuickUserToggler } from "../extras/QuiclUserToggler";
import { UserNotificationsDropdown } from "../extras/dropdowns/UserNotificationsDropdown";
import { shallowEqual, useSelector } from "react-redux";
import { BreadCrumbs } from "../subheader/components/BreadCrumbs";
import { useLocation } from "react-router-dom";
import {
  getBreadcrumbsAndTitle,
  useSubheader,
} from "../../_core/MetronicSubheader";
import {
  ADMIN_URL,
  RESULT_MANAGER_ROLE,
  SUPER_ADMIN_ROLE,
} from "../../../../enums/constant";

export function Topbar() {
  const uiService = useHtmlClassService();
  const location = useLocation();
  const subheader = useSubheader();

  useLayoutEffect(() => {
    const aside = getBreadcrumbsAndTitle("kt_aside_menu", location.pathname);
    const header = getBreadcrumbsAndTitle("kt_header_menu", location.pathname);
    const breadcrumbs =
      aside && aside.breadcrumbs.length > 0
        ? aside.breadcrumbs
        : header.breadcrumbs;
    if (location.pathname === "/feedbacks") {
      subheader.setTitle("Feedbacks");
      subheader.setBreadcrumbs([{ pathname: "/", title: "Feedbacks" }]);
    } else if (location.pathname === "/complaints") {
      subheader.setTitle("Complains");
      subheader.setBreadcrumbs([{ pathname: "/", title: "Complaints" }]);
    } else if (location.pathname === "/allNotification") {
      subheader.setTitle("Notifications");
      subheader.setBreadcrumbs([{ pathname: "/", title: "Notifications" }]);
    } else if (location.pathname === ADMIN_URL + "/dashboard") {
      subheader.setTitle("Dashboard");
      subheader.setBreadcrumbs([{ pathname: "/", title: "Dashboard" }]);
    } else if (location.pathname === "/my-results") {
      subheader.setTitle("Results");
      subheader.setBreadcrumbs([{ pathname: "/", title: "Results" }]);
    } else if (location.pathname === ADMIN_URL + "/cameras") {
      subheader.setTitle("Live Preview");
      subheader.setBreadcrumbs([{ pathname: "/", title: "Live Preview" }]);
    } else {
      subheader.setBreadcrumbs(breadcrumbs);
      subheader.setTitle(
        aside && aside.title && aside.title.length > 0
          ? aside.title
          : header.title
      );
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  const { userRole } = useSelector(
    ({ auth }) => ({
      userRole: auth.user?.roles?.length && auth.user.roles[0]?.role,
    }),
    shallowEqual
  );
  const layoutProps = useMemo(() => {
    return {
      viewSearchDisplay: objectPath.get(
        uiService.config,
        "extras.search.display"
      ),
      viewNotificationsDisplay: objectPath.get(
        uiService.config,
        "extras.notifications.display"
      ),
      viewQuickActionsDisplay: objectPath.get(
        uiService.config,
        "extras.quick-actions.display"
      ),
      viewCartDisplay: objectPath.get(uiService.config, "extras.cart.display"),
      viewQuickPanelDisplay: objectPath.get(
        uiService.config,
        "extras.quick-panel.display"
      ),
      viewLanguagesDisplay: objectPath.get(
        uiService.config,
        "extras.languages.display"
      ),
      viewUserDisplay: objectPath.get(uiService.config, "extras.user.display"),
      config: uiService.config,
      subheaderMobileToggle: objectPath.get(
        uiService.config,
        "subheader.mobile-toggle"
      ),
      subheaderCssClasses: uiService.getClasses("subheader", true),
      subheaderContainerCssClasses: uiService.getClasses(
        "subheader_container",
        true
      ),
    };
  }, [uiService]);
  useEffect(() => {}, [subheader]);

  return (
    <>
      <div className="topbar">
        <div
          className={`d-flex align-items-center flex-wrap mr-1 breadcrumb-desktop`}
        >
          {layoutProps.subheaderMobileToggle && (
            <button
              className="burger-icon burger-icon-left mr-4 d-inline-block d-lg-none"
              id="kt_subheader_mobile_toggle"
            >
              <span />
            </button>
          )}

          <div className="d-flex align-items-baseline">
            <h5 className="text-dark font-weight-bold my-2 mr-5">
              <>{subheader.title}</>
            </h5>
          </div>
          <BreadCrumbs items={subheader.breadcrumbs} />
        </div>

        {userRole !== SUPER_ADMIN_ROLE && userRole !== RESULT_MANAGER_ROLE
          ? layoutProps.viewNotificationsDisplay && (
              <UserNotificationsDropdown />
            )
          : null}

        {layoutProps.viewUserDisplay && <QuickUserToggler />}
      </div>
    </>
  );
}
