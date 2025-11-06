import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card, CardBody, Pagination} from "../../../../../_metronic/_partials/controls";
import {useUsecaseUIContext} from "./UsecaseUIContext";
import {Button, Col, Row} from "reactstrap";
import {CardHeader} from "@mui/material";
import {
  entityFilter,
  getFilteredAndPaginatedEntities, getPaginationOptions,
  headerSortingClasses,
  sortCaret
} from "../../../../../_metronic/_helpers";
import * as columnFormatters from "./usecase-details-table/column-formatters";
import {updateCameraUsecaseMapping} from "../_redux/UsecaseAPI";
import {successToast, warningToast} from "../../../../../utils/ToastMessage";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import * as actions from "../_redux/UsecaseAction";
import paginationFactory, {PaginationProvider} from "react-bootstrap-table2-paginator";
import {SearchText} from "../../../../../utils/SearchText";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {AutoServingTable} from "../../../../../utils/AutoServingTable";
import SweetAlert from "react-bootstrap-sweetalert";
import { SUPER_ADMIN_ROLE} from "../../../../../enums/constant";
import * as action from "../../Locations/_redux/LocationAction";
import FetchViolationModal from "../../../../../utils/FetchViolationModal";

export default function UsecaseCard() {
  const usecaseUIContext = useUsecaseUIContext();
  const [showBarTable, setShowBarTable] = useState(false);
  const usecaseUIProps = useMemo(() => ({
    ...usecaseUIContext,
    newUsecaseButtonClick: usecaseUIContext.openNewUsecaseDialog,
  }), [usecaseUIContext]);

  const {userRole} = useSelector(
      ({auth}) => ({
        userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
      }),
      shallowEqual
  );

  const ShowAlert =(row)=> {
    setShowAlert(true);
    setRow(row);
  }
  const columns = [
    {
      dataField: "idx",
      text: "Index",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,

    },
    {
      dataField: "Location",
      text: "Location Name",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
          row?.Location?.location_name,

    },
    {
      dataField: "CameraManager",
      text: "Camera Name",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
          row?.CameraManager?.camera_name,

    },
    {
      dataField: "UseCase",
      text: "Usecase Name",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
          row?.UseCase?.usecase,

    },
    {
      dataField: "CameraUseCaseMapping",
      text: "Time Before Event",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
          row?.CameraUseCaseMapping?.second_before_event,

    },
    {
      dataField: "CameraUseCaseMapping",
      text: "Time After Event",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
          row?.CameraUseCaseMapping?.second_after_event,

    },
    {
      dataField: "CameraUseCaseMapping",
      text: "Timeout",
      sort: true,
      sortCaret: sortCaret,
      headerSortingClasses,
      formatter: (_, row) =>
          row?.CameraUseCaseMapping?.usecase_timeout,
    },{
      dataField: "action",
      text: "Actions",

      formatter: columnFormatters.ActionsColumnFormatter,
      formatExtraData: {
        changeUsecaseStatus: ShowAlert,
        userRole: userRole,
        openEditUsecaseDialog: usecaseUIProps.openEditUsecaseDialog
      }
    },
    {
      dataField: "action",
      text: "Roi",
      formatter: columnFormatters.ActionsRoiColumnFormatter,
      formatExtraData: {
        openViewRoiDialog: usecaseUIProps.openViewRoiDialog,
        openEditRoiDialog: usecaseUIProps.openEditRoiDialog
      }
    }
  ];

  const [isStatusAPIcalled, setIsStatusAPIcalled] = React.useState(false);

  function changeUsecaseStatusFunction(row) {

    const usecaseStatus = {
      id: row?.CameraUseCaseMapping?.id,
      status: !row?.CameraUseCaseMapping?.status,
    }
    updateCameraUsecaseMapping(usecaseStatus)
        .then(response => {
          if (response && response.isSuccess) {
            setIsStatusAPIcalled(!isStatusAPIcalled);
            successToast(response.data?.message);
            setShowAlert(false);
          }
        })
        .catch(error => {
          setShowAlert(false);
          setIsStatusAPIcalled(!isStatusAPIcalled);
          if (error.detail) {
            console.log(error.detail);
          }
        });
  }

  const {currentState ,popupData} = useSelector(
      state => ({
        currentState: state.useCase,
        popupData: state.location?.popupData,
      }),
      shallowEqual
  );


  const { entities = [], listLoading = false } = currentState;

  const [filterEntities, setFilterEntities] = useState(entities);
  const [showAlert, setShowAlert] = useState(false);
  const [row, setRow] = useState();


  const dispatch = useDispatch();
  const searchInput = useRef("");
  let currentItems = getFilteredAndPaginatedEntities(
      filterEntities || entities,
      usecaseUIProps.queryParams
  );

  const handleFilterUsecase = useCallback((e) => {
    if (entities.length > 0) {
      const searchStr = (e?.target?.value || searchInput.current.value || "").trim();
      const keys = [
        "Location.location_name",
        "CameraManager.camera_name",
        "UseCase.usecase"
      ];

      currentItems = entityFilter(
          entities,
          searchStr,
          keys,
          usecaseUIProps.queryParams,
          setFilterEntities
      );
    }
  }, [entities, usecaseUIProps.queryParams, setFilterEntities]);

  const handleConfirm = useCallback(() => {
    changeUsecaseStatusFunction(row);
  }, [row, changeUsecaseStatusFunction]);

  const toggleShowAlert = () => {
    setShowAlert(false);
  };

  const handleCancel = useCallback(() => {
    toggleShowAlert();
  }, [toggleShowAlert]);

  const handleCloseModal = useCallback(() => {
    dispatch(action.clearPopupDataAction());
    setShowBarTable(false);
  }, [dispatch, setShowBarTable]);

  useEffect(() => {
    if(popupData.length > 0){
      setShowBarTable(true)
    }else {
      setShowBarTable(false)
    }
  }, [popupData]);
  useEffect(() => {
    dispatch(actions.getAllCameraUsecaseMappings(userRole));
  }, [usecaseUIProps.queryParams, dispatch, isStatusAPIcalled]);
  useEffect(() => {
    handleFilterUsecase();
    // eslint-disable-next-line
  }, [entities]);





  return (
      <>
      <Card className="example example-compact" style={{ minHeight: "300px" }}>
        <CardBody style={{ minHeight: "300px", padding: "10px 10px" }}>
          <Row className="align-items-center">
            {/* Left side - Title */}
            <Col xs={12} sm={12} md={6} lg={6} xl={6} className="mb-2 mb-md-0">
              <CardHeader title="UseCase Mapping Details"/>
            </Col>

            {/* Right side - Search and Button */}
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                {/* Search Text */}
                <div className="mr-1 mb-2">
                  <SearchText
                      reference={searchInput}
                      onChangeHandler={handleFilterUsecase}
                      placeholder={"Search For Usecase Name ,Location Name, Camera Name"}
                  />
                </div>

                {userRole === SUPER_ADMIN_ROLE && (
                    <Button
                        className="mr-3 mb-2"
                        color="primary"
                        onClick={usecaseUIProps.newUsecaseButtonClick}
                    >
                      Add UseCase Mapping
                    </Button>
                )}
              </div>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col xl={12} style={{ padding: "10px 20px", minWidth: "300px" }}>
              {/*<UsecaseTable />*/}
              <>
                {currentItems?.length > 0 ? (
                    <PaginationProvider
                        pagination={paginationFactory(
                            getPaginationOptions(
                                filterEntities?.length,
                                usecaseUIProps.queryParams
                            )
                        )}
                    >
                      {({paginationProps, paginationTableProps}) => {
                        return (
                            <Pagination
                                isLoading={listLoading}
                                paginationProps={paginationProps}
                            >
                              <BlockUi tag="div" blocking={listLoading} color="#147b82">
                                <div style={{ flex: 1, height: "calc(100vh - 365px)",overflowX:"auto" }}>
                                  <AutoServingTable
                                      columns={columns}
                                      items={currentItems}
                                      tableChangeHandler={usecaseUIProps.setQueryParams}
                                      paginationTableProps={paginationTableProps}
                                  />
                                </div>
                                <SweetAlert
                                    // info={!isSuccess}
                                    showCancel={true}
                                    showConfirm={true}
                                    confirmBtnText="Confirm"
                                    confirmBtnBsStyle="primary"
                                    cancelBtnBsStyle="light"
                                    cancelBtnStyle={{color: "black"}}
                                    title={"Are you sure ?"}
                                    onConfirm={handleConfirm}
                                    onCancel={handleCancel}
                                    show={showAlert}
                                    focusCancelBtn
                                />
                              </BlockUi>
                            </Pagination>
                        );
                      }}
                    </PaginationProvider>
                ) : (
                    <div
                        style={{
                          minHeight: "calc(100vh - 365px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                    >
                      <h3 className="text-center mb-0">No Data Found</h3>
                    </div>

                )}
              </>
            </Col>
          </Row>
        </CardBody>
      </Card>

        {showBarTable &&
            <FetchViolationModal
                showBarTableData={showBarTable}
                tableDatas={popupData}
                handleCloseModal={handleCloseModal}
            />}
    </>
  );
}
