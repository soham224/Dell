import React from "react";
import BootstrapTable from "react-bootstrap-table-next";
import {Col,  Row} from "react-bootstrap";
import * as moment from "moment";
import {withStyles} from "@mui/styles";
import {clearPopupDataAction} from "../Locations/_redux/LocationAction";
import {connect} from "react-redux";
import {getTotalCamerasByLocationId} from "./_redux";
import {convertToReadableString} from "../../../../utils/stringConvert";
import Boundingbox from "image-bounding-box-custom";
import {TransformComponent, TransformWrapper} from "react-zoom-pan-pinch";
import CustomFrameControls from "../../../../utils/CustomFrameControls";
import CommonModal from "../../../../utils/CommonModal";
import {CardMedia} from "@mui/material";

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

class DashboardTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tableData: props.tableData || [],
            showBarTable: props.showBarTable,
            dashboardGraphName: props.dashboardGraphName,
            columns: null,
            data: [],
            viewImageModal: false,
            cameraData: [],
            currentFrameIndex: 0,
            currentVideoIndex: 0,
            imageLoaded: false,
            activeTab: "images"
        };
    }


    componentDidMount() {
        this.getTotalCamerasByLocationIds()
        this.initializeColumns();
    }

    getTotalCamerasByLocationIds = () => {
        const {user} = this.props;
        getTotalCamerasByLocationId(['-1'], user?.roles[0]?.role)
            .then(res => {
                if (res && res.isSuccess) {
                    let cameraOptions = res.data.map(item => ({
                        label: item.camera_name,
                        value: item.id,
                    }));

                    cameraOptions.push({label: "All Camera", value: '-1'});

                    this.setState({cameraData: cameraOptions}, () => {
                        this.getColumnsAndData(); // <-- Called after cameraData is ready
                    });
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
    };


    componentDidUpdate(prevProps, prevState) {
        if (prevState.currentFrameIndex !== this.state.currentFrameIndex) {
            this.setState({imageLoaded: false});
        }
        else if(prevState.currentVideoIndex !== this.state.currentVideoIndex) {
            this.setState({imageLoaded: false});
        }
    }

    initializeColumns = () => {
        let columns = [];

        if (this.props.dashboardGraphName === "Label") {
            columns = [
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
                            .map(label => convertToReadableString(label.trim()))
                            .join(", ");
                    }
                }
            ];
        } else {
            columns = [
                {dataField: "event_name", text: "Event"},
                {dataField: "event_type", text: "Event Type"},
                {dataField: "event_desc", text: "Event Description"},
                {dataField: "camera_name", text: "Camera Name"},
                {dataField: "event_date", text: "Event Date"},
            ];
        }

        this.setState({columns});
    };

    getColumnsAndData = () => {
        const {currentFrameIndex, tableData, cameraData ,activeTab ,currentVideoIndex} = this.state;
        if (!tableData.length) return;

        const frame = activeTab === "images" ? tableData[currentFrameIndex] : tableData[currentVideoIndex];
        let data = [];

        const cameraObj = cameraData.find(cam => cam.value.toString() === frame?.camera_id?.toString());
        const camera_name = cameraObj ? cameraObj.label : "Unknown Camera";

        const count = frame?.result?.detection?.length || 0;
        const date = moment
            .utc(frame?.frame_date?.$date)
            .local()
            .format("MMMM DD YYYY, h:mm:ss a");
        const labels = Object.keys(frame?.counts || {}).toString();

        data.push({camera_name, count, date, labels});

        this.setState({data});
    };

    handleNextFrame = () => {
        this.setState(
            prevState => ({
                currentFrameIndex: Math.min(prevState.currentFrameIndex + 1, prevState.tableData.length - 1),
                imageLoaded: false
            }),
            this.getColumnsAndData
        );
    };


    handlePrevFrame = () => {
        this.setState(
            prevState => ({
                currentFrameIndex: Math.max(prevState.currentFrameIndex - 1, 0),
                imageLoaded: false
            }),
            this.getColumnsAndData
        );
    };

    handleNextVideo = () => {
        this.setState(
            prevState => ({
                currentVideoIndex: Math.min(prevState.currentVideoIndex + 1, prevState.tableData.length - 1),
                imageLoaded: false
            }),
            this.getColumnsAndData
        );
    };


    handlePrevVideo = () => {
        this.setState(
            prevState => ({
                currentVideoIndex: Math.max(prevState.currentVideoIndex - 1, 0),
                imageLoaded: false
            }),
            this.getColumnsAndData
        );
    };

    handleCloseModal = () => {
        this.setState({showBoundingBox: false, showBarTable: false}, () => {
            setTimeout(() => {
                this.props.clearPopupDataAction();
                // Reset for future opening
                this.setState({showBoundingBox: true});
            }, 300); // Allow React to unmount cleanly
        });
    };
    handleZoomIn = (fn) => () => fn();
    handleZoomOut = (fn) => () => fn();
    handleResetTransform = (fn) => () => fn();

    handleTabSelect = (key) => {
        this.setState({activeTab: key});
    }

    render() {
        const {columns, data, currentFrameIndex, tableData,
            // currentVideoIndex ,imageLoaded
        } = this.state;

        // const imageUrl = tableData[currentFrameIndex]?.image_url;
        // const videoUrl = tableData[currentVideoIndex]?.video_url;

        return (
            // <Modal
            //     size="lg"
            //     show={this.state.showBarTable}
            //     onHide={this.handleCloseModal}
            //     dialogClassName="result-modal"
            // >
            //     <Modal.Header closeButton>
            //         <h3>My Result Details</h3>
            //     </Modal.Header>
            //
            //     <Modal.Body>
            //         <Tabs
            //             activeKey={this.state.activeTab}
            //             onSelect={this.handleTabSelect}
            //             id="media-tabs"
            //             className="mb-3"
            //         >
            //             {/* Images Tab */}
            //             <Tab eventKey="images" title="Images">
            //                 <>
            //                     {data.length > 0 ? (
            //                         <BootstrapTable
            //                             bootstrap4
            //                             keyField="id"
            //                             data={data}
            //                             columns={columns}
            //                             bordered={false}
            //                             wrapperClasses="table-responsive"
            //                         />
            //                     ) : (
            //                         <p>No data available</p>
            //                     )}
            //
            //                     <ZoomInOutFunctionImage
            //                         currentFrameIndex={currentFrameIndex}
            //                         tableData={tableData}
            //                         handleNext={this.handleNextFrame}
            //                         handlePrev={this.handlePrevFrame}
            //                         imageUrl={imageUrl}
            //                         isNextPrev={true}
            //                     />
            //                 </>
            //             </Tab>
            //
            //             {/* Video Tab */}
            //             {/*<Tab eventKey="video" title="Video">*/}
            //             {/*    {data.length > 0 ? (*/}
            //             {/*        <BootstrapTable*/}
            //             {/*            bootstrap4*/}
            //             {/*            keyField="id"*/}
            //             {/*            data={data}*/}
            //             {/*            columns={columns}*/}
            //             {/*            bordered={false}*/}
            //             {/*            wrapperClasses="table-responsive"*/}
            //             {/*        />*/}
            //             {/*    ) : (*/}
            //             {/*        <p>No data available</p>*/}
            //             {/*    )}*/}
            //
            //             {/*   {videoUrl ? (*/}
            //             {/*        <ZoomInOutFunctionVideo*/}
            //             {/*            currentFrameIndex={currentVideoIndex}*/}
            //             {/*            tableData={tableData}*/}
            //             {/*            handleNext={this.handleNextVideo}*/}
            //             {/*            handlePrev={this.handlePrevVideo}*/}
            //             {/*            // videoUrl={videoUrl}*/}
            //             {/*            isNextPrev={true}*/}
            //             {/*        />*/}
            //             {/*    ) : (*/}
            //             {/*        <p className="text-center">No video available for this frame.</p>*/}
            //             {/*    )}*/}
            //             {/*</Tab>*/}
            //         </Tabs>
            //     </Modal.Body>
            //
            //     <Modal.Footer>
            //         <Row className="w-100">
            //             <Col xs={6}>
            //                 {this.state.activeTab === "images" && tableData?.length > 0 && typeof currentFrameIndex === "number" ? (
            //                         <span> Frame {currentFrameIndex + 1} of {tableData.length} </span> ):
            //                 (this.state.activeTab === "video" && tableData?.length > 0 && typeof currentVideoIndex === "number" && (
            //                         <span> Frame {currentVideoIndex + 1} of {tableData.length} </span>)
            //                 )}
            //             </Col>
            //             <Col xs={6} className="text-right">
            //                 <Button onClick={this.handleCloseModal} className="btn btn-secondary ml-2">
            //                     Cancel
            //                 </Button>
            //             </Col>
            //         </Row>
            //     </Modal.Footer>
            // </Modal>


            <CommonModal
                size="lg"
                show={this.state.showBarTable}
                handleClose={this.handleCloseModal}
                arialabelledby="example-modal-sizes-title-lg"
                title={"My Result Details a"}
                scrollable={false}
                closeButtonFlag={true}
                applyButton={false}
                content={
                    <>
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

                            {this.props.dashboardGraphName === "Label" ? (
                                <TransformWrapper
                                    defaultScale={1}
                                    defaultPositionX={200}
                                    defaultPositionY={100}
                                >
                                    {({zoomIn, zoomOut, resetTransform}) => (
                                        <>
                                            <div className="tools" style={{width: "100%", marginBottom: "4px"}}>
                                                <CustomFrameControls
                                                    zoomIn={zoomIn}
                                                    zoomOut={zoomOut}
                                                    className={"d-flex align-items-center justify-content-between"}
                                                    isFrame={true}
                                                    frameData={true}
                                                    resetTransform={resetTransform}
                                                    onPrev={this.handlePrevFrame}
                                                    onNext={this.handleNextFrame}
                                                    isFirstFrame={currentFrameIndex === 0}
                                                    isLastFrame={currentFrameIndex === tableData.length - 1}
                                                />
                                            </div>
                                            {console.log("tableData[currentFrameIndex]11", tableData[currentFrameIndex])}
                                            <div className="boundimage-full w-100" style={{margin: "0 auto"}}>
                                                <TransformComponent>
                                                    <Boundingbox
                                                        key={currentFrameIndex}
                                                        className="row m-auto col-12 p-0 text-center"
                                                        image={tableData[currentFrameIndex]?.image_url}
                                                        boxes={tableData[currentFrameIndex]?.result?.detection.map(d => ({
                                                            coord: [d.location[0], d.location[1], d.location[2] - d.location[0], d.location[3] - d.location[1]],
                                                            label:  d.label
                                                        }))}
                                                        showLabels={false}
                                                        options={{
                                                            colors: {
                                                                normal: "red", selected: "red", unselected: "red"
                                                            },
                                                            style: {
                                                                maxWidth: "100%",
                                                                maxHeight: "90vh",
                                                                margin: "auto",
                                                                width: 752,
                                                                color: "red",
                                                                height: 470
                                                            }
                                                        }}
                                                    />
                                                </TransformComponent>
                                            </div>
                                        </>
                                    )}
                                </TransformWrapper>
                            ) : (
                                <>
                                    {tableData[currentFrameIndex]?.image_list ? (
                                        <Row>
                                            {/* First Image */}
                                            <Col xl={6} md={6} sm={12} lg={6}>
                                                <TransformWrapper defaultScale={1} defaultPositionX={200}
                                                                  defaultPositionY={100}>
                                                    {({zoomIn, zoomOut, resetTransform}) => (
                                                        <>
                                                            <div className="tools"
                                                                 style={{width: "100%", marginBottom: "4px"}}>
                                                                <CustomFrameControls
                                                                    zoomIn={zoomIn}
                                                                    zoomOut={zoomOut}
                                                                    resetTransform={resetTransform}
                                                                    frameData={true}
                                                                />
                                                            </div>
                                                            {console.log("tableData[currentFrameIndex]", tableData[currentFrameIndex])}
                                                            <div className="boundimage-full w-100"
                                                                 style={{margin: "0 auto"}}>
                                                                <TransformComponent>
                                                                    <div className="mt-5 mb-5">
                                                                        <CardMedia style={{cursor: "pointer"}}
                                                                                   alt="Image Here 1">
                                                                            <Boundingbox
                                                                                className="row m-auto col-12 p-0 text-center"
                                                                                image={
                                                                                    tableData[currentFrameIndex]?.image_list[0]?.imageUrl ||
                                                                                    tableData[currentFrameIndex]?.image_list[0]
                                                                                }

                                                                                boxes={tableData[currentFrameIndex]?.result?.detection.map(d => ({
                                                                                    coord: [d.location[0], d.location[1], d.location[2] - d.location[0], d.location[3] - d.location[1]],
                                                                                    label:  d.label
                                                                                }))}
                                                                                options={{
                                                                                    colors: {
                                                                                        normal: "red",
                                                                                        selected: "red",
                                                                                        unselected: "red"
                                                                                    },
                                                                                    style: {
                                                                                        maxWidth: "100%",
                                                                                        maxHeight: "100vh",
                                                                                        margin: "auto",
                                                                                        width: "100vw",
                                                                                        color: "red",
                                                                                        height: 510
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </CardMedia>
                                                                    </div>
                                                                </TransformComponent>
                                                            </div>
                                                        </>
                                                    )}
                                                </TransformWrapper>
                                            </Col>

                                            {/* Last Image */}
                                            <Col xl={6} md={6} sm={12} lg={6}>
                                                <TransformWrapper defaultScale={1} defaultPositionX={200}
                                                                  defaultPositionY={100}>
                                                    {({zoomIn, zoomOut, resetTransform}) => (
                                                        <>
                                                            <div className="tools"
                                                                 style={{width: "100%", marginBottom: "4px"}}>
                                                                <CustomFrameControls
                                                                    zoomIn={zoomIn}
                                                                    zoomOut={zoomOut}
                                                                    resetTransform={resetTransform}
                                                                    frameData={true}
                                                                />
                                                            </div>
                                                            <div className="boundimage-full w-100"
                                                                 style={{margin: "0 auto"}}>
                                                                <TransformComponent>
                                                                    <div className="mt-5 mb-5">
                                                                        <CardMedia style={{cursor: "pointer"}}
                                                                                   alt="Image Here 2">
                                                                            <Boundingbox
                                                                                className="row m-auto col-12 p-0 text-center"
                                                                                image={
                                                                                    tableData[currentFrameIndex]?.image_list[
                                                                                    tableData[currentFrameIndex]?.image_list.length - 1
                                                                                        ]?.imageUrl ||
                                                                                    tableData[currentFrameIndex]?.image_list[
                                                                                    tableData[currentFrameIndex]?.image_list.length - 1
                                                                                        ]
                                                                                }
                                                                                options={{
                                                                                    colors: {
                                                                                        normal: "red",
                                                                                        selected: "red",
                                                                                        unselected: "red"
                                                                                    },
                                                                                    style: {
                                                                                        maxWidth: "100%",
                                                                                        maxHeight: "100vh",
                                                                                        margin: "auto",
                                                                                        width: "100vw",
                                                                                        color: "red",
                                                                                        height: 510
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </CardMedia>
                                                                    </div>
                                                                </TransformComponent>
                                                            </div>
                                                        </>
                                                    )}
                                                </TransformWrapper>
                                            </Col>
                                        </Row>
                                    ) : null}
                                </>
                            )}
                        </>

                    </>
                }
            />
        );
    }
}

const mapDispatchToProps = {
    clearPopupDataAction
};

export default connect(null, mapDispatchToProps)(withStyles(styles)(DashboardTable));
