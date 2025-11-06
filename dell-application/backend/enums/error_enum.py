from enum import Enum


class CommonErrorEnum(str, Enum):
    LABELS_NOT_FOUND = "No label found for camera"
    NO_LOCATION_FOUND_CURRENT_USER = "No location found for current user"
    NO_DATA_FOUND = "No Data Found"
    NO_LOCATION_FOUND_FOR_USER = "No Location Found For User"
    INACTIVE_USER = "Inactive user"
