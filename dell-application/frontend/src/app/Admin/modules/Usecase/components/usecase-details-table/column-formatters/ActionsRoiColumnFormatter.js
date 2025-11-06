import React from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";

export function ActionsRoiColumnFormatter(
    cellContent,
    row,
    rowIndex,
    { openViewRoiDialog }
) {

    return (
        <>
            <a
                title="View Roi"
                className={`btn btn-icon btn-light btn-sm mx-3`}
                onClick={(e) => {
                        openViewRoiDialog(row?.CameraUseCaseMapping?.id);

                }}
            >
          <VisibilityIcon
              color={"action"}
              style={{ fontSize: "2rem", color: "#147b82" }}
          />
            </a>
        </>
    );
}
