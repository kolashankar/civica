from fastapi import APIRouter, HTTPException, Depends, Query
from models.inspection import Inspection, InspectionSubmit, InspectionReport, InspectionCreate
from middleware.auth import get_current_user, require_role
from utils.database import get_database
from services.assignment_service import assign_random_team
from datetime import datetime
from typing import List, Optional
import uuid

router = APIRouter(prefix="/inspections", tags=["inspections"])

@router.get("/team/{team_id}")
async def get_team_inspections(team_id: str, current_user: dict = Depends(get_current_user)):
    """Get all inspections assigned to a team"""
    db = get_database()
    
    # Verify user belongs to the team
    if current_user.get("team_id") != team_id and current_user.get("role") not in ["admin", "headmaster"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this team's inspections")
    
    inspections = await db.inspections.find({"team_id": team_id}).to_list(100)
    
    # Enrich with office and school data
    for inspection in inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        school = await db.schools.find_one({"_id": inspection["school_id"]})
        
        inspection["office"] = office if office else None
        inspection["school"] = school if school else None
    
    return inspections

@router.get("/{inspection_id}")
async def get_inspection_detail(inspection_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed inspection information"""
    db = get_database()
    
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Verify access
    if current_user.get("role") == "student":
        if current_user.get("team_id") != inspection["team_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to view this inspection")
    
    # Enrich with related data
    office = await db.offices.find_one({"_id": inspection["office_id"]})
    school = await db.schools.find_one({"_id": inspection["school_id"]})
    team = await db.teams.find_one({"_id": inspection["team_id"]})
    template = await db.templates.find_one({"_id": inspection["template_id"]})
    
    inspection["office"] = office
    inspection["school"] = school
    inspection["team"] = team
    inspection["template"] = template
    
    return inspection

@router.post("/{inspection_id}/submit")
async def submit_inspection_report(
    inspection_id: str,
    report_data: InspectionSubmit,
    current_user: dict = Depends(get_current_user)
):
    """Submit inspection report"""
    db = get_database()
    
    # Get inspection
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Verify user belongs to assigned team
    if current_user.get("team_id") != inspection["team_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to submit this inspection")
    
    # Check if already submitted
    if inspection.get("status") != "assigned":
        raise HTTPException(status_code=400, detail="Inspection already submitted")
    
    # Create report
    report = {
        "cleanliness_rating": report_data.cleanliness_rating,
        "staff_behavior_rating": report_data.staff_behavior_rating,
        "service_quality_rating": report_data.service_quality_rating,
        "issues": report_data.issues,
        "complaints": report_data.complaints,
        "suggestions": report_data.suggestions,
        "photos": report_data.photos,
        "submitted_at": datetime.utcnow(),
        "submitted_by": current_user["_id"]
    }
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {
            "$set": {
                "report": report,
                "status": "submitted"
            }
        }
    )
    
    return {"message": "Inspection report submitted successfully", "inspection_id": inspection_id}

@router.get("/history/{team_id}")
async def get_team_history(team_id: str, current_user: dict = Depends(get_current_user)):
    """Get completed inspections for a team"""
    db = get_database()
    
    # Verify access
    if current_user.get("team_id") != team_id and current_user.get("role") not in ["admin", "headmaster"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    inspections = await db.inspections.find({
        "team_id": team_id,
        "status": {"$in": ["submitted", "responded", "closed", "escalated"]}
    }).to_list(100)
    
    # Enrich with office data
    for inspection in inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        inspection["office"] = office
    
    return inspections


# ============ OFFICE ROUTES ============

@router.get("/office/{office_id}")
async def get_office_inspections(
    office_id: str,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    school_id: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all inspections for a specific office"""
    db = get_database()
    
    # Verify user belongs to the office or is admin
    if current_user.get("role") == "office":
        if current_user.get("office_id") != office_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this office's inspections")
    elif current_user.get("role") not in ["admin", "responder"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build query
    query = {"office_id": office_id}
    
    if status:
        query["status"] = status
    if school_id:
        query["school_id"] = school_id
    if priority:
        query["priority"] = priority
    if date_from:
        query["assigned_date"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "assigned_date" in query:
            query["assigned_date"]["$lte"] = datetime.fromisoformat(date_to)
        else:
            query["assigned_date"] = {"$lte": datetime.fromisoformat(date_to)}
    
    # Get inspections
    inspections = await db.inspections.find(query).sort("assigned_date", -1).to_list(100)
    
    # Enrich with school and team data
    for inspection in inspections:
        school = await db.schools.find_one({"_id": inspection["school_id"]})
        team = await db.teams.find_one({"_id": inspection["team_id"]})
        
        inspection["school"] = school
        inspection["team"] = team
    
    return inspections


@router.get("/office/{office_id}/stats")
async def get_office_stats(
    office_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get statistics for office dashboard"""
    db = get_database()
    
    # Verify user belongs to the office or is admin
    if current_user.get("role") == "office":
        if current_user.get("office_id") != office_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.get("role") not in ["admin", "responder"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all inspections for this office
    all_inspections = await db.inspections.find({"office_id": office_id}).to_list(1000)
    
    total = len(all_inspections)
    pending = len([i for i in all_inspections if i["status"] in ["assigned", "submitted"]])
    responded = len([i for i in all_inspections if i["status"] in ["responded", "closed"]])
    
    # Calculate average rating
    ratings = []
    for inspection in all_inspections:
        if inspection.get("report"):
            report = inspection["report"]
            if report.get("cleanliness_rating") and report.get("staff_behavior_rating") and report.get("service_quality_rating"):
                avg = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                ratings.append(avg)
    
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    
    # Get overdue inspections (submitted more than 7 days ago without response)
    overdue = []
    for inspection in all_inspections:
        if inspection["status"] == "submitted" and inspection.get("report"):
            submitted_at = inspection["report"].get("submitted_at")
            if submitted_at:
                days_since_submission = (datetime.utcnow() - submitted_at).days
                if days_since_submission > 7:
                    overdue.append(inspection)
    
    return {
        "total": total,
        "pending": pending,
        "responded": responded,
        "avg_rating": avg_rating,
        "overdue_count": len(overdue),
        "overdue_inspections": overdue[:5]  # Return first 5 overdue
    }


@router.post("/{inspection_id}/office-response")
async def submit_office_response(
    inspection_id: str,
    response_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit office response to inspection report"""
    db = get_database()
    
    # Get inspection
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Verify user belongs to the office
    if current_user.get("role") == "office":
        if current_user.get("office_id") != inspection["office_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to respond to this inspection")
    elif current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if report exists
    if not inspection.get("report"):
        raise HTTPException(status_code=400, detail="No report submitted yet")
    
    # Check if already responded
    if inspection.get("office_response"):
        raise HTTPException(status_code=400, detail="Office has already responded to this inspection")
    
    # Validate response data
    response_text = response_data.get("response_text", "")
    action_taken = response_data.get("action_taken", "")
    
    if len(response_text) < 50:
        raise HTTPException(status_code=400, detail="Response text must be at least 50 characters")
    if not action_taken:
        raise HTTPException(status_code=400, detail="Actions taken is required")
    
    # Create office response
    office_response = {
        "response_text": response_text,
        "action_taken": action_taken,
        "remarks": response_data.get("remarks", ""),
        "responded_at": datetime.utcnow(),
        "responded_by": current_user["_id"]
    }
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {
            "$set": {
                "office_response": office_response,
                "status": "responded"
            }
        }
    )
    
    # TODO: Create notification for govt responder
    
    return {"message": "Office response submitted successfully", "inspection_id": inspection_id}


@router.put("/{inspection_id}/office-response")
async def edit_office_response(
    inspection_id: str,
    response_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Edit office response (only before govt review)"""
    db = get_database()
    
    # Get inspection
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Verify user belongs to the office
    if current_user.get("role") == "office":
        if current_user.get("office_id") != inspection["office_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to edit this response")
    elif current_user.get("role") not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if response exists
    if not inspection.get("office_response"):
        raise HTTPException(status_code=400, detail="No response to edit")
    
    # Check if govt has reviewed (cannot edit after review)
    if inspection.get("govt_review"):
        raise HTTPException(status_code=400, detail="Cannot edit response after government review")
    
    # Validate response data
    response_text = response_data.get("response_text", "")
    action_taken = response_data.get("action_taken", "")
    
    if len(response_text) < 50:
        raise HTTPException(status_code=400, detail="Response text must be at least 50 characters")
    if not action_taken:
        raise HTTPException(status_code=400, detail="Actions taken is required")
    
    # Update office response
    office_response = {
        "response_text": response_text,
        "action_taken": action_taken,
        "remarks": response_data.get("remarks", ""),
        "responded_at": inspection["office_response"]["responded_at"],  # Keep original date
        "responded_by": inspection["office_response"]["responded_by"],  # Keep original user
        "edited_at": datetime.utcnow(),
        "edited_by": current_user["_id"]
    }
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {"$set": {"office_response": office_response}}
    )
    
    return {"message": "Office response updated successfully"}


# ============ HEADMASTER ROUTES ============

@router.post("/{inspection_id}/approve")
async def approve_inspection_report(
    inspection_id: str,
    approval_data: dict,
    current_user: dict = Depends(require_role(["headmaster", "admin"]))
):
    """Approve or reject an inspection report (headmaster/admin only)"""
    db = get_database()
    
    # Get inspection
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Verify headmaster owns the school
    if current_user.get("role") == "headmaster":
        if current_user.get("school_id") != inspection["school_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to approve this inspection")
    
    # Check if report exists
    if not inspection.get("report"):
        raise HTTPException(status_code=400, detail="No report submitted yet")
    
    # Check if already approved/rejected
    if inspection["status"] != "submitted":
        raise HTTPException(status_code=400, detail="Inspection is not in submitted status")
    
    approved = approval_data.get("approved", True)
    comments = approval_data.get("comments", "")
    
    # Create approval record
    approval = {
        "approved": approved,
        "comments": comments,
        "approved_by": current_user["_id"],
        "approved_at": datetime.utcnow()
    }
    
    # Update inspection
    update_data = {
        "headmaster_approval": approval
    }
    
    # If rejected, keep status as submitted so students can resubmit
    # If approved, move to next stage
    if approved:
        update_data["status"] = "responded"  # Move to next stage
    
    await db.inspections.update_one(
        {"_id": inspection_id},
        {"$set": update_data}
    )
    
    # TODO: Create notification for the team
    
    return {
        "message": f"Report {'approved' if approved else 'rejected'} successfully",
        "approved": approved
    }



# ============ ADMIN ROUTES ============

@router.get("")
async def get_all_inspections(
    skip: int = 0,
    limit: int = 10,
    status: Optional[str] = None,
    school_id: Optional[str] = None,
    office_id: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get all inspections with filtering (admin only)"""
    db = get_database()
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if school_id:
        query["school_id"] = school_id
    if office_id:
        query["office_id"] = office_id
    if priority:
        query["priority"] = priority
    
    # Get total count
    total = await db.inspections.count_documents(query)
    
    # Get inspections
    inspections = await db.inspections.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enrich with related data
    for inspection in inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        school = await db.schools.find_one({"_id": inspection["school_id"]})
        team = await db.teams.find_one({"_id": inspection["team_id"]})
        
        inspection["office"] = office
        inspection["school"] = school
        inspection["team"] = team
    
    return {
        "inspections": inspections,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("")
async def create_inspection(
    inspection_data: InspectionCreate,
    auto_assign: bool = False,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Create a new inspection (admin only)"""
    db = get_database()
    
    # Verify school exists
    school = await db.schools.find_one({"_id": inspection_data.school_id})
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Verify office exists
    office = await db.offices.find_one({"_id": inspection_data.office_id})
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Verify template exists
    template = await db.templates.find_one({"_id": inspection_data.template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Assign team
    if auto_assign or not inspection_data.team_id:
        try:
            team_id = await assign_random_team(inspection_data.school_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        team_id = inspection_data.team_id
        # Verify team exists and belongs to school
        team = await db.teams.find_one({"_id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team["school_id"] != inspection_data.school_id:
            raise HTTPException(status_code=400, detail="Team does not belong to selected school")
    
    # Create inspection
    inspection_id = str(uuid.uuid4())
    inspection = {
        "_id": inspection_id,
        "task_name": inspection_data.task_name,
        "task_description": inspection_data.task_description,
        "office_id": inspection_data.office_id,
        "school_id": inspection_data.school_id,
        "team_id": team_id,
        "assigned_date": datetime.utcnow(),
        "due_date": inspection_data.due_date,
        "status": "assigned",
        "priority": inspection_data.priority,
        "template_id": inspection_data.template_id,
        "report": None,
        "office_response": None,
        "govt_review": None,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.inspections.insert_one(inspection)
    
    # TODO: Create notification for assigned team
    
    return {"message": "Inspection created successfully", "inspection_id": inspection_id, "team_id": team_id}


@router.put("/{inspection_id}")
async def update_inspection(
    inspection_id: str,
    inspection_data: InspectionCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update inspection details (admin only)"""
    db = get_database()
    
    # Check if inspection exists
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Cannot update submitted inspections
    if inspection["status"] != "assigned":
        raise HTTPException(status_code=400, detail="Cannot update inspection that has been submitted")
    
    # Verify team belongs to school
    if inspection_data.team_id:
        team = await db.teams.find_one({"_id": inspection_data.team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team["school_id"] != inspection_data.school_id:
            raise HTTPException(status_code=400, detail="Team does not belong to selected school")
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {
            "$set": {
                "task_name": inspection_data.task_name,
                "task_description": inspection_data.task_description,
                "office_id": inspection_data.office_id,
                "school_id": inspection_data.school_id,
                "team_id": inspection_data.team_id,
                "due_date": inspection_data.due_date,
                "priority": inspection_data.priority,
                "template_id": inspection_data.template_id
            }
        }
    )
    
    return {"message": "Inspection updated successfully"}


@router.post("/{inspection_id}/reassign")
async def reassign_inspection(
    inspection_id: str,
    team_id: str,
    reason: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Reassign inspection to a different team"""
    db = get_database()
    
    # Check if inspection exists
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Cannot reassign completed inspections
    if inspection["status"] in ["closed"]:
        raise HTTPException(status_code=400, detail="Cannot reassign closed inspection")
    
    # Verify new team exists
    team = await db.teams.find_one({"_id": team_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Verify team belongs to same school
    if team["school_id"] != inspection["school_id"]:
        raise HTTPException(status_code=400, detail="Team must belong to the same school")
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {
            "$set": {
                "team_id": team_id,
                "status": "assigned",  # Reset to assigned
                "report": None  # Clear any existing report
            }
        }
    )
    
    # TODO: Create notification for new team
    
    return {"message": f"Inspection reassigned to team {team['name']} successfully"}


@router.post("/{inspection_id}/override-status")
async def override_inspection_status(
    inspection_id: str,
    status: str,
    reason: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Override inspection status (admin only)"""
    db = get_database()
    
    # Check if inspection exists
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Validate status
    valid_statuses = ["assigned", "submitted", "responded", "closed", "escalated"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {
            "$set": {
                "status": status,
                "admin_override": {
                    "overridden_by": current_user["_id"],
                    "overridden_at": datetime.utcnow(),
                    "reason": reason,
                    "previous_status": inspection["status"]
                }
            }
        }
    )
    
    return {"message": f"Inspection status overridden to '{status}'"}


@router.delete("/{inspection_id}")
async def delete_inspection(
    inspection_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Delete an inspection (admin only)"""
    db = get_database()
    
    # Check if inspection exists
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Delete inspection
    await db.inspections.delete_one({"_id": inspection_id})
    
    return {"message": "Inspection deleted successfully"}
