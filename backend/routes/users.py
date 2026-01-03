from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from models.user import UserCreate, User, UserUpdate
from utils.auth import get_password_hash
from utils.database import get_database
from middleware.auth import get_current_user, require_role
from datetime import datetime
import uuid
import math
import csv
import io

router = APIRouter(prefix="/users", tags=["users"])

@router.get("")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    role: str = Query(None),
    school_id: str = Query(None),
    is_active: bool = Query(None),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get all users with pagination, search, and filters"""
    db = get_database()
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    if role:
        query["role"] = role
    if school_id:
        query["school_id"] = school_id
    if is_active is not None:
        query["is_active"] = is_active
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = math.ceil(total / limit)
    
    # Get users
    users = await db.users.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enrich with school/office/team info
    enriched_users = []
    for user in users:
        user_data = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "phone": user.get("phone"),
            "role": user["role"],
            "school_id": user.get("school_id"),
            "office_id": user.get("office_id"),
            "team_id": user.get("team_id"),
            "is_active": user.get("is_active", True),
            "created_at": user["created_at"].isoformat() if "created_at" in user else None,
            "grade": user.get("grade")
        }
        
        # Get school name if exists
        if user.get("school_id"):
            school = await db.schools.find_one({"_id": user["school_id"]})
            if school:
                user_data["school_name"] = school["name"]
        
        # Get office name if exists
        if user.get("office_id"):
            office = await db.offices.find_one({"_id": user["office_id"]})
            if office:
                user_data["office_name"] = office["name"]
        
        # Get team name if exists
        if user.get("team_id"):
            team = await db.teams.find_one({"_id": user["team_id"]})
            if team:
                user_data["team_name"] = team["name"]
        
        enriched_users.append(user_data)
    
    return {
        "users": enriched_users,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    }

@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get a single user by ID"""
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone"),
        "role": user["role"],
        "school_id": user.get("school_id"),
        "office_id": user.get("office_id"),
        "team_id": user.get("team_id"),
        "is_active": user.get("is_active", True),
        "created_at": user["created_at"].isoformat() if "created_at" in user else None,
        "grade": user.get("grade"),
        "profile_image": user.get("profile_image")
    }
    
    # Get school info if exists
    if user.get("school_id"):
        school = await db.schools.find_one({"_id": user["school_id"]})
        if school:
            user_data["school"] = {
                "id": school["_id"],
                "name": school["name"],
                "district": school["district"]
            }
    
    # Get office info if exists
    if user.get("office_id"):
        office = await db.offices.find_one({"_id": user["office_id"]})
        if office:
            user_data["office"] = {
                "id": office["_id"],
                "name": office["name"],
                "type": office["type"]
            }
    
    # Get team info if exists
    if user.get("team_id"):
        team = await db.teams.find_one({"_id": user["team_id"]})
        if team:
            user_data["team"] = {
                "id": team["_id"],
                "name": team["name"]
            }
    
    return user_data

@router.post("")
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Create a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    valid_roles = ["admin", "headmaster", "student", "office", "responder"]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Validate school_id for roles that require it
    if user_data.role in ["headmaster", "student"] and not user_data.school_id:
        raise HTTPException(
            status_code=400,
            detail=f"school_id is required for {user_data.role} role"
        )
    
    # Create user document
    user_dict = user_data.dict()
    user_dict["_id"] = str(uuid.uuid4())
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["is_active"] = True
    user_dict["created_at"] = datetime.utcnow()
    user_dict["team_id"] = None
    user_dict["office_id"] = None
    user_dict["profile_image"] = None
    
    # Insert user
    await db.users.insert_one(user_dict)
    
    # Update school student count if student
    if user_data.role == "student" and user_data.school_id:
        await db.schools.update_one(
            {"_id": user_data.school_id},
            {"$inc": {"student_count": 1}}
        )
    
    return {
        "message": "User created successfully",
        "user": {
            "id": user_dict["_id"],
            "email": user_dict["email"],
            "name": user_dict["name"],
            "role": user_dict["role"],
            "school_id": user_dict.get("school_id"),
            "grade": user_dict.get("grade")
        }
    }

@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update a user"""
    db = get_database()
    
    # Check if user exists
    existing = await db.users.find_one({"_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update fields
    update_fields = {}
    if user_data.name:
        update_fields["name"] = user_data.name
    if user_data.phone is not None:
        update_fields["phone"] = user_data.phone
    if user_data.profile_image is not None:
        update_fields["profile_image"] = user_data.profile_image
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields["updated_at"] = datetime.utcnow()
    
    # Update user
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update user")
    
    return {"message": "User updated successfully"}

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Soft delete a user (deactivate)"""
    db = get_database()
    
    # Check if user exists
    existing = await db.users.find_one({"_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting yourself
    if user_id == current_user["_id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    # Soft delete (deactivate)
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "User deactivated successfully"}

@router.post("/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Reactivate a user"""
    db = get_database()
    
    # Check if user exists
    existing = await db.users.find_one({"_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Activate
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "User activated successfully"}

@router.post("/bulk-import")
async def bulk_import_users(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Bulk import users from CSV file"""
    db = get_database()
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Read CSV file
    contents = await file.read()
    csv_text = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_text))
    
    created_users = []
    errors = []
    
    for idx, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
        try:
            # Validate required fields
            required_fields = ["email", "name", "password", "role"]
            missing_fields = [field for field in required_fields if not row.get(field)]
            if missing_fields:
                errors.append({
                    "row": idx,
                    "error": f"Missing required fields: {', '.join(missing_fields)}"
                })
                continue
            
            # Check if user already exists
            existing_user = await db.users.find_one({"email": row["email"]})
            if existing_user:
                errors.append({
                    "row": idx,
                    "email": row["email"],
                    "error": "Email already registered"
                })
                continue
            
            # Validate role
            valid_roles = ["admin", "headmaster", "student", "office", "responder"]
            if row["role"] not in valid_roles:
                errors.append({
                    "row": idx,
                    "email": row["email"],
                    "error": f"Invalid role: {row['role']}"
                })
                continue
            
            # Create user document
            user_dict = {
                "_id": str(uuid.uuid4()),
                "email": row["email"],
                "name": row["name"],
                "password": get_password_hash(row["password"]),
                "role": row["role"],
                "phone": row.get("phone"),
                "school_id": row.get("school_id") if row.get("school_id") else None,
                "office_id": None,
                "team_id": None,
                "grade": row.get("grade") if row.get("grade") else None,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "profile_image": None
            }
            
            # Insert user
            await db.users.insert_one(user_dict)
            
            # Update school student count if student
            if user_dict["role"] == "student" and user_dict.get("school_id"):
                await db.schools.update_one(
                    {"_id": user_dict["school_id"]},
                    {"$inc": {"student_count": 1}}
                )
            
            created_users.append({
                "email": user_dict["email"],
                "name": user_dict["name"],
                "role": user_dict["role"]
            })
            
        except Exception as e:
            errors.append({
                "row": idx,
                "email": row.get("email", "N/A"),
                "error": str(e)
            })
    
    return {
        "message": f"Bulk import completed. Created: {len(created_users)}, Errors: {len(errors)}",
        "created_count": len(created_users),
        "error_count": len(errors),
        "created_users": created_users[:10],  # Return first 10 for preview
        "errors": errors[:10]  # Return first 10 errors
    }


# Profile & Settings routes

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user


@router.put("/me")
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile"""
    db = get_database()
    
    # Build update fields
    update_fields = {}
    if user_data.name:
        update_fields["name"] = user_data.name
    if user_data.phone is not None:
        update_fields["phone"] = user_data.phone
    if user_data.profile_image is not None:
        update_fields["profile_image"] = user_data.profile_image
    
    # Allow custom fields for responder role
    if current_user.get("role") == "responder":
        if hasattr(user_data, 'designation') and user_data.designation:
            update_fields["designation"] = user_data.designation
        if hasattr(user_data, 'department') and user_data.department:
            update_fields["department"] = user_data.department
        if hasattr(user_data, 'jurisdiction') and user_data.jurisdiction:
            update_fields["jurisdiction"] = user_data.jurisdiction
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields["updated_at"] = datetime.utcnow()
    
    # Update user
    result = await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    return {"message": "Profile updated successfully"}


@router.get("/settings")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    """Get user's settings"""
    db = get_database()
    
    # Get settings from user document
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return settings or defaults
    return user.get("settings", {
        "emailNotifications": True,
        "escalationAlerts": True,
        "overdueAlerts": True,
        "complianceAlerts": True,
        "violationThreshold": 3,
        "emailDigest": "daily",
        "autoReportGeneration": False
    })


@router.put("/settings")
async def update_user_settings(
    settings: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user's settings"""
    db = get_database()
    
    # Update settings
    result = await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"settings": settings, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update settings")
    
    return {"message": "Settings updated successfully"}


@router.post("/change-password")
async def change_password(
    password_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Change user's password"""
    from utils.auth import verify_password
    
    db = get_database()
    
    # Get current user
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.get("current_password", ""), user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_password_hash = get_password_hash(password_data.get("new_password"))
    
    # Update password
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_password_hash, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password changed successfully"}

