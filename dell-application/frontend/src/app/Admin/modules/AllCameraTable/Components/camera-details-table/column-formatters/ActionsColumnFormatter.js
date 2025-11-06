import React, { useCallback } from "react";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../../../../_metronic/_helpers";
import { Switch } from "@mui/material";
import { SUPER_ADMIN_ROLE } from "../../../../../../../enums/constant";

function CameraStatusSwitch({ row, changeCameraStatus, ...props }) {
    const handleChange = useCallback(() => {
        changeCameraStatus(row);
    }, [changeCameraStatus, row]);
    return <Switch {...props} onChange={handleChange} />;
}

export function ActionsColumnFormatter(
    cellContent,
    row,
    rowIndex,
    { openEditCameraDialog, changeCameraStatus,userRole,openVideoInferenceCameraDialog}
) {

    return (
        <>
        {userRole === SUPER_ADMIN_ROLE && <>
            <a
                title="Edit Camera"
                className={`btn btn-icon btn-light btn-hover-primary btn-sm mx-3 ${userRole !== SUPER_ADMIN_ROLE ? "disabled" : ""}`}
                onClick={(e) => {
                    if (userRole === SUPER_ADMIN_ROLE) {
                        openEditCameraDialog(row.id);
                    } else {
                        e.preventDefault(); // prevent action if not allowed
                    }
                }}
                style={{ pointerEvents: userRole === SUPER_ADMIN_ROLE ? "auto" : "none", opacity: userRole === SUPER_ADMIN_ROLE ? 1 : 0.5 }}
            >
            <span className="svg-icon svg-icon-md svg-icon-primary">
                <SVG
                    title="Edit Camera Details"
                    src={toAbsoluteUrl("/media/svg/icons/Communication/Write.svg")}
                />
            </span>
            </a></>}

            <CameraStatusSwitch
                color="primary"
                checked={row.status}
                name="cameraStatus"
                row={row}
                changeCameraStatus={changeCameraStatus}
                disabled={userRole !== SUPER_ADMIN_ROLE}
            />
            {/*<a*/}
            {/*    title="Video Inference"*/}
            {/*    className={`btn btn-icon btn-light btn-hover-primary btn-sm mx-3`}*/}
            {/*    onClick={(e) => {*/}
            {/*        openVideoInferenceCameraDialog(row.id);*/}
            {/*    }}*/}
            {/*>*/}
            {/*<span className="svg-icon svg-icon-md svg-icon-primary">*/}
            {/*    <SVG*/}
            {/*        title="Video Inference"*/}
            {/*        src={toAbsoluteUrl("/media/svg/icons/Devices/Video-camera.svg")}*/}
            {/*    />*/}
            {/*</span>*/}
            {/*</a>*/}
        </>
    );
}
