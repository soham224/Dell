import React, {useCallback, useEffect} from "react";
import {Modal} from "react-bootstrap";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {UsecaseSlice} from "../../../Usecase/_redux/UsecaseSlice";
import * as action from "../../../Usecase/_redux/UsecaseAction";
import UsecaseEditForm from "../../../Usecase/components/usecase-details-edit-dialog/UsecaseEditForm";
import * as actionModal from "../../_redux/ModalCategoryAction";

const {actions} = UsecaseSlice;

export default function ModalCategoryEditModal({show, onHide, usecaseId, className}) {
    const { actionsLoading, getAllCameraUsecaseMappingById } = useSelector(
        (state) => ({
            actionsLoading: state.useCase?.actionsLoading || false,
            getAllCameraUsecaseMappingById: state.useCase?.getAllCameraUsecaseMappingById,
        }),
        shallowEqual
    );

    const dispatch = useDispatch();

    useEffect(() => {
        if (usecaseId !== null && usecaseId !== undefined) {
            dispatch(action.getAllCameraUsecaseMappingByIdes(usecaseId));
        } else {
            dispatch(actions.clearUsecaseById());
        }
    }, [usecaseId, dispatch]);

    const handleSaveUsecase = useCallback((usecase) => {
        const updateData = {
            id: usecase?.id,
            usecase_id: usecase?.usecase_id,
            camera_id: usecase?.camera_id,
            usecase_timeout: usecase?.usecase_timeout,
            second_before_event: usecase?.second_before_event || 1,
            second_after_event: usecase?.second_after_event || 1,
        };

        if (usecase?.id) {
            dispatch(action.updateCameraUsecaseMappinges(updateData)).then(() => {
                dispatch(actionModal.getCameraUsecaseMAppingByUSeCaseIdes(usecase?.usecase_id));
                onHide();
            });
        }
    },[])

    return (
        <>
            <Modal
                size="md"
                show={show}
                onHide={onHide}
                aria-labelledby="example-modal-sizes-title-lg"
                className={className}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-lg">
                        Usecase Edit
                    </Modal.Title>
                </Modal.Header>
                <BlockUi tag="div" blocking={actionsLoading} color="#147b82">
                    <UsecaseEditForm
                        saveUsecase={handleSaveUsecase}
                        actionsLoading={actionsLoading}
                        usecaseData={getAllCameraUsecaseMappingById}
                        onHide={onHide}
                    />
                </BlockUi>
            </Modal>
        </>
    );
}
