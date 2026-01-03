import random
from datetime import datetime, timedelta
from utils.database import get_database

async def assign_random_team(school_id: str) -> str:
    """
    Assign a random team from a school using a fair distribution algorithm
    
    Algorithm:
    1. Get all active teams from the school
    2. Count recent assignments (last 30 days) for each team
    3. Filter out teams with too many recent assignments (fairness threshold)
    4. Randomly select from eligible teams
    5. If no eligible teams, select from all teams
    
    Returns: team_id
    Raises: Exception if no teams found
    """
    db = get_database()
    
    # Get all active teams from school
    teams = await db.teams.find({
        "school_id": school_id,
        "is_active": True
    }).to_list(1000)
    
    if not teams:
        raise Exception(f"No active teams found for school {school_id}")
    
    # If only one team, return it
    if len(teams) == 1:
        return teams[0]["_id"]
    
    # Count recent assignments (last 30 days) for each team
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    team_workload = {}
    for team in teams:
        count = await db.inspections.count_documents({
            "team_id": team["_id"],
            "assigned_date": {"$gte": thirty_days_ago}
        })
        team_workload[team["_id"]] = count
    
    # Calculate fairness threshold (average + 1)
    avg_workload = sum(team_workload.values()) / len(team_workload)
    fairness_threshold = avg_workload + 1
    
    # Filter teams below fairness threshold
    eligible_teams = [
        team_id for team_id, count in team_workload.items()
        if count < fairness_threshold
    ]
    
    # If no eligible teams, use all teams
    if not eligible_teams:
        eligible_teams = [team["_id"] for team in teams]
    
    # Randomly select a team
    selected_team_id = random.choice(eligible_teams)
    
    return selected_team_id


async def get_team_workload_stats(school_id: str) -> dict:
    """
    Get workload statistics for all teams in a school
    Useful for admin dashboard and monitoring
    """
    db = get_database()
    
    teams = await db.teams.find({
        "school_id": school_id,
        "is_active": True
    }).to_list(1000)
    
    stats = []
    for team in teams:
        total_assigned = await db.inspections.count_documents({"team_id": team["_id"]})
        pending = await db.inspections.count_documents({
            "team_id": team["_id"],
            "status": "assigned"
        })
        completed = await db.inspections.count_documents({
            "team_id": team["_id"],
            "status": {"$in": ["submitted", "responded", "closed"]}
        })
        
        stats.append({
            "team_id": team["_id"],
            "team_name": team["name"],
            "total_assigned": total_assigned,
            "pending": pending,
            "completed": completed,
            "completion_rate": (completed / total_assigned * 100) if total_assigned > 0 else 0
        })
    
    return {
        "school_id": school_id,
        "teams": stats
    }
