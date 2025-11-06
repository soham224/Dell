import React from "react";
import {useSubheader} from "../../../../_metronic/layout";
import ActivityPage from "./components/ActivityPage";

export default function Activity(){
    const subheader = useSubheader();
    subheader.setTitle("Activity");

    return (
        <ActivityPage/>
    );
}