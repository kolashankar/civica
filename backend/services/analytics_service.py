"""Analytics service for aggregating inspection data"""
from datetime import datetime, timedelta
from typing import Dict, List
from utils.database import get_database

async def get_global_stats() -> Dict:
    """Calculate global statistics"""
    db = get_database()
    
    # Total inspections
    total_inspections = await db.inspections.count_documents({})
    
    # Count by status
    assigned = await db.inspections.count_documents({"status": "assigned"})
    in_progress = await db.inspections.count_documents({"status": "in_progress"})
    submitted = await db.inspections.count_documents({"status": "submitted"})
    responded = await db.inspections.count_documents({"status": "responded"})
    reviewed = await db.inspections.count_documents({"status": "reviewed"})
    closed = await db.inspections.count_documents({"status": "closed"})
    
    # Active (assigned + in_progress)
    active_inspections = assigned + in_progress
    
    # Completed (submitted + responded + reviewed + closed)
    completed_inspections = submitted + responded + reviewed + closed
    
    # Calculate completion rate
    completion_rate = (completed_inspections / total_inspections * 100) if total_inspections > 0 else 0
    
    # Count today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    completed_today = await db.inspections.count_documents({
        "status": {"$in": ["submitted", "responded", "reviewed", "closed"]},
        "created_at": {"$gte": today_start}
    })
    
    # Calculate average completion time (in days)
    pipeline = [
        {
            "$match": {
                "status": {"$in": ["submitted", "responded", "reviewed", "closed"]},
                "report.submitted_at": {"$exists": True}
            }
        },
        {
            "$project": {
                "completion_time": {
                    "$divide": [
                        {"$subtract": ["$report.submitted_at", "$assigned_date"]},
                        1000 * 60 * 60 * 24  # Convert milliseconds to days
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "avg_time": {"$avg": "$completion_time"}
            }
        }
    ]
    
    avg_result = await db.inspections.aggregate(pipeline).to_list(1)
    avg_completion_time = round(avg_result[0]["avg_time"], 1) if avg_result and avg_result[0].get("avg_time") else 0
    
    # Count entities
    total_schools = await db.schools.count_documents({"is_active": True})
    total_offices = await db.offices.count_documents({"is_active": True})
    total_teams = await db.teams.count_documents({"is_active": True})
    total_students = await db.users.count_documents({"role": "student", "is_active": True})
    
    return {
        "total_inspections": total_inspections,
        "active_inspections": active_inspections,
        "completed_inspections": completed_inspections,
        "completion_rate": round(completion_rate, 1),
        "completed_today": completed_today,
        "avg_completion_time_days": avg_completion_time,
        "by_status": {
            "assigned": assigned,
            "in_progress": in_progress,
            "submitted": submitted,
            "responded": responded,
            "reviewed": reviewed,
            "closed": closed
        },
        "entities": {
            "schools": total_schools,
            "offices": total_offices,
            "teams": total_teams,
            "students": total_students
        }
    }

async def get_inspection_trends(days: int = 30) -> List[Dict]:
    """Get inspection trends over time"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "count": {"$sum": 1},
                "submitted": {
                    "$sum": {
                        "$cond": [{"$in": ["$status", ["submitted", "responded", "reviewed", "closed"]]}, 1, 0]
                    }
                }
            }
        },
        {
            "$sort": {"_id": 1}
        }
    ]
    
    results = await db.inspections.aggregate(pipeline).to_list(days)
    
    return [
        {
            "date": r["_id"],
            "total": r["count"],
            "completed": r["submitted"]
        }
        for r in results
    ]

async def get_school_performance() -> List[Dict]:
    """Get performance metrics by school"""
    db = get_database()
    
    pipeline = [
        {
            "$lookup": {
                "from": "schools",
                "localField": "school_id",
                "foreignField": "_id",
                "as": "school"
            }
        },
        {
            "$unwind": "$school"
        },
        {
            "$group": {
                "_id": "$school_id",
                "school_name": {"$first": "$school.name"},
                "total": {"$sum": 1},
                "completed": {
                    "$sum": {
                        "$cond": [{"$in": ["$status", ["submitted", "responded", "reviewed", "closed"]]}, 1, 0]
                    }
                }
            }
        },
        {
            "$project": {
                "school_id": "$_id",
                "school_name": 1,
                "total": 1,
                "completed": 1,
                "completion_rate": {
                    "$cond": [
                        {"$gt": ["$total", 0]},
                        {"$multiply": [{"$divide": ["$completed", "$total"]}, 100]},
                        0
                    ]
                }
            }
        },
        {
            "$sort": {"completion_rate": -1}
        },
        {
            "$limit": 10
        }
    ]
    
    results = await db.inspections.aggregate(pipeline).to_list(10)
    
    return [
        {
            "school_id": r["school_id"],
            "school_name": r["school_name"],
            "total_inspections": r["total"],
            "completed_inspections": r["completed"],
            "completion_rate": round(r["completion_rate"], 1)
        }
        for r in results
    ]

async def get_office_compliance() -> List[Dict]:
    """Get compliance rates by office"""
    db = get_database()
    
    pipeline = [
        {
            "$lookup": {
                "from": "offices",
                "localField": "office_id",
                "foreignField": "_id",
                "as": "office"
            }
        },
        {
            "$unwind": "$office"
        },
        {
            "$group": {
                "_id": "$office_id",
                "office_name": {"$first": "$office.name"},
                "office_type": {"$first": "$office.type"},
                "total": {"$sum": 1},
                "responded": {
                    "$sum": {
                        "$cond": [{"$in": ["$status", ["responded", "reviewed", "closed"]]}, 1, 0]
                    }
                }
            }
        },
        {
            "$project": {
                "office_id": "$_id",
                "office_name": 1,
                "office_type": 1,
                "total": 1,
                "responded": 1,
                "response_rate": {
                    "$cond": [
                        {"$gt": ["$total", 0]},
                        {"$multiply": [{"$divide": ["$responded", "$total"]}, 100]},
                        0
                    ]
                }
            }
        },
        {
            "$sort": {"response_rate": -1}
        },
        {
            "$limit": 10
        }
    ]
    
    results = await db.inspections.aggregate(pipeline).to_list(10)
    
    return [
        {
            "office_id": r["office_id"],
            "office_name": r["office_name"],
            "office_type": r["office_type"],
            "total_inspections": r["total"],
            "responded_count": r["responded"],
            "response_rate": round(r["response_rate"], 1)
        }
        for r in results
    ]

async def get_status_distribution() -> List[Dict]:
    """Get distribution of inspections by status"""
    db = get_database()
    
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]
    
    results = await db.inspections.aggregate(pipeline).to_list(10)
    
    # Map status to readable labels
    status_labels = {
        "assigned": "Assigned",
        "in_progress": "In Progress",
        "submitted": "Submitted",
        "responded": "Office Responded",
        "reviewed": "Govt Reviewed",
        "closed": "Closed"
    }
    
    return [
        {
            "status": r["_id"],
            "label": status_labels.get(r["_id"], r["_id"]),
            "count": r["count"]
        }
        for r in results
    ]
