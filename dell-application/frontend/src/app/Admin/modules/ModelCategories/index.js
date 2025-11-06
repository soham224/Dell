import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navigation from "./components/model-categories/Navigation";
import Model from "./components/model";

export function ModelCategoryPage() {
    const location = useLocation();

    const showNavigationOnly = location.pathname === "/admin/model-categories/view";

    return (
        <div>{showNavigationOnly && (
            <Navigation />
        )}

            <Routes>
                <Route path="model/:id" element={<Model />} />
            </Routes>
        </div>
    );
}
