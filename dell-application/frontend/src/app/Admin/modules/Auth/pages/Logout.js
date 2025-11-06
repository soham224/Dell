import React, { Component } from "react";
import { connect } from "react-redux";
import { Navigate } from "react-router-dom"; // Use Navigate instead of Redirect
import { LayoutSplashScreen } from "../../../../../_metronic/layout";
import * as auth from "../_redux/authRedux";
import Cookies from "universal-cookie";
import { ACCESS_TOKEN, TOKEN_TYPE } from "../../../../../enums/auth.enums";

class Logout extends Component {
  componentDidMount() {
    this.props.logout();
    const cookies = new Cookies();
    cookies.remove(ACCESS_TOKEN, { httpOnly: false });
    cookies.remove(TOKEN_TYPE, { httpOnly: false });
  }

  render() {
    const { hasAuthToken } = this.props;
    if (!hasAuthToken) {
      return <Navigate to="/auth/login" replace />;
    }

    return <LayoutSplashScreen />;
  }
}

export default connect(
    ({ auth }) => ({ hasAuthToken: Boolean(auth.authToken) }),
    auth.actions
)(Logout);
