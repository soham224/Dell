import React, {useCallback} from "react";
import {useField, useFormikContext} from "formik";
import DatePicker from "react-datepicker";

const getFieldCSSClasses = (touched, errors) => {
  const classes = ["form-control"];
  if (touched && errors) {
    classes.push("is-invalid");
  }

  if (touched && !errors) {
    classes.push("is-valid");
  }

  return classes.join(" ");
};

export function DatePickerField({...props}) {
  const {setFieldValue, errors, touched} = useFormikContext();
  const [field] = useField(props);

  // Define the handler function outside of JSX
  const handleDateChange = useCallback((val) => {
    setFieldValue(field.name, val);
  },[]);

  // Define a function to calculate the selected value
  const getSelectedDate = () => {
    return (field.value && new Date(field.value)) || null;
  };

  return (
      <>
        {props.label && <label>{props.label}</label>}
        <DatePicker
            className={getFieldCSSClasses(touched[field.name], errors[field.name])}
            style={{width: "100%"}}
            {...field}
            {...props}
            selected={getSelectedDate()} // Use the function
            onChange={handleDateChange} // Use the handler function
        />
        {errors[field.name] && touched[field.name] ? (
            <div className="invalid-datepicker-feedback">
              {errors[field.name].toString()}
            </div>
        ) : (
            <div className="feedback">
              Please enter <b>{props.label}</b> in 'mm/dd/yyyy' format
            </div>
        )}
      </>
  );
}
