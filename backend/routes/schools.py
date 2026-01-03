from fastapi import APIRouter, HTTPException, Depends, Query
from models.school import SchoolCreate, School
from utils.database import get_database
from middleware.auth import get_current_user
from datetime import datetime
import uuid
import math

router = APIRouter(prefix="/schools", tags=["schools"])

@router.get("")
async def get_schools(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    district: str = Query(None),
    is_active: bool = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get all schools with pagination, search, and filters"""
    # Only admin can access this endpoint
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"district": {"$regex": search, "$options": "i"}},
            {"state": {"$regex": search, "$options": "i"}}
        ]
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if is_active is not None:
        query["is_active"] = is_active
    
    # Get total count
    total = await db.schools.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = math.ceil(total / limit)
    
    # Get schools
    schools = await db.schools.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    return {
        "schools": [
            {
                "id": school["_id"],
                "name": school["name"],
                "address": school["address"],
                "district": school["district"],
                "state": school["state"],
                "pincode": school["pincode"],
                "headmaster_id": school.get("headmaster_id"),
                "student_count": school.get("student_count", 0),
                "is_active": school.get("is_active", True),
                "created_at": school["created_at"].isoformat() if "created_at" in school else None
            }
            for school in schools
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    }

@router.get("/{school_id}")
async def get_school(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single school by ID"""
    if current_user["role"] not in ["admin", "headmaster"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    school = await db.schools.find_one({"_id": school_id})
    
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Get headmaster info if exists
    headmaster = None
    if school.get("headmaster_id"):
        headmaster_doc = await db.users.find_one({"_id": school["headmaster_id"]})
        if headmaster_doc:
            headmaster = {
                "id": headmaster_doc["_id"],
                "name": headmaster_doc["name"],
                "email": headmaster_doc["email"],
                "phone": headmaster_doc.get("phone")
            }
    
    # Get team count
    team_count = await db.teams.count_documents({"school_id": school_id})
    
    # Get inspection count
    inspection_count = await db.inspections.count_documents({"school_id": school_id})
    
    return {
        "id": school["_id"],
        "name": school["name"],
        "address": school["address"],
        "district": school["district"],
        "state": school["state"],
        "pincode": school["pincode"],
        "headmaster_id": school.get("headmaster_id"),
        "headmaster": headmaster,
        "student_count": school.get("student_count", 0),
        "team_count": team_count,
        "inspection_count": inspection_count,
        "is_active": school.get("is_active", True),
        "created_at": school["created_at"].isoformat() if "created_at" in school else None
    }

@router.post("")
async def create_school(
    school_data: SchoolCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new school"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if school name already exists
    existing = await db.schools.find_one({"name": school_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="School with this name already exists")
    
    # Create school document
    school_dict = school_data.dict()
    school_dict["_id"] = str(uuid.uuid4())
    school_dict["student_count"] = 0
    school_dict["is_active"] = True
    school_dict["created_by"] = current_user["_id"]
    school_dict["created_at"] = datetime.utcnow()
    
    # Insert school
    await db.schools.insert_one(school_dict)
    
    return {
        "message": "School created successfully",
        "school": {
            "id": school_dict["_id"],
            "name": school_dict["name"],
            "address": school_dict["address"],
            "district": school_dict["district"],
            "state": school_dict["state"],
            "pincode": school_dict["pincode"]
        }
    }

@router.put("/{school_id}")
async def update_school(
    school_id: str,
    school_data: SchoolCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a school"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if school exists
    existing = await db.schools.find_one({"_id": school_id})
    if not existing:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Update school
    update_data = school_data.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.schools.update_one(
        {"_id": school_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update school")
    
    return {"message": "School updated successfully"}

@router.delete("/{school_id}")
async def delete_school(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a school (deactivate)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if school exists
    existing = await db.schools.find_one({"_id": school_id})
    if not existing:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Soft delete (deactivate)
    await db.schools.update_one(
        {"_id": school_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "School deactivated successfully"}

@router.post("/{school_id}/activate")
async def activate_school(
    school_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reactivate a school"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if school exists
    existing = await db.schools.find_one({"_id": school_id})
    if not existing:
        raise HTTPException(status_code=404, detail="School not found")
    
    # Activate
    await db.schools.update_one(
        {"_id": school_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "School activated successfully"}
