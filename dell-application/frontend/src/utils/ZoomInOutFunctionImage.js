import React from 'react';
import { Button } from '@mui/material';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import CustomFrameControls from "./CustomFrameControls";
import Boundingbox from "image-bounding-box-custom";
import {boundBoxOptions} from "./UIHelpers";


function ZoomInOutFunctionImage({ currentFrameIndex, tableData, handleNext, handlePrev, imageUrl,isNextPrev }) {
    let transformRef = React.useRef(null);

    return (
        <div>
            <div className="button-group">
                <div className="control-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <span className="left-controls" >
                        <Button
                            variant="outlined"
                            onClick={() => transformRef.current?.zoomIn()}
                            title="Zoom In"
                            sx={{ fontSize: '0.75rem', minWidth: '32px' }}
                        >
                          +
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => transformRef.current?.zoomOut()}
                            title="Zoom Out"
                            sx={{ fontSize: '0.75rem',minWidth: '32px' }}
                        >
                          -
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={() => transformRef.current?.resetTransform()}
                            title="Reset"
                            sx={{ fontSize: '0.75rem' }}
                        >
                          Reset
                        </Button>

                    </span>
                    {isNextPrev &&(
                    <span className="right-controls" style={{ display: 'flex', gap: 10 }}>
                        <Button
                            variant="outlined"
                            onClick={handlePrev}
                            disabled={currentFrameIndex === 0}
                            title="Previous"
                            sx={{ fontSize: '0.75rem' }}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleNext}
                            disabled={currentFrameIndex === tableData.length - 1}
                            title="Next"
                            sx={{ fontSize: '0.75rem' }}
                        >
                            Next
                        </Button>
                    </span>)}
                </div>
            </div>

            <div className="image-container">
                <TransformWrapper
                    defaultScale={1}
                    defaultPositionX={200}
                    defaultPositionY={100}
                >
                    {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                        <React.Fragment>
                            <div
                                className="tools text-right"
                                style={{ width: "100%", marginBottom: "4px" }}
                            >
                                <CustomFrameControls
                                    zoomIn={zoomIn}
                                    zoomOut={zoomOut}
                                    resetTransform={resetTransform}
                                    frameData={true}
                                />
                            </div>
                            <div
                                className="boundimage-full w-100"
                                style={{ margin: "0 auto" }}
                            >
                                {console.log("tableData",tableData[currentFrameIndex])}
                                <TransformComponent>
                                    <Boundingbox
                                        className="row m-auto col-12 p-0 text-center"
                                        image={imageUrl}
                                        boxes={tableData[currentFrameIndex]?.result?.detection.map(d => ({
                                            coord: [
                                                d.location[0],
                                                d.location[1],
                                                d.location[2] - d.location[0],
                                                d.location[3] - d.location[1]
                                            ],
                                            label: d.label
                                        }))}
                                        options={boundBoxOptions}
                                    />
                                </TransformComponent>
                            </div>
                        </React.Fragment>
                    )}
                </TransformWrapper>
            </div>
        </div>
    );
}

export default ZoomInOutFunctionImage;
