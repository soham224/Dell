import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Cookies from "universal-cookie";

const ProtectedRoute = ({ routeRole, children }) => {
  const cookies = new Cookies();
  const { user } = useSelector((state) => state.auth);
  const isAuthorized = user?.id && cookies.get("access_token");

  if (!isAuthorized) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = user?.roles[0]?.role;

  if (routeRole.includes(userRole)) {
    return children;
  }

  return <Navigate to="/error" replace />; // Redirect unauthorized users
};

export default ProtectedRoute;
