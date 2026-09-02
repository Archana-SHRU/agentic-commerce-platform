from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic wrapper for paginated list endpoints."""

    total: int
    skip: int
    limit: int
    items: list[T]


class ErrorResponse(BaseModel):
    detail: str
