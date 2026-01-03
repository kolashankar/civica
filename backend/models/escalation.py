from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class FollowUp(BaseModel):
    """Follow-up entry for an escalation"""
    notes: str
    added_by: str
    added_at: datetime
    action_taken: Optional[str] = None

class EscalationBase(BaseModel):
    """Base escalation model"""
    inspection_id: str
    escalation_reason: str
    action_items: List[str] = []
    description: Optional[str] = None
    severity: str = "medium"  # low, medium, high, critical

class EscalationCreate(EscalationBase):
    """Create escalation request"""
    pass

class Escalation(EscalationBase):
    """Full escalation model"""
    id: str = Field(alias="_id")
    escalated_by: str
    escalated_at: datetime
    status: str = "open"  # open, in_progress, resolved, re_escalated
    follow_ups: List[FollowUp] = []
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    assigned_to: Optional[str] = None
    re_escalated_to: Optional[str] = None
    re_escalation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True

class FollowUpRequest(BaseModel):
    """Request to add a follow-up"""
    notes: str
    action_taken: Optional[str] = None

class ResolveRequest(BaseModel):
    """Request to resolve an escalation"""
    resolution_notes: str

class ReEscalateRequest(BaseModel):
    """Request to re-escalate"""
    re_escalation_reason: str
    escalated_to: Optional[str] = None  # Higher authority ID
