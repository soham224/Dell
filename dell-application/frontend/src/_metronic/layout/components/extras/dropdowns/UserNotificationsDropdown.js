/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-restricted-imports */
/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
/* eslint-disable */
import React, {useState, useMemo, useEffect, useCallback} from "react";
import { Nav, Tab, Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import PerfectScrollbar from "react-perfect-scrollbar";
import SVG from "react-inlinesvg";
import objectPath from "object-path";
import { useHtmlClassService } from "../../../_core/MetronicLayout";
import { toAbsoluteUrl } from "../../../../_helpers";
import { DropdownTopbarItemToggler } from "../../../../_partials/dropdowns";
import {
  getCameraNotification,
  updateCameraNotification,
} from "../../../../../app/Admin/modules/Notification/_redux/notification";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import * as moment from "moment";
import {NotificationsNone} from "@mui/icons-material";
import {warningToast} from "../../../../../utils/ToastMessage";
const perfectScrollbarOptions = {
  wheelSpeed: 2,
  wheelPropagation: false,
};

export function UserNotificationsDropdown() {
  const [key, setKey] = useState("Alerts");
  const [viewData, setViewData] = useState([]);
  const [viewAllBtn, setShowViewALl] = useState(false);
  const [counter, setCounter] = useState(0);
  const uiService = useHtmlClassService();
  const layoutProps = useMemo(() => {
    return {
      offcanvas:
        objectPath.get(uiService.config, "extras.notifications.layout") ===
        "offcanvas",
    };
  }, [uiService]);


  useEffect(() => {
    getAllNotifications1();
  }, []);

  const getAllNotifications1 = (all) => {
    getCameraNotification()
        .then((response) => {
            if (response && response.isSuccess) {
                handleNotificationResponse(response.data, all);
            }
        })
        .catch(handleNotificationError);
  };

  const handleNotificationResponse = (data, all) => {
    const unreadData = data.filter((el) => el.is_unread);
    setCounter(unreadData.length || 0);
    let view = unreadData;
    if (!all) {
        view = (unreadData && unreadData.slice(0, 3)) || [];
        setShowViewALl(unreadData.length > 3);
    } else {
        setShowViewALl(false);
    }
    setViewData(view);
  };

  const handleNotificationError = (error) => {
    if (error.detail) {
        warningToast(error.detail);
    } else {
        warningToast("Something went Wrong");
    }
  };

  const getCounts = () => {
    getCameraNotification()
      .then((response) => {
        if (response && response.isSuccess) {
          let data = response.data.filter((el) => el.is_unread);
          setCounter(data.length || 0);
        }
      })
      .catch((error) => {
          if (error.detail) {
          warningToast(error.detail);
        } else {
          warningToast("Something went Wrong");
        }
      });
  };

  const viewAllNotifications = () => {
    getAllNotifications1(true);
  };


  const readNotifications = (ids) => {
    updateCameraNotification(ids).then((response) => {
      if (response && response.isSuccess) {
        getCounts();
      }
    });
  };

  const toggleDropdown = useCallback((status) => {
    if (!status) {
      let ids = viewData.map((item) => item.id);
      readNotifications(ids);
    } else {
      getAllNotifications1();
    }
  },[viewData]);

  const handleTabSelect = useCallback((key) => {
    setKey(key);
  }, []);

  return (
    <>
      {layoutProps.offcanvas && (
        <div className="topbar-item">
          <div
            className="btn btn-icon btn-clean btn-lg mr-1 pulse pulse-primary"
            id="kt_quick_notifications_toggle"
          >
            <span className="svg-icon svg-icon-xl svg-icon-primary">

              <NotificationsNone color={"primary"}/>
            </span>
            <span className="pulse-ring"></span>
          </div>
        </div>
      )}
      {!layoutProps.offcanvas && (
        <Dropdown drop="down" alignRight onToggle={toggleDropdown}>
          <Dropdown.Toggle
            as={DropdownTopbarItemToggler}
            id="kt_quick_notifications_toggle"
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={
                <Tooltip id="user-notification-tooltip">
                  User Notifications
                </Tooltip>
              }
            >
              <div
                className="btn btn-icon btn-hover-transparent-white btn-dropdown btn-lg mr-1 pulse pulse-primary"
                id="kt_quick_notifications_toggle"
              >
                <span className="svg-icon svg-icon-xl">
                   <NotificationsNone color={"primary"}/>
                  {counter && counter > 0 ? (
                    <>
                      <span className={"notification-counter"}>{counter}</span>
                    </>
                  ) : (
                    <span className="pulse-p1"></span>
                  )}
                </span>
                {counter && counter > 0 ? <span className="pulse-ring" /> : ""}
              </div>
            </OverlayTrigger>
          </Dropdown.Toggle>

          <Dropdown.Menu className="dropdown-menu p-0 m-0 dropdown-menu-right dropdown-menu-anim-up dropdown-menu-lg">
            <form>
              {/** Head */}
              <BlockUi tag="div" blocking={false} color="#014f9f">
                <div
                  className="d-flex flex-column pt-10 bgi-size-cover bgi-no-repeat rounded-top"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom right, #147b82, #147b82)",
                  }}
                >
                  <h4 className="d-flex flex-center rounded-top">
                    <span className="text-white ">Notifications</span>

                  </h4>

                  <Tab.Container defaultActiveKey={key}>
                    <Nav
                      as="ul"
                      className="nav nav-bold nav-tabs nav-tabs-line nav-tabs-line-3x nav-tabs-line-transparent-white nav-tabs-line-active-border-success mt-3 px-8"
                      onSelect={handleTabSelect}
                    ></Nav>
                    <Tab.Content className="tab-content">
                      <Tab.Pane eventKey="Alerts" className="p-4">
                        <PerfectScrollbar
                          options={perfectScrollbarOptions}
                          className="scroll pr-4 mr-n4"
                          style={{
                            maxHeight: "400px",
                            position: "relative",
                            height: "auto",
                          }}
                        >
                          {viewData && viewData.length > 0 ? (
                            viewData.map((key, value) => (
                              <div className="d-flex align-items-center mb-6" key={key.id}>
                                <div className="symbol symbol-40 symbol-light-primary mr-5">
                                  <span className="symbol-label">
                                    <SVG
                                      src={toAbsoluteUrl(
                                        "/media/svg/icons/Home/Library.svg"
                                      )}
                                      className="svg-icon-lg svg-icon-primary"
                                    ></SVG>
                                  </span>
                                </div>
                                <div className="d-flex flex-column font-weight-bold">
                                  <a
                                    href="#"
                                    className="text-dark text-hover-primary mb-1 font-size-lg"
                                  ></a>
                                  {key.notification_message}

                                  <span className="text-muted">
                                    {moment
                                      .utc(key.created_date)
                                      .local()
                                      .format("MMMM DD YYYY, h:mm:ss a")}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={"text-center"}>
                              No Notifications Available
                            </div>
                          )}
                        </PerfectScrollbar>

                        {viewAllBtn && (
                          <div
                            className="footer  text-center"
                            style={{ cursor: "pointer" }}
                            onClick={viewAllNotifications}
                          >
                            <div
                              className="text-dark"
                              style={{ fontWeight: "600" }}
                            >
                              <span className="svg-icon svg-icon-xl text-dark">
                                <SVG
                                  src={toAbsoluteUrl(
                                    "/media/svg/icons/Navigation/Angle-double-down.svg"
                                  )}
                                />
                              </span>
                            </div>
                          </div>
                        )}
                      </Tab.Pane>
                      <Tab.Pane
                        eventKey="Events"
                        id="topbar_notifications_events"
                      >
                        <PerfectScrollbar
                          options={perfectScrollbarOptions}
                          className="navi navi-hover scroll my-4"
                          style={{ maxHeight: "300px", position: "relative" }}
                        >
                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-line-chart text-success"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New report has been received
                                </div>
                                <div className="text-muted">23 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-paper-plane text-danger"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  Finance report has been generated
                                </div>
                                <div className="text-muted">25 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-user flaticon2-line- text-success"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New order has been received
                                </div>
                                <div className="text-muted">2 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-pin text-primary"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New customer is registered
                                </div>
                                <div className="text-muted">3 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-sms text-danger"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  Application has been approved
                                </div>
                                <div className="text-muted">3 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-pie-chart-3 text-warning"></i>
                              </div>
                              <div className="navinavinavi-text">
                                <div className="font-weight-bold">
                                  New file has been uploaded
                                </div>
                                <div className="text-muted">5 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon-pie-chart-1 text-info"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New user feedback received
                                </div>
                                <div className="text-muted">8 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-settings text-success"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  System reboot has been successfully completed
                                </div>
                                <div className="text-muted">12 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon-safe-shield-protection text-primary"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New order has been placed
                                </div>
                                <div className="text-muted">15 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-notification text-primary"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  Company meeting canceled
                                </div>
                                <div className="text-muted">19 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-fax text-success"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New report has been received
                                </div>
                                <div className="text-muted">23 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon-download-1 text-danger"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  Finance report has been generated
                                </div>
                                <div className="text-muted">25 hrs ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon-security text-warning"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New customer comment recieved
                                </div>
                                <div className="text-muted">2 days ago</div>
                              </div>
                            </div>
                          </a>

                          <a href="#" className="navi-item">
                            <div className="navi-link">
                              <div className="navi-icon mr-2">
                                <i className="flaticon2-analytics-1 text-success"></i>
                              </div>
                              <div className="navi-text">
                                <div className="font-weight-bold">
                                  New customer is registered
                                </div>
                                <div className="text-muted">3 days ago</div>
                              </div>
                            </div>
                          </a>
                        </PerfectScrollbar>
                      </Tab.Pane>
                      <Tab.Pane eventKey="Logs" id="topbar_notifications_logs">
                        <div className="d-flex flex-center text-center text-muted min-h-200px">
                          All caught up!
                          <br />
                          No new notifications.
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </div>
              </BlockUi>
            </form>
          </Dropdown.Menu>
        </Dropdown>
      )}
    </>
  );
}
