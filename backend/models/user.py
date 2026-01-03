from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: str  # admin, headmaster, student, office, responder
    
class UserCreate(UserBase):
    password: str
    school_id: Optional[str] = None
    grade: Optional[str] = None
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class User(UserBase):
    id: str = Field(alias="_id")
    school_id: Optional[str] = None
    office_id: Optional[str] = None
    team_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    grade: Optional[str] = None
    profile_image: Optional[str] = None
    
    class Config:
        populate_by_name = True
        
class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    school_id: Optional[str] = None
    team_id: Optional[str] = None
    grade: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class UserStats(BaseModel):
    total_inspections: int
    completed_inspections: int
    pending_inspections: int
    success_rate: float
