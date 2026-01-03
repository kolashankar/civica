from fastapi import APIRouter, HTTPException, Depends, Query
from models.office import OfficeCreate, Office
from utils.database import get_database
from middleware.auth import get_current_user
from datetime import datetime
import uuid
import math

router = APIRouter(prefix="/offices", tags=["offices"])

@router.get("")
async def get_offices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    office_type: str = Query(None),
    district: str = Query(None),
    is_active: bool = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get all offices with pagination, search, and filters"""
    # Only admin and responder can access this endpoint
    if current_user["role"] not in ["admin", "responder"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"contact_person": {"$regex": search, "$options": "i"}},
            {"district": {"$regex": search, "$options": "i"}}
        ]
    if office_type:
        query["type"] = office_type
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if is_active is not None:
        query["is_active"] = is_active
    
    # Get total count
    total = await db.offices.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = math.ceil(total / limit)
    
    # Get offices
    offices = await db.offices.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    return {
        "offices": [
            {
                "id": office["_id"],
                "name": office["name"],
                "type": office["type"],
                "address": office["address"],
                "district": office["district"],
                "state": office["state"],
                "pincode": office["pincode"],
                "contact_person": office.get("contact_person"),
                "contact_phone": office.get("contact_phone"),
                "is_active": office.get("is_active", True),
                "created_at": office["created_at"].isoformat() if "created_at" in office else None
            }
            for office in offices
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    }

@router.get("/{office_id}")
async def get_office(
    office_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single office by ID"""
    if current_user["role"] not in ["admin", "responder", "office"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    office = await db.offices.find_one({"_id": office_id})
    
    if not office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Get inspection count
    inspection_count = await db.inspections.count_documents({"office_id": office_id})
    
    # Get recent inspections
    recent_inspections = await db.inspections.find(
        {"office_id": office_id}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "id": office["_id"],
        "name": office["name"],
        "type": office["type"],
        "address": office["address"],
        "district": office["district"],
        "state": office["state"],
        "pincode": office["pincode"],
        "contact_person": office.get("contact_person"),
        "contact_phone": office.get("contact_phone"),
        "inspection_count": inspection_count,
        "is_active": office.get("is_active", True),
        "created_at": office["created_at"].isoformat() if "created_at" in office else None,
        "recent_inspections": [
            {
                "id": insp["_id"],
                "task_name": insp["task_name"],
                "status": insp["status"],
                "created_at": insp["created_at"].isoformat() if "created_at" in insp else None
            }
            for insp in recent_inspections
        ]
    }

@router.post("")
async def create_office(
    office_data: OfficeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new office"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Validate office type
    valid_types = ["mro", "municipality", "hospital", "police", "other"]
    if office_data.type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid office type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Create office document
    office_dict = office_data.dict()
    office_dict["_id"] = str(uuid.uuid4())
    office_dict["is_active"] = True
    office_dict["created_by"] = current_user["_id"]
    office_dict["created_at"] = datetime.utcnow()
    
    # Insert office
    await db.offices.insert_one(office_dict)
    
    return {
        "message": "Office created successfully",
        "office": {
            "id": office_dict["_id"],
            "name": office_dict["name"],
            "type": office_dict["type"],
            "address": office_dict["address"],
            "district": office_dict["district"],
            "state": office_dict["state"]
        }
    }

@router.put("/{office_id}")
async def update_office(
    office_id: str,
    office_data: OfficeCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update an office"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if office exists
    existing = await db.offices.find_one({"_id": office_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Validate office type
    valid_types = ["mro", "municipality", "hospital", "police", "other"]
    if office_data.type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid office type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Update office
    update_data = office_data.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.offices.update_one(
        {"_id": office_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update office")
    
    return {"message": "Office updated successfully"}

@router.delete("/{office_id}")
async def delete_office(
    office_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete an office (deactivate)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if office exists
    existing = await db.offices.find_one({"_id": office_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Soft delete (deactivate)
    await db.offices.update_one(
        {"_id": office_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Office deactivated successfully"}

@router.post("/{office_id}/activate")
async def activate_office(
    office_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reactivate an office"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    # Check if office exists
    existing = await db.offices.find_one({"_id": office_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Activate
    await db.offices.update_one(
        {"_id": office_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Office activated successfully"}
