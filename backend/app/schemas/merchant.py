from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class MerchantOut(BaseModel):
    """Response schema for a merchant."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    created_at: datetime
