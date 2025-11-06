import React, {createContext, useCallback, useContext, useMemo, useState} from "react";
import { isEqual, isFunction } from "lodash";
import { initialFilter } from "../../../../../utils/UIHelpers";

const CameraUIContext = createContext();

export function useCameraUIContext() {
  return useContext(CameraUIContext);
}

export function CameraUIProvider({ cameraUIEvents, children }) {
  const [queryParams, setQueryParamsBase] = useState(initialFilter);
  const setQueryParams = useCallback(nextQueryParams => {
    setQueryParamsBase(prevQueryParams => {
      if (isFunction(nextQueryParams)) {
        nextQueryParams = nextQueryParams(prevQueryParams);
      }

      if (isEqual(prevQueryParams, nextQueryParams)) {
        return prevQueryParams;
      }

      return nextQueryParams;
    });
  }, []);

  const value = useMemo(() => ({
    queryParams,
    setQueryParams,
    openNewCameraDialog: cameraUIEvents.newCameraBtnClick,
    openEditCameraDialog: cameraUIEvents.editCameraBtnClick,
    openVideoInferenceCameraDialog: cameraUIEvents.videoInferenceCameraBtnClick,
    openChangeStatusCameraDialog:
    cameraUIEvents.changeStatusCameraBtnClick
  }), [queryParams, setQueryParams, cameraUIEvents]);


  return (
    <CameraUIContext.Provider value={value}>
      {children}
    </CameraUIContext.Provider>
  );
}
