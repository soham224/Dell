"""
CRUD layer for ai_people_footfall_analysis.

Provides a simple create operation via the generic CRUDBase.
"""

from __future__ import annotations

from typing import Type

from crud.base import CRUDBase
from models.ai_people_footfall_analysis import AiPeopleFootfallAnalysis
from schemas.ai_people_footfall_analysis import (
    AiPeopleFootfallCreate,
    AiPeopleFootfallRead,
)


class _AiPeopleFootfallCRUD(
    CRUDBase[AiPeopleFootfallAnalysis, AiPeopleFootfallCreate, AiPeopleFootfallRead]
):
    """CRUD operations for AiPeopleFootfallAnalysis model.

    Inherits default create/get/update/remove methods.
    """

    pass


ai_people_footfall_crud = _AiPeopleFootfallCRUD(AiPeopleFootfallAnalysis)
