import React, {useCallback, useEffect, useState} from "react";
import {Col, Modal, Tab, Tabs, Row} from "react-bootstrap";
import {shallowEqual, useSelector} from "react-redux";
import {warningToast} from "../../../../../../../../utils/ToastMessage";
import BootstrapTable from "react-bootstrap-table-next";
import moment from "moment";
import {Button} from "reactstrap";
import {convertToReadableString} from "../../../../../../../../utils/stringConvert";
import ZoomInOutFunctionImage from "../../../../../../../../utils/ZoomInOutFunctionImage";

export function MyResultViewDialog({id, show, onHide, row,cameraName}) {
    const [modalData, setModalData] = useState([]);
    const [activeTab, setActiveTab] = useState("images");
    const [myResultFetchedById, setMyResultFetchedById] = useState({});

    const columns = [
        {dataField: "camera_name", text: "camera"},
        {dataField: "count", text: "Count"},
        {dataField: "date", text: "Date"},
        {
            dataField: "labels",
            text: "Labels",
            formatter: (cell) => {
                if (!cell) return "";
                return cell
                    .split(",")
                    .map(label => convertToReadableString(label.trim()))
                    .join(", ");
            }
        }
    ];

    useEffect(() => {
        if (Object.keys(row).length > 0) {
            getColumnsAndData();
        }
        // eslint-disable-next-line
    }, [row]);

    const {entities} = useSelector(
        (state) => ({
            entities: state.myResult.entities,
        }),
        shallowEqual
    );

    useEffect(() => {
        if (id && entities) {
            const deployedRTSPJob = entities.filter((d) => d._id.$oid === id);
            if (deployedRTSPJob.length) {
                setMyResultFetchedById(deployedRTSPJob[0]);
            } else warningToast("No deployedRTSP job found with that id");
        }

        return () => setMyResultFetchedById({});
    }, [id, entities]);

    const getColumnsAndData = () => {
        let modal_data = [];
        let camera_name = cameraName[parseInt(row?.camera_id)];
        let count = row.result.detection.length;
        let Date = moment
            .utc(row.frame_date.$date)
            .local()
            .format("MMMM DD YYYY, h:mm:ss a");
        let labels = Object.keys(row.counts).toString();
        modal_data.push({
            camera_name,
            count,
            date: Date,
            labels,
        });
        setModalData(modal_data);
    };

    const handleTabSelect = useCallback((key) => setActiveTab(key), []);

    return (
        <Modal
            size="lg"
            show={show}
            onHide={onHide}
            dialogClassName="result-modal"
            aria-labelledby="example-modal-sizes-title-lg"
            style={{maxHeight: "-webkit-fill-available"}}
        >
            <Modal.Header closeButton>
                <Modal.Title id="example-modal-sizes-title-lg">
                    My Result Details
                </Modal.Title>
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
                        <Row>
                            <Col xl={12} xs={12} md={12} lg={12} sm={12} className="mt-2">
                                {row && modalData && (
                                    <BootstrapTable
                                        classes="table table-head-custom table-vertical-center overflow-hidden mt-3"
                                        bootstrap4
                                        wrapperClasses="table-responsive"
                                        keyField="label"
                                        bordered={false}
                                        data={modalData}
                                        columns={columns}
                                    />
                                )}
                            </Col>
                            <Col xl={12} xs={12} md={12} lg={12} sm={12}>
                                <ZoomInOutFunctionImage
                                    imageUrl={myResultFetchedById?.image_url}
                                />
                            </Col>
                        </Row>
                    </Tab>

                    {/* Video Tab */}
                    <Tab eventKey="video" title="Video">
                        <Row>
                            <Col xl={12} xs={12} md={12} lg={12} sm={12} className="mt-2">
                                {row && modalData && (
                                    <BootstrapTable
                                        classes="table table-head-custom table-vertical-center overflow-hidden mt-3"
                                        bootstrap4
                                        wrapperClasses="table-responsive"
                                        keyField="label"
                                        bordered={false}
                                        data={modalData}
                                        columns={columns}
                                    />
                                )}
                            </Col>
                            <Col xl={12} xs={12} md={12} lg={12} sm={12}>
                                {myResultFetchedById && myResultFetchedById.video_url ? (
                                    <div className="text-center">
                                        <video
                                            width="100%"
                                            height="auto"
                                            controls
                                            style={{maxHeight: "100vh", borderRadius: "0px"}}
                                        >
                                            <source src={myResultFetchedById.video_url} type="video/mp4"/>
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                ) : (
                                    <p className="text-center">No video available for this frame.</p>
                                )}
                            </Col>
                        </Row>

                    </Tab>
                </Tabs>
            </Modal.Body>
            <Modal.Footer>
                <Button color={"secondary"} onClick={onHide}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
