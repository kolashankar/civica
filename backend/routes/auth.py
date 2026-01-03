from fastapi import APIRouter, HTTPException, Depends
from models.user import UserCreate, UserLogin, UserResponse, UserUpdate, ChangePassword, UserStats
from utils.auth import get_password_hash, verify_password, create_access_token
from utils.database import get_database
from middleware.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register")
async def register(user_data: UserCreate):
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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
    
    # Create access token
    access_token = create_access_token(data={"sub": user_dict["_id"], "role": user_dict["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_dict["_id"],
            "email": user_dict["email"],
            "name": user_dict["name"],
            "role": user_dict["role"],
            "school_id": user_dict.get("school_id"),
            "team_id": user_dict.get("team_id"),
            "grade": user_dict.get("grade")
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    db = get_database()
    
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["_id"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "school_id": user.get("school_id"),
            "team_id": user.get("team_id"),
            "grade": user.get("grade")
        }
    }

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(lambda: __import__('middleware.auth', fromlist=['get_current_user']).get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "school_id": current_user.get("school_id"),
        "team_id": current_user.get("team_id"),
        "grade": current_user.get("grade")
    }

@router.get("/schools")
async def get_schools():
    """Get all active schools for signup dropdown"""
    db = get_database()
    schools = await db.schools.find({"is_active": True}).to_list(100)
    return [
        {
            "id": school["_id"],
            "name": school["name"],
            "district": school.get("district"),
            "state": school.get("state")
        }
        for school in schools
    ]

@router.put("/profile")
async def update_profile(
    profile_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    db = get_database()
    
    update_fields = {}
    if profile_data.name:
        update_fields["name"] = profile_data.name
    if profile_data.phone is not None:
        update_fields["phone"] = profile_data.phone
    if profile_data.profile_image is not None:
        update_fields["profile_image"] = profile_data.profile_image
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update user
    result = await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user["_id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "phone": updated_user.get("phone"),
            "role": updated_user["role"],
            "school_id": updated_user.get("school_id"),
            "team_id": updated_user.get("team_id"),
            "grade": updated_user.get("grade"),
            "profile_image": updated_user.get("profile_image")
        }
    }

@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    db = get_database()
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_password_hash = get_password_hash(password_data.new_password)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_password_hash}}
    )
    
    return {"message": "Password changed successfully"}

@router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get user statistics"""
    db = get_database()
    
    if current_user["role"] != "student" or not current_user.get("team_id"):
        return {
            "total_inspections": 0,
            "completed_inspections": 0,
            "pending_inspections": 0,
            "success_rate": 0.0
        }
    
    team_id = current_user["team_id"]
    
    # Get all inspections for the team
    all_inspections = await db.inspections.find({"team_id": team_id}).to_list(1000)
    
    total = len(all_inspections)
    completed = len([i for i in all_inspections if i["status"] in ["submitted", "responded", "closed"]])
    pending = len([i for i in all_inspections if i["status"] == "assigned"])
    success_rate = (completed / total * 100) if total > 0 else 0.0
    
    return {
        "total_inspections": total,
        "completed_inspections": completed,
        "pending_inspections": pending,
        "success_rate": round(success_rate, 1)
    }
