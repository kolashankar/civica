from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Notification(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    title: str
    message: str
    type: str  # new_assignment, response, reminder, announcement
    related_inspection_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime
    
    class Config:
        populate_by_name = True

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str
    related_inspection_id: Optional[str] = None
