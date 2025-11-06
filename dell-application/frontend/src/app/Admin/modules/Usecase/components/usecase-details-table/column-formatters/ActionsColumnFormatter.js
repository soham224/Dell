import React, {useCallback} from "react";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../../../../_metronic/_helpers";
import {Switch} from "@mui/material";
import { SUPER_ADMIN_ROLE} from "../../../../../../../enums/constant";

function UsecaseStatusSwitch({ row, changeUsecaseStatus, ...props }) {
    const handleChange = useCallback(() => {
        changeUsecaseStatus(row);
    }, [changeUsecaseStatus, row]);
    return <Switch {...props} onChange={handleChange} />;
}
export function ActionsColumnFormatter(
    cellContent,
    row,
    rowIndex,
    { openEditUsecaseDialog ,changeUsecaseStatus, userRole}
) {

    return (
        <>
            <a  
                title="Edit usecase Mapping"
                className={`btn btn-icon btn-light btn-hover-primary btn-sm mx-3`}
                onClick={() => openEditUsecaseDialog(row?.CameraUseCaseMapping?.id)}
            >
                <span className="svg-icon svg-icon-md svg-icon-primary">
                    <SVG
                        title="Edit usecase Mapping Details"
                        src={toAbsoluteUrl("/media/svg/icons/Communication/Write.svg")}
                    />
                </span>
            </a>

            <UsecaseStatusSwitch
                color="primary"
                checked={row?.CameraUseCaseMapping?.status}
                name="usecaseStatus"
                row={row}
                changeUsecaseStatus={changeUsecaseStatus}
                disabled={userRole !== SUPER_ADMIN_ROLE}
            />
        </>
    );
}
