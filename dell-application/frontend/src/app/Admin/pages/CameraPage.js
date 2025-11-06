import React from "react";
import {useSubheader} from "../../../_metronic/layout";
import AllCamera from "../modules/AllCameraTable";

export default function CameraPage() {
    const suhbeader = useSubheader();
    suhbeader.setTitle("Camera");

    return (
        <AllCamera/>
    );
};
