import React from 'react';
import {Button, ButtonGroup} from "@mui/material";
import {DeleteOutline, Redo, Refresh, Undo} from "@mui/icons-material";

const CustomFrameControls = ({
                                 zoomIn,
                                 zoomOut,
                                 resetTransform,
                                 onPrev,
                                 onNext,
                                 isFirstFrame,
                                 isLastFrame, className, isFrame, frameData, boundingBoxFrame, resetRegions,
                                 undoRegion
                                 , redoRegion, deleteAllRegions
                             }) => {
    return (
        <ButtonGroup
            size="small"
            aria-label="Small outlined button group"
            style={{width: "100%"}}
        >
            {boundingBoxFrame && (
                <>
                    <Button variant="outlined" color="secondary" onClick={resetRegions}><Refresh/></Button>
                    <Button variant="outlined" color="secondary" onClick={undoRegion}><Undo/></Button>
                    <Button variant="outlined" color="secondary" onClick={redoRegion}><Redo/></Button>
                    <Button variant="outlined" color="secondary" onClick={deleteAllRegions}><DeleteOutline/></Button>
                </>)}
            {frameData && (
                <>
                    <div
                        className={className}
                        style={{width: "100%"}}
                    >
                <span className="d-flex gap-2">
                    <Button variant="outlined" onClick={zoomIn}>+</Button>
                    <Button variant="outlined" onClick={zoomOut}>-</Button>
                    <Button variant="outlined" onClick={resetTransform}>Reset</Button>
                </span>

                        {isFrame && (
                            <span className="d-flex gap-2">
                    <Button variant="outlined" disabled={isFirstFrame} onClick={onPrev}>
                        &lt;
                    </Button>
                    <Button variant="outlined" disabled={isLastFrame} onClick={onNext}>
                        &gt;
                    </Button>
                </span>
                        )}

                    </div>
                </>)}

        </ButtonGroup>
    );
};

export default CustomFrameControls;
