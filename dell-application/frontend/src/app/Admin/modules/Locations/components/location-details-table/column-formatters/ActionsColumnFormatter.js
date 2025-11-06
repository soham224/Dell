import React, {useCallback} from "react";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../../../../_metronic/_helpers";
import { Switch } from "@mui/material";
import {SUPER_ADMIN_ROLE} from "../../../../../../../enums/constant";

function LocationStatusSwitch({ row, changeLocationStatus, ...props }) {
    const handleChange = useCallback(() => {
        changeLocationStatus(row);
    }, [changeLocationStatus, row]);
    return <Switch {...props} onChange={handleChange} />;
}
export function ActionsColumnFormatter(
    cellContent,
    row,
    rowIndex,
    { openEditLocationDialog, changeLocationStatus,userRole}
) {


    return (
        <>
            {userRole === SUPER_ADMIN_ROLE && <>
                {/*eslint-disable-next-line*/}
                <a
                    title="Edit Camera"
                    className={`btn btn-icon btn-light btn-hover-primary btn-sm mx-3 ${userRole !== SUPER_ADMIN_ROLE ? "disabled" : ""}`}
                    onClick={(e) => {
                        if (userRole === SUPER_ADMIN_ROLE) {
                            openEditLocationDialog(row.id);
                        } else {
                            e.preventDefault(); // prevent action if not allowed
                        }
                    }}
                    style={{ pointerEvents: userRole === SUPER_ADMIN_ROLE ? "auto" : "none", opacity: userRole === SUPER_ADMIN_ROLE ? 1 : 0.5 }}
                >
            <span className="svg-icon svg-icon-md svg-icon-primary">
                <SVG
                    title="Edit Location Details"
                    src={toAbsoluteUrl("/media/svg/icons/Communication/Write.svg")}
                />
            </span>
                </a></>}

            <LocationStatusSwitch
                color="primary"
                checked={row.status}
                name="locationStatus"
                row={row}
                changeLocationStatus={changeLocationStatus}
                disabled={userRole !== SUPER_ADMIN_ROLE}
            />
        </>
    );
}

