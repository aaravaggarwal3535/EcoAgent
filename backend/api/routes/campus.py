"""Campus information endpoints."""
from fastapi import APIRouter, Depends
from typing import Dict, Any

from api.dependencies import get_campus_graph, get_data_service
from agents.campus_graph import CampusAgentGraph
from api.data_service import DataService

router = APIRouter()

from pydantic import BaseModel

class UploadArchitectureRequest(BaseModel):
    campus_info: Dict[str, Any]
    buildings: Dict[str, Any]
    rooms: Dict[str, Any]

@router.post("/upload-architecture")
async def upload_architecture(
    request: UploadArchitectureRequest,
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Upload and set new campus architecture from Excel."""
    try:
        data_service.update_campus_structure(request.dict())
        return {"status": "success", "message": "Campus architecture updated successfully"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@router.get("/info")
async def get_campus_info(
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Get basic campus information."""
    campus_data = data_service.get_campus_structure()
    
    return {
        "campus_name": campus_data.get("campus_info", {}).get("name", "Campus"),
        "total_buildings": len(campus_data.get("buildings", {})),
        "total_rooms": len(campus_data.get("rooms", {})),
        "buildings": [
            {
                "id": b_id,
                "name": b_data.get("name"),
                "floors": b_data.get("floors"),
                "room_count": len([r for r in campus_data.get("rooms", {}).values() if r.get("building_id") == b_id])
            }
            for b_id, b_data in campus_data.get("buildings", {}).items()
        ]
    }


@router.get("/buildings/{building_id}")
async def get_building_details(
    building_id: str,
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Get detailed information about a specific building."""
    campus_data = data_service.get_campus_structure()
    
    building = campus_data.get("buildings", {}).get(building_id)
    if not building:
        return {"error": "Building not found"}
    
    rooms = {
        r_id: r_data
        for r_id, r_data in campus_data.get("rooms", {}).items()
        if r_data.get("building_id") == building_id
    }
    
    return {
        "building_id": building_id,
        "building_name": building.get("name"),
        "floors": building.get("floors"),
        "total_rooms": len(rooms),
        "rooms": rooms
    }


@router.get("/rooms/{room_id}")
async def get_room_details(
    room_id: str,
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Get detailed information about a specific room."""
    campus_data = data_service.get_campus_structure()
    current_data = data_service.get_current_observations()
    
    room_config = campus_data.get("rooms", {}).get(room_id)
    if not room_config:
        return {"error": "Room not found"}
    
    room_obs = current_data.get("rooms", {}).get(room_id, {})
    
    return {
        "room_id": room_id,
        "config": room_config,
        "current_state": room_obs
    }
