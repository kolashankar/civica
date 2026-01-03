from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OfficeBase(BaseModel):
    name: str
    type: str  # mro, municipality, hospital, police, other
    address: str
    district: str
    state: str
    pincode: str
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    
class OfficeCreate(OfficeBase):
    pass
    
class Office(OfficeBase):
    id: str = Field(alias="_id")
    is_active: bool = True
    created_by: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
