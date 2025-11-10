from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from api import deps
from crud.usecase_crud import usecase_crud_obj

import crud

usecase_router = APIRouter()


@usecase_router.get("/get_all_usecases", response_model=List[schemas.UseCaseSchema])
def get_all_available_usecases(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    available_usecases = usecase_crud_obj.get_all_available_usecase(db)
    if not available_usecases:
        raise HTTPException(status_code=404, detail="No usecases available.")
    return available_usecases
