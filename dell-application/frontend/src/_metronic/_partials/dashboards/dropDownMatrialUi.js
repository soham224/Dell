import React, { useCallback } from "react";
import Select from "react-select";

const DropDownMatrialUi = ({ graphType, handleGraphChange, drilldownFromFun }) => {
    const options = [
        { value: "column", label: "Bar" },
        { value: "line", label: "Line" },
        ...(drilldownFromFun === false ? [{ value: "stack", label: "Stack" }] : [])
    ];

    // Move theme function out of JSX
    const customTheme = useCallback((theme) => ({
        ...theme,
        borderRadius: 0,
        cursor: "pointer",
        colors: {
            ...theme.colors,
            primary25: "#5DBFC4",
            primary: "#147b82"
        }
    }), []);

    // Move onChange handler out of JSX
    const handleChange = useCallback((selectedOption) => {
        handleGraphChange(selectedOption.value);
    }, [handleGraphChange]);

    return (
        <Select
            theme={customTheme}
            value={options.find(option => option.value === graphType)}
            onChange={handleChange}
            options={options}
            // className="mb-5"
        />
    );
};

export default DropDownMatrialUi;
