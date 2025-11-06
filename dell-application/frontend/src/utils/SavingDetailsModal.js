import { Modal } from "react-bootstrap";
import * as PropTypes from "prop-types";
import React from "react";

function getTop(top) {
  if (top === "start") {
    return 115;
  } else {
    return 256;
  }
}

export const SavingDetailsModal = (props) => (
  <Modal
    style={{ marginTop: `${getTop(props.top)}px` }}
    size="sm"
    show={props.show}
    backdrop={"static"}
    aria-labelledby="example-modal-sizes-title-sm"
  >
    <div className="overlay-layer bg-transparent text-center mt-5">
      <div className="spinner-border text-info text-center" />
      <div>Saving Details</div>
    </div>
  </Modal>
);

SavingDetailsModal.propTypes = { show: PropTypes.bool };