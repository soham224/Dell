import React from "react";
import * as PropTypes from "prop-types";

export function SearchText(props) {
  let { onChangeHandler, reference, className ,placeholder} = props;
  return (
    <div className={className + "col-xl-3"}>
      <input
        // style={{ width: "auto" }}
        type="text"
        className="form-control"
        name="searchText"
        placeholder={placeholder ? placeholder : "Search For Name"}
        onChange={onChangeHandler}
        ref={reference}
      />
    </div>
  );
}

SearchText.propTypes = {
  onChangeHandler: PropTypes.func,
  reference: PropTypes.object,
  className: PropTypes.string,
  placeholder: PropTypes.string
};
