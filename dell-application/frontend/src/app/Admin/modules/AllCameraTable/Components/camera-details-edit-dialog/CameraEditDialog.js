import React, {useCallback, useEffect} from "react";
import {Modal} from "react-bootstrap";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import {CameraEditDialogHeader} from "./CameraEditDialogHeader";
import CameraEditForm from "./CameraEditForm";
import * as action from "../../_redux/CameraAction";
import {CameraSlice} from "../../_redux/CameraSlice";
import {addNotification} from "../../../Notification/_redux/notification";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {useParams} from "react-router-dom";

const {actions} = CameraSlice;

export default function CameraEditDialog({show, onHide}) {
    const dispatch = useDispatch();
    const {id} = useParams();

    const {
        actionsLoading,
        cameraFetchedById,
        userRole,
        user
    } = useSelector(
        (state) => ({
            actionsLoading: state.camera?.actionsLoading || false,
            cameraFetchedById: state.camera?.getCameraRoiById,
            userRole: state.auth.user?.roles?.length && state.auth.user.roles[0]?.role,
            user: state.auth.user,
        }),
        shallowEqual
    );


    useEffect(() => {
        if (id !== null && id !== undefined) {
            dispatch(action.getCameraRoiByIdes(id));
        } else {
            dispatch(actions.clearCameraById());
        }
    }, [id, dispatch]);


    const saveCameraDetails = useCallback((camera) => {

        let data = {
            rtsp_url: camera?.rtsp_url,
            camera_name: camera?.camera_name,
            location_id: camera?.location_id ,
            process_fps: camera?.process_fps,
        };
        let updateData = {
            rtsp_url: camera?.rtsp_url,
            camera_name: camera?.camera_name,
            location_id: camera?.location_id ,
            process_fps: camera?.process_fps,
            id: camera?.id,
        };

        if (!id) {
            dispatch(action.createLocation(data, user.id)).then(() => {
                dispatch(action.getAllCameras(userRole));
                onHide();
            });
        } else {
            dispatch(action.updateDeploymentCameraes(updateData)).then(() => {
                let data2 = {
                    notification_message: "Camera Updated : " + updateData.camera_name,
                    user_id: user.id,
                    type_of_notification: "string", // Consider replacing "string" with a defined constant or enum if possible
                    status: true,
                    is_unread: true,
                };
                dispatch(action.getAllCameras(userRole));  // Refresh camera list
                onHide(); // Close modal or dialog

                // Send notification (no need to await unless response handling is required)
                addNotification(data2).catch((error) => {
                    console.error("Notification failed:", error);
                });
            });
        }
    },[]);

    return (
        <>
            <Modal
                size="md"
                show={show}
                onHide={onHide}
                aria-labelledby="example-modal-sizes-title-lg"
            >
                <CameraEditDialogHeader id={id}/>
                <BlockUi tag="div" blocking={actionsLoading} color="#147b82">
                    <CameraEditForm
                        saveCamera={saveCameraDetails}
                        actionsLoading={actionsLoading}
                        cameraData={cameraFetchedById}
                        onHide={onHide}
                    />
                </BlockUi>
            </Modal>
        </>
    );
}
