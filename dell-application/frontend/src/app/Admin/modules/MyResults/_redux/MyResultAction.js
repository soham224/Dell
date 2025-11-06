import {MyResultSlice} from "./MyResultSlice";

const {actions} = MyResultSlice;

export const setMyResults = (myResults) => dispatch => {
    dispatch(actions.setEntities(myResults))
}