import React from 'react';
import { Button } from '@mui/material';

function ZoomInOutFunctionVideo({ currentFrameIndex, tableData, handleNext, handlePrev, videoUrl,isNextPrev }) {

    return (
        <div>
            <div className="button-group">
                <div className="control-bar" style={{ display: 'flex', justifyContent: 'end', gap: 10, marginBottom: 10 }}>
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

            <div className="text-center">
                <video
                    key={currentFrameIndex}
                    width="100%"
                    height="auto"
                    controls
                    style={{ maxHeight: "100vh", borderRadius: "0px" }}
                >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    );
}

export default ZoomInOutFunctionVideo;
