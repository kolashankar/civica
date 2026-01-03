from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SchoolBase(BaseModel):
    name: str
    address: str
    district: str
    state: str
    pincode: str
    
class SchoolCreate(SchoolBase):
    headmaster_id: Optional[str] = None
    
class School(SchoolBase):
    id: str = Field(alias="_id")
    headmaster_id: Optional[str] = None
    student_count: int = 0
    is_active: bool = True
    created_by: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
