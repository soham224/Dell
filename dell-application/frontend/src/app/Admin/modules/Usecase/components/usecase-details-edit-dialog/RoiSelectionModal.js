import React from "react";
import {Button, Modal} from "react-bootstrap";
import {Grid} from "@mui/material";
import {HotKeys} from "react-hotkeys"
import {Annotator, Viewer} from "tusk-annotate-tool";

const modalData = [
    {
        media_id: "61c6323e-d23c-44c5-b655-ef72a01125c5",
        filename: "208_1680628711_frame.jpg",
        media_type: "IMAGE",
        src: "https://cdn.wallpapersafari.com/77/1/IeCovk.jpg",
        media_created_at: "2024-03-28T01:33:50.863571+00:00",
        result_id: "a902c61e-4cc9-44f4-9edf-5ac010e2c310",
        regions: [],
        is_hide: false
    }
];
const defaultHotkeys = [
    {
        id: "select_tool",
        description: "Switch to the Select Tool",
        binding: "escape",
    },
    {
        id: "zoom_tool",
        description: "Select the Zoom Tool",
        binding: "z",
    },
    {
        id: "create_point",
        description: "Create a point",
    },
    {
        id: "create_bounding_box",
        description: "Create a bounding box",
        binding: "b",
    },
    {
        id: "pan_tool",
        description: "Select the Pan Tool",
        binding: "m",
    },
    {
        id: "create_polygon",
        description: "Create a Polygon",
        binding: "p",
    },
    {
        id: "create_pixel",
        description: "Create a Pixel Mask",
    },
    {
        id: "save_and_previous_sample",
        description: "Save and go to previous sample",
        binding: "ArrowLeft",
    },
    {
        id: "save_and_next_sample",
        description: "Save and go to next sample",
        binding: "ArrowRight",
    },
    {
        id: "save_and_exit_sample",
        description: "Save and exit current sample",
    },
    {
        id: "exit_sample",
        description: "Exit sample without saving",
    },
    {
        id: "delete_region",
        description: "Delete selected region",
        binding: "d",
    },
    {
        id: "undo",
        description: "Undo latest change",
        binding: "Ctrl+z",
    }, {
        id: "new_icon",
        description: "Next To Previous",
        binding: "q"
    }, {
        id: "smart_tool",
        description: "Smart Annotation",
        binding: "s"
    }
]
const defaultKeyMap = {}
for (const {id, binding} of defaultHotkeys) defaultKeyMap[id] = binding

const RoiSelectionModal = ({
                             show, onHide
                           }) => {
    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                backdrop="static"
                keyboard={false}
                scrollable={false}
                size="xl"
                style={{maxHeight: "-webkit-fill-available"}}
                aria-labelledby="contained-modal-title-vcenter"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-lg">
                        ROI Selection
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid container spacing={2}>
                        <Grid
                            item
                            xl={12}
                            lg={12}
                            md={12}
                            xs={12}
                            p={0}
                            className={"d-flex"}
                        >

                                <div className={"modal-annotationsize-change"}>


                                    <div>
                                        <HotKeys keyMap={defaultKeyMap}>
                                            <Annotator
                                                labelImages
                                                regionClsList={['person']}
                                                images={[...modalData]}
                                                selectedImage={modalData[0]?.src}
                                                enabledTools={[
                                                    "select",
                                                    "create-box",
                                                    "create-polygon",
                                                    "create-expanding-line",
                                                    "create-pixel",
                                                    "show-mask",
                                                    "create-line",
                                                    "smart-tool"
                                                ]}
                                                selectedTool="create-box"
                                                // onNextImage={onNextImage}
                                                // onPrevImage={onPrevImage}
                                                // OnSegment={data => {
                                                //     onSegment(data);
                                                // }}
                                                // // segmentPoint={smartAssistanceData}
                                                // onExit={handleSave}
                                                // onClose={handlclose}
                                                // hideNext={false}
                                                // fullscreen={false}
                                                // hidePrev={false}
                                                // hideSettings={false}
                                                // hideClone={false}
                                                // hideFullScreen={true}
                                                // showMask={true}
                                                // hideHeader={false}
                                                // hideClose={true}
                                                // autoSegmentationOptions={"autoseg"}
                                                // pageInfo={pageInfo}
                                                // page={page}
                                                // modalpage={true}
                                            />
                                        </HotKeys>
                                    </div>
                                    <div>
                                        <Viewer
                                            // annotationLabelShow={true}
                                            imageSrc={"https://cdn.wallpapersafari.com/77/1/IeCovk.jpg"}
                                            regions={[]}
                                            clientWidthNew={240}
                                            clientHeightNew={190}
                                            dragWithPrimary={true}
                                            showPointDistances={false}
                                            zoomWithPrimary={true}
                                            modifyingAllowedArea={true}
                                            createWithPrimary={true}
                                            zoomOnAllowedArea={true}
                                            fullImageSegmentationMode={false}
                                            zoomBox={null}
                                        />
                                    </div>
                                </div>

                        </Grid>
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        onClick={onHide}
                        className="btn btn-light btn-elevate"
                    >
                        Cancel
                    </Button>
                    <> </>
                    <Button
                        type="submit"
                        // onClick={handleSubmit}
                        className="btn btn-primary btn-elevate"
                    >
                        Save
                    </Button>
                </Modal.Footer>

            </Modal>
        </>
    );
}

export default RoiSelectionModal;
