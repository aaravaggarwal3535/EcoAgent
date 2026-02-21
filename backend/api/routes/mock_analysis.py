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
            for rid, r in building_rooms.items()  # Analyze all rooms in building
        }
    }


@router.get("/analysis/current")
async def get_mock_analysis(
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
    data_service: DataService = Depends(get_data_service)
):
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
    
    # Apply environmental parameters if specified
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
    
    if avg_occupancy is not None:
        for room_id, room_data in rooms.items():
            room_type = room_data.get('type', 'classroom')
            capacity = room_data.get('capacity', 30)
            
            # Apply occupancy with variation
            variation = random.randint(-5, 5)
            room_data['occupancy'] = max(0, min(avg_occupancy + variation, capacity))
            occupancy_ratio = room_data['occupancy'] / capacity if capacity > 0 else 0
            if occupancy_ratio < 0.3:
                room_data['occupancy_level'] = 'low'
            elif occupancy_ratio < 0.7:
                room_data['occupancy_level'] = 'medium'
            else:
                room_data['occupancy_level'] = 'high'
    
    # Generate building analyses
    building_states = {}
    for building_id in campus_data["buildings"].keys():
        building_states[building_id] = generate_mock_building_analysis(building_id, rooms)
    
    # Campus-wide metrics
    total_energy = sum(b["total_energy_kw"] for b in building_states.values())
    total_occupancy = sum(b["total_occupancy"] for b in building_states.values())
    total_capacity = sum(b["total_capacity"] for b in building_states.values())
    total_water = round(random.uniform(150, 300), 1)
    avg_occupancy_rate = round((total_occupancy / total_capacity * 100), 1) if total_capacity > 0 else 0
    
    # Generate AI-powered recommendations based on actual data
    campus_recommendations = generate_ai_recommendations(
        building_states=building_states,
        total_energy=total_energy,
        total_occupancy=total_occupancy,
        total_capacity=total_capacity,
        avg_occupancy_rate=avg_occupancy_rate
    )
    
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
            "avg_occupancy_rate": avg_occupancy_rate,
            "estimated_cost_per_hour": round(total_energy * 0.12 + total_water * 0.002, 2),
            "potential_savings_percent": round(random.uniform(22, 35), 1)
        },
        "building_states": building_states,
        "campus_recommendations": campus_recommendations,
        "critical_buildings": critical_buildings,
        "analysis_type": "MOCK_SIMULATION",
        "note": "This is simulated data for demo purposes. Real agent analysis coming soon!"
    }


def generate_ai_recommendations(building_states, total_energy, total_occupancy, total_capacity, avg_occupancy_rate):
    """Generate intelligent recommendations based on campus data analysis."""
    recommendations = []
    
    # Find highest energy consuming buildings
    sorted_buildings = sorted(building_states.items(), key=lambda x: x[1]["total_energy_kw"], reverse=True)
    top_building = sorted_buildings[0] if sorted_buildings else None
    
    # Find underutilized buildings (low occupancy)
    underutilized = [
        (bid, b) for bid, b in building_states.items()
        if b["occupancy_rate"] < 20
    ]
    
    # Recommendation 1: Peak energy demand pattern
    if total_occupancy > total_capacity * 0.5:  # If above 50% capacity
        peak_time = random.choice(["2-5 PM", "3-6 PM", "1-4 PM"])
        top_building_name = top_building[0] if top_building else "Science Hall"
        recommendations.append(
            f"🏢 Peak energy demand {peak_time} across {top_building_name}"
        )
    
    # Recommendation 2: Smart grid implementation
    smart_grid_savings = round(random.uniform(20, 30))
    recommendations.append(
        f"💡 Smart grid implementation: {smart_grid_savings}% energy reduction potential"
    )
    
    # Recommendation 3: HVAC optimization
    hvac_savings = round(random.uniform(25, 35))
    recommendations.append(
        f"🌡️ HVAC optimization: {hvac_savings}% of total savings opportunity"
    )
    
    # Recommendation 4: Space consolidation based on occupancy
    if avg_occupancy_rate < 60:  # If below 60% capacity
        consolidation_savings = round(random.uniform(30, 50))
        recommendations.append(
            f"📊 Consolidate underutilized spaces: reduce active areas {consolidation_savings}%"
        )
    else:
        recommendations.append(
            "📊 Distribute classes during peak hours to balance load"
        )
    
    # Recommendation 5: Priority action based on building analysis
    if top_building:
        top_savings = round(random.uniform(20, 35))
        recommendations.append(
            f"🎯 Priority: {top_building[0]} shows highest savings potential ({top_savings}%)"
        )
    
    return recommendations
