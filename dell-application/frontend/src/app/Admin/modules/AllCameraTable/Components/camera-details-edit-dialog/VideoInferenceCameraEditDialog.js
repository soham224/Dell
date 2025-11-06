import React, {useEffect} from "react";
import {Modal} from "react-bootstrap";
import {Button} from "reactstrap";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import * as action from "../../_redux/CameraAction";
import {CameraSlice} from "../../_redux/CameraSlice";
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {Tooltip} from "@mui/material";

const {actions} = CameraSlice;

export default function VideoInferenceCameraEditDialog({show, onHide}) {
    const dispatch = useDispatch();
    const {id} = useParams();

    const {listLoading, cameraFetchedById} = useSelector(
        (state) => ({
            listLoading: state.camera?.listLoading,
            cameraFetchedById: state.camera?.getCameraRoiById,
        }),
        shallowEqual
    );

    useEffect(() => {
        if (id !== null && id !== undefined) {
            dispatch(action.getCameraRoiByIdes(id));
        } else {
            dispatch(actions.clearCameraByIdAction());
        }
    }, [id, dispatch]);

    const imageData = cameraFetchedById?.inference_url || {};

    const handleFullscreen = (url) => {
        const win = window.open();
        if (win) {
            win.document.write(`<img src="${url}" style="width:100%;height:100%;" alt="Fullscreen Image" />`);
        }
    };

    const openInNewTab = () => {
        if (!imageData) return;

        const imageEntries = Object.entries(imageData).filter(([_, url]) => !!url);
        const imageCount = imageEntries.length;

        const newWindow = window.open("", "_blank");
        if (!newWindow) return;

        newWindow.document.write(`
    <html>
      <head>
        <title>Inference Images</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            font-family: sans-serif;
            box-sizing: border-box;
          }
          body {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 10px;
            padding: 10px;
          }
          .image-container {
            display: flex;
            justify-content: center;
            align-items: center;
            /*background: #f9f9f9;*/
            /*border: 1px solid #ccc;*/
            /*border-radius: 8px;*/
            padding: 10px;
            width: 100%;
            height: auto;
          }

          /* Image size rules */
          img {
            width: 100%;
            height: auto;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
          }

          /* Responsive width based on image count */
          ${imageCount === 1 ? `
            .image-container {
              flex: 1 1 100%;
              max-width: 100%;
            }
          ` : imageCount === 2 ? `
            .image-container {
              flex: 1 1 48%;
              max-width: 48%;
            }
          ` : `
            .image-container {
              flex: 1 1 45%;
              max-width: 45%;
            }
          `}

          /* Mobile-first fallback for small screens */
          @media (max-width: 768px) {
            .image-container {
              flex: 1 1 100% !important;
              max-width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        ${imageEntries.map(([key, url]) => `
          <div class="image-container">
            <img src="${url}" alt="${key}" />
          </div>
        `).join('')}
      </body>
    </html>
  `);

        newWindow.document.close(); // Finish rendering
    };


    return (
        <Modal
            show={show}
            onHide={onHide}
            backdrop="static"
            keyboard={false}
            className="custom-usecase-modal"
            centered
        >
            <Modal.Header closeButton={false}>
                <Modal.Title>Video Inference</Modal.Title>
                {Object.keys(imageData || {}).length > 0 && (
                    <Tooltip title="Open in New Tab" arrow>
                        <div
                            onClick={openInNewTab}
                            style={{
                                marginLeft: "auto",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <OpenInNewIcon fontSize="medium" />
                        </div>
                    </Tooltip>
                )}


            </Modal.Header>

            <Modal.Body>
                <BlockUi tag="div" blocking={listLoading} color="#147b82">
                    {Object.keys(imageData || {}).length > 0 ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                gap: "1rem",
                                flexWrap: "wrap"
                            }}
                        >
                            {Object.entries(imageData).map(([key, url]) => (
                                <div key={key} style={{position: "relative", flex: "1 1 45%"}}>
                                    <img
                                        src={url}
                                        alt={key}
                                        style={{
                                            width: "100%",
                                            height: "70vh",
                                            objectFit: "fill",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <FullscreenIcon
                                        onClick={() => handleFullscreen(url)}
                                        style={{
                                            position: "absolute",
                                            top: 10,
                                            right: 10,
                                            cursor: "pointer",
                                            color: "#1976d2"
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                    ) : (
                        <h4 className="text-center mt-5">No inference images found</h4>
                    )}
                </BlockUi>
            </Modal.Body>

            <Modal.Footer>
                <Button color="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
