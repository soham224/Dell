import React from "react";
import {Link, Redirect, Switch} from "react-router-dom";
import {toAbsoluteUrl} from "../../../../../_metronic/_helpers";
import {ContentRoute} from "../../../../../_metronic/layout"
import Login from "./Login";
import Registration from "./Registration";
import ForgotPassword from "./ForgotPassword";
import "../../../../../_metronic/_assets/sass/pages/login/classic/login-1.scss";

export function AuthPage() {
  return (
      <>
        <div className="d-flex flex-column flex-root">

          <div
              className="login login-1 login-signin-on d-flex flex-column flex-lg-row flex-row-fluid bg-white"
              id="kt_login"
          >

            <div
                className="login-aside d-flex flex-row-auto bgi-size-cover bgi-no-repeat p-10 p-lg-10"
                style={{
                  backgroundImage: `url(${toAbsoluteUrl("/media/main-banner.jpg")})`
                }}
            >

              <div className="d-flex flex-row-fluid flex-column justify-content-between">

                <Link to="/" className="flex-column-auto mt-5">

                  <h1 style={{color: 'white', fontWeight: 'bold', fontSize: 35}}>
                    Auto Serving
                  </h1>
                </Link>

                <div className="flex-column-fluid d-flex flex-column justify-content-center">
                  <h3 className="font-size-h1 mb-5 text-white">
                    Welcome to TUSKER AI!
                  </h3>

                </div>

                <div className="d-none flex-column-auto d-lg-flex justify-content-between mt-10">
                  <div className="opacity-70 font-weight-bold	text-white">
                      TUSKER AI
                  </div>

                </div>

              </div>

            </div>

            <div className="flex-row-fluid d-flex flex-column position-relative p-7 overflow-hidden">

              <div className="d-flex flex-column-fluid flex-center mt-30 mt-lg-0">
                <Switch>
                <ContentRoute path="/auth/login" component={Login}/>
                <ContentRoute path="/auth/registration" component={Registration}/>
                <ContentRoute
                    path="/auth/forgot-password"
                    component={ForgotPassword}
                />
                <Redirect from="/auth" exact={true} to="/auth/login"/>
                <Redirect to="/auth/login"/>
              </Switch>
              </div>

              <div
                  className="d-flex d-lg-none flex-column-auto flex-column flex-sm-row justify-content-between align-items-center mt-5 p-5">
                <div className="text-dark-50 font-weight-bold order-2 order-sm-1 my-2">
                    TUSKER AI
                </div>

              </div>

            </div>

          </div>

        </div>
      </>
  );
}
