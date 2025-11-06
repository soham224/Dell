import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import React from "react";
import {CameraUIProvider} from "./CameraUIContext";
import CameraEditDialog from "./camera-details-edit-dialog/CameraEditDialog";
import { ADMIN_URL } from "../../../../../enums/constant";
import CameraTable from "./camera-details-table/CameraTable";
import VideoInferenceCameraEditDialog from "./camera-details-edit-dialog/VideoInferenceCameraEditDialog";
import {useDispatch} from "react-redux";
import * as action from "../_redux/CameraAction";

export default function AllCameraPages() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // Hook to access the current location
    const cameraPageBaseUrl = ADMIN_URL + "/camera";


    const cameraUIEvents = {
        newCameraBtnClick: () => {
            navigate(`${cameraPageBaseUrl}/new`);
        },
        editCameraBtnClick: (id) => {
            navigate(`${cameraPageBaseUrl}/${id}/edit`);
        },
        videoInferenceCameraBtnClick: (id) => {
            navigate(`${cameraPageBaseUrl}/${id}/inference`);
        },
        changeStatusCameraBtnClick: (id, status, isDeprecatedStatus) => {
            navigate(
                `${cameraPageBaseUrl}/${id}/${status}/${isDeprecatedStatus}/changeStatus`
            );
        },

    };

    // Check if we're on a modal route
    const isModalRoute =
        location.pathname.endsWith("/new") || location.pathname.includes("/edit") || location.pathname.includes("/inference");

    const closeModal = React.useCallback(() => {
        dispatch(action.clearCameraByIdAction());
        navigate(cameraPageBaseUrl); // Navigate back to the main page
    }, [dispatch, navigate, cameraPageBaseUrl]);


    return (
        <CameraUIProvider cameraUIEvents={cameraUIEvents}>
            <div>
                {/* Always show the main table */}
                <CameraTable />

                {/* Conditionally render modals based on the current route */}
                {isModalRoute && (
                    <Routes>
                        {/* New Location Dialog */}
                        <Route
                            path="new"
                            element={<CameraEditDialog show={true} onHide={closeModal} />}
                        />

                        {/* Edit Location Dialog */}
                        <Route
                            path=":id/edit"
                            element={<CameraEditDialog show={true} onHide={closeModal} />}
                        />
                        {/* Inference Dialog */}
                        <Route
                            path=":id/inference"
                            element={<VideoInferenceCameraEditDialog show={true} onHide={closeModal} />}
                        />
                    </Routes>
                )}
            </div>
        </CameraUIProvider>
    );
}
