import React, {useCallback, useEffect} from "react";
import {Modal} from "react-bootstrap";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import {LocationEditDialogHeader} from "./LocationEditDialogHeader";
import LocationEditForm from "./LocationEditForm";
import * as action from "../../_redux/LocationAction";
import {LocationSlice} from "../../_redux/LocationSlice";
import {addNotification} from "../../../Notification/_redux/notification";
import  BlockUi  from "@availity/block-ui";
import "@availity/block-ui/dist/index.css"
import {useParams} from "react-router-dom";

const {actions} = LocationSlice;

export default function LocationEditDialog({show, onHide}) {
    const {id} = useParams();
    const {actionsLoading, locationFetchedById} = useSelector(
        (state) => ({
            actionsLoading: state.location.actionsLoading,
            locationFetchedById: state.location.locationFetchedById,
        }),
        shallowEqual
    );

    const dispatch = useDispatch();

    useEffect(() => {
        if (id !== null && id !== undefined) {
            dispatch(action.fetchLocationById(id));
        } else {
            dispatch(actions.clearLocationById());
        }
    }, [id, dispatch]);

    const {user} = useSelector(
        ({auth}) => ({
            user: auth.user,
        }),
        shallowEqual
    );

    const saveLocationDetails = useCallback((location) => {
        if (!id) {
            dispatch(action.createLocation(location, user.id)).then(() => {
                dispatch(action.fetchLocation(user.roles[0]?.role));
                onHide();
            });
        } else {
            dispatch(action.locationUpdate(location, user.company_id)).then(() => {
                let data2 = {
                    notification_message: "Location Updated : " + location.locationName,
                    user_id: user.id,
                    type_of_notification: "string",
                    status: true,
                    is_unread: true,
                };
                dispatch(action.fetchLocation(user.roles[0]?.role));
                onHide();
                addNotification(data2).catch((error) => {
                    console.error("Location failed:", error);
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
                <LocationEditDialogHeader id={id}/>
                <BlockUi tag="div" blocking={actionsLoading} color="#147b82">
                    <LocationEditForm
                        saveLocation={saveLocationDetails}
                        actionsLoading={actionsLoading}
                        locationData={locationFetchedById}
                        onHide={onHide}
                    />
                </BlockUi>
            </Modal>
        </>
    );
}
