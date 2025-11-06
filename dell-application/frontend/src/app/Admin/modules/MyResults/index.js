import React from "react";
import DeployedRTSPJobs from "./components/DeployedRTSPJobs";
import {useSubheader} from "../../../../_metronic/layout";

export default function MyResults(){
    const subheader = useSubheader();
    subheader.setTitle("Result");

    return (
        <DeployedRTSPJobs/>
    );
}