import React, {createContext, useCallback, useContext, useMemo, useState} from "react";
import {isEqual, isFunction} from "lodash";
import {initialFilter} from "../../../../../../../utils/UIHelpers";

const MyResultUIContext = createContext();

export function useMyResultUIContext() {
    return useContext(MyResultUIContext);
}

export function MyResultUIProvider({myResultUIEvents, children}) {
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
        openViewMyResultDialog: myResultUIEvents.openViewMyResultBtnClick,
    }), [queryParams, setQueryParams, myResultUIEvents]);

    return <MyResultUIContext.Provider value={value}>{children}</MyResultUIContext.Provider>;
}
