from fastapi import APIRouter, HTTPException, Depends, Query
from models.user import UserCreate, UserUpdate
from middleware.auth import require_role, get_current_user
from utils.database import get_database
from utils.auth import get_password_hash
from datetime import datetime
import uuid
import math

router = APIRouter(prefix="/students", tags=["students"])

@router.get("/school/{school_id}")
async def get_students_by_school(
    school_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    grade: str = Query(None),
    team_status: str = Query(None),  # "assigned" or "unassigned"
    is_active: bool = Query(None),
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get all students for a specific school with pagination and filters"""
    db = get_database()
    
    # If headmaster, verify they own this school
    if current_user.get("role") == "headmaster" and current_user.get("school_id") != school_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {"school_id": school_id, "role": "student"}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    if grade:
        query["grade"] = grade
    
    if team_status == "assigned":
        query["team_id"] = {"$ne": None}
    elif team_status == "unassigned":
        query["team_id"] = None
    
    if is_active is not None:
        query["is_active"] = is_active
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = math.ceil(total / limit)
    
    # Get students
    students = await db.users.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enrich with team info
    enriched_students = []
    for student in students:
        student_data = {
            "id": student["_id"],
            "email": student["email"],
            "name": student["name"],
            "phone": student.get("phone"),
            "grade": student.get("grade"),
            "team_id": student.get("team_id"),
            "is_active": student.get("is_active", True),
            "created_at": student["created_at"].isoformat() if "created_at" in student else None,
            "profile_image": student.get("profile_image")
        }
        
        # Get team name if exists
        if student.get("team_id"):
            team = await db.teams.find_one({"_id": student["team_id"]})
            if team:
                student_data["team_name"] = team["name"]
        
        enriched_students.append(student_data)
    
    return {
        "students": enriched_students,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    }

@router.get("/{student_id}/performance")
async def get_student_performance(
    student_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get performance metrics for a specific student"""
    db = get_database()
    
    # Get student
    student = await db.users.find_one({"_id": student_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # If headmaster, verify student belongs to their school
    if current_user.get("role") == "headmaster" and student.get("school_id") != current_user.get("school_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get team info
    team = None
    if student.get("team_id"):
        team = await db.teams.find_one({"_id": student["team_id"]})
    
    # Get inspection statistics if student is in a team
    total_inspections = 0
    completed_inspections = 0
    
    if team:
        total_inspections = await db.inspections.count_documents({"team_id": team["_id"]})
        completed_inspections = await db.inspections.count_documents({
            "team_id": team["_id"],
            "status": {"$in": ["submitted", "responded", "closed"]}
        })
    
    participation_rate = (completed_inspections / total_inspections * 100) if total_inspections > 0 else 0
    
    return {
        "student": {
            "id": student["_id"],
            "name": student["name"],
            "email": student["email"],
            "grade": student.get("grade"),
            "team_name": team["name"] if team else None,
            "is_team_leader": team["team_leader_id"] == student_id if team else False
        },
        "performance": {
            "total_inspections": total_inspections,
            "completed_inspections": completed_inspections,
            "participation_rate": round(participation_rate, 2)
        }
    }

@router.post("")
async def create_student(
    student_data: UserCreate,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Create a new student"""
    db = get_database()
    
    # If headmaster, ensure student is created in their school
    if current_user.get("role") == "headmaster":
        if not student_data.school_id or student_data.school_id != current_user.get("school_id"):
            raise HTTPException(status_code=403, detail="Can only create students in your school")
    
    # Force role to be student
    student_data.role = "student"
    
    # Check if email already exists
    existing = await db.users.find_one({"email": student_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate school exists
    if student_data.school_id:
        school = await db.schools.find_one({"_id": student_data.school_id})
        if not school:
            raise HTTPException(status_code=404, detail="School not found")
    else:
        raise HTTPException(status_code=400, detail="school_id is required for students")
    
    # Create student document
    student_dict = student_data.dict()
    student_dict["_id"] = str(uuid.uuid4())
    student_dict["password"] = get_password_hash(student_data.password)
    student_dict["is_active"] = True
    student_dict["created_at"] = datetime.utcnow()
    student_dict["team_id"] = None
    student_dict["office_id"] = None
    student_dict["profile_image"] = None
    
    # Insert student
    await db.users.insert_one(student_dict)
    
    # Update school student count
    await db.schools.update_one(
        {"_id": student_data.school_id},
        {"$inc": {"student_count": 1}}
    )
    
    return {
        "message": "Student created successfully",
        "student": {
            "id": student_dict["_id"],
            "email": student_dict["email"],
            "name": student_dict["name"],
            "grade": student_dict.get("grade"),
            "school_id": student_dict["school_id"]
        }
    }

@router.put("/{student_id}")
async def update_student(
    student_id: str,
    student_data: UserUpdate,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Update student information"""
    db = get_database()
    
    # Check if student exists
    student = await db.users.find_one({"_id": student_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # If headmaster, verify student belongs to their school
    if current_user.get("role") == "headmaster" and student.get("school_id") != current_user.get("school_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build update fields
    update_fields = {}
    if student_data.name:
        update_fields["name"] = student_data.name
    if student_data.phone is not None:
        update_fields["phone"] = student_data.phone
    if student_data.profile_image is not None:
        update_fields["profile_image"] = student_data.profile_image
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields["updated_at"] = datetime.utcnow()
    
    # Update student
    result = await db.users.update_one(
        {"_id": student_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update student")
    
    return {"message": "Student updated successfully"}

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Soft delete a student (deactivate)"""
    db = get_database()
    
    # Check if student exists
    student = await db.users.find_one({"_id": student_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # If headmaster, verify student belongs to their school
    if current_user.get("role") == "headmaster" and student.get("school_id") != current_user.get("school_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Soft delete (deactivate)
    await db.users.update_one(
        {"_id": student_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Student deactivated successfully"}

@router.post("/{student_id}/activate")
async def activate_student(
    student_id: str,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Reactivate a student"""
    db = get_database()
    
    # Check if student exists
    student = await db.users.find_one({"_id": student_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # If headmaster, verify student belongs to their school
    if current_user.get("role") == "headmaster" and student.get("school_id") != current_user.get("school_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Activate
    await db.users.update_one(
        {"_id": student_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Student activated successfully"}
