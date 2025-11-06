/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { Link } from "react-router-dom";
import { shallowEqual, useSelector } from "react-redux";

import {
  ADMIN_ROLE,
  ADMIN_URL,
  RESULT_MANAGER_ROLE,
  SUPER_ADMIN_ROLE,
  SUPERVISOR_ROLE
} from "../../../../../enums/constant";
import Cookies from "universal-cookie";

export function BreadCrumbs({ items }) {
  const { user } = useSelector(
    ({ auth }) => ({
      isAuthorized: auth.user?.id && new Cookies().get("access_token"),
      user: auth.user
    }),
    shallowEqual
  );

  if (!items || !items.length) {
    return <ul className="breadcrumb breadcrumb-transparent breadcrumb-dot font-weight-bold p-0 my-2" />;
  }

  // Determine the link to render based on user role
  const renderRoleBasedLink = () => {
    if (user?.roles[0].role !== SUPER_ADMIN_ROLE && user?.roles[0].role !== RESULT_MANAGER_ROLE) {
      return (
        <Link to={ADMIN_URL + "/dashboard"}>
          <i className="flaticon2-shelter text-muted icon-1x" />
        </Link>
      );
    }
    return null;
  };

  // Determine the link to render based on item title and user role
  const getLinkForItem = (item) => {
    switch (item.title) {
      case "Dashboard":
        if (user?.roles[0].role === ADMIN_ROLE || user?.roles[0].role === SUPERVISOR_ROLE) {
          return <Link to={ADMIN_URL + "/dashboard"}>{item.title}</Link>;
        }
        break;
      case "Results":
        return <Link to={"/my-results"}>{item.title}</Link>;
      case "Live Preview":
        return <Link to={ADMIN_URL + "/cameras"}>{item.title}</Link>;
      case "Locations":
        return <Link to={ADMIN_URL + "/locations"}>{item.title}</Link>;
      case "Supervisor":
        return <Link to={ADMIN_URL + "/addSupervisor"}>{item.title}</Link>;
      case "Employees":
        return <Link to={ADMIN_URL + "/employee"}>{item.title}</Link>;
      case "Attendance":
        if (user?.roles[0].role === "admin") {
          return <Link to={ADMIN_URL + "/attendance"}>{item.title}</Link>;
        } else if (user?.roles[0].role === "supervisor") {
          return <Link to={"/attendance"}>{item.title}</Link>;
        }
        break;
      case "Violation":
        if (user?.roles[0].role === "admin") {
          return <Link to={ADMIN_URL + "/violation"}>{item.title}</Link>;
        } else if (user?.roles[0].role === "supervisor") {
          return <Link to={"/violation"}>{item.title}</Link>;
        }
        break;
      case "Subscriptions":
        return <Link to={ADMIN_URL + "/subscriptions"}>{item.title}</Link>;
      case "Feedbacks":
        return <Link to={"/feedbacks"}>{item.title}</Link>;
      case "Complaints":
        return <Link to={"/complaints"}>{item.title}</Link>;
      case "Notifications":
        return <Link to={"/allNotification"}>{item.title}</Link>;
      default:
        return <Link to={ADMIN_URL + "/dashboard"}>{item.title}</Link>;
    }
  };

  return (
    <ul className="breadcrumb breadcrumb-transparent breadcrumb-dot font-weight-bold p-0 my-2">
      <li className="breadcrumb-item">
        {user?.roles[0].role === ADMIN_ROLE ? (
          <>
            <Link to={ADMIN_URL + "/dashboard"}>
              <i className="flaticon2-shelter text-muted icon-1x" />
            </Link>
          </>
        ) : (
          renderRoleBasedLink()
        )}
      </li>
      {user?.roles[0].role !== SUPER_ADMIN_ROLE &&
        user?.roles[0].role !== RESULT_MANAGER_ROLE &&
        items.map((item) => (
          <li key={item.title} className="breadcrumb-item">
            {getLinkForItem(item)}
          </li>
        ))}
    </ul>
  );
}
