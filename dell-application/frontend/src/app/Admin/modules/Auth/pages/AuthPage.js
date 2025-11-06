import React from "react";
import {Link, Outlet, useLocation} from "react-router-dom";
import {toAbsoluteUrl} from "../../../../../_metronic/_helpers";
import "../../../../../_metronic/_assets/sass/pages/login/classic/login-1.scss";
import {connect} from "react-redux";
import {injectIntl} from "react-intl";
import * as auth from "../_redux/authRedux";
import SVG from "react-inlinesvg";


function AuthPage() {
    const today = new Date().getFullYear();
    const location = useLocation();
    const currentPath = location.pathname;
    const handleClick = (event) => {
        event.preventDefault();
        window.location.href = "#";

    };

    return (
        <>
            <div className="d-flex flex-column flex-root">

                <div
                    className="login login-1 login-signin-on d-flex flex-column flex-md-row flex-lg-row flex-sm-row flex-row-fluid bg-white "
                    id="kt_login"
                >
                    <div
                        className=" displays1 login-aside d-flex flex-row-auto bgi-size-cover bgi-no-repeat p-10 p-lg-10"
                        style={{
                            backgroundImage: `url(${toAbsoluteUrl(
                                "/media/bg/main-banner.jpg"
                            )})`
                        }}
                    >

                        <div className="d-flex flex-row-fluid flex-column justify-content-between">
                            <div className="flex-column-fluid d-flex flex-column justify-content-center">
                                <a href="#" onClick={handleClick} target="_blank">
                                    <h1
                                        className={"d-flex justify-content-center"}
                                        style={{
                                            color: "#fff",
                                            fontFamily: "Rubik, sans-serif",
                                            fontSize: "65px",
                                            lineHeight: "1.1",
                                            fontWeight: "500",
                                            textTransform: "uppercase"
                                        }}
                                    >
                                        <img
                                            src={toAbsoluteUrl("/media/logos/white-logo.png")}
                                            alt="Metronic logo"
                                            style={{width: '30vh', height: '8vh'}}
                                        />
                                    </h1>
                                </a>
                                <h4 className="font-size-h2 mb-5 text-white d-flex justify-content-center">
                                    No-Code AI Computer Vision Platform
                                </h4>
                                <h4 className="font-size-h2 mb-5 text-white d-flex justify-content-center">
                                    Image and Video Analytics
                                </h4>
                            </div>
                            <div className="mt-10 d-flex">
                                <div className={"flex-column-fluid justify-content-left mr-2"}>
                  <span className="opacity-70 font-weight-bold	text-white">
                           &copy; 2021-{today}
                  </span>
                                    <span className="opacity-70 font-weight-bold	text-white">
                    <a
                        href="#"
                        onClick={handleClick}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white ml-2 text-hover-primary"
                    >

                       TUSKER AI
                    </a>
                  </span>
                                </div>
                            </div>
                            {/* end:: Aside footer for desktop */}
                        </div>
                        {/*end: Aside Container*/}
                    </div>
                    <div className="flex-row-fluid d-flex flex-column position-relative p-7 overflow-hidden">
                        {/* Top Right Corner */}
                        <div style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            zIndex: 10
                        }}>
                            {console.log("windows" , window.location.href)}
                            {currentPath === "/auth/registration" ? (
                                // ✅ When user is on /auth/registration
                                <p className="text-muted font-weight-bold mb-0">
                                    Already have an account?{" "}
                                    <Link to="/auth/login" className="text-primary font-weight-bold">
                                        Log In!
                                    </Link>
                                </p>
                            ) : (
                                // ✅ When user is on any other page
                                <p className="text-muted font-weight-bold mb-0">
                                    Don’t have an account yet?{" "}
                                    <Link to="/auth/registration" className="text-primary font-weight-bold">
                                        Sign Up!
                                    </Link>
                                </p>
                            )}

                        </div>

                        <div className="delete_large mt-15">
                            <a href="#"
                               onClick={handleClick} target="_blank">
                                <h1
                                    className={"d-flex justify-content-center"}
                                    style={{
                                        fontFamily: "Rubik, sans-serif",
                                        fontSize: "44px",
                                        lineHeight: "1.1",
                                        fontWeight: "500",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    TUSKER AI
                                </h1>
                            </a>
                        </div>

                        <div className="d-flex flex-column-fluid flex-center mt-lg-0">
                            <Outlet/>
                        </div>

                        <div
                            className="displays1 d-flex d-lg-none flex-column-auto flex-column flex-sm-row justify-content-between align-items-center mt-5 p-5">
                            <div>
                <span className="delete_large text-dark-50 font-weight-bold order-2 order-sm-1 my-2">
                  {" "}
                    <a
                        href={`#`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-70 text-dark-75 font-weight-bold ml-2 text-hover-primary"
                    >
                  TUSKER AI
                  </a>
                </span>
                            </div>
                        </div>
                        <div className="delete_large">
                            <div className="d-flex">
                <span className="opacity-70 font-weight-bold  flex-column-fluid flex-left">
                    <a
                        href={`#`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-70 text-dark-75 font-weight-bold ml-2 text-hover-primary"
                    >
                    &copy; 2021-{today}     TUSKER AI
                  </a>
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default injectIntl(connect(null, auth.actions)(AuthPage));
