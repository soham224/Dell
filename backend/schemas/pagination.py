from typing import Optional

from pydantic import BaseModel


class PaginationResponse(BaseModel):
    total_page: int
    next_page: Optional[int] = None
    pre_page: Optional[int] = None
    page_size: int
    total_count: int
