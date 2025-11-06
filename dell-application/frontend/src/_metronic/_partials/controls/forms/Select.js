import React from "react";
import {useField} from "formik";
import {FieldFeedbackLabel} from "./FieldFeedbackLabel";
import Select from "react-select";

const getFieldCSSClasses = (touched, errors) => {
  const classes = ["form-control", "form-control-solid"];
  if (touched && errors) {
    classes.push("is-invalid-select");
  }

  if (touched && !errors) {
    classes.push("is-valid-select");
  }

  return classes.join(" ");
};

// Modern wrapper for react-select that uses default parameters instead of defaultProps
export function ReactSelectWrapper({
  isMulti = false,
  isSearchable = true,
  isLoading = false,
  placeholder = "Select...",
  className = "",
  theme = (theme) => ({
    ...theme,
    borderRadius: 0,
    colors: {
      ...theme.colors,
      primary25: "#5DBFC4",
      primary: "#147b82"
    }
  }),
  ...props
}) {
  return (
    <Select
      isMulti={isMulti}
      isSearchable={isSearchable}
      isLoading={isLoading}
      placeholder={placeholder}
      className={className}
      theme={theme}
      {...props}
    />
  );
}

export function FormSelect({
  label,
  withFeedbackLabel = true,
  type = "text",
  customFeedbackLabel,
  children,
  ...props
}) {
  const [field, meta] = useField(props);
  const {touched, error} = meta;
  return (
    <>
      {label && <label>Select {label}</label>}
      <select
        className={getFieldCSSClasses(touched, error)}
        {...field}
        {...props}
      >
        {children}
      </select>
      {withFeedbackLabel && (
        <FieldFeedbackLabel
          erros={error}
          touched={touched}
          label={label}
          customFeedbackLabel={customFeedbackLabel}
        />
      )}
    </>
  );
}
