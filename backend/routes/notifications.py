from fastapi import APIRouter, HTTPException, Depends
from models.notification import Notification, NotificationCreate
from middleware.auth import get_current_user
from utils.database import get_database
from datetime import datetime
import uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    """Get all notifications for the current user"""
    db = get_database()
    
    notifications = await db.notifications.find(
        {"user_id": current_user["_id"]}
    ).sort("created_at", -1).to_list(100)
    
    return notifications

@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    db = get_database()
    
    count = await db.notifications.count_documents({
        "user_id": current_user["_id"],
        "is_read": False
    })
    
    return {"unread_count": count}

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    db = get_database()
    
    # Get notification
    notification = await db.notifications.find_one({"_id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Verify ownership
    if notification["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark as read
    await db.notifications.update_one(
        {"_id": notification_id},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    db = get_database()
    
    result = await db.notifications.update_many(
        {"user_id": current_user["_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {
        "message": f"Marked {result.modified_count} notifications as read",
        "count": result.modified_count
    }
