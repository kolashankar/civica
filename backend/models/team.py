from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    school_id: str
    
class TeamCreate(TeamBase):
    student_ids: List[str]
    team_leader_id: str
    
class Team(TeamBase):
    id: str = Field(alias="_id")
    student_ids: List[str]
    team_leader_id: str
    is_active: bool = True
    created_by: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
