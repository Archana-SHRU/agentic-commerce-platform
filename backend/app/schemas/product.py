from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.merchant import MerchantOut


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    category: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., gt=0, description="Price must be greater than 0")
    stock: int = Field(default=0, ge=0)
    rating: Decimal = Field(default=Decimal("0"), ge=0, le=5)
    is_active: bool = Field(default=True)


class ProductCreate(ProductBase):
    merchant_id: int = Field(..., gt=0)


class ProductUpdate(BaseModel):
    """All fields optional - only provided fields are updated."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    price: Decimal | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    rating: Decimal | None = Field(default=None, ge=0, le=5)
    is_active: bool | None = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    created_at: datetime


class ProductWithMerchantOut(ProductOut):
    """Product response that also nests basic merchant info."""

    merchant: MerchantOut
