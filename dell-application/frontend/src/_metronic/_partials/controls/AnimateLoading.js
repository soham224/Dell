import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ProgressBar } from "react-bootstrap";

const AnimateLoading = () => {
  const location = useLocation();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const animateTimeouts = [];
    let isAnimating = true;

    const animate = () => {
      if (isAnimating && width <= 100) {
        animateTimeouts.push(
            setTimeout(() => {
              setWidth((prevWidth) => prevWidth + 10);
            }, 30)
        );
      } else {
        stopAnimate();
      }
    };

    const stopAnimate = () => {
      isAnimating = false;
      animateTimeouts.forEach((timeout) => clearTimeout(timeout));
      animateTimeouts.push(
          setTimeout(() => {
            setWidth(0);
          }, 300)
      );
    };

    const scrollToTop = () => {
      const scrollToTopBtn = document.getElementById("kt_scrolltop");
      if (scrollToTopBtn) {
        scrollToTopBtn.click();
      }
    };

    // Trigger animation on location change
    animate();
    scrollToTop();

    return () => {
      isAnimating = false;
      animateTimeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [location.pathname]);

  return (
      <div className="header-progress-bar" style={{ height: "3px", width: "100%" }}>
        {width > 0 && (
            <ProgressBar variant="info" now={width} style={{ height: "3px" }} />
        )}
      </div>
  );
};

export default AnimateLoading;
