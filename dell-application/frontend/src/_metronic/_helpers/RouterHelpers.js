import * as utils from "./LocalStorageHelpers";

const localStorageLastLocationKey = "metronic-lastLocation";

function acceptLocation(lastLocation) {
    return lastLocation &&
           lastLocation.pathname &&
           lastLocation.pathname !== "/" &&
           lastLocation.pathname.indexOf("auth") === -1 &&
           lastLocation.pathname !== "/logout";
}

export function saveLastLocation(lastLocation) {
    if (acceptLocation(lastLocation)) {
        utils.setStorage(
            localStorageLastLocationKey,
            JSON.stringify(lastLocation),
            120
        );
    }
}

export function forgotLastLocation() {
    utils.removeStorage(localStorageLastLocationKey);
}

export function getLastLocation() {
    const defaultLocation = {pathname: "/", title: "Dashboard"};
    const localStorateLocations = utils.getStorage(localStorageLastLocationKey);
    if (!localStorateLocations) {
        return {pathname: "/", title: "Dashboard"};
    }

    try {
        const result = JSON.parse(localStorateLocations);
        return result;
    } catch (error) {
        console.error(error);
        return defaultLocation;
    }
}

export function getCurrentUrl(location) {
    return location.pathname.split(/[?#]/);
}

export function checkIsActive(location, url) {
    const current = getCurrentUrl(location);
    return current && url && (current === url || current.includes(url));
}
