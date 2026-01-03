from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class InspectionReport(BaseModel):
    cleanliness_rating: Optional[int] = None
    staff_behavior_rating: Optional[int] = None
    service_quality_rating: Optional[int] = None
    issues: Optional[str] = None
    complaints: Optional[str] = None
    suggestions: Optional[str] = None
    photos: Optional[List[str]] = []  # base64 strings
    submitted_at: Optional[datetime] = None
    submitted_by: Optional[str] = None
    
class OfficeResponse(BaseModel):
    response_text: str
    action_taken: str
    remarks: Optional[str] = None
    responded_at: Optional[datetime] = None
    responded_by: Optional[str] = None
    
class GovtReview(BaseModel):
    review_status: str  # approved, rejected, escalated
    review_comments: str
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    
class InspectionBase(BaseModel):
    task_name: str
    task_description: str
    office_id: str
    school_id: str
    
class InspectionCreate(InspectionBase):
    team_id: Optional[str] = None
    due_date: datetime
    priority: str = "medium"  # low, medium, high
    template_id: str
    
class Inspection(InspectionBase):
    id: str = Field(alias="_id")
    team_id: str
    assigned_date: datetime
    due_date: datetime
    status: str = "assigned"  # assigned, submitted, responded, closed, escalated
    priority: str
    template_id: str
    report: Optional[InspectionReport] = None
    office_response: Optional[OfficeResponse] = None
    govt_review: Optional[GovtReview] = None
    created_by: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
        
class InspectionSubmit(BaseModel):
    cleanliness_rating: int
    staff_behavior_rating: int
    service_quality_rating: int
    issues: str
    complaints: str
    suggestions: str
    photos: List[str] = []  # base64 strings
