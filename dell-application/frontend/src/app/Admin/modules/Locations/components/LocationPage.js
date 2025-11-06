import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import React from "react";
import { LocationUIProvider } from "./LocationUIContext";
import LocationEditDialog from "./location-details-edit-dialog/LocationEditDialog";
import { ADMIN_URL } from "../../../../../enums/constant";
import LocationTable from "./location-details-table/LocationTable";

export default function LocationPage() {
    const navigate = useNavigate();
    const location = useLocation(); // Hook to access the current location
    const locationPageBaseUrl = ADMIN_URL + "/locations";


    const locationUIEvents = {
        newLocationBtnClick: () => {
            navigate(`${locationPageBaseUrl}/new`);
        },
        editLocationBtnClick: (id) => {
            navigate(`${locationPageBaseUrl}/${id}/edit`);
        },
        changeStatusLocationBtnClick: (id, status, isDeprecatedStatus) => {
            navigate(
                `${locationPageBaseUrl}/${id}/${status}/${isDeprecatedStatus}/changeStatus`
            );
        },

    };

    // Check if we're on a modal route
    const isModalRoute =
        location.pathname.endsWith("/new") || location.pathname.includes("/edit");

    const closeModal = React.useCallback(() => {
        navigate(locationPageBaseUrl); // Navigate back to the main page
    },[ navigate, locationPageBaseUrl]);

    return (
        <LocationUIProvider locationUIEvents={locationUIEvents}>
            <div>
                {/* Always show the main table */}
                <LocationTable />

                {/* Conditionally render modals based on the current route */}
                {isModalRoute && (
                    <Routes>
                        {/* New Location Dialog */}
                        <Route
                            path="new"
                            element={<LocationEditDialog show={true} onHide={closeModal} />}
                        />

                        {/* Edit Location Dialog */}
                        <Route
                            path=":id/edit"
                            element={<LocationEditDialog show={true} onHide={closeModal} />}
                        />
                    </Routes>
                )}
            </div>
        </LocationUIProvider>
    );
}
