#!/usr/bin/env python3
"""
Create test data for comprehensive testing
"""

import requests
import json
import uuid
from datetime import datetime, timedelta

BACKEND_URL = "https://violation-alerts.preview.emergentagent.com/api"
TEST_USER_EMAIL = "responder.test@gov.in"
TEST_USER_PASSWORD = "TestPass123!"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def create_test_data():
    """Create comprehensive test data"""
    token = get_auth_token()
    if not token:
        print("❌ Failed to get auth token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("🔧 Creating test data...")
    
    # Create test school
    school_data = {
        "name": "Test Government School",
        "address": "123 Test Street, Test City",
        "district": "Test District",
        "state": "Test State",
        "pincode": "123456",
        "phone": "+91-9876543210",
        "email": "test.school@gov.in",
        "headmaster_name": "Test Headmaster",
        "headmaster_phone": "+91-9876543211",
        "headmaster_email": "headmaster@test.school.gov.in",
        "total_students": 500,
        "total_teachers": 25,
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/schools", json=school_data, headers=headers)
        if response.status_code == 200:
            school_id = response.json()["id"]
            print(f"✅ Created test school: {school_id}")
        else:
            print(f"⚠️ School creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating school: {e}")
        return
    
    # Create test office
    office_data = {
        "name": "Test Education Office",
        "type": "education",
        "address": "456 Office Street, Test City",
        "district": "Test District",
        "state": "Test State",
        "pincode": "123456",
        "phone": "+91-9876543212",
        "email": "test.office@gov.in",
        "head_name": "Test Office Head",
        "head_phone": "+91-9876543213",
        "head_email": "head@test.office.gov.in",
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/offices", json=office_data, headers=headers)
        if response.status_code == 200:
            office_id = response.json()["id"]
            print(f"✅ Created test office: {office_id}")
        else:
            print(f"⚠️ Office creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating office: {e}")
        return
    
    # Create test student users
    student_ids = []
    for i in range(3):
        student_data = {
            "email": f"student{i+1}@test.school.gov.in",
            "name": f"Test Student {i+1}",
            "phone": f"+91-987654321{i}",
            "role": "student",
            "password": "TestPass123!",
            "school_id": school_id,
            "grade": f"Grade {i+8}"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/register", json=student_data)
            if response.status_code == 200:
                student_id = response.json()["user"]["id"]
                student_ids.append(student_id)
                print(f"✅ Created test student {i+1}: {student_id}")
            else:
                print(f"⚠️ Student {i+1} creation failed: {response.text}")
        except Exception as e:
            print(f"❌ Error creating student {i+1}: {e}")
    
    if len(student_ids) < 3:
        print("❌ Failed to create enough students")
        return
    
    # Create test team
    team_data = {
        "name": "Test Inspection Team Alpha",
        "school_id": school_id,
        "student_ids": student_ids,
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/teams", json=team_data, headers=headers)
        if response.status_code == 200:
            team_id = response.json()["id"]
            print(f"✅ Created test team: {team_id}")
        else:
            print(f"⚠️ Team creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating team: {e}")
        return
    
    # Create test template
    template_data = {
        "name": "Test Inspection Template",
        "description": "Template for testing purposes",
        "tasks": [
            {
                "name": "Cleanliness Check",
                "description": "Check overall cleanliness of the office",
                "category": "cleanliness"
            },
            {
                "name": "Staff Behavior Assessment",
                "description": "Assess staff behavior and professionalism",
                "category": "behavior"
            },
            {
                "name": "Service Quality Review",
                "description": "Review quality of services provided",
                "category": "service"
            }
        ],
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/templates", json=template_data, headers=headers)
        if response.status_code == 200:
            template_id = response.json()["id"]
            print(f"✅ Created test template: {template_id}")
        else:
            print(f"⚠️ Template creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating template: {e}")
        return
    
    # Create test inspections with different statuses
    inspection_scenarios = [
        {
            "status": "submitted",
            "task_name": "Cleanliness Check - Submitted",
            "priority": "high",
            "has_report": True,
            "has_response": False
        },
        {
            "status": "responded",
            "task_name": "Staff Behavior Assessment - Responded",
            "priority": "medium",
            "has_report": True,
            "has_response": True
        },
        {
            "status": "assigned",
            "task_name": "Service Quality Review - Assigned",
            "priority": "low",
            "has_report": False,
            "has_response": False
        }
    ]
    
    inspection_ids = []
    
    for i, scenario in enumerate(inspection_scenarios):
        inspection_data = {
            "school_id": school_id,
            "office_id": office_id,
            "team_id": team_id,
            "template_id": template_id,
            "task_name": scenario["task_name"],
            "priority": scenario["priority"],
            "assigned_date": (datetime.utcnow() - timedelta(days=i+1)).isoformat(),
            "due_date": (datetime.utcnow() + timedelta(days=7-i)).isoformat(),
            "status": scenario["status"]
        }
        
        # Add report if needed
        if scenario["has_report"]:
            inspection_data["report"] = {
                "cleanliness_rating": 3 - i,  # Varying ratings
                "staff_behavior_rating": 4 - i,
                "service_quality_rating": 2 + i,
                "issues": f"Test issues found during inspection {i+1}. Some cleanliness and service quality concerns.",
                "complaints": f"Test complaints from citizens about service {i+1}",
                "suggestions": f"Test suggestions for improvement {i+1}",
                "photos": [f"test_photo_{i+1}_1.jpg", f"test_photo_{i+1}_2.jpg"],
                "submitted_at": (datetime.utcnow() - timedelta(days=i)).isoformat(),
                "submitted_by": student_ids[0]
            }
        
        # Add office response if needed
        if scenario["has_response"]:
            inspection_data["office_response"] = {
                "response_text": f"Test office response for inspection {i+1}. We have taken necessary actions to address the issues.",
                "action_taken": f"Test actions taken by office {i+1}",
                "timeline": f"Actions will be completed within {i+2} weeks",
                "contact_person": "Test Office Contact",
                "contact_phone": "+91-9876543214",
                "responded_at": (datetime.utcnow() - timedelta(hours=i*12)).isoformat(),
                "responded_by": str(uuid.uuid4())  # Mock office user ID
            }
        
        try:
            response = requests.post(f"{BACKEND_URL}/inspections", json=inspection_data, headers=headers)
            if response.status_code == 200:
                inspection_id = response.json()["id"]
                inspection_ids.append(inspection_id)
                print(f"✅ Created test inspection {i+1} ({scenario['status']}): {inspection_id}")
            else:
                print(f"⚠️ Inspection {i+1} creation failed: {response.text}")
        except Exception as e:
            print(f"❌ Error creating inspection {i+1}: {e}")
    
    print(f"\n🎉 Test data creation completed!")
    print(f"   Schools: 1")
    print(f"   Offices: 1") 
    print(f"   Students: {len(student_ids)}")
    print(f"   Teams: 1")
    print(f"   Templates: 1")
    print(f"   Inspections: {len(inspection_ids)}")
    
    return {
        "school_id": school_id,
        "office_id": office_id,
        "team_id": team_id,
        "template_id": template_id,
        "student_ids": student_ids,
        "inspection_ids": inspection_ids
    }

if __name__ == "__main__":
    create_test_data()