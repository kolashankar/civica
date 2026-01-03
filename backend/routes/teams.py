from fastapi import APIRouter, HTTPException, Depends
from models.team import Team, TeamCreate
from middleware.auth import get_current_user, require_role
from utils.database import get_database
from datetime import datetime
from typing import List, Optional
import uuid

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("")
async def get_teams(
    skip: int = 0,
    limit: int = 10,
    school_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get all teams with pagination and filtering"""
    db = get_database()
    
    # Build query
    query = {"is_active": True}
    if school_id:
        query["school_id"] = school_id
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    # Get total count
    total = await db.teams.count_documents(query)
    
    # Get teams
    teams = await db.teams.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with school data and student info
    for team in teams:
        school = await db.schools.find_one({"_id": team["school_id"]})
        team["school"] = school
        
        # Get student details
        students = []
        for student_id in team.get("student_ids", []):
            student = await db.users.find_one({"_id": student_id})
            if student:
                students.append({
                    "_id": student["_id"],
                    "name": student["name"],
                    "email": student["email"]
                })
        team["students"] = students
        
        # Get team leader details
        if team.get("team_leader_id"):
            leader = await db.users.find_one({"_id": team["team_leader_id"]})
            team["team_leader"] = leader if leader else None
    
    return {
        "teams": teams,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/school/{school_id}")
async def get_teams_by_school(
    school_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get all active teams for a school"""
    db = get_database()
    
    teams = await db.teams.find({
        "school_id": school_id,
        "is_active": True
    }).to_list(100)
    
    # Enrich with student info
    for team in teams:
        students = []
        for student_id in team.get("student_ids", []):
            student = await db.users.find_one({"_id": student_id})
            if student:
                students.append({
                    "_id": student["_id"],
                    "name": student["name"],
                    "email": student["email"]
                })
        team["students"] = students
    
    return teams

@router.get("/{team_id}")
async def get_team_detail(
    team_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get detailed team information"""
    db = get_database()
    
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Enrich with school data
    school = await db.schools.find_one({"_id": team["school_id"]})
    team["school"] = school
    
    # Get full student details
    students = []
    for student_id in team.get("student_ids", []):
        student = await db.users.find_one({"_id": student_id})
        if student:
            students.append({
                "_id": student["_id"],
                "name": student["name"],
                "email": student["email"],
                "phone": student.get("phone"),
                "grade": student.get("grade")
            })
    team["students"] = students
    
    # Get team leader details
    if team.get("team_leader_id"):
        leader = await db.users.find_one({"_id": team["team_leader_id"]})
        team["team_leader"] = leader
    
    # Get inspection stats
    total_inspections = await db.inspections.count_documents({"team_id": team_id})
    completed_inspections = await db.inspections.count_documents({
        "team_id": team_id,
        "status": {"$in": ["submitted", "responded", "closed"]}
    })
    
    team["stats"] = {
        "total_inspections": total_inspections,
        "completed_inspections": completed_inspections,
        "pending_inspections": total_inspections - completed_inspections
    }
    
    return team

@router.post("")
async def create_team(
    team_data: TeamCreate,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Create a new team"""
    db = get_database()
    
    # Verify school exists
    school = await db.schools.find_one({"_id": team_data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Verify all students exist and belong to the school
    for student_id in team_data.student_ids:
        student = await db.users.find_one({"_id": student_id, "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
        if student.get("school_id") != team_data.school_id:
            raise HTTPException(status_code=400, detail=f"Student {student_id} does not belong to this school")
    
    # Verify team leader is in the student list
    if team_data.team_leader_id not in team_data.student_ids:
        raise HTTPException(status_code=400, detail="Team leader must be one of the team members")
    
    # Check if team name already exists in this school
    existing = await db.teams.find_one({
        "name": team_data.name,
        "school_id": team_data.school_id,
        "is_active": True
    })
    if existing:
        raise HTTPException(status_code=400, detail="Team name already exists in this school")
    
    # Create team
    team_id = str(uuid.uuid4())
    team = {
        "_id": team_id,
        "name": team_data.name,
        "school_id": team_data.school_id,
        "student_ids": team_data.student_ids,
        "team_leader_id": team_data.team_leader_id,
        "is_active": True,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.teams.insert_one(team)
    
    # Update students with team_id
    await db.users.update_many(
        {"_id": {"$in": team_data.student_ids}},
        {"$set": {"team_id": team_id}}
    )
    
    return {"message": "Team created successfully", "team_id": team_id}

@router.put("/{team_id}")
async def update_team(
    team_id: str,
    team_data: TeamCreate,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Update team details"""
    db = get_database()
    
    # Check if team exists
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Verify school exists
    school = await db.schools.find_one({"_id": team_data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Verify all students exist and belong to the school
    for student_id in team_data.student_ids:
        student = await db.users.find_one({"_id": student_id, "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
        if student.get("school_id") != team_data.school_id:
            raise HTTPException(status_code=400, detail=f"Student {student_id} does not belong to this school")
    
    # Verify team leader is in the student list
    if team_data.team_leader_id not in team_data.student_ids:
        raise HTTPException(status_code=400, detail="Team leader must be one of the team members")
    
    # Check if new name conflicts with existing team
    if team_data.name != team["name"]:
        existing = await db.teams.find_one({
            "name": team_data.name,
            "school_id": team_data.school_id,
            "is_active": True,
            "_id": {"$ne": team_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Team name already exists in this school")
    
    # Remove team_id from old students not in new list
    old_student_ids = set(team.get("student_ids", []))
    new_student_ids = set(team_data.student_ids)
    removed_students = old_student_ids - new_student_ids
    
    if removed_students:
        await db.users.update_many(
            {"_id": {"$in": list(removed_students)}},
            {"$set": {"team_id": None}}
        )
    
    # Update team
    await db.teams.update_one(
        {"_id": team_id},
        {
            "$set": {
                "name": team_data.name,
                "school_id": team_data.school_id,
                "student_ids": team_data.student_ids,
                "team_leader_id": team_data.team_leader_id
            }
        }
    )
    
    # Update new students with team_id
    await db.users.update_many(
        {"_id": {"$in": team_data.student_ids}},
        {"$set": {"team_id": team_id}}
    )
    
    return {"message": "Team updated successfully"}

@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Soft delete a team (deactivate)"""
    db = get_database()
    
    # Check if team exists
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if team has active inspections
    active_inspections = await db.inspections.count_documents({
        "team_id": team_id,
        "status": "assigned"
    })
    
    if active_inspections > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete team with {active_inspections} active inspections"
        )
    
    # Deactivate team
    await db.teams.update_one(
        {"_id": team_id},
        {"$set": {"is_active": False}}
    )
    
    # Remove team_id from students
    await db.users.update_many(
        {"team_id": team_id},
        {"$set": {"team_id": None}}
    )
    
    return {"message": "Team deleted successfully"}

@router.post("/{team_id}/activate")
async def activate_team(
    team_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Reactivate a deactivated team"""
    db = get_database()
    
    # Check if team exists
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Activate team
    await db.teams.update_one(
        {"_id": team_id},
        {"$set": {"is_active": True}}
    )
    
    # Restore team_id to students
    await db.users.update_many(
        {"_id": {"$in": team.get("student_ids", [])}},
        {"$set": {"team_id": team_id}}
    )
    
    return {"message": "Team activated successfully"}

@router.get("/{team_id}/performance")
async def get_team_performance(
    team_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get detailed performance analytics for a team"""
    db = get_database()
    
    # Get team
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # If headmaster, verify team belongs to their school
    if current_user.get("role") == "headmaster" and team.get("school_id") != current_user.get("school_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get inspection statistics
    total_inspections = await db.inspections.count_documents({"team_id": team_id})
    completed_inspections = await db.inspections.count_documents({
        "team_id": team_id,
        "status": {"$in": ["submitted", "responded", "closed"]}
    })
    pending_inspections = await db.inspections.count_documents({
        "team_id": team_id,
        "status": "assigned"
    })
    
    # Calculate completion rate
    completion_rate = (completed_inspections / total_inspections * 100) if total_inspections > 0 else 0
    
    # Get recent inspections
    recent_inspections = await db.inspections.find(
        {"team_id": team_id}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Enrich with office data
    recent_activity = []
    for inspection in recent_inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        recent_activity.append({
            "id": inspection["_id"],
            "task_name": inspection["task_name"],
            "office_name": office["name"] if office else "Unknown",
            "status": inspection["status"],
            "due_date": inspection["due_date"]
        })
    
    # Get team members info
    members = []
    for student_id in team.get("student_ids", []):
        student = await db.users.find_one({"_id": student_id})
        if student:
            members.append({
                "id": student["_id"],
                "name": student["name"],
                "email": student["email"],
                "grade": student.get("grade"),
                "is_leader": student_id == team.get("team_leader_id")
            })
    
    return {
        "team": {
            "id": team["_id"],
            "name": team["name"],
            "member_count": len(team.get("student_ids", []))
        },
        "performance": {
            "total_inspections": total_inspections,
            "completed_inspections": completed_inspections,
            "pending_inspections": pending_inspections,
            "completion_rate": round(completion_rate, 2)
        },
        "members": members,
        "recent_activity": recent_activity
    }
