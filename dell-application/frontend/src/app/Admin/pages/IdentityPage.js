import React from "react";
import {useSubheader} from "../../../_metronic/layout";
import Identity from "../modules/Identity";

export default function IdentityPage() {
    const suhbeader = useSubheader();
    suhbeader.setTitle("Identity");

    return (
            <Identity/>
    );
};
