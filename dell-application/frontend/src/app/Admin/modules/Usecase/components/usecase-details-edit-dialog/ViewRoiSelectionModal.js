import React, {useEffect} from "react";
import { Modal} from "react-bootstrap";
import * as action from "../../_redux/UsecaseAction";
import {useParams} from "react-router-dom";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import BlockUi from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import { Button } from "reactstrap";

const ViewRoiSelectionModal = ({
                                   show, onHide
                               }) => {
    const {id} = useParams();
    const dispatch = useDispatch();

    const {actionsLoading, getAllCameraUsecaseMappingById} = useSelector(
        (state) => ({
            actionsLoading: state.useCase?.actionsLoading || false,
            getAllCameraUsecaseMappingById: state.useCase?.getAllCameraUsecaseMappingById,
        }),
        shallowEqual
    );
    useEffect(() => {
        if (id !== null && id !== undefined) {
            dispatch(action.getAllCameraUsecaseMappingByIdes(id));
        } else {
            dispatch(action.clearUsecaseByIdAction());
        }
    }, [id, dispatch]);
    return (
        <>
            <Modal
                show={show}
                onHide={onHide}
                backdrop="static"
                keyboard={false}
                scrollable={false}
                size="lg"
                style={{maxHeight: "-webkit-fill-available"}}
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-lg">
                        ROI Images
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <BlockUi blocking={actionsLoading} tag="div" color="#147b82">
                    {getAllCameraUsecaseMappingById?.CameraUseCaseMapping?.roi_image_path ? <>
                            <img
                                src={getAllCameraUsecaseMappingById?.CameraUseCaseMapping?.roi_image_path}
                                alt="RTSP Stream"
                                style={{ width: '100%', height: '60vh' }}
                            />
                        </> :

                        <h3 className={"mt-5 d-flex justify-content-center"}>
                            No ROI Image
                        </h3>
                    }
                    </BlockUi>

                </Modal.Body>
                <Modal.Footer>
                    <Button
                        color={'secondary'}
                        onClick={onHide}

                    >
                        Cancel
                    </Button>
                </Modal.Footer>

            </Modal>
        </>
    );
}

export default ViewRoiSelectionModal;
