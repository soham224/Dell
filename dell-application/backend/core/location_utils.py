from typing import List

from sqlalchemy.orm import Session

import crud
import models


def _get_location_list_for_user(db: Session, user: models.User) -> List[int]:
    if crud.user.is_supervisor(user):
        return [loc.id for loc in user.locations] if user.locations else []
    else:
        location_objs = crud.location_crud_obj.get_all_company_enabled_location(
            db, user.company_id
        )
        return [loc.id for loc in location_objs] if location_objs else []
