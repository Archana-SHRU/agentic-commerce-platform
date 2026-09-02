from fastapi import Query
from typing import Annotated

from app.db.base import get_db  # noqa: F401  (re-exported for convenience)

SkipParam = Annotated[int, Query(ge=0, description="Number of items to skip")]

LimitParam = Annotated[
    int, Query(ge=1, le=100, description="Max number of items to return")
]
