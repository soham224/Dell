import React, {useCallback, useEffect, useRef, useState} from "react";
import { Col, Row } from "react-bootstrap";
import {CardBody, CardHeader} from "../../../../../../_metronic/_partials/controls";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { makeStyles } from "@mui/styles";
import { Card } from "reactstrap";
import { useNavigate, useParams } from "react-router-dom";
import UsecaseTableModal from "./UsecaseTableModal";
import {
    entityFilter,
    getFilteredAndPaginatedEntities,
    headerSortingClasses,
    sortCaret,
    toAbsoluteUrl,
} from "../../../../../../_metronic/_helpers";
import * as action from "../../_redux/ModalCategoryAction";
import { SUPER_ADMIN_ROLE } from "../../../../../../enums/constant";
import { Switch } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ModalCategoryEditModal from "./ModalCategoryEditModal";
import SVG from "react-inlinesvg";
import SweetAlert from "react-bootstrap-sweetalert";
import { updateCameraUsecaseMapping } from "../../../Usecase/_redux/UsecaseAPI";
import { successToast, warningToast } from "../../../../../../utils/ToastMessage";
import ModalCategoryRoiViewModal from "./ModalCategoryRoiViewModal";
import { ArrowBack } from "@mui/icons-material";
import modelData from "./../model/modalData.json";
import * as actions from "../../../Usecase/_redux/UsecaseAction";

const useStyles = makeStyles(() => ({
    header: {
        paddingBottom: 0,
    },
    title: {
        display: "inline-flex",
        margin: "1rem 0",
    },
}));

function ActionFormatter(openEditUsecase, handleShowAlert, userRole) {
    return function(cell, row) {
        function handleSwitchChange(row) {
            return () => handleShowAlert(row);
        }
        function handleEditClick() {
            openEditUsecase(row?.CameraUseCaseMapping?.id);
        }
        return (
            <>
                <a
                    title="Edit Usecase Mapping"
                    className="btn btn-icon btn-light btn-hover-primary btn-sm mx-3"
                    onClick={handleEditClick}
                    style={{ cursor: "pointer" }}
                >
                    <span className="svg-icon svg-icon-md svg-icon-primary">
                        <SVG title="Edit Usecase Mapping Details" src={toAbsoluteUrl("/media/svg/icons/Communication/Write.svg")} />
                    </span>
                </a>
                <Switch
                    color="primary"
                    checked={row?.CameraUseCaseMapping?.status}
                    onChange={handleSwitchChange(row)}
                    name="usecaseStatus"
                    disabled={userRole !== SUPER_ADMIN_ROLE}
                />
            </>
        );
    };
}

function RoiActionFormatter(openViewRoi) {
    return function(cell, row) {
        return (
            <a
                title="View ROI"
                className="btn btn-icon btn-light btn-sm mx-3"
                onClick={() => openViewRoi(row?.CameraUseCaseMapping?.id)}
                style={{ cursor: "pointer" }}
            >
                <VisibilityIcon color="action" style={{ fontSize: "2rem", color: "#147b82" }} />
            </a>
        );
    };
}

export default function Model() {
    const { id } = useParams();
    const classes = useStyles();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [model, setModel] = useState({});
    const [imageURL, setImageURL] = useState("");
    const [activeId, setActiveId] = useState(-1);
    const [modalShow, setModalShow] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [usecaseId, setUsecaseId] = useState(null);
    const [roiModal, setRoiModal] = useState(false);
    const [roiDetails, setRoiDetails] = useState(null);

    const [filterEntities, setFilterEntities] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const searchInput = useRef(null);

    const [page, setPage] = useState(1);
    const [sizePerPage, setSizePerPage] = useState(5);

    const [queryParams, setQueryParams] = useState({ pageNumber: 1, pageSize: 5 });
    const [isStatusAPIcalled, setIsStatusAPIcalled] = useState(false);

    // Redux state
    const { entities = [], listLoading = false } = useSelector(
        (state) => state.modalCategory || {},
        shallowEqual
    );

    const { userRole } = useSelector(
        ({ auth }) => ({
            userRole: auth.user?.roles?.length ? auth.user.roles[0]?.role : null,
        }),
        shallowEqual
    );

    // Load model data on mount or id change
    useEffect(() => {
        if (modelData?.length) {
            const found = modelData.find((m) => String(m.id) === String(id));
            if (found) {
                setModel(found);
                setImageURL(found.model_result_img?.[0]?.image_url || "");
                setActiveId(0);
            }
        }
    }, [id]);

    // Fetch camera usecase mappings whenever id or status toggled
    useEffect(() => {
        dispatch(action.getCameraUsecaseMAppingByUSeCaseIdes(id));
    }, [dispatch, id, isStatusAPIcalled]);

    // Filter entities on search or when entities change
    useEffect(() => {
        if (searchInput.current?.value) {
            setFilterEntities(entityFilter(entities, searchInput.current.value));
        } else {
            setFilterEntities(entities);
        }
    }, [entities]);

    const totalSize = filterEntities.length;
    const currentItems = getFilteredAndPaginatedEntities(filterEntities, queryParams);

    const handleClickImage = (e, url) => {
        setActiveId(parseInt(e.target.id, 10));
        setImageURL(url);
    };

    const handleModalOpen = React.useCallback(() => setModalShow(true), []);
    const handleModalClose = React.useCallback(() => setModalShow(false), []);
    const handleEditUsecaseClose = React.useCallback(() => setEditModal(false), []);
    const handleViewRoiClose = React.useCallback(() => {
        dispatch(actions.clearUsecaseByIdAction());
        setRoiModal(false);
    }, [dispatch]);
    const handlePageChange = React.useCallback((newPage, newSizePerPage) => {
        setPage(newPage);
        setSizePerPage(newSizePerPage);
        setQueryParams({ pageNumber: newPage, pageSize: newSizePerPage });
    },[]);

    const handleConfirm = React.useCallback(() => {
        changeUsecaseStatusFunction(selectedRow);
    }, [selectedRow]);
    const handleShowAlert = (row) => {
        setShowAlert(true);
        setSelectedRow(row);
    };

    const toggleShowAlert = useCallback(() => setShowAlert(false),[]);

    const openEditUsecase = (id) => {
        setEditModal(true);
        setUsecaseId(id);
    };

    const openViewRoi = (id) => {
        setRoiModal(true);
        setRoiDetails(id);
    };

    const changeUsecaseStatusFunction = (row) => {
        const usecaseStatus = {
            id: row?.CameraUseCaseMapping?.id,
            status: !row?.CameraUseCaseMapping?.status,
        };

        updateCameraUsecaseMapping(usecaseStatus)
            .then((response) => {
                if (response?.isSuccess) {
                    setIsStatusAPIcalled((prev) => !prev);
                    successToast(response?.data?.message);
                    setShowAlert(false);
                }
            })
            .catch((error) => {
                setShowAlert(false);
                setIsStatusAPIcalled((prev) => !prev);
                warningToast(error.detail || "Something went wrong");
            });
    };

    const columns = [
        {
            dataField: "idx",
            text: "Index",
            sort: true,
            headerSortingClasses,
        },
        {
            dataField: "Location",
            text: "Location Name",
            sort: true,
            sortCaret,
            headerSortingClasses,
            formatter: (_, row) => row?.Location?.location_name,

        },
        {
            dataField: "CameraManager",
            text: "Camera Name",
            sort: true,
            sortCaret,
            headerSortingClasses,
            formatter: (_, row) => row?.CameraManager?.camera_name,
        },
        {
            dataField: "UseCase",
            text: "Usecase Name",
            sort: true,
            sortCaret,
            headerSortingClasses,
            formatter: (_, row) => row?.UseCase?.usecase,

        },
        {
            dataField: "CameraUseCaseMapping",
            text: "Time Before Event",
            sort: true,
            sortCaret,
            headerSortingClasses,
            formatter: (_, row) =>
                row?.CameraUseCaseMapping?.second_before_event,

        },
        {
            dataField: "CameraUseCaseMapping",
            text: "Time After Event",
            sort: true,
            sortCaret,
            headerSortingClasses,
            formatter: (_, row) =>
                row?.CameraUseCaseMapping?.second_after_event,

        },
        {
            dataField: "CameraUseCaseMapping",
            text: "Timeout",
            sort: true,
            sortCaret,
            headerSortingClasses,
            formatter: (_, row) => row?.CameraUseCaseMapping?.usecase_timeout,

        },
        {
            dataField: "action",
            text: "Actions",
            formatter: ActionFormatter(openEditUsecase, handleShowAlert, userRole),
        },
        {
            dataField: "roiAction",
            text: "ROI",
            formatter: RoiActionFormatter(openViewRoi),
        }
    ];


    const handleBackMainPage = useCallback(() => {
        navigate("/admin/model-categories/view");
    },[]);

    return (
        <>

            <Card className="example example-compact">
                <BlockUi tag="div" blocking={false} color="#147b82">
                    <CardHeader
                        title={model?.model_name}
                        headerClassName={classes.header}
                        className={classes.title}
                        icon={<ArrowBack onClick={handleBackMainPage} style={{ color: "#147b82", cursor: "pointer", marginRight: 5 }} />}
                    />
                    <CardBody>
                        <div className={''}>{model?.model_description}</div>
                        <div className="separator separator-dashed my-3" />
                        <div>
                            <img
                                style={{ height: 500 }}
                                className="d-block w-100"
                                src={
                                    imageURL ||
                                    "https://www.iotforall.com/wp-content/uploads/2018/02/Coming-Soon-to-a-Hotel-Near-You-AI-for-Building-Maintenance-696x428.jpg"
                                }
                                alt="Model Sample"
                            />
                        </div>
                        <Row className="mt-4">
                            <Col xl={6} xs={12} md={12} className="vertical mt-2">
                                <p style={{ fontWeight: "bold", fontSize: 15 }}>Choose a Sample Image</p>
                                <p style={{ fontSize: 12 }}>Try our sample Images for detection.</p>
                                {model?.model_result_img?.map((img,index) => (
                                    <>
                                    <img
                                        key={img.image_url}
                                        className={activeId === index ? "my-image" : "my-images"}
                                        style={{ height: 110, width: 110, cursor: "pointer" }}
                                        id={index}
                                        onClick={(e) => handleClickImage(e, img.image_url)}
                                        src={img?.image_url}
                                        alt={`Sample ${index + 1}`}
                                    />
                                    </>
                                ))}
                            </Col>
                            <Col xl={6} xs={12} md={12} lg={12} sm={12}>
                                <div className="d-flex justify-content-around" style={{ padding: "8%" }}>
                                    <button type="button" onClick={handleModalOpen} className="btn btn-primary font-weight-bold font-size-h6">
                                        Usecase Details View
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </BlockUi>
            </Card>

            {modalShow && (
                <UsecaseTableModal
                    show={modalShow}
                    closeModal={handleModalClose}
                    currentItems={currentItems}
                    filterEntities={filterEntities}
                    listLoading={listLoading}
                    columns={columns}
                    totalSize={totalSize}
                    page={page}
                    sizePerPage={sizePerPage}
                    onPageChange={handlePageChange}
                    modalcategoryId={id}
                    queryParams={queryParams}
                    setQueryParams={setQueryParams}
                    className={`custom-usecase-modal ${editModal || roiModal ? 'lower-z-index' : ''}`}
                />
            )}

            <SweetAlert
                showCancel
                showConfirm
                confirmBtnText="Confirm"
                confirmBtnBsStyle="primary"
                cancelBtnBsStyle="light"
                cancelBtnStyle={{ color: "black" }}
                title="Are you sure?"
                onConfirm={handleConfirm}
                onCancel={toggleShowAlert}
                show={showAlert}
                focusCancelBtn
            />

            {editModal && <ModalCategoryEditModal onHide={handleEditUsecaseClose} usecaseId={usecaseId} show={editModal}  className="sub-modal"/>}

            {roiModal && <ModalCategoryRoiViewModal onHide={handleViewRoiClose} roiId={roiDetails} show={roiModal}  className="sub-modal"/>}
        </>
    );
}
