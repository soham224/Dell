import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import React from "react";
import {UsecaseUIProvider} from "./UsecaseUIContext";
import UsecaseCard from "./UsecaseCard";
import UsecaseEditDialog from "./usecase-details-edit-dialog/UsecaseEditDialog";
import {ADMIN_URL} from "../../../../../enums/constant";
import RoiSelectionModal from "./usecase-details-edit-dialog/RoiSelectionModal";
import ViewRoiSelectionModal from "./usecase-details-edit-dialog/ViewRoiSelectionModal";
import * as action from "../_redux/UsecaseAction";

import {useDispatch} from "react-redux";

export default function AllUsecasePages() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // Hook to access the current location
    const usecasePageBaseUrl = ADMIN_URL + "/usecase";


    const usecaseUIEvents = {
        newUsecaseBtnClick: () => {
            navigate(`${usecasePageBaseUrl}/new`);
        },
        editUsecaseBtnClick: (id) => {
            navigate(`${usecasePageBaseUrl}/${id}/edit`);
        },
        editRoiBtnClick: (id) => {
            navigate(`${usecasePageBaseUrl}/${id}/roi`);
        },
        viewRoiBtnClick: (id) => {
            navigate(`${usecasePageBaseUrl}/${id}/view`);
        },
        changeStatusUsecaseBtnClick: (id, status, isDeprecatedStatus) => {
            navigate(
                `${usecasePageBaseUrl}/${id}/${status}/${isDeprecatedStatus}/changeStatus`
            );
        },

    };

    // Check if we're on a modal route
    const isModalRoute =
        location.pathname.endsWith("/new") || location.pathname.includes("/edit") || location.pathname.includes("/roi") || location.pathname.includes("/view");

    const closeModal = () => {
        dispatch(action.clearUsecaseByIdAction());
        navigate(usecasePageBaseUrl); // Navigate back to the main page
    };

    const handleHide = React.useCallback(() => {
        closeModal();
    }, []);

    return (
        <UsecaseUIProvider usecaseUIEvents={usecaseUIEvents}>
            <div>
                {/* Always show the main table */}
                <UsecaseCard/>

                {/* Conditionally render modals based on the current route */}
                {isModalRoute && (
                    <Routes>
                        {/* New Location Dialog */}
                        <Route
                            path="new"
                            element={<UsecaseEditDialog show={true} onHide={handleHide}/>}
                        />
                        <Route
                            path=":id/roi"
                            element={<RoiSelectionModal show={true} onHide={handleHide}/>}
                        />
                        <Route
                            path=":id/view"
                            element={<ViewRoiSelectionModal show={true} onHide={handleHide}/>}
                        />

                        {/* Edit Location Dialog */}
                        <Route
                            path=":id/edit"
                            element={<UsecaseEditDialog show={true} onHide={handleHide}/>}
                        />
                    </Routes>
                )}
            </div>
        </UsecaseUIProvider>
    );
}
