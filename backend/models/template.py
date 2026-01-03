from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class FormField(BaseModel):
    field_name: str
    field_type: str  # rating, text, multiline, photo
    is_required: bool = True
    options: Optional[List[str]] = None
    
class TemplateBase(BaseModel):
    name: str
    description: str
    office_types: List[str]
    
class TemplateCreate(TemplateBase):
    form_fields: List[FormField]
    
class TemplateClone(BaseModel):
    new_name: str

class Template(TemplateBase):
    id: str = Field(alias="_id")
    form_fields: List[FormField]
    is_active: bool = True
    created_by: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
