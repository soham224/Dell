import { createSlice } from "@reduxjs/toolkit";

const initialLocationState = {
  listLoading: false,
  actionsLoading: false,
  totalCount: 0,
  entities: [],
  filteredEntities: "",
  locationFetchedById: "",
  tableData: false,
  popupData:[]
};

export const callTypes = {
  list: "list",
  action: "action"
};

export const LocationSlice = createSlice({
  name: "location",
  initialState: initialLocationState,
  reducers: {
    catchError: (state, action) => {
      state.error = `${action.type}: ${action.payload.error}`;
      if (action.payload.callType === callTypes.list) {
        state.listLoading = false;
        state.entities = [];
        state.tableData = false;
        state.popupData =[];
      } else {
        state.actionsLoading = false;
        state.entities = [];
        state.tableData = false;
        state.popupData =[];
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

    locationFetched: (state, action) => {
      state.listLoading = false;
      state.error = null;
      state.entities = action.payload;
      state.totalCount = action.payload.length;
      state.tableData = true;
    },

    addNewLocation: (state, action) => {
      state.actionsLoading = false;
      state.entities.push(action.payload);
      state.error = null;
      state.tableData = true;
    },

    updatedExistingLocation: (state, action) => {
      let data = action.payload;
      state.listLoading = false;
      state.error = null;
      state.entities = state.entities.map(entity => {
        if (entity.id === data.id) {
          return data;
        }
        return entity;
      });
    },

    locationFetchedById: (state, action) => {
      state.actionsLoading = false;
      state.listLoading = false;
      state.error = null;
      state.locationFetchedById = action.payload;
      state.tableData = true;
    },

    clearLocationById: (state, action) => {
      state.actionsLoading = false;
      state.listLoading = false;
      state.error = null;
      state.locationFetchedById = null;
    },

    popupData: (state, action) => {
      state.actionsLoading = false;
      state.listLoading = false;
      state.error = null;
      state.popupData = action.payload;
    },

    clearPopupData: (state, action) => {
      state.actionsLoading = false;
      state.listLoading = false;
      state.error = null;
      state.popupData = [];
    }

  }
});
