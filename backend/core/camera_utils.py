import crud


def get_current_user_location(db, current_user, location_list):
    location_list = [int(location) for location in location_list or []]
    if not location_list or -1 in location_list:
        if crud.user.is_supervisor(current_user):
            return [location.id for location in current_user.locations]
        else:
            location_obj = crud.location_crud_obj.get_all_company_enabled_location(
                db, current_user.company_id
            )
            return [location.id for location in location_obj]
    else:
        return location_list
