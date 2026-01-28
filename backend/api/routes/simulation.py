"""Simulation endpoints - what-if scenarios."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from api.dependencies import get_campus_graph, get_data_service
from agents.campus_graph import CampusAgentGraph
from api.data_service import DataService

router = APIRouter()


class SimulationScenario(BaseModel):
    """What-if simulation scenario."""
    name: str
    type: str  # close_building, reduce_hvac, shift_schedule
    building_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


@router.post("/run")
async def run_simulation(
    scenario: SimulationScenario,
    campus_graph: CampusAgentGraph = Depends(get_campus_graph),
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Run a what-if simulation scenario."""
    current_data = data_service.get_current_observations()
    
    # Extract custom parameters
    params = scenario.parameters or {}
    num_rooms = params.get('num_rooms', None)
    num_buildings = params.get('num_buildings', None)
    budget_level = params.get('budget_level', 'medium')
    
    scenario_dict = {
        "name": scenario.name,
        "type": scenario.type,
        "building_id": scenario.building_id,
        "parameters": scenario.parameters or {}
    }
    
    # Run simulation with budget constraints
    result = campus_graph.run_what_if_simulation(
        scenario_dict, 
        current_data,
        num_rooms=num_rooms,
        num_buildings=num_buildings,
        budget_level=budget_level
    )
    
    return result


@router.get("/templates")
async def get_scenario_templates() -> List[Dict[str, Any]]:
    """Get pre-defined simulation scenario templates."""
    return [
        {
            "id": "close_building_night",
            "name": "Close Building After 8 PM",
            "type": "close_building",
            "description": "Simulate closing a building after 8 PM to save energy",
            "estimated_impact": "15-25% building energy savings"
        },
        {
            "id": "reduce_hvac_low_occupancy",
            "name": "Reduce HVAC in Low Occupancy",
            "type": "reduce_hvac",
            "description": "Reduce HVAC in rooms with <30% occupancy",
            "estimated_impact": "10-15% campus energy savings"
        },
        {
            "id": "consolidate_classes",
            "name": "Consolidate Evening Classes",
            "type": "shift_schedule",
            "description": "Move all evening classes to 2 buildings",
            "estimated_impact": "20-30% evening energy savings"
        }
    ]


@router.post("/compare")
async def compare_scenarios(
    scenarios: List[SimulationScenario],
    campus_graph: CampusAgentGraph = Depends(get_campus_graph),
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """Compare multiple simulation scenarios."""
    current_data = data_service.get_current_observations()
    
    results = []
    for scenario in scenarios:
        scenario_dict = {
            "name": scenario.name,
            "type": scenario.type,
            "building_id": scenario.building_id,
            "parameters": scenario.parameters or {}
        }
        
        result = campus_graph.run_what_if_simulation(scenario_dict, current_data)
        results.append({
            "scenario": scenario.name,
            "savings": result.get("comparison", {})
        })
    
    # Rank by energy savings
    ranked = sorted(results, key=lambda x: x["savings"].get("energy_savings_pct", 0), reverse=True)
    
    return {
        "scenarios_compared": len(scenarios),
        "results": ranked,
        "recommended": ranked[0] if ranked else None
    }
