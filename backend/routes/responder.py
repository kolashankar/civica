from fastapi import APIRouter, HTTPException, Depends, Query
from middleware.auth import get_current_user, require_role
from utils.database import get_database
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from models.escalation import Escalation, FollowUpRequest, ResolveRequest, ReEscalateRequest, FollowUp
import uuid

router = APIRouter(prefix="/responder", tags=["responder"])


class GovtReviewRequest(BaseModel):
    review_status: str  # approved, escalated, more_info
    review_comments: str
    escalation_reason: Optional[str] = None
    action_items: Optional[List[str]] = []
    notify_parties: Optional[List[str]] = []


# ============ DASHBOARD & STATISTICS ============

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(require_role(["responder", "admin"]))):
    """Get system-wide statistics for responder dashboard"""
    db = get_database()
    
    # Get all inspections
    all_inspections = await db.inspections.find({}).to_list(10000)
    
    total_inspections = len(all_inspections)
    active_inspections = len([i for i in all_inspections if i["status"] in ["assigned", "submitted", "responded"]])
    pending_reviews = len([i for i in all_inspections if i["status"] in ["submitted", "responded"]])
    escalated_issues = len([i for i in all_inspections if i["status"] == "escalated"])
    
    # Calculate average response time (from submission to office response)
    response_times = []
    for inspection in all_inspections:
        if inspection.get("report") and inspection.get("office_response"):
            submitted_at = inspection["report"].get("submitted_at")
            responded_at = inspection["office_response"].get("responded_at")
            if submitted_at and responded_at:
                time_diff = (responded_at - submitted_at).total_seconds() / 86400  # Convert to days
                response_times.append(time_diff)
    
    avg_response_time = round(sum(response_times) / len(response_times), 1) if response_times else 0
    
    # Calculate compliance rate (% of offices that responded within 7 days)
    on_time_responses = len([rt for rt in response_times if rt <= 7])
    compliance_rate = round((on_time_responses / len(response_times) * 100), 1) if response_times else 0
    
    # Calculate resolution rate (% of closed inspections)
    closed_inspections = len([i for i in all_inspections if i["status"] == "closed"])
    resolution_rate = round((closed_inspections / total_inspections * 100), 1) if total_inspections > 0 else 0
    
    # Calculate escalation rate
    escalation_rate = round((escalated_issues / total_inspections * 100), 1) if total_inspections > 0 else 0
    
    return {
        "overview": {
            "total_inspections": total_inspections,
            "active_inspections": active_inspections,
            "pending_reviews": pending_reviews,
            "escalated_issues": escalated_issues
        },
        "metrics": {
            "avg_response_time": avg_response_time,
            "compliance_rate": compliance_rate,
            "resolution_rate": resolution_rate,
            "escalation_rate": escalation_rate
        }
    }


@router.get("/inspections/priority")
async def get_priority_items(current_user: dict = Depends(require_role(["responder", "admin"]))):
    """Get priority items: overdue responses, critical issues, repeated violations"""
    db = get_database()
    
    # Get all inspections
    all_inspections = await db.inspections.find({}).to_list(10000)
    
    # Overdue responses (submitted more than 7 days ago without office response)
    overdue_responses = []
    for inspection in all_inspections:
        if inspection["status"] == "submitted" and inspection.get("report"):
            submitted_at = inspection["report"].get("submitted_at")
            if submitted_at:
                days_since_submission = (datetime.utcnow() - submitted_at).days
                if days_since_submission > 7:
                    # Enrich with office and school data
                    office = await db.offices.find_one({"_id": inspection["office_id"]})
                    school = await db.schools.find_one({"_id": inspection["school_id"]})
                    inspection["office"] = office
                    inspection["school"] = school
                    inspection["days_overdue"] = days_since_submission - 7
                    overdue_responses.append(inspection)
    
    # Sort by days overdue
    overdue_responses.sort(key=lambda x: x["days_overdue"], reverse=True)
    
    # Critical issues (low ratings and high priority)
    critical_issues = []
    for inspection in all_inspections:
        if inspection.get("report") and inspection["priority"] == "high":
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                if avg_rating <= 2.5:  # Low rating threshold
                    office = await db.offices.find_one({"_id": inspection["office_id"]})
                    school = await db.schools.find_one({"_id": inspection["school_id"]})
                    inspection["office"] = office
                    inspection["school"] = school
                    inspection["avg_rating"] = round(avg_rating, 1)
                    critical_issues.append(inspection)
    
    # Sort by rating (lowest first)
    critical_issues.sort(key=lambda x: x["avg_rating"])
    
    # Repeated violations (offices with multiple low-rated inspections)
    office_violations = {}
    for inspection in all_inspections:
        if inspection.get("report"):
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                if avg_rating < 3:  # Below average rating
                    office_id = inspection["office_id"]
                    if office_id not in office_violations:
                        office_violations[office_id] = {
                            "office_id": office_id,
                            "violation_count": 0,
                            "avg_ratings": [],
                            "inspections": []
                        }
                    office_violations[office_id]["violation_count"] += 1
                    office_violations[office_id]["avg_ratings"].append(avg_rating)
                    office_violations[office_id]["inspections"].append(inspection["_id"])
    
    # Filter offices with more than 2 violations
    repeated_violations = []
    for office_id, data in office_violations.items():
        if data["violation_count"] >= 2:
            office = await db.offices.find_one({"_id": office_id})
            if office:
                repeated_violations.append({
                    "office": office,
                    "violation_count": data["violation_count"],
                    "avg_rating": round(sum(data["avg_ratings"]) / len(data["avg_ratings"]), 1),
                    "inspection_ids": data["inspections"]
                })
    
    # Sort by violation count
    repeated_violations.sort(key=lambda x: x["violation_count"], reverse=True)
    
    return {
        "overdue_responses": overdue_responses[:10],  # Top 10
        "critical_issues": critical_issues[:10],  # Top 10
        "repeated_violations": repeated_violations[:10]  # Top 10
    }


@router.get("/inspections/recent-activity")
async def get_recent_activity(
    limit: int = 20,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Get recent activity feed"""
    db = get_database()
    
    # Get recent inspections sorted by updated time
    recent_inspections = await db.inspections.find({}).sort("created_at", -1).limit(limit).to_list(limit)
    
    activity_feed = []
    
    for inspection in recent_inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        school = await db.schools.find_one({"_id": inspection["school_id"]})
        
        # Determine activity type and timestamp
        if inspection.get("govt_review"):
            activity_feed.append({
                "type": "review",
                "timestamp": inspection["govt_review"].get("reviewed_at"),
                "inspection_id": inspection["_id"],
                "task_name": inspection["task_name"],
                "office_name": office["name"] if office else "Unknown",
                "school_name": school["name"] if school else "Unknown",
                "status": inspection["status"],
                "review_status": inspection["govt_review"].get("review_status")
            })
        elif inspection.get("office_response"):
            activity_feed.append({
                "type": "response",
                "timestamp": inspection["office_response"].get("responded_at"),
                "inspection_id": inspection["_id"],
                "task_name": inspection["task_name"],
                "office_name": office["name"] if office else "Unknown",
                "school_name": school["name"] if school else "Unknown",
                "status": inspection["status"]
            })
        elif inspection.get("report"):
            activity_feed.append({
                "type": "submission",
                "timestamp": inspection["report"].get("submitted_at"),
                "inspection_id": inspection["_id"],
                "task_name": inspection["task_name"],
                "office_name": office["name"] if office else "Unknown",
                "school_name": school["name"] if school else "Unknown",
                "status": inspection["status"]
            })
        else:
            activity_feed.append({
                "type": "assignment",
                "timestamp": inspection["assigned_date"],
                "inspection_id": inspection["_id"],
                "task_name": inspection["task_name"],
                "office_name": office["name"] if office else "Unknown",
                "school_name": school["name"] if school else "Unknown",
                "status": inspection["status"]
            })
    
    # Sort by timestamp
    activity_feed.sort(key=lambda x: x["timestamp"] if x["timestamp"] else datetime.min, reverse=True)
    
    return activity_feed


# ============ INSPECTION MANAGEMENT ============

@router.get("/inspections")
async def get_all_inspections(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    school_id: Optional[str] = None,
    office_id: Optional[str] = None,
    district: Optional[str] = None,
    priority: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    rating_min: Optional[float] = None,
    rating_max: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "date_desc",  # date_asc, date_desc, priority, rating_asc, rating_desc, response_time
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Get all inspections with advanced filtering and sorting"""
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
    if date_from:
        query["assigned_date"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "assigned_date" in query:
            query["assigned_date"]["$lte"] = datetime.fromisoformat(date_to)
        else:
            query["assigned_date"] = {"$lte": datetime.fromisoformat(date_to)}
    
    # Get all matching inspections
    inspections = await db.inspections.find(query).to_list(10000)
    
    # Enrich with related data and calculate additional fields
    enriched_inspections = []
    for inspection in inspections:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        school = await db.schools.find_one({"_id": inspection["school_id"]})
        team = await db.teams.find_one({"_id": inspection["team_id"]})
        
        inspection["office"] = office
        inspection["school"] = school
        inspection["team"] = team
        
        # Calculate average rating
        if inspection.get("report"):
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                inspection["avg_rating"] = round(avg_rating, 1)
            else:
                inspection["avg_rating"] = None
        else:
            inspection["avg_rating"] = None
        
        # Calculate response time in days
        if inspection.get("report") and inspection.get("office_response"):
            submitted_at = inspection["report"].get("submitted_at")
            responded_at = inspection["office_response"].get("responded_at")
            if submitted_at and responded_at:
                time_diff = (responded_at - submitted_at).days
                inspection["response_time_days"] = time_diff
            else:
                inspection["response_time_days"] = None
        else:
            inspection["response_time_days"] = None
        
        # Apply district filter
        if district and office:
            if office.get("district") != district:
                continue
        
        # Apply rating filter
        if rating_min is not None and inspection["avg_rating"] is not None:
            if inspection["avg_rating"] < rating_min:
                continue
        if rating_max is not None and inspection["avg_rating"] is not None:
            if inspection["avg_rating"] > rating_max:
                continue
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            if not any([
                search_lower in inspection["_id"].lower(),
                search_lower in (office["name"].lower() if office else ""),
                search_lower in (school["name"].lower() if school else ""),
                search_lower in inspection["task_name"].lower()
            ]):
                continue
        
        enriched_inspections.append(inspection)
    
    # Sort inspections
    if sort_by == "date_asc":
        enriched_inspections.sort(key=lambda x: x["assigned_date"])
    elif sort_by == "date_desc":
        enriched_inspections.sort(key=lambda x: x["assigned_date"], reverse=True)
    elif sort_by == "priority":
        priority_order = {"high": 0, "medium": 1, "low": 2}
        enriched_inspections.sort(key=lambda x: priority_order.get(x["priority"], 3))
    elif sort_by == "rating_asc":
        enriched_inspections.sort(key=lambda x: x["avg_rating"] if x["avg_rating"] is not None else 999)
    elif sort_by == "rating_desc":
        enriched_inspections.sort(key=lambda x: x["avg_rating"] if x["avg_rating"] is not None else -1, reverse=True)
    elif sort_by == "response_time":
        enriched_inspections.sort(key=lambda x: x["response_time_days"] if x["response_time_days"] is not None else 999)
    
    # Pagination
    total = len(enriched_inspections)
    paginated_inspections = enriched_inspections[skip:skip + limit]
    
    return {
        "inspections": paginated_inspections,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/inspections/{inspection_id}/full")
async def get_inspection_full_detail(
    inspection_id: str,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Get complete inspection details with all related data"""
    db = get_database()
    
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Enrich with all related data
    office = await db.offices.find_one({"_id": inspection["office_id"]})
    school = await db.schools.find_one({"_id": inspection["school_id"]})
    team = await db.teams.find_one({"_id": inspection["team_id"]})
    template = await db.templates.find_one({"_id": inspection["template_id"]})
    
    # Get team members
    if team:
        team_members = await db.users.find({"_id": {"$in": team.get("student_ids", [])}}).to_list(100)
        team["members"] = team_members
    
    # Get headmaster info
    if school:
        headmaster = await db.users.find_one({"_id": school.get("headmaster_id")})
        school["headmaster"] = headmaster
    
    # Get office user who responded
    if inspection.get("office_response"):
        responder_id = inspection["office_response"].get("responded_by")
        if responder_id:
            office_user = await db.users.find_one({"_id": responder_id})
            inspection["office_response"]["responder"] = office_user
    
    # Get govt reviewer
    if inspection.get("govt_review"):
        reviewer_id = inspection["govt_review"].get("reviewed_by")
        if reviewer_id:
            govt_user = await db.users.find_one({"_id": reviewer_id})
            inspection["govt_review"]["reviewer"] = govt_user
    
    inspection["office"] = office
    inspection["school"] = school
    inspection["team"] = team
    inspection["template"] = template
    
    # Calculate average rating
    if inspection.get("report"):
        report = inspection["report"]
        if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
            avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
            inspection["avg_rating"] = round(avg_rating, 1)
    
    return inspection


@router.post("/inspections/{inspection_id}/govt-review")
async def submit_govt_review(
    inspection_id: str,
    review_data: GovtReviewRequest,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Submit government review for an inspection"""
    db = get_database()
    
    # Get inspection
    inspection = await db.inspections.find_one({"_id": inspection_id})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Validate that inspection has office response
    if not inspection.get("office_response"):
        raise HTTPException(status_code=400, detail="Cannot review inspection without office response")
    
    # Validate review data
    if len(review_data.review_comments) < 30:
        raise HTTPException(status_code=400, detail="Review comments must be at least 30 characters")
    
    valid_statuses = ["approved", "escalated", "more_info"]
    if review_data.review_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid review status. Must be one of: {valid_statuses}")
    
    if review_data.review_status == "escalated" and not review_data.escalation_reason:
        raise HTTPException(status_code=400, detail="Escalation reason is required when escalating")
    
    # Create govt review
    govt_review = {
        "review_status": review_data.review_status,
        "review_comments": review_data.review_comments,
        "escalation_reason": review_data.escalation_reason,
        "action_items": review_data.action_items,
        "reviewed_at": datetime.utcnow(),
        "reviewed_by": current_user["_id"]
    }
    
    # Determine new inspection status
    if review_data.review_status == "approved":
        new_status = "closed"
    elif review_data.review_status == "escalated":
        new_status = "escalated"
    else:  # more_info
        new_status = "responded"  # Send back to responded status
    
    # Update inspection
    await db.inspections.update_one(
        {"_id": inspection_id},
        {
            "$set": {
                "govt_review": govt_review,
                "status": new_status
            }
        }
    )
    
    # TODO: Create notifications for relevant parties based on notify_parties
    
    return {
        "message": "Government review submitted successfully",
        "inspection_id": inspection_id,
        "new_status": new_status
    }


@router.put("/inspections/{inspection_id}/status")
async def update_inspection_status(
    inspection_id: str,
    status: str,
    reason: Optional[str] = None,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Update inspection status (responder override)"""
    db = get_database()
    
    # Get inspection
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
                "responder_override": {
                    "overridden_by": current_user["_id"],
                    "overridden_at": datetime.utcnow(),
                    "reason": reason,
                    "previous_status": inspection["status"]
                }
            }
        }
    )
    
    return {"message": f"Inspection status updated to '{status}'"}


# ============ ANALYTICS ============

@router.get("/analytics/system")
async def get_system_analytics(
    days: int = 30,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Get system-wide analytics"""
    db = get_database()
    
    # Get all inspections
    all_inspections = await db.inspections.find({}).to_list(10000)
    
    # Calculate date range
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Inspections over time
    inspections_by_date = {}
    for inspection in all_inspections:
        if inspection["assigned_date"] >= start_date:
            date_key = inspection["assigned_date"].strftime("%Y-%m-%d")
            inspections_by_date[date_key] = inspections_by_date.get(date_key, 0) + 1
    
    inspections_over_time = [{"date": k, "count": v} for k, v in sorted(inspections_by_date.items())]
    
    # Status distribution
    status_distribution = {}
    for inspection in all_inspections:
        status = inspection["status"]
        status_distribution[status] = status_distribution.get(status, 0) + 1
    
    status_data = [{"status": k, "count": v} for k, v in status_distribution.items()]
    
    # Office type compliance (offices grouped by type)
    offices = await db.offices.find({}).to_list(1000)
    office_compliance = {}
    
    for office in offices:
        office_type = office.get("type", "other")
        if office_type not in office_compliance:
            office_compliance[office_type] = {
                "total": 0,
                "on_time": 0
            }
        
        # Get inspections for this office
        office_inspections = [i for i in all_inspections if i["office_id"] == office["_id"]]
        
        for inspection in office_inspections:
            if inspection.get("report") and inspection.get("office_response"):
                office_compliance[office_type]["total"] += 1
                submitted_at = inspection["report"].get("submitted_at")
                responded_at = inspection["office_response"].get("responded_at")
                if submitted_at and responded_at:
                    time_diff = (responded_at - submitted_at).days
                    if time_diff <= 7:
                        office_compliance[office_type]["on_time"] += 1
    
    office_compliance_data = []
    for office_type, data in office_compliance.items():
        compliance_rate = (data["on_time"] / data["total"] * 100) if data["total"] > 0 else 0
        office_compliance_data.append({
            "office_type": office_type,
            "compliance_rate": round(compliance_rate, 1),
            "total_inspections": data["total"]
        })
    
    # Rating trends over time
    rating_trends = {}
    for inspection in all_inspections:
        if inspection.get("report") and inspection["assigned_date"] >= start_date:
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                date_key = inspection["assigned_date"].strftime("%Y-%m-%d")
                if date_key not in rating_trends:
                    rating_trends[date_key] = {"ratings": [], "count": 0}
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                rating_trends[date_key]["ratings"].append(avg_rating)
                rating_trends[date_key]["count"] += 1
    
    rating_data = []
    for date_key, data in sorted(rating_trends.items()):
        if data["ratings"]:
            avg = sum(data["ratings"]) / len(data["ratings"])
            rating_data.append({
                "date": date_key,
                "average_rating": round(avg, 2),
                "count": data["count"]
            })
    
    # Response time distribution
    response_times = []
    for inspection in all_inspections:
        if inspection.get("report") and inspection.get("office_response"):
            submitted_at = inspection["report"].get("submitted_at")
            responded_at = inspection["office_response"].get("responded_at")
            if submitted_at and responded_at:
                time_diff = (responded_at - submitted_at).days
                response_times.append(time_diff)
    
    response_time_buckets = {
        "0-3 days": 0,
        "4-7 days": 0,
        "8-14 days": 0,
        "15+ days": 0
    }
    
    for rt in response_times:
        if rt <= 3:
            response_time_buckets["0-3 days"] += 1
        elif rt <= 7:
            response_time_buckets["4-7 days"] += 1
        elif rt <= 14:
            response_time_buckets["8-14 days"] += 1
        else:
            response_time_buckets["15+ days"] += 1
    
    response_time_data = [{"bucket": k, "count": v} for k, v in response_time_buckets.items()]
    
    # Issue categories
    issue_categories = {}
    for inspection in all_inspections:
        if inspection.get("report") and inspection["report"].get("issues"):
            issues_text = inspection["report"]["issues"].lower()
            
            if any(word in issues_text for word in ["clean", "dirty", "garbage", "waste", "hygiene"]):
                issue_categories["Cleanliness"] = issue_categories.get("Cleanliness", 0) + 1
            if any(word in issues_text for word in ["staff", "behavior", "rude", "attitude"]):
                issue_categories["Staff Behavior"] = issue_categories.get("Staff Behavior", 0) + 1
            if any(word in issues_text for word in ["service", "slow", "delay", "queue", "waiting"]):
                issue_categories["Service Quality"] = issue_categories.get("Service Quality", 0) + 1
            if any(word in issues_text for word in ["infrastructure", "building", "facility", "equipment"]):
                issue_categories["Infrastructure"] = issue_categories.get("Infrastructure", 0) + 1
    
    issue_data = [{"category": k, "count": v} for k, v in issue_categories.items()]
    
    return {
        "inspections_over_time": inspections_over_time,
        "status_distribution": status_data,
        "office_compliance": office_compliance_data,
        "rating_trends": rating_data,
        "response_times": response_time_data,
        "issue_categories": issue_data
    }


# ============ ESCALATION MANAGEMENT ============

@router.get("/escalations")
async def get_all_escalations(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    office_id: Optional[str] = None,
    escalation_reason: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    severity: Optional[str] = None,
    sort_by: Optional[str] = "date_desc",  # date_asc, date_desc, severity
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Get all escalations with filters"""
    db = get_database()
    
    # Build query
    query = {}
    
    if status:
        query["status"] = status
    if office_id:
        query["office_id"] = office_id
    if escalation_reason:
        query["escalation_reason"] = escalation_reason
    if severity:
        query["severity"] = severity
    if date_from:
        query["escalated_at"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "escalated_at" in query:
            query["escalated_at"]["$lte"] = datetime.fromisoformat(date_to)
        else:
            query["escalated_at"] = {"$lte": datetime.fromisoformat(date_to)}
    
    # Get all matching escalations
    escalations = await db.escalations.find(query).to_list(10000)
    
    # Enrich with inspection and related data
    enriched_escalations = []
    for escalation in escalations:
        # Get inspection
        inspection = await db.inspections.find_one({"_id": escalation["inspection_id"]})
        if inspection:
            office = await db.offices.find_one({"_id": inspection["office_id"]})
            school = await db.schools.find_one({"_id": inspection["school_id"]})
            
            escalation["inspection"] = inspection
            escalation["office"] = office
            escalation["school"] = school
            
            # Get escalated_by user
            escalated_by_user = await db.users.find_one({"_id": escalation["escalated_by"]})
            escalation["escalated_by_user"] = escalated_by_user
            
            enriched_escalations.append(escalation)
    
    # Sort escalations
    if sort_by == "date_asc":
        enriched_escalations.sort(key=lambda x: x["escalated_at"])
    elif sort_by == "date_desc":
        enriched_escalations.sort(key=lambda x: x["escalated_at"], reverse=True)
    elif sort_by == "severity":
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        enriched_escalations.sort(key=lambda x: severity_order.get(x.get("severity", "medium"), 4))
    
    # Pagination
    total = len(enriched_escalations)
    paginated_escalations = enriched_escalations[skip:skip + limit]
    
    return {
        "escalations": paginated_escalations,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/escalations/{escalation_id}")
async def get_escalation_detail(
    escalation_id: str,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Get complete escalation details"""
    db = get_database()
    
    escalation = await db.escalations.find_one({"_id": escalation_id})
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    # Get inspection with full details
    inspection = await db.inspections.find_one({"_id": escalation["inspection_id"]})
    if inspection:
        office = await db.offices.find_one({"_id": inspection["office_id"]})
        school = await db.schools.find_one({"_id": inspection["school_id"]})
        team = await db.teams.find_one({"_id": inspection["team_id"]})
        
        escalation["inspection"] = inspection
        escalation["office"] = office
        escalation["school"] = school
        escalation["team"] = team
    
    # Get escalated_by user
    escalated_by_user = await db.users.find_one({"_id": escalation["escalated_by"]})
    escalation["escalated_by_user"] = escalated_by_user
    
    # Get resolved_by user if resolved
    if escalation.get("resolved_by"):
        resolved_by_user = await db.users.find_one({"_id": escalation["resolved_by"]})
        escalation["resolved_by_user"] = resolved_by_user
    
    # Enrich follow-ups with user data
    if escalation.get("follow_ups"):
        for follow_up in escalation["follow_ups"]:
            user = await db.users.find_one({"_id": follow_up["added_by"]})
            follow_up["user"] = user
    
    return escalation


@router.post("/escalations/{escalation_id}/follow-up")
async def add_follow_up(
    escalation_id: str,
    follow_up_data: FollowUpRequest,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Add a follow-up to an escalation"""
    db = get_database()
    
    escalation = await db.escalations.find_one({"_id": escalation_id})
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    if escalation["status"] == "resolved":
        raise HTTPException(status_code=400, detail="Cannot add follow-up to resolved escalation")
    
    # Create follow-up
    follow_up = {
        "notes": follow_up_data.notes,
        "added_by": current_user["_id"],
        "added_at": datetime.utcnow(),
        "action_taken": follow_up_data.action_taken
    }
    
    # Add follow-up to escalation
    await db.escalations.update_one(
        {"_id": escalation_id},
        {
            "$push": {"follow_ups": follow_up},
            "$set": {
                "status": "in_progress",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Follow-up added successfully",
        "escalation_id": escalation_id
    }


@router.put("/escalations/{escalation_id}/resolve")
async def resolve_escalation(
    escalation_id: str,
    resolve_data: ResolveRequest,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Mark escalation as resolved"""
    db = get_database()
    
    escalation = await db.escalations.find_one({"_id": escalation_id})
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    if escalation["status"] == "resolved":
        raise HTTPException(status_code=400, detail="Escalation is already resolved")
    
    if len(resolve_data.resolution_notes) < 30:
        raise HTTPException(status_code=400, detail="Resolution notes must be at least 30 characters")
    
    # Update escalation
    await db.escalations.update_one(
        {"_id": escalation_id},
        {
            "$set": {
                "status": "resolved",
                "resolution_notes": resolve_data.resolution_notes,
                "resolved_at": datetime.utcnow(),
                "resolved_by": current_user["_id"],
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Update inspection status to closed
    await db.inspections.update_one(
        {"_id": escalation["inspection_id"]},
        {"$set": {"status": "closed"}}
    )
    
    return {
        "message": "Escalation resolved successfully",
        "escalation_id": escalation_id
    }


@router.post("/escalations/{escalation_id}/re-escalate")
async def re_escalate(
    escalation_id: str,
    re_escalate_data: ReEscalateRequest,
    current_user: dict = Depends(require_role(["responder", "admin"]))
):
    """Re-escalate to higher authority"""
    db = get_database()
    
    escalation = await db.escalations.find_one({"_id": escalation_id})
    if not escalation:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    if escalation["status"] == "resolved":
        raise HTTPException(status_code=400, detail="Cannot re-escalate resolved escalation")
    
    if len(re_escalate_data.re_escalation_reason) < 30:
        raise HTTPException(status_code=400, detail="Re-escalation reason must be at least 30 characters")
    
    # Update escalation
    await db.escalations.update_one(
        {"_id": escalation_id},
        {
            "$set": {
                "status": "re_escalated",
                "re_escalation_reason": re_escalate_data.re_escalation_reason,
                "re_escalated_to": re_escalate_data.escalated_to,
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "follow_ups": {
                    "notes": f"Re-escalated: {re_escalate_data.re_escalation_reason}",
                    "added_by": current_user["_id"],
                    "added_at": datetime.utcnow(),
                    "action_taken": "re_escalated"
                }
            }
        }
    )
    
    return {
        "message": "Escalation re-escalated successfully",
        "escalation_id": escalation_id
    }

