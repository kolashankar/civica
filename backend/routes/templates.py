from fastapi import APIRouter, HTTPException, Depends
from models.template import Template, TemplateCreate, TemplateClone, FormField
from middleware.auth import get_current_user, require_role
from utils.database import get_database
from datetime import datetime
from typing import List, Optional
import uuid

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("")
async def get_templates(
    skip: int = 0,
    limit: int = 10,
    office_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin", "headmaster"]))
):
    """Get all templates with pagination and filtering"""
    db = get_database()
    
    # Build query
    query = {"is_active": True}
    if office_type:
        query["office_types"] = office_type
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    # Get total count
    total = await db.templates.count_documents(query)
    
    # Get templates
    templates = await db.templates.find(query).skip(skip).limit(limit).to_list(limit)
    
    return {
        "templates": templates,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/all")
async def get_all_templates(
    office_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all active templates (no pagination) - for dropdowns"""
    db = get_database()
    
    query = {"is_active": True}
    if office_type:
        query["office_types"] = office_type
    
    templates = await db.templates.find(query).to_list(1000)
    
    return templates

@router.get("/{template_id}")
async def get_template_detail(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed template information"""
    db = get_database()
    
    template = await db.templates.find_one({"_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get usage stats
    usage_count = await db.inspections.count_documents({"template_id": template_id})
    template["usage_count"] = usage_count
    
    return template

@router.post("")
async def create_template(
    template_data: TemplateCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Create a new template"""
    db = get_database()
    
    # Validate form fields
    if not template_data.form_fields or len(template_data.form_fields) == 0:
        raise HTTPException(status_code=400, detail="Template must have at least one form field")
    
    # Validate field types
    valid_field_types = ["rating", "text", "multiline", "photo", "dropdown"]
    for field in template_data.form_fields:
        if field.field_type not in valid_field_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid field type: {field.field_type}. Must be one of {valid_field_types}"
            )
        # Dropdown fields must have options
        if field.field_type == "dropdown" and not field.options:
            raise HTTPException(
                status_code=400,
                detail=f"Dropdown field '{field.field_name}' must have options"
            )
    
    # Check for duplicate field names
    field_names = [field.field_name for field in template_data.form_fields]
    if len(field_names) != len(set(field_names)):
        raise HTTPException(status_code=400, detail="Duplicate field names not allowed")
    
    # Check if template name already exists
    existing = await db.templates.find_one({
        "name": template_data.name,
        "is_active": True
    })
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists")
    
    # Create template
    template_id = str(uuid.uuid4())
    template = {
        "_id": template_id,
        "name": template_data.name,
        "description": template_data.description,
        "office_types": template_data.office_types,
        "form_fields": [field.dict() for field in template_data.form_fields],
        "is_active": True,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.templates.insert_one(template)
    
    return {"message": "Template created successfully", "template_id": template_id}

@router.put("/{template_id}")
async def update_template(
    template_id: str,
    template_data: TemplateCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Update template details"""
    db = get_database()
    
    # Check if template exists
    template = await db.templates.find_one({"_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Validate form fields
    if not template_data.form_fields or len(template_data.form_fields) == 0:
        raise HTTPException(status_code=400, detail="Template must have at least one form field")
    
    # Validate field types
    valid_field_types = ["rating", "text", "multiline", "photo", "dropdown"]
    for field in template_data.form_fields:
        if field.field_type not in valid_field_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid field type: {field.field_type}. Must be one of {valid_field_types}"
            )
        if field.field_type == "dropdown" and not field.options:
            raise HTTPException(
                status_code=400,
                detail=f"Dropdown field '{field.field_name}' must have options"
            )
    
    # Check for duplicate field names
    field_names = [field.field_name for field in template_data.form_fields]
    if len(field_names) != len(set(field_names)):
        raise HTTPException(status_code=400, detail="Duplicate field names not allowed")
    
    # Check if new name conflicts with existing template
    if template_data.name != template["name"]:
        existing = await db.templates.find_one({
            "name": template_data.name,
            "is_active": True,
            "_id": {"$ne": template_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Template name already exists")
    
    # Check if template is being used in active inspections
    active_inspections = await db.inspections.count_documents({
        "template_id": template_id,
        "status": "assigned"
    })
    
    if active_inspections > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot modify template with {active_inspections} active inspections. Consider cloning instead."
        )
    
    # Update template
    await db.templates.update_one(
        {"_id": template_id},
        {
            "$set": {
                "name": template_data.name,
                "description": template_data.description,
                "office_types": template_data.office_types,
                "form_fields": [field.dict() for field in template_data.form_fields]
            }
        }
    )
    
    return {"message": "Template updated successfully"}

@router.post("/{template_id}/clone")
async def clone_template(
    template_id: str,
    clone_data: TemplateClone,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Clone an existing template"""
    db = get_database()
    
    # Check if template exists
    template = await db.templates.find_one({"_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if new name already exists
    existing = await db.templates.find_one({
        "name": clone_data.new_name,
        "is_active": True
    })
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists")
    
    # Create cloned template
    new_template_id = str(uuid.uuid4())
    new_template = {
        "_id": new_template_id,
        "name": clone_data.new_name,
        "description": template["description"] + " (Cloned)",
        "office_types": template["office_types"],
        "form_fields": template["form_fields"],
        "is_active": True,
        "created_by": current_user["_id"],
        "created_at": datetime.utcnow()
    }
    
    await db.templates.insert_one(new_template)
    
    return {"message": "Template cloned successfully", "template_id": new_template_id}

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Soft delete a template (deactivate)"""
    db = get_database()
    
    # Check if template exists
    template = await db.templates.find_one({"_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check if template is being used in active inspections
    active_inspections = await db.inspections.count_documents({
        "template_id": template_id,
        "status": "assigned"
    })
    
    if active_inspections > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete template with {active_inspections} active inspections"
        )
    
    # Deactivate template
    await db.templates.update_one(
        {"_id": template_id},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/activate")
async def activate_template(
    template_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Reactivate a deactivated template"""
    db = get_database()
    
    # Check if template exists
    template = await db.templates.find_one({"_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Activate template
    await db.templates.update_one(
        {"_id": template_id},
        {"$set": {"is_active": True}}
    )
    
    return {"message": "Template activated successfully"}
