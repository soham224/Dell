/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React from "react";
import SVG from "react-inlinesvg";
import {toAbsoluteUrl} from "../../../_helpers";

export function MixedWidget1() {


  return (
      <>
      <div className={`card card-custom bg-gray-100 col-lg-12 col-xxl-12`}>
        <div className="card-body p-0 position-relative overflow-hidden">
          {/* Chart */}
          <div
              id="kt_mixed_widget_1_chart"
              className=""
              style={{height: "200px"}}
          ></div>

          {/* Stat */}
          <div className="card-spacer mt-n25">
            <div className="row m-0">
              <div className="col bg-light-warning px-6 py-8 rounded-xl mr-7 mb-7">
              <span className="svg-icon svg-icon-3x svg-icon-warning d-block my-2">
                <SVG
                    src={toAbsoluteUrl("/media/svg/icons/Media/Equalizer.svg")}
                ></SVG>
              </span>
                <a
                    href="#"
                    className="text-warning font-weight-bold font-size-h6"
                >
                  Total Projects <br/>
                  3
                </a>
              </div>
              <div className="col bg-light-primary px-6 py-8 rounded-xl mb-7">
              <span className="svg-icon svg-icon-3x svg-icon-primary d-block my-2">
                <SVG
                    src={toAbsoluteUrl(
                        "/media/svg/icons/Communication/Add-user.svg"
                    )}
                ></SVG>
              </span>
                <a
                    href="#"
                    className="text-primary font-weight-bold font-size-h6 mt-2"
                >
                  Total Models <br/>
                  5
                </a>
              </div>
              <div className="col bg-light-warning px-6 py-8 rounded-xl ml-7 mb-7">
              <span className="svg-icon svg-icon-3x svg-icon-warning d-block my-2">
                <SVG
                    src={toAbsoluteUrl("/media/svg/icons/Media/Equalizer.svg")}
                ></SVG>
              </span>
                <a
                    href="#"
                    className="text-warning font-weight-bold font-size-h6"
                >
                  Total Experiments <br/>
                  5
                </a>
              </div>

            </div>
            <div className="row m-0">
              <div className="col bg-light-danger px-6 py-8 rounded-xl mr-7">
              <span className="svg-icon svg-icon-3x svg-icon-danger d-block my-2">
                <SVG
                    src={toAbsoluteUrl("/media/svg/icons/Design/Layers.svg")}
                ></SVG>
              </span>
                <a
                    href="#"
                    className="text-danger font-weight-bold font-size-h6 mt-2"
                >
                  Total Frameworks <br/>
                  1
                </a>
              </div>
              <div className="col bg-light-success px-6 py-8 rounded-xl">
              <span className="svg-icon svg-icon-3x svg-icon-success d-block my-2">
                <SVG
                    src={toAbsoluteUrl(
                        "/media/svg/icons/Communication/Urgent-mail.svg"
                    )}
                ></SVG>
              </span>
                <a
                    href="#"
                    className="text-success font-weight-bold font-size-h6 mt-2"
                >
                  Total Annotation Types <br/>
                  1
                </a>
              </div>
              <div className="col bg-light-danger px-6 py-8 rounded-xl ml-7">
              <span className="svg-icon svg-icon-3x svg-icon-danger d-block my-2">
                <SVG
                    src={toAbsoluteUrl("/media/svg/icons/Design/Layers.svg")}
                ></SVG>
              </span>
                <a
                    href="#"
                    className="text-danger font-weight-bold font-size-h6 mt-2"
                >
                  Total Model Types <br/>
                  5
                </a>
              </div>
            </div>
          </div>

          {/* Resize */}
          <div className="resize-triggers">
            <div className="expand-trigger">
              <div style={{width: "411px", height: "461px"}}/>
            </div>
            <div className="contract-trigger"/>
          </div>
        </div>
      </div>
        </>
  );
}
