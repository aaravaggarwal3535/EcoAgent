"""Dependencies for FastAPI routes."""
from fastapi import HTTPException
from typing import Optional

from agents.campus_graph import CampusAgentGraph
from api.data_service import DataService


# Global instances
campus_graph: Optional[CampusAgentGraph] = None
data_service: Optional[DataService] = None


def set_campus_graph(graph: CampusAgentGraph):
    """Set the campus graph instance."""
    global campus_graph
    campus_graph = graph


def set_data_service(service: DataService):
    """Set the data service instance."""
    global data_service
    data_service = service


def get_campus_graph() -> CampusAgentGraph:
    """Dependency to get campus graph instance."""
    if campus_graph is None:
        raise HTTPException(status_code=503, detail="Campus graph not initialized")
    return campus_graph


def get_data_service() -> DataService:
    """Dependency to get data service instance."""
    if data_service is None:
        raise HTTPException(status_code=503, detail="Data service not initialized")
    return data_service
