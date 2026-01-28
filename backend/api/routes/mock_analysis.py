"""Mock analysis endpoint for demo purposes - no actual AI calls."""
from fastapi import APIRouter, Depends
from typing import Dict, Any
import random
from datetime import datetime

from api.dependencies import get_data_service
from api.data_service import DataService

router = APIRouter(prefix="/api/mock", tags=["mock"])


def generate_mock_room_analysis(room_id: str, room_data: Dict) -> Dict[str, Any]:
    """Generate realistic mock analysis for a room."""
    occupancy = room_data.get("occupancy", 0)
    capacity = room_data.get("capacity", 30)
    occupancy_pct = (occupancy / capacity * 100) if capacity > 0 else 0
    
    # Generate realistic energy based on room type and occupancy
    base_energy = {
        "classroom": 3.5,
        "lab": 8.0,
        "library": 2.5,
        "dorm": 1.2,
        "cafeteria": 12.0,
        "bathroom": 0.8
    }.get(room_data.get("type", "classroom"), 3.0)
    
    energy = base_energy * (0.3 + occupancy_pct / 100 * 0.7)
    
    # Generate recommendations
    recommendations = []
    if occupancy_pct < 20 and energy > 2:
        recommendations.append("Reduce HVAC - low occupancy detected")
        recommendations.append("Auto-dim lights to 40% brightness")
    if occupancy_pct > 80:
        recommendations.append("Increase ventilation for high occupancy")
    recommendations.append(f"Schedule next maintenance check")
    
    anomalies = []
    if occupancy == 0 and energy > base_energy * 0.5:
        anomalies.append("Equipment running with no occupants")
    
    return {
        "room_id": room_id,
        "room_type": room_data.get("type", "classroom"),
        "building_id": room_data.get("building_id", "unknown"),
        "current_occupancy": occupancy,
        "capacity": capacity,
        "occupancy_level": "high" if occupancy_pct > 70 else "medium" if occupancy_pct > 30 else "low",
        "estimated_energy_kw": round(energy, 2),
        "estimated_water_lph": round(random.uniform(0, 5) if room_data.get("type") in ["bathroom", "cafeteria"] else 0, 1),
        "estimated_co2_ppm": int(400 + occupancy_pct * 4),
        "predicted_occupancy_1h": max(0, occupancy + random.randint(-5, 10)),
        "predicted_energy_1h": round(energy * random.uniform(0.8, 1.2), 2),
        "recommendations": recommendations[:3],
        "anomalies": anomalies,
        "savings_potential": round(random.uniform(10, 35), 1),
        "last_updated": datetime.now().isoformat()
    }


def generate_mock_building_analysis(building_id: str, rooms: Dict) -> Dict[str, Any]:
    """Generate mock building-level analysis."""
    building_rooms = {rid: r for rid, r in rooms.items() if r.get("building_id") == building_id}
    
    total_energy = sum(
        generate_mock_room_analysis(rid, r)["estimated_energy_kw"] 
        for rid, r in building_rooms.items()
    )
    total_occupancy = sum(r.get("occupancy", 0) for r in building_rooms.values())
    total_capacity = sum(r.get("capacity", 30) for r in building_rooms.values())
    
    occupancy_rate = (total_occupancy / total_capacity * 100) if total_capacity > 0 else 0
    
    recommendations = [
        f"Close floors with <20% occupancy → Save {random.randint(15, 25)} kW",
        "Enable smart HVAC scheduling across building",
        "Consolidate activities to fewer active zones"
    ]
    
    return {
        "building_id": building_id,
        "total_rooms": len(building_rooms),
        "total_energy_kw": round(total_energy, 2),
        "total_occupancy": total_occupancy,
        "total_capacity": total_capacity,
        "occupancy_rate": round(occupancy_rate, 1),
        "avg_energy_per_room": round(total_energy / len(building_rooms), 2) if building_rooms else 0,
        "recommendations": recommendations,
        "savings_potential": round(random.uniform(20, 40), 1),
        "room_states": {
            rid: generate_mock_room_analysis(rid, r) 
            for rid, r in list(building_rooms.items())[:5]  # Sample first 5 rooms
        }
    }


@router.get("/analysis/current")
async def get_mock_analysis(data_service: DataService = Depends(get_data_service)):
    """Generate mock campus analysis without calling AI agents."""
    campus_data = data_service.get_campus_structure()
    current_obs = data_service.get_current_observations()
    
    # Merge room data
    rooms = {}
    for room_id, room_config in campus_data["rooms"].items():
        rooms[room_id] = {
            **room_config,
            "occupancy": current_obs["rooms"].get(room_id, {}).get("occupancy", 0)
        }
    
    # Generate building analyses
    building_states = {}
    for building_id in campus_data["buildings"].keys():
        building_states[building_id] = generate_mock_building_analysis(building_id, rooms)
    
    # Campus-wide metrics
    total_energy = sum(b["total_energy_kw"] for b in building_states.values())
    total_occupancy = sum(b["total_occupancy"] for b in building_states.values())
    total_water = round(random.uniform(150, 300), 1)
    
    campus_recommendations = [
        "🏢 Peak energy 2-6 PM across Science & Engineering",
        "💡 Smart grid implementation: 20-25% energy reduction potential",
        "🌡️ HVAC optimization: 30% of total savings opportunity",
        "📊 Consolidate classes after 6 PM: reduce active spaces 40%",
        "🎯 Priority: Science Hall highest savings potential (28%)"
    ]
    
    # Identify critical buildings
    critical_buildings = [
        {"building_id": bid, "reason": "High energy usage", "energy_kw": b["total_energy_kw"]}
        for bid, b in building_states.items()
        if b["total_energy_kw"] > 50
    ]
    
    return {
        "timestamp": datetime.now().isoformat(),
        "campus_metrics": {
            "total_energy_kw": round(total_energy, 2),
            "total_water_lph": total_water,
            "total_occupancy": total_occupancy,
            "total_buildings": len(building_states),
            "total_rooms": len(rooms),
            "avg_occupancy_rate": round(
                sum(b["occupancy_rate"] for b in building_states.values()) / len(building_states), 1
            ) if building_states else 0,
            "estimated_cost_per_hour": round(total_energy * 0.12 + total_water * 0.002, 2),
            "potential_savings_percent": round(random.uniform(22, 35), 1)
        },
        "building_states": building_states,
        "campus_recommendations": campus_recommendations,
        "critical_buildings": critical_buildings,
        "analysis_type": "MOCK_SIMULATION",
        "note": "This is simulated data for demo purposes. Real agent analysis coming soon!"
    }
