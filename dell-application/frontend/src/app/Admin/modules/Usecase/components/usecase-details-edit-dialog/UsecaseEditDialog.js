import React, {useCallback, useEffect} from "react";
import {Modal} from "react-bootstrap";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import {UsecaseEditDialogHeader} from "./UsecaseEditDialogHeader";
import UsecaseEditForm from "./UsecaseEditForm";
import * as action from "../../_redux/UsecaseAction";
import {UsecaseSlice} from "../../_redux/UsecaseSlice";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {useParams} from "react-router-dom";

const {actions} = UsecaseSlice;

export default function UsecaseEditDialog({show, onHide}) {
    const {id} = useParams();
    const { actionsLoading, getAllCameraUsecaseMappingById } = useSelector(
        (state) => ({
            actionsLoading: state.useCase?.actionsLoading || false,
            getAllCameraUsecaseMappingById: state.useCase?.getAllCameraUsecaseMappingById,
        }),
        shallowEqual
    );

    const dispatch = useDispatch();

    useEffect(() => {
        if (id !== null && id !== undefined) {
            dispatch(action.getAllCameraUsecaseMappingByIdes(id));
        } else {
            dispatch(actions.clearUsecaseById());
        }
    }, [id, dispatch]);

    const {userRole} = useSelector(
        ({auth}) => ({
            userRole: auth.user?.roles?.length && auth.user.roles[0]?.role
        }),
        shallowEqual
    );
    const saveUsecaseDetails = useCallback((usecase) => {


        let data = {
            usecase_id: usecase?.usecase_id,
            camera_id: usecase?.camera_id,
            usecase_timeout: usecase?.usecase_timeout ,
            second_before_event: usecase?.second_before_event,
            second_after_event: usecase?.second_after_event ,
        };
        let updateData = {
            id: usecase?.id,
            usecase_id: usecase?.usecase_id,
            camera_id: usecase?.camera_id,
            usecase_timeout: usecase?.usecase_timeout ,
            second_before_event: usecase?.second_before_event ,
            second_after_event: usecase?.second_after_event ,
        }

        if (!usecase?.id) {
            dispatch(action.addCameraUsecaseMappings(data)).then(() => {
                dispatch(action.getAllCameraUsecaseMappings(userRole));
                onHide();
            });
        } else {
            dispatch(action.updateCameraUsecaseMappinges(updateData)).then(() => {
                dispatch(action.getAllCameraUsecaseMappings(userRole));
                onHide();
            });
        }
    },[]);

    return (
        <>
            <Modal
                size="md"
                centered={false}
                show={show}
                onHide={onHide}
                aria-labelledby="example-modal-sizes-title-lg"
            >
                <UsecaseEditDialogHeader id={id}/>
                <BlockUi tag="div" blocking={actionsLoading} color="#147b82">
                    <UsecaseEditForm
                        saveUsecase={saveUsecaseDetails}
                        actionsLoading={actionsLoading}
                        usecaseData={getAllCameraUsecaseMappingById}
                        onHide={onHide}
                    />
                </BlockUi>
            </Modal>
        </>
    );
}
