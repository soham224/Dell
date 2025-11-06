import React, { useMemo } from "react";
import { useHtmlClassService } from "../../_core/MetronicLayout";

export function Footer() {
  const uiService = useHtmlClassService();
    const today = new Date().getFullYear();
  const layoutProps = useMemo(() => {
    return {
      footerClasses: uiService.getClasses("footer", true),
      footerContainerClasses: uiService.getClasses("footer_container", true),
    };
  }, [uiService]);

  return (
    <div
      className={`footer bg-white py-4 d-flex flex-lg-column  ${layoutProps.footerClasses}`}
      id="kt_footer"
    >
      <div
        className={`${layoutProps.footerContainerClasses} d-flex flex-column flex-md-row align-items-center justify-content-between`}
      >

        <div className="opacity-70 font-weight-bold order-2 order-md-1">
            <span className={'opacity-70 text-dark-75 font-weight-bold'}>
                &copy; 2021-{today}
            </span>
          <a
              href={"#"}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 text-dark-75 font-weight-bold ml-2 text-hover-primary"
          >

              TUSKER AI

          </a>
        </div>


      </div>
    </div>
  );
}
