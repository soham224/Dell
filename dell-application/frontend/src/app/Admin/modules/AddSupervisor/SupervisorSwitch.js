// SupervisorSwitch.js
import React, { useCallback } from "react";
import { Switch } from "@mui/material";

const SupervisorStatusChange = ({ cellContent, row, setShowAlert1 }) => {
    const handleSwitchChange = useCallback(() => {
        setShowAlert1(cellContent, row);
    }, [cellContent, row, setShowAlert1]);

    return (
        <Switch
            checked={cellContent[0]?.user_status}
            onChange={handleSwitchChange}
            color="primary"
        />
    );
};

export default SupervisorStatusChange;
