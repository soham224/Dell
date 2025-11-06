import SweetAlert from "react-bootstrap-sweetalert";
import React, { useState, useCallback } from "react";
import * as PropTypes from "prop-types";
import { useDispatch } from "react-redux";

export function AutoServingStatusChangeAlert(props) {
  const dispatch = useDispatch();

  let {
    id,
    entities,
    status,
    show,
    onHide,
    timeout = 800,
    initTitle = "Are you sure? to change status",
    successTitle = "Status Changed Successfully !",
    loadingTitle = "Changing Status",
    updateMethod,
  } = props;

  const initialTitle = initTitle;
  const [alertData, setAlertData] = useState({
    loading: false,
    success: false,
    alertTitle: initialTitle,
  });

  const confirmSubmitData = useCallback(() => {
    setAlertData({
      ...alertData,
      loading: true,
      alertTitle: loadingTitle,
    });
    let data = { ...entities.filter((d) => d.id === id * 1)[0] };
    data.status = status;
    dispatch(updateMethod(data)).then(() => {
      setAlertData({ loading: false, success: true, alertTitle: successTitle });
      setTimeout(() => {
        setAlertData({
          ...alertData,
          success: false,
          alertTitle: initialTitle,
        });
        onHide();
      }, timeout);
    });
  }, [alertData, dispatch, entities, id, loadingTitle, onHide, status, successTitle, timeout, updateMethod]);

  const { success, loading, alertTitle } = alertData;

  return (
    <SweetAlert
      info={!success}
      success={success}
      showCancel={!loading && !success}
      showConfirm={!loading && !success}
      closeOnClickOutside={!loading}
      confirmBtnText="Confirm"
      confirmBtnBsStyle="primary"
      cancelBtnBsStyle="light"
      cancelBtnStyle={{ color: "black" }}
      title={alertTitle}
      onConfirm={confirmSubmitData}
      onCancel={onHide}
      show={show}
      focusCancelBtn
      dependencies={[loading]}
    >
      {loading ? (
        <div className="overlay-layer bg-transparent">
          <div className="spinner-border text-info text-center" />
        </div>
      ) : (
        <></>
      )}
    </SweetAlert>
  );
}

AutoServingStatusChangeAlert.propTypes = {
  id: PropTypes.string,
  entities: PropTypes.array,
  status: PropTypes.string,
  show: PropTypes.bool,
  onHide: PropTypes.func,
  timeout: PropTypes.number,
  initTitle: PropTypes.string,
  successTitle: PropTypes.string,
  loadingTitle: PropTypes.string,
  updateMethod: PropTypes.func,
};
