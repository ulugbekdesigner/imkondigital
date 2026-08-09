"""B2B "Xizmatlar" qiziqish sxemasi."""

from pydantic import BaseModel, EmailStr


class ServiceInterestCreate(BaseModel):
    email: EmailStr
