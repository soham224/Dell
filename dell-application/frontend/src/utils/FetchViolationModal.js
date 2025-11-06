import React, {useState, useEffect, useCallback} from "react";
import BootstrapTable from "react-bootstrap-table-next";
import {Button} from "reactstrap";
import {Col, Modal, Row, Tab, Tabs} from "react-bootstrap";
import * as moment from "moment";
import {getTotalCamerasByLocationId} from "../app/Admin/modules/DashboardGraph/_redux";
import {withStyles} from "@mui/styles";
import {shallowEqual, useSelector} from "react-redux";
import {convertToTitleCase} from "./stringConvert";
import ZoomInOutFunctionImage from "./ZoomInOutFunctionImage";
import ZoomInOutFunctionVideo from "./ZoomInOutFunctionVideo";


const styles = theme => ({
    card: {
        maxWidth: 416, height: "100%", margin: "auto"
    }, media: {
        height: 230
    }, header: {
        paddingBottom: "0rem"
    }, learnMore: {
        position: "absolute", bottom: 0
    }, cardCol: {
        height: 220, marginTop: 25, marginBottom: 15
    }
});

const FetchViolationModal = ({tableDatas, showBarTableData, handleCloseModal}) => {
    const [columns, setColumns] = useState(null);
    const [data, setData] = useState([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [cameraOptions, setCameraOptions] = useState([]);
    const [activeTab, setActiveTab] = useState("images");
    const {userRole} = useSelector(
        ({auth}) => ({
            userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
        }),
        shallowEqual
    );
    useEffect(() => {
        getTotalCamerasByLocationIds()
    }, [userRole]);


    const getTotalCamerasByLocationIds = () => {
        getTotalCamerasByLocationId(['-1'] , userRole)
            .then(res => {
                if (res && res.isSuccess) {
                    let cameraOptions = [];

                    res.data.map((item, index) => {
                        cameraOptions.push({label: item.camera_name, value: item.id});
                        return null;
                    });
                    cameraOptions.push({label: "All Camera", value: '-1'});
                    setCameraOptions(cameraOptions);
                } else {
                    this.setState({blocking: false});
                    console.log("Something went wrong");
                }
            })
            .catch(error => {
                if (error.detail) {
                   console.log(error.detail);
                }
            });
    }


    useEffect(() => {
        if (cameraOptions) {
            initializeColumns();
            getColumnsAndData();
        }
    }, [currentFrameIndex,currentVideoIndex ,  tableDatas, cameraOptions]);



    const initializeColumns = () => {
        let cols = [];

        cols = [
            {dataField: "camera_name", text: "Camera"},
            {dataField: "count", text: "Count"},
            {dataField: "date", text: "Date"},
            {
                dataField: "labels",
                text: "Labels",
                formatter: (cell) => {
                    if (!cell) return "";
                    return cell
                        .split(",")
                        .map(label => convertToTitleCase(label.trim()))
                        .join(", ");
                }
            }
        ];


        setColumns(cols);
    };

    const getColumnsAndData = () => {
        if (!tableDatas.length) return;

        const frame = activeTab === 'images' ?  tableDatas[currentFrameIndex] :   tableDatas[currentVideoIndex];
        let newData = [];
        const cameraValue = cameraOptions.find(camera => String(camera.value) === frame?.camera_id);
        const camera_name = cameraValue?.label || "Unknown Camera";
        const count = frame?.result?.detection?.length || 0;
        const date = moment.utc(frame?.frame_date?.$date).local().format("MMMM DD YYYY, h:mm:ss a");
        const labels = Object.keys(frame?.counts || {}).toString();
        const notification_type = "tusker";
        newData.push({camera_name, count, date, labels, notification_type});

        setData(newData);
    };

    const handleNextFrame = useCallback(() => {
        setCurrentFrameIndex(prevIndex => Math.min(prevIndex + 1, tableDatas.length - 1));
    }, [tableDatas.length]);

    const handlePrevFrame = useCallback(() => {
        setCurrentFrameIndex(prevIndex => Math.max(prevIndex - 1, 0));
    }, []);

    const handleNextVideo = useCallback(() => {
        setCurrentVideoIndex(prevIndex => Math.min(prevIndex + 1, tableDatas.length - 1));
    }, [tableDatas.length]);

    const handlePrevVideo = useCallback(() => {
        setCurrentVideoIndex(prevIndex => Math.max(prevIndex - 1, 0));
    }, []);


    const handleTabSelect = useCallback((key) => {
        setActiveTab(key);
    }, []);

    return (
        <Modal
            size="lg"
            show={showBarTableData}
            onHide={handleCloseModal}
            dialogClassName="result-modal"
        >
            <Modal.Header closeButton>
                <h3>
                    My Result Details
                </h3>
            </Modal.Header>

            <Modal.Body>
                <Tabs
                    activeKey={activeTab}
                    onSelect={handleTabSelect}
                    id="media-tabs"
                    className="mb-3"
                >
                    {/* Images Tab */}
                    <Tab eventKey="images" title="Images">
                <>
                    {data.length > 0 ? (
                        <BootstrapTable
                            bootstrap4
                            keyField="id"
                            data={data}
                            columns={columns}
                            bordered={false}
                            wrapperClasses="table-responsive"
                        />
                    ) : (
                        <p>No data available</p>
                    )}
                    <ZoomInOutFunctionImage
                        currentFrameIndex={currentFrameIndex}
                        tableData={tableDatas}
                        handleNext={handleNextFrame}
                        handlePrev={handlePrevFrame}
                        imageUrl={tableDatas[currentFrameIndex]?.image_url}
                        isNextPrev={true}
                    />
                </>
                    </Tab>
                    <Tab eventKey="video" title="Video">
                        {data.length > 0 ? (
                            <BootstrapTable
                                bootstrap4
                                keyField="id"
                                data={data}
                                columns={columns}
                                bordered={false}
                                wrapperClasses="table-responsive"
                            />
                        ) : (
                            <p>No data available</p>
                        )}
                        {tableDatas && tableDatas[currentVideoIndex]?.video_url ? (
                            <ZoomInOutFunctionVideo
                                currentFrameIndex={currentVideoIndex}
                                tableData={tableDatas}
                                handleNext={handleNextVideo}
                                handlePrev={handlePrevVideo}
                                videoUrl={tableDatas[currentVideoIndex]?.video_url}
                                isNextPrev={true}
                            />
                        ) : (
                            <p className="text-center">No video available for this frame.</p>
                        )}
                    </Tab>
                </Tabs>
            </Modal.Body>

            <Modal.Footer>
                <Row className="w-100">
                    <Col xs={6}>
                        <span>
                            {activeTab === 'images' ?
                                <>Frame {currentFrameIndex + 1} of {tableDatas.length}</>
                                :
                                <>Video {currentVideoIndex + 1} of {tableDatas.length}</>
                            }

                        </span>
                    </Col>
                    <Col xs={6} className="text-right">
                        <Button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn btn-secondary ml-2"
                        >
                            Cancel
                        </Button>
                    </Col>
                </Row>
            </Modal.Footer>
        </Modal>
    );
};

export default withStyles(styles)(FetchViolationModal);