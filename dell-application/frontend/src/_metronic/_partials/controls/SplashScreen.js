import React from "react";
import {toAbsoluteUrl} from "../../_helpers";
import {CircularProgress} from "@mui/material";

export function SplashScreen() {
    return (
        <>
            <div className="splash-screen">
                <img
                    src={toAbsoluteUrl("/media/logos/logo-mini-md.png")}
                    alt="Metronic logo"
                />
                <CircularProgress className="splash-screen-spinner"/>
            </div>
        </>
    );
}
