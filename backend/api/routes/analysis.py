"""Analysis endpoints - real-time campus analysis."""
from fastapi import APIRouter, Depends, BackgroundTasks
from typing import Dict, Any
import asyncio

from api.dependencies import get_campus_graph, get_data_service
from agents.campus_graph import CampusAgentGraph
from api.data_service import DataService

router = APIRouter()

# Cache for latest analysis
_latest_analysis: Dict[str, Any] = None


@router.get("/current")
async def get_current_analysis(
    num_rooms: int = None,
    num_buildings: int = None,
    budget_level: str = 'medium',
    # Environmental parameters
    avg_occupancy: int = None,
    lights_on: bool = True,
    ac_on: bool = True,
    ac_temperature: int = 22,
    fans_on: bool = False,
    projectors_on_percent: int = 30,
    computers_count: int = 5,
    time_of_day: str = 'afternoon',
    outdoor_temperature: int = 30,
    campus_graph: CampusAgentGraph = Depends(get_campus_graph),
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Get current campus analysis with agent insights."""
    current_data = data_service.get_current_observations()
    
    # Apply environmental parameters to the data
    env_params = {
        'avg_occupancy': avg_occupancy,
        'lights_on': lights_on,
        'ac_on': ac_on,
        'ac_temperature': ac_temperature,
        'fans_on': fans_on,
        'projectors_on_percent': projectors_on_percent,
        'computers_count': computers_count,
        'time_of_day': time_of_day,
        'outdoor_temperature': outdoor_temperature
    }
    
    current_data = data_service.apply_environmental_params(current_data, env_params)
    
    # Apply budget constraints if specified
    if num_rooms is not None or num_buildings is not None:
        current_data = campus_graph._apply_budget_constraints(
            current_data,
            num_rooms=num_rooms,
            num_buildings=num_buildings,
            budget_level=budget_level
        )
    
    # Run complete agent analysis
    result = await campus_graph.run_campus_analysis(current_data)
    
    # Add execution info
    result['execution_info'] = {
        'rooms_analyzed': len(current_data.get('rooms', {})),
        'buildings_analyzed': len(set(r.get('building_id') for r in current_data.get('rooms', {}).values())),
        'budget_level': budget_level,
        'environmental_params': env_params
    }
    
    global _latest_analysis
    _latest_analysis = result
    
    return result


@router.get("/summary")
async def get_analysis_summary() -> Dict[str, Any]:
    """Get cached analysis summary (fast endpoint)."""
    if _latest_analysis is None:
        return {"status": "no_analysis_available", "message": "Run /current first"}
    
    return {
        "campus_name": _latest_analysis.get("campus_name"),
        "timestamp": _latest_analysis.get("timestamp"),
        "summary": _latest_analysis.get("summary"),
        "savings_potential": _latest_analysis.get("savings_potential"),
        "critical_buildings": _latest_analysis.get("critical_buildings"),
        "top_recommendations": _latest_analysis.get("campus_recommendations", [])[:3]
    }


@router.get("/building/{building_id}")
async def get_building_analysis(
    building_id: str
) -> Dict[str, Any]:
    """Get analysis for a specific building."""
    if _latest_analysis is None:
        return {"status": "no_analysis_available"}
    
    building_states = _latest_analysis.get("building_states", {})
    building_state = building_states.get(building_id)
    
    if not building_state:
        return {"error": "Building not found in analysis"}
    
    return building_state


@router.get("/room/{room_id}")
async def get_room_analysis(
    room_id: str
) -> Dict[str, Any]:
    """Get analysis for a specific room."""
    if _latest_analysis is None:
        return {"status": "no_analysis_available"}
    
    # Search through building states for room
    for building_state in _latest_analysis.get("building_states", {}).values():
        for room_state in building_state.get("room_states", []):
            if room_state.get("room_id") == room_id:
                return room_state
    
    return {"error": "Room not found in analysis"}


@router.post("/refresh")
async def trigger_analysis_refresh(
    background_tasks: BackgroundTasks,
    campus_graph: CampusAgentGraph = Depends(get_campus_graph),
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, str]:
    """Trigger a background analysis refresh."""
    async def run_background_analysis():
        current_data = data_service.get_current_observations()
        result = await campus_graph.run_campus_analysis(current_data)
        global _latest_analysis
        _latest_analysis = result
    
    background_tasks.add_task(run_background_analysis)
    
    return {"status": "analysis_scheduled", "message": "Analysis running in background"}
