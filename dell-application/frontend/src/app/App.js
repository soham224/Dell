import React from "react";
import {Provider} from "react-redux";
import {BrowserRouter} from "react-router-dom";
import {PersistGate} from "redux-persist/integration/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {I18nProvider} from "../_metronic/i18n";
import {LayoutSplashScreen, MaterialThemeProvider} from "../_metronic/layout";
import Router from "./Routes";
import FetchDataInEveryFiveMin from "../utils/FetchDataInEveryFiveMin";

function App({store, persistor}) {
  return (
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={<LayoutSplashScreen />}>
          <React.Suspense fallback={<LayoutSplashScreen />}>
            <BrowserRouter>
              <MaterialThemeProvider>
                <I18nProvider>
                  <ToastContainer/>
                    <FetchDataInEveryFiveMin />
                  <Router />
                </I18nProvider>
              </MaterialThemeProvider>
            </BrowserRouter>
          </React.Suspense>
        </PersistGate>
      </Provider>
  );
}
export default App;