import React, { createContext, useCallback, useContext, useState, useMemo } from "react";
import { isEqual, isFunction } from "lodash";
import { initialFilter } from "../../../../../utils/UIHelpers";

const UsecaseUIContext = createContext();

export function useUsecaseUIContext() {
  return useContext(UsecaseUIContext);
}

export function UsecaseUIProvider({ usecaseUIEvents, children }) {
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

  // Memoize the value object
  const value = useMemo(() => ({
    queryParams,
    setQueryParams,
    openNewUsecaseDialog: usecaseUIEvents.newUsecaseBtnClick,
    openEditUsecaseDialog: usecaseUIEvents.editUsecaseBtnClick,
    openEditRoiDialog: usecaseUIEvents.editRoiBtnClick,
    openViewRoiDialog: usecaseUIEvents.viewRoiBtnClick,
    openChangeStatusUsecaseDialog: usecaseUIEvents.changeStatusUsecaseBtnClick
  }), [queryParams, setQueryParams, usecaseUIEvents]);

  return (
    <UsecaseUIContext.Provider value={value}>
      {children}
    </UsecaseUIContext.Provider>
  );
}
