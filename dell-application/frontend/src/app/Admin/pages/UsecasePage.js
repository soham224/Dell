import React from "react";
import {useSubheader} from "../../../_metronic/layout";
import AllUsecase from "../modules/Usecase";

export default function UsecasePage() {
    const suhbeader = useSubheader();
    suhbeader.setTitle("Usecase");

    return (
        <AllUsecase />
    );
};
