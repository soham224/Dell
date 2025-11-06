import { createSlice } from "@reduxjs/toolkit";

const initialLocationState = {
  listLoading: false,
  actionsLoading: false,
  totalCount: 0,
  entities: [],
  filteredEntities: "",
  getCameraRoiById: "",
  tableData: false,
};

export const callTypes = {
  list: "list",
  action: "action"
};

export const ModalCategorySlice = createSlice({
  name: "modalCategory",
  initialState: initialLocationState,
  reducers: {
    catchError: (state, action) => {
      state.error = `${action.type}: ${action.payload.error}`;
      if (action.payload.callType === callTypes.list) {
        state.listLoading = false;
        state.entities = [];
        state.tableData = false;
      } else {
        state.actionsLoading = false;
        state.entities = [];
        state.tableData = false;
      }
    },

    startCall: (state, action) => {
      state.error = null;
      if (action.payload.callType === callTypes.list) {
        state.listLoading = true;
      } else {
        state.actionsLoading = true;
      }
    },

    getCameraUsecaseMAppingByUSeCaseId: (state, action) => {
      state.listLoading = false;
      state.error = null;
      state.entities = action.payload;
      state.totalCount = action.payload.length;
      state.tableData = true;
    },
  }
});
