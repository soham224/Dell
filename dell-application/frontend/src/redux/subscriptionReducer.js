const SET_SUBSCRIPTIONS = "SET_SUBSCRIPTIONS";
const SET_DEPLOYED_DETAILS = "SET_MODEL_DETAILS";
const SET_MODEL_NAME = "SET_MODEL_NAME";

export function setSubscription(data) {
    return {
      type: SET_SUBSCRIPTIONS,
      subscriptions: data
    };
  }
export function setDeployedDetails(data) {
    return {
        type: SET_DEPLOYED_DETAILS,
        deployedDetails: data
    };
}
export function setModelName(data) {
    return {
        type: SET_MODEL_NAME,
        modelname: data
    };
}

const initialState = {
    subscriptions: false,
    modelname : '',
    deployedDetails : null
  }
  
const userReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_SUBSCRIPTIONS:
        return {
          ...state,
          subscriptions: action.subscriptions
        };
        case SET_MODEL_NAME:
            return {
                ...state,
                modelname: action.modelname
            };
        case SET_DEPLOYED_DETAILS:
            return {
                ...state,
                deployedDetails: action.deployedDetails
            };
      default:
        return state;
    }
  };
  
  export default userReducer;
  