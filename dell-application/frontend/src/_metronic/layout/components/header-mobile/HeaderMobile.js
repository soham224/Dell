import React, {useMemo} from "react";
import {Link} from "react-router-dom";
import objectPath from "object-path";
import SVG from "react-inlinesvg";
import {toAbsoluteUrl} from "../../../_helpers";
import {useHtmlClassService} from "../../";

export function HeaderMobile() {
    const uiService = useHtmlClassService();

    const layoutProps = useMemo(() => {
        return {
            brandClasses: uiService.getClasses("brand", true),
            headerLogo: uiService.getStickyLogo(),
            asideDisplay: objectPath.get(uiService.config, "aside.self.display"),
            headerMenuSelfDisplay: objectPath.get(uiService.config, "header.menu.self.display") === true,
            headerMobileCssClasses: uiService.getClasses("header_mobile", true),
            headerMobileAttributes: uiService.getAttributes("header_mobile")
        };
    }, [uiService]);

    return (<>
            {/*begin::Header Mobile*/}
            <div
                id="kt_header_mobile"
                className={`header-mobile align-items-center ${layoutProps.headerMobileCssClasses}`}
                {...layoutProps.headerMobileAttributes}
            >
                {/*begin::Logo*/}
                <Link className="brand-logo-mobile">
            <span>
                 <img
                     src={toAbsoluteUrl("/media/logos/white-logo.png")}
                     alt="Tusker AI logo"
                     style={{width: '200px', height: '40px'}}
                 />
            </span>
                </Link>

                <div className="d-flex align-items-center">
                    {layoutProps.asideDisplay && (<>
                            <button className="btn p-0 burger-icon burger-icon-left" id="kt_aside_mobile_toggle">
                                <span/>
                            </button>

                        </>)}
                    <button
                        className="btn btn-hover-text-primary p-0 ml-2"
                        id="kt_header_mobile_topbar_toggle"
                    >
              <span className="svg-icon svg-icon-xl">
                <SVG src={toAbsoluteUrl("/media/svg/icons/General/User.svg")}/>
              </span>
                    </button>
                </div>
            </div>

        </>);
}
