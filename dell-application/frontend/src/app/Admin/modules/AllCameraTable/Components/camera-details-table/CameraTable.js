import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import paginationFactory, {PaginationProvider} from "react-bootstrap-table2-paginator";
import {
    entityFilter,
    getFilteredAndPaginatedEntities,
    getPaginationOptions,
    headerSortingClasses,
    sortCaret
} from "../../../../../../_metronic/_helpers";
import * as columnFormatters from "./column-formatters";
import {Card, CardBody, Pagination} from "../../../../../../_metronic/_partials/controls";
import {useCameraUIContext} from "../CameraUIContext";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import * as actions from "../../_redux/CameraAction";
import {SearchText} from "../../../../../../utils/SearchText";
import {AutoServingTable} from "../../../../../../utils/AutoServingTable";
import {updateRtspStatus} from "../../_redux/CameraAPI";
import {successToast, warningToast} from "../../../../../../utils/ToastMessage";
import SweetAlert from "react-bootstrap-sweetalert";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import * as moment from "moment";
import {Button, Col, Row} from "reactstrap";
import {CardHeader} from "@mui/material";
import {SUPER_ADMIN_ROLE} from "../../../../../../enums/constant";
import FetchViolationModal from "../../../../../../utils/FetchViolationModal";
import * as action from "../../../Locations/_redux/LocationAction";


export default function CameraTable() {
    const [showBarTable, setShowBarTable] = useState(false);

    const cameraUIContext = useCameraUIContext();
    const cameraUIProps = useMemo(() => ({
        ...cameraUIContext,
        newCameraButtonClick: cameraUIContext.openNewCameraDialog,
    }), [cameraUIContext]);

    const {userRole} = useSelector(
        ({auth}) => ({
            userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
        }),
        shallowEqual
    );
    const columns = [
        {
            dataField: "idx",
            text: "Index",
            sort: true,
            sortCaret: sortCaret,
            headerSortingClasses,
            style: {
                minWidth: "55px"
            }
        },
        {
            dataField: "location_details",
            text: "Location Name",
            sort: true,
            sortCaret: sortCaret,
            headerSortingClasses,
            formatter: (_, row) =>
                row?.location_details?.location_name,
            style: {
                minWidth: "165px"
            }
        },
        {
            dataField: "camera_name",
            text: "Camera Name",
            sort: true,
            sortCaret: sortCaret,
            headerSortingClasses,
            style: {
                minWidth: "165px"
            }
        },
        {
            dataField: "created_date",
            text: "Created Date",
            sort: true,
            sortCaret: sortCaret,
            headerSortingClasses,
            // formatter: dateTimeFormatter,
            formatter: (_, row) =>
                moment
                    .utc(row?.created_date)
                    .local()
                    .format("MMMM DD YYYY, h:mm:ss a"),

            style: {
                minWidth: 180
            }
        },
        {
            dataField: "updated_date",
            text: "Updated Date",
            sort: true,
            sortCaret: sortCaret,
            headerSortingClasses,
            formatter: (_, row) =>
                moment
                    .utc(row?.updated_date)
                    .local()
                    .format("MMMM DD YYYY, h:mm:ss a"),

            style: {
                minWidth: 180
            }
        },
        {
            dataField: "action",
            text: "Actions",
            style: {
                minWidth: "150px"
            },
            formatter: columnFormatters.ActionsColumnFormatter,
            formatExtraData: {
                changeCameraStatus: ShowAlert,
                userRole:userRole,
                openEditCameraDialog: cameraUIProps.openEditCameraDialog,
                openVideoInferenceCameraDialog:cameraUIProps.openVideoInferenceCameraDialog,
            }
        }
    ];


    const [isStatusAPIcalled, setIsStatusAPIcalled] = React.useState(false);

    function changeCameraStatusFunction(row) {
        let cameraId = row.id;
        let statusValue = !row.status;
        let statusType = "status";
        updateRtspStatus(cameraId, statusType, statusValue)
            .then(response => {
                if (response && response.isSuccess) {
                    setIsStatusAPIcalled(!isStatusAPIcalled);
                    successToast(response.data.message);
                    setShowAlert(false);
                }
            })
            .catch(error => {
                setShowAlert(false);
                setIsStatusAPIcalled(!isStatusAPIcalled);
                if (error.detail) {
                    warningToast(error.detail);
                } else {
                    warningToast("Something went Wrong");
                }
            });
    }


    const {currentState ,popupData} = useSelector(
        state => ({
            currentState: state.camera,
            popupData: state.location?.popupData,
        }),
        shallowEqual
    );


    const { entities = [], listLoading = false } = currentState;

    const [filterEntities, setFilterEntities] = useState(entities);
    const [showAlert, setShowAlert] = useState(false);
    const [row, setRow] = useState();
    const searchInput = useRef("");
    let currentItems = getFilteredAndPaginatedEntities(
        filterEntities || entities,
        cameraUIProps.queryParams
    );

    const handleCloseModal = useCallback(() =>{
        dispatch(action.clearPopupDataAction())
        setShowBarTable(false)
    },[])

    useEffect(() => {
        if(popupData.length > 0){
            setShowBarTable(true)
        }else {
            setShowBarTable(false)
        }
    }, [popupData]);

    const filterCamera = useCallback(e => {
        if (entities.length > 0) {
            const searchStr = (e?.target?.value || searchInput.current.value || "").trim();
            const keys = ["id", "camera_name"];
            currentItems = entityFilter(
                entities || filterEntities,
                searchStr,
                keys,
                cameraUIProps.queryParams,
                setFilterEntities
            );
        }
    },[entities, filterEntities, cameraUIProps.queryParams]);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(actions.getAllCameras(userRole));
    }, [cameraUIProps.queryParams, dispatch, isStatusAPIcalled]);
    useEffect(() => {
        filterCamera();
        // eslint-disable-next-line
    }, [entities]);

    const toggleShowAlert = () => {
        setShowAlert(false);
    };

    function ShowAlert(row) {
        setShowAlert(true);
        setRow(row);
    }

    const handleConfirm = useCallback(() => {
        changeCameraStatusFunction(row);
    }, [row]);

    const handleCancel = useCallback(() => {
        toggleShowAlert();
    }, [toggleShowAlert]);
    return (
        <>
            <Card className="example example-compact" style={{ minHeight: "300px" }}>
                <CardBody style={{ minHeight: "300px", padding: "10px 10px" }}>

                    <Row className="align-items-center">
                        {/* Left side - Title */}
                        <Col xs={12} sm={12} md={6} lg={6} xl={6} className="mb-2 mb-md-0">
                            <CardHeader title="Camera Details"/>
                        </Col>

                        {/* Right side - Search and Button */}
                        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
                            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
                                {/* Search Text */}
                                <div className="mr-1 mb-2">
                                    <SearchText
                                        reference={searchInput}
                                        onChangeHandler={filterCamera}
                                        placeholder={"Search For Camera Name"}
                                    />
                                </div>

                                {userRole === SUPER_ADMIN_ROLE && (
                                    <Button
                                        className="mr-3 mb-2"
                                        color="primary"
                                        onClick={cameraUIProps.newCameraButtonClick}
                                    >
                                        Add Camera
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                    <hr />
                    <Row>
                        <Col xl={12} style={{ padding: "10px 20px", minWidth: "300px" }}>
            {currentItems?.length > 0 ? (
                <PaginationProvider
                    pagination={paginationFactory(
                        getPaginationOptions(
                            filterEntities?.length,
                            cameraUIProps.queryParams
                        )
                    )}
                >
                    {({paginationProps, paginationTableProps}) => {
                        return (
                            <Pagination
                                isLoading={listLoading}
                                paginationProps={paginationProps}
                            >
                                <div style={{ flex: 1, height: "calc(100vh - 365px)",overflowX: "auto" }}>
                                <BlockUi tag="div" blocking={listLoading} color="#147b82">
                                    <AutoServingTable
                                        columns={columns}
                                        items={currentItems}
                                        tableChangeHandler={cameraUIProps.setQueryParams}
                                        paginationTableProps={paginationTableProps}
                                    />
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
                                </div>
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
