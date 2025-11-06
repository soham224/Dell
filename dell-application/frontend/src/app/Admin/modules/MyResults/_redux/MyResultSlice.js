import {createSlice} from "@reduxjs/toolkit";

const initialMyResult = {
    entities: []
};

export const MyResultSlice = createSlice({
    name: "myResultASU",
    initialState: initialMyResult,
    reducers: {
        setEntities: (state, action) => {
            state.entities = action.payload;
        }
    }
});
