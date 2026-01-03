"""Compliance calculation service for offices"""
from datetime import datetime, timedelta
from typing import Dict, List
from utils.database import get_database


async def calculate_office_compliance(office_id: str) -> Dict:
    """Calculate compliance score for a specific office"""
    db = get_database()
    
    # Get all inspections for this office
    inspections = await db.inspections.find({"office_id": office_id}).to_list(10000)
    
    if not inspections:
        return {
            "office_id": office_id,
            "compliance_score": 0,
            "total_inspections": 0,
            "metrics": {}
        }
    
    total_inspections = len(inspections)
    
    # 1. Response Rate (% of inspections responded to)
    responded_count = len([i for i in inspections if i.get("office_response")])
    response_rate = (responded_count / total_inspections * 100) if total_inspections > 0 else 0
    
    # 2. On-Time Response Rate (% responded within 7 days)
    on_time_count = 0
    response_times = []
    for inspection in inspections:
        if inspection.get("report") and inspection.get("office_response"):
            submitted_at = inspection["report"].get("submitted_at")
            responded_at = inspection["office_response"].get("responded_at")
            if submitted_at and responded_at:
                time_diff = (responded_at - submitted_at).days
                response_times.append(time_diff)
                if time_diff <= 7:
                    on_time_count += 1
    
    on_time_rate = (on_time_count / responded_count * 100) if responded_count > 0 else 0
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    
    # 3. Average Rating
    ratings = []
    for inspection in inspections:
        if inspection.get("report"):
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                ratings.append(avg_rating)
    
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    rating_score = (avg_rating / 5 * 100)  # Convert to percentage
    
    # 4. Resolution Rate (% of closed inspections)
    closed_count = len([i for i in inspections if i["status"] == "closed"])
    resolution_rate = (closed_count / total_inspections * 100) if total_inspections > 0 else 0
    
    # 5. Violation Count (inspections with rating < 3)
    violation_count = len([r for r in ratings if r < 3])
    violation_rate = (violation_count / len(ratings) * 100) if ratings else 0
    
    # Calculate weighted compliance score
    # Response Rate: 30%, On-Time Rate: 25%, Rating: 25%, Resolution: 15%, Low Violations: 5%
    compliance_score = (
        response_rate * 0.30 +
        on_time_rate * 0.25 +
        rating_score * 0.25 +
        resolution_rate * 0.15 +
        (100 - violation_rate) * 0.05
    )
    
    return {
        "office_id": office_id,
        "compliance_score": round(compliance_score, 1),
        "total_inspections": total_inspections,
        "metrics": {
            "response_rate": round(response_rate, 1),
            "on_time_rate": round(on_time_rate, 1),
            "avg_response_time_days": round(avg_response_time, 1),
            "avg_rating": round(avg_rating, 2),
            "resolution_rate": round(resolution_rate, 1),
            "violation_count": violation_count,
            "violation_rate": round(violation_rate, 1)
        }
    }


async def get_all_offices_compliance() -> List[Dict]:
    """Get compliance scores for all offices"""
    db = get_database()
    
    offices = await db.offices.find({"is_active": True}).to_list(1000)
    
    compliance_data = []
    for office in offices:
        compliance = await calculate_office_compliance(office["_id"])
        compliance["office"] = office
        compliance_data.append(compliance)
    
    # Sort by compliance score (descending)
    compliance_data.sort(key=lambda x: x["compliance_score"], reverse=True)
    
    return compliance_data


async def get_violation_tracking() -> List[Dict]:
    """Get offices with repeated violations"""
    db = get_database()
    
    # Get all inspections
    all_inspections = await db.inspections.find({}).to_list(10000)
    
    # Track violations per office
    office_violations = {}
    
    for inspection in all_inspections:
        if inspection.get("report"):
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                
                if avg_rating < 3:  # Below average rating = violation
                    office_id = inspection["office_id"]
                    
                    if office_id not in office_violations:
                        office_violations[office_id] = {
                            "office_id": office_id,
                            "violations": [],
                            "violation_count": 0,
                            "avg_violation_rating": []
                        }
                    
                    office_violations[office_id]["violations"].append({
                        "inspection_id": inspection["_id"],
                        "task_name": inspection["task_name"],
                        "rating": round(avg_rating, 1),
                        "date": inspection["assigned_date"],
                        "status": inspection["status"]
                    })
                    office_violations[office_id]["violation_count"] += 1
                    office_violations[office_id]["avg_violation_rating"].append(avg_rating)
    
    # Filter offices with 2+ violations and enrich with office data
    repeated_violations = []
    for office_id, data in office_violations.items():
        if data["violation_count"] >= 2:
            office = await db.offices.find_one({"_id": office_id})
            if office:
                # Sort violations by date (most recent first)
                data["violations"].sort(key=lambda x: x["date"], reverse=True)
                
                repeated_violations.append({
                    "office": office,
                    "violation_count": data["violation_count"],
                    "avg_violation_rating": round(sum(data["avg_violation_rating"]) / len(data["avg_violation_rating"]), 2),
                    "violations": data["violations"][:10],  # Latest 10 violations
                    "severity": "critical" if data["violation_count"] >= 5 else "high" if data["violation_count"] >= 3 else "medium"
                })
    
    # Sort by violation count (descending)
    repeated_violations.sort(key=lambda x: x["violation_count"], reverse=True)
    
    return repeated_violations


async def get_office_compliance_history(office_id: str, months: int = 6) -> List[Dict]:
    """Get compliance history for an office over time"""
    db = get_database()
    
    # Calculate date ranges
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=months * 30)
    
    # Get inspections in date range
    inspections = await db.inspections.find({
        "office_id": office_id,
        "assigned_date": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    # Group by month
    monthly_data = {}
    
    for inspection in inspections:
        month_key = inspection["assigned_date"].strftime("%Y-%m")
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": month_key,
                "inspections": [],
                "ratings": []
            }
        
        monthly_data[month_key]["inspections"].append(inspection)
        
        # Calculate rating
        if inspection.get("report"):
            report = inspection["report"]
            if all([report.get("cleanliness_rating"), report.get("staff_behavior_rating"), report.get("service_quality_rating")]):
                avg_rating = (report["cleanliness_rating"] + report["staff_behavior_rating"] + report["service_quality_rating"]) / 3
                monthly_data[month_key]["ratings"].append(avg_rating)
    
    # Calculate metrics for each month
    history = []
    for month_key, data in sorted(monthly_data.items()):
        total = len(data["inspections"])
        responded = len([i for i in data["inspections"] if i.get("office_response")])
        closed = len([i for i in data["inspections"] if i["status"] == "closed"])
        avg_rating = sum(data["ratings"]) / len(data["ratings"]) if data["ratings"] else 0
        
        history.append({
            "month": month_key,
            "total_inspections": total,
            "response_rate": round((responded / total * 100), 1) if total > 0 else 0,
            "resolution_rate": round((closed / total * 100), 1) if total > 0 else 0,
            "avg_rating": round(avg_rating, 2)
        })
    
    return history
