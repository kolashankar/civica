from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import require_role, get_current_user
from services.analytics_service import (
    get_global_stats,
    get_inspection_trends,
    get_school_performance,
    get_office_compliance,
    get_status_distribution
)
from utils.database import get_database
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/global")
async def get_analytics_global(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get global system statistics"""
    stats = await get_global_stats()
    return stats

@router.get("/trends")
async def get_analytics_trends(
    days: int = 30,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get inspection trends over time"""
    trends = await get_inspection_trends(days)
    return {"trends": trends, "days": days}

@router.get("/schools")
async def get_analytics_schools(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get school performance metrics"""
    performance = await get_school_performance()
    return {"schools": performance}

@router.get("/offices")
async def get_analytics_offices(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get office compliance rates"""
    compliance = await get_office_compliance()
    return {"offices": compliance}

@router.get("/status-distribution")
async def get_analytics_status(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get distribution of inspections by status"""
    distribution = await get_status_distribution()
    return {"distribution": distribution}

@router.get("/school/{school_id}")
async def get_school_analytics(
    school_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get detailed analytics for a specific school"""
    db = get_database()
    
    # Verify school exists
    school = await db.schools.find_one({"_id": school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # If headmaster, verify they own this school
    if current_user.get("role") == "headmaster" and current_user.get("school_id") != school_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get school statistics
    total_students = await db.users.count_documents({"school_id": school_id, "role": "student", "is_active": True})
    active_teams = await db.teams.count_documents({"school_id": school_id, "is_active": True})
    
    # Get inspection statistics
    total_inspections = await db.inspections.count_documents({"school_id": school_id})
    completed_inspections = await db.inspections.count_documents({
        "school_id": school_id,
        "status": {"$in": ["submitted", "responded", "closed"]}
    })
    pending_inspections = await db.inspections.count_documents({
        "school_id": school_id,
        "status": "assigned"
    })
    
    completion_rate = (completed_inspections / total_inspections * 100) if total_inspections > 0 else 0
    
    # Get recent activity (last 10 inspections)
    recent_inspections = await db.inspections.find(
        {"school_id": school_id}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Enrich recent inspections with office and team data
    recent_activity = []
    for inspection in recent_inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        team = await db.teams.find_one({"_id": inspection["team_id"]})
        
        recent_activity.append({
            "id": inspection["_id"],
            "task_name": inspection["task_name"],
            "office_name": office["name"] if office else "Unknown",
            "team_name": team["name"] if team else "Unknown",
            "status": inspection["status"],
            "assigned_date": inspection["assigned_date"],
            "due_date": inspection["due_date"]
        })
    
    return {
        "school": {
            "id": school["_id"],
            "name": school["name"],
            "district": school["district"]
        },
        "stats": {
            "total_students": total_students,
            "active_teams": active_teams,
            "total_inspections": total_inspections,
            "completed_inspections": completed_inspections,
            "pending_inspections": pending_inspections,
            "completion_rate": round(completion_rate, 2)
        },
        "recent_activity": recent_activity
    }

@router.get("/school/{school_id}/activity")
async def get_school_activity_feed(
    school_id: str,
    days: int = 7,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get recent activity feed for a school"""
    db = get_database()
    
    # If headmaster, verify they own this school
    if current_user.get("role") == "headmaster" and current_user.get("school_id") != school_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get activities from last N days
    start_date = datetime.utcnow() - timedelta(days=days)
    
    activities = []
    
    # Recent inspection assignments
    inspections = await db.inspections.find({
        "school_id": school_id,
        "created_at": {"$gte": start_date}
    }).sort("created_at", -1).limit(20).to_list(20)
    
    for inspection in inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        team = await db.teams.find_one({"_id": inspection["team_id"]})
        
        activities.append({
            "type": "inspection_assigned",
            "date": inspection["created_at"].isoformat(),
            "description": f"New inspection '{inspection['task_name']}' assigned to {team['name'] if team else 'Unknown'}",
            "inspection_id": inspection["_id"],
            "status": inspection["status"]
        })
    
    # Sort by date
    activities.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "activities": activities[:15],  # Return top 15
        "total": len(activities)
    }
