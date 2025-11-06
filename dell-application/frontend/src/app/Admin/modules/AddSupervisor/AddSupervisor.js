import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import paginationFactory, { PaginationProvider } from "react-bootstrap-table2-paginator";
import {
  entityFilter,
  getFilteredAndPaginatedEntities,
  getPaginationOptions,
  headerSortingClasses,
  sortCaret,
  toAbsoluteUrl,
} from "../../../../_metronic/_helpers";
import { Pagination ,Card, CardBody} from "../../../../_metronic/_partials/controls";
import { warningToast } from "../../../../utils/ToastMessage";
import SweetAlert from "react-bootstrap-sweetalert";
import { Button, Col, Container, Row } from "reactstrap";
import { getSupervisorList, updateSupervisorStatus } from "./_redux";
import SVG from "react-inlinesvg";
import { useSupervisorUIContext } from "./SupervisorUIContext";
import { AutoServingTable } from "../../../../utils/AutoServingTable";
import { SearchText } from "../../../../utils/SearchText";
import { CardHeader } from "@mui/material";
import AddSupervisorModal from "./addSupervisorModal";
import AssignLocationModal from "./assignLocationModal";
import BlockUi from "@availity/block-ui";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import * as action from "../Locations/_redux/LocationAction";
import FetchViolationModal from "../../../../utils/FetchViolationModal";
import SupervisorStatusChange from "./SupervisorSwitch";

// Outside the component
function actionsFormatter(handleAssignLocation, setShowAlert1) {
  return function(cellContent, row) {
    const onAssignClick = () => handleAssignLocation(cellContent, row);

    return (
        <>
          <a
              title="Assign locations"
              className="btn btn-icon btn-light btn-hover-primary btn-sm mx-3"
              onClick={onAssignClick}
          >
          <span className="svg-icon svg-icon-md svg-icon-primary">
            <SVG
                title="Assign locations"
                src={toAbsoluteUrl("/media/svg/icons/Communication/Write.svg")}
            />
          </span>
          </a>
          <SupervisorStatusChange
              cellContent={cellContent}
              row={row}
              setShowAlert1={setShowAlert1}
          />
        </>
    );
  };
}

export default function AddSupervisor() {
  const dispatch = useDispatch();
  const supervisorUIContext = useSupervisorUIContext();
  const supervisorUIProps = useMemo(() => supervisorUIContext, [supervisorUIContext]);

  const [showBarTable, setShowBarTable] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [columns, setColumns] = useState([]);
  const [assignLocationModal, setAssignLocationModal] = useState(false);
  const [selected_user_id, setSelectedUserId] = useState("");
  const [selected_user_location, setSelectedUserLocation] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [specific_user_id, setSpecificUserId] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [cellContent, setCellContent] = useState([]);
  const [row, setRow] = useState(null);
  const [data, setData] = useState([]);
  const [filterEntities, setFilterEntities] = useState([]);

  const { user, popupData } = useSelector(
      ({ auth, location }) => ({
        user: auth.user,
        popupData: location?.popupData,
      }),
      shallowEqual
  );

  const blockAddSupervisor = useCallback(() => setBlocking(true),[]);
  const unblockAddSupervisor = () => setBlocking(false);

  const toggleSupervisorModal = useCallback(() => setModalOpen(!modalOpen),[]);
  const toggleLocationModal = () => setAssignLocationModal(!assignLocationModal);
  const toggleShowAlert = useCallback(() => setShowAlert(false),[]);
  const setShowAlert1 = useCallback((cellContent, row) => {
    setShowAlert(true);
    setCellContent(cellContent);
    setRow(row);
  },[]);

  const handleCloseModal = useCallback(() => {
    dispatch(action.clearPopupDataAction());
    setShowBarTable(false);
  },[]);

  const parseSupervisorData = (responseData) => {
    return responseData.map((obj, index) => {
      const locationObj = obj.locations?.map(l => l.location_name) || [];
      const locationId = obj.locations?.map(l => ({
        label: l.location_name,
        value: l.id,
      })) || [];

      return {
        id: index + 1,
        email: obj.user_email,
        company: obj?.company,
        locations: locationObj.toString(),
        assignlocation: [{
          user_status: obj.user_status,
          location: locationId,
          id: obj.id,
        }],
      };
    });
  };

  const getAllSupervisorList = () => {
    const tableColumns = [
      {
        dataField: "id",
        text: "INDEX",
        sort: true,
        sortCaret,
        headerSortingClasses,
      },
      {
        dataField: "email",
        text: "Email",
        sort: true,
        sortCaret,
        headerSortingClasses,
      },
      {
        dataField: "locations",
        text: "Locations",
        sort: true,
        sortCaret,
        headerSortingClasses,
        formatter: (cellContent, row) =>
            row?.locations ?  row?.locations : "-",
      },
      {
        dataField: "assignlocation",
        text: "Actions",
        style: { minWidth: "150px" },
        formatter: actionsFormatter(handleAssignLocation, setShowAlert1),
      },
    ];

    blockAddSupervisor();
    {
      !assignLocationModal &&
      getSupervisorList(user?.roles[0]?.role)
          .then((response) => {
            if (response?.isSuccess) {
              const formattedData = parseSupervisorData(response.data);
              setColumns(tableColumns);
              setData(formattedData);
              setFilterEntities(formattedData);
            } else {
              warningToast("Something went wrong");
            }
          })
          .catch((error) => warningToast(error?.detail || "Something went Wrong"))
          .finally(() => unblockAddSupervisor());
    }
  };

  const handleUserStatus = (cellContent, row) => {
    const updateStatus = {
      user_status: !cellContent[0].user_status,
      user_id: cellContent[0].id,
    };

    blockAddSupervisor();
    updateSupervisorStatus(updateStatus)
        .then((response) => {
          if (!response?.isSuccess) return warningToast("Something went wrong");
          getAllSupervisorList();
        })
        .catch((error) => warningToast(error?.detail || "Something went Wrong"))
        .finally(() => toggleShowAlert());
  };

  const handleAssignLocation = (cellContent, row) => {
    setSelectedUserId(row);
    setSpecificUserId(cellContent[0].id);
    setSelectedUserLocation(cellContent[0].location);
    setTimeout(() => toggleLocationModal(), 500);
  };

  const searchInput = useRef("");
  const filterSupervisor = useCallback((e) => {
    const searchStr = (e?.target?.value || searchInput.current.value || "").trim();
    const keys = ["id", "email"];
    entityFilter(data, searchStr, keys, supervisorUIProps.queryParams, setFilterEntities);
  },[data, supervisorUIProps.queryParams, setFilterEntities]);

  useEffect(() => {
    getAllSupervisorList();
  }, [supervisorUIProps.queryParams, modalOpen, assignLocationModal]);

  useEffect(() => {
    if (popupData.length > 0) setShowBarTable(true);
    else setShowBarTable(false);
  }, [popupData]);

  useEffect(() => {
    filterSupervisor();
  }, []);

  const currentItems = getFilteredAndPaginatedEntities(filterEntities || data, supervisorUIProps.queryParams);

  const handleConfirm = React.useCallback(() => {
    handleUserStatus(cellContent, row);
  }, [cellContent, row]);


  return (
      <Container className="p-0" fluid>
        <Card className="example example-compact" style={{ minHeight: "300px" }}>
          <CardBody style={{ minHeight: "300px", padding: "10px 10px" }}>
            <Row className="align-items-center">
              <Col xs={12} sm={12} md={6} lg={6} xl={6} className="mb-2 mb-md-0"><CardHeader title="Supervisor Details" /></Col>
              <Col xs={12} sm={12} md={6} lg={6} xl={6} className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                <div className={"mr-1"}><SearchText reference={searchInput} onChangeHandler={filterSupervisor} placeholder="Search For Email" /></div>
                <Button color="primary" onClick={toggleSupervisorModal}>Add Supervisor</Button>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col xl={12} style={{ padding: "10px 20px", minWidth: "300px" }}>
                {currentItems?.length > 0 ? (
                    <PaginationProvider pagination={paginationFactory(getPaginationOptions(filterEntities.length, supervisorUIProps.queryParams))}>
                      {({ paginationProps, paginationTableProps }) => (
                          <Pagination paginationProps={paginationProps}>
                            <div style={{ flex: 1, height: "calc(100vh - 368px)", overflowX: "auto" }}>
                              <BlockUi tag="div" blocking={blocking} color="#147b82">
                                <AutoServingTable
                                    columns={columns}
                                    items={currentItems}
                                    tableChangeHandler={supervisorUIProps.setQueryParams}
                                    paginationTableProps={paginationTableProps}
                                />
                              </BlockUi>
                            </div>
                          </Pagination>
                      )}
                    </PaginationProvider>
                ) : (
                    <div style={{ minHeight: "calc(100vh - 365px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h3 className="text-center mb-0">No Data Found</h3>
                    </div>
                )}
              </Col>
              {assignLocationModal && (
                  <AssignLocationModal
                      specific_user_id={specific_user_id}
                      blockAddSupervisor={blockAddSupervisor}
                      selectedUserLocation={selected_user_location}
                      selectedUser={selected_user_id}
                      toggleLocationModal={toggleLocationModal}
                      modalOpen={assignLocationModal}
                      userRole={user?.roles[0]?.role}
                  />
              )}
            </Row>
          </CardBody>
        </Card>

        <SweetAlert
            showCancel
            showConfirm
            confirmBtnText="Confirm"
            confirmBtnBsStyle="primary"
            cancelBtnBsStyle="light"
            cancelBtnStyle={{ color: "black" }}
            title="Are you sure ?"
            onConfirm={handleConfirm}
            onCancel={toggleShowAlert}
            show={showAlert}
            focusCancelBtn
        />

        {modalOpen && (
            <AddSupervisorModal
                blockAddSupervisor={blockAddSupervisor}
                modalOpen={modalOpen}
                toggleSupervisorModal={toggleSupervisorModal}
                userRole={user?.roles[0]?.role}
            />
        )}

        {showBarTable && (
            <FetchViolationModal
                showBarTableData={showBarTable}
                tableDatas={popupData}
                handleCloseModal={handleCloseModal}
            />
        )}
      </Container>
  );
}
