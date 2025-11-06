import React, {createContext, useCallback, useContext, useMemo, useState} from "react";
import { isEqual, isFunction } from "lodash";
import { initialFilter } from "../../../../../utils/UIHelpers";

const LocationUIContext = createContext();

export function useLocationUIContext() {
  return useContext(LocationUIContext);
}

export function LocationUIProvider({ locationUIEvents, children }) {
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
    openNewLocationDialog: locationUIEvents.newLocationBtnClick,
    openEditLocationDialog: locationUIEvents.editLocationBtnClick,
    openChangeStatusLocationDialog:
      locationUIEvents.changeStatusLocationBtnClick
  }), [queryParams, setQueryParams, locationUIEvents]);

  return (
    <LocationUIContext.Provider value={value}>
      {children}
    </LocationUIContext.Provider>
  );
}
