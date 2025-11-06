/* eslint-disable */
import React, {useMemo} from "react";
import {useNavigate} from "react-router-dom";
import Dropdown from "react-bootstrap/Dropdown";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import objectPath from "object-path";
import {useHtmlClassService} from "../../../_core/MetronicLayout";
import {toAbsoluteUrl} from "../../../../_helpers";
import {DropdownTopbarItemToggler} from "../../../../_partials/dropdowns";
import {Col, Row} from "react-bootstrap";
import {actions} from "../../../../../app/Admin/modules/Auth";
import {successToast} from "../../../../../utils/ToastMessage";

export function UserProfileDropdown() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const uiService = useHtmlClassService();
    const regexImage = /\.(gif|jpe?g|tiff?|png|webp|bmp|ico|svg)$/i
    const layoutProps = useMemo(() => {
        return {
            light:
                objectPath.get(uiService.config, "extras.user.dropdown.style") !==
                "light",
        };
    }, [uiService]);

    const {user} = useSelector(
        ({auth}) => ({
            user: auth.user,
        }),
        shallowEqual
    );
    const userRole = user?.roles?.length && user.roles[0]?.role
    const handleLogout = () => {
        successToast("You have been logged out. Thank you for visiting!");
        dispatch(actions.logout());
        navigate("/auth/login", {replace: true});
    };

    return (
        <>
            {userRole !== "superadmin" && userRole !== "resultmanager" ?
                <Dropdown drop="down" alignRight>
                    <Dropdown.Toggle
                        as={DropdownTopbarItemToggler}
                        id="dropdown-toggle-user-profile"
                    >
                        <div>
                          <span>
                            Hi,
                          </span>{" "}
                           <span className="font-weight-bolder">
                            {user?.company?.company_name}
                            </span>{" "}
                            <span className="symbol symbol-35">
                             <span className="text-white symbol-label font-size-h5 font-weight-bold cursor-pointer"
                                style={{backgroundColor: "#147b82"}}>
                            {user?.company?.company_name[0]}
                            </span>
                            </span>
                        </div>
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        className="p-0 m-0 dropdown-menu-right dropdown-menu-anim dropdown-menu-top-unround dropdown-menu-xl">
                        <>
                            {/** ClassName should be 'dropdown-menu p-0 m-0 dropdown-menu-right dropdown-menu-anim dropdown-menu-top-unround dropdown-menu-xl' */}
                            {layoutProps.light && (
                                <>
                                    <div className="d-flex align-items-center p-8 rounded-top"
                                         style={{height: '100px'}}>
                                        <Row className={"d-flex justify-content-around"}>
                                            <Col xl={4} xs={12} md={12} lg={12} sm={12}>
                                                <div className="">
                                                    <img
                                                        className=""
                                                        style={{
                                                            width:'95px',
                                                            height: '35px'
                                                        }}
                                                        alt="Logo"
                                                        src={userRole !== "superadmin" && userRole !== "resultmanager" && (regexImage).test(user?.company?.company_description) ?
                                                            user?.company?.company_description :
                                                                    toAbsoluteUrl("/media/logos/logo-tusker.png")}

                                                    />
                                                </div>
                                            </Col>
                                            <Col xl={6} xs={12} md={12} lg={12} sm={12}
                                                 className={`mt-2 ml-2`}>
                                                <div className="font-weight-bolder">
                                                    {userRole !== "superadmin" && userRole !== "resultmanager" && user?.company?.company_name}
                                                </div>
                                                <div className="">
                                                    {userRole !== "superadmin" && userRole !== "resultmanager" && user?.user_email}
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                </>
                            )}

                        </>



                        <div className="navi-footer px-8 py-5 text-right">
                            <button
                                className="btn btn-light-primary font-weight-boldest-500"
                                onClick={handleLogout}
                            >
                                Sign Out
                            </button>
                        </div>
                    </Dropdown.Menu>
                </Dropdown>
                : <div className="navi-footer px-8 py-5 text-right">
                    <button
                        className="btn btn-light-primary font-weight-bold"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </button>
                </div>
            }
        </>
    );
}
