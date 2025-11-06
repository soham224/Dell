/**
 * Create React App entry point. This and `public/index.html` files can not be
 * changed or moved.
 */
import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import store, { persistor } from "./redux/store";
import App from "./app/App";
import "./index.scss"; // Standard version
import "./_metronic/_assets/plugins/keenthemes-icons/font/ki.css";
import "socicon/css/socicon.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./_metronic/_assets/plugins/flaticon/flaticon.css";
import "./_metronic/_assets/plugins/flaticon2/flaticon.css";
// Datepicker
import "react-datepicker/dist/react-datepicker.css";

import {
  MetronicLayoutProvider,
  MetronicSplashScreenProvider,
  MetronicSubheaderProvider,
} from "./_metronic/layout";
import { MetronicI18nProvider } from "./_metronic/i18n";

const {PUBLIC_URL} = process.env;
const root = createRoot(document.getElementById('root'));
root.render(
    <MetronicI18nProvider>
        <MetronicLayoutProvider>
            <MetronicSubheaderProvider>
                <MetronicSplashScreenProvider>
                    <App store={store} persistor={persistor} basename={PUBLIC_URL}/>
                </MetronicSplashScreenProvider>
            </MetronicSubheaderProvider>
        </MetronicLayoutProvider>
    </MetronicI18nProvider>,

);





