"""Person detection endpoints using YOLOv8."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
import base64
import logging
import traceback

from api.dependencies import get_data_service
from api.data_service import DataService
from agents.person_detector import get_detector, PersonDetector

router = APIRouter()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


@router.post("/process-frame")
async def process_frame(
    room_id: str = Form(...),
    frame_data: str = Form(...),
    draw_boxes: bool = Form(True),
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """
    Process a frame from mobile camera and detect people in the room.
    
    Args:
        room_id: ID of the room being analyzed
        frame_data: Base64-encoded JPEG frame (without 'data:image/jpeg;base64,' prefix)
        draw_boxes: Whether to draw bounding boxes on output frame
        data_service: Data service dependency
    
    Returns:
        {
            "room_id": str,
            "person_count": int,
            "occupancy_level": str,  # "low", "medium", "high"
            "capacity": int,
            "output_frame": str,  # Base64-encoded frame with detected boxes
            "detection_details": {
                "total_detections": int,
                "person_detections": list,
                "confidence_scores": list
            },
            "timestamp": str
        }
    """
    try:
        # Validate room exists
        campus_data = data_service.get_campus_structure()
        if room_id not in campus_data.get("rooms", {}):
            raise HTTPException(
                status_code=404,
                detail=f"Room '{room_id}' not found in campus database. Available buildings: lib, sci, eng, dorm, cafe (e.g., sci-101)"
            )
        
        # Get detector
        detector = get_detector(model_name="yolov8n.pt", conf_threshold=0.4)
        
        # Process frame
        person_count, output_frame, detection_details = detector.process_base64_frame(
            frame_data,
            draw_boxes=draw_boxes
        )
        
        # Update occupancy in data service
        room_obs = data_service.update_room_occupancy(room_id, person_count)
        
        room_config = campus_data["rooms"][room_id]
        
        return {
            "room_id": room_id,
            "person_count": person_count,
            "occupancy_level": room_obs.get("occupancy_level", "low"),
            "capacity": room_config.get("capacity", 30),
            "output_frame": output_frame,
            "detection_details": detection_details,
            "timestamp": room_obs.get("last_detection_time")
        }
    
    except HTTPException:
        raise
    except ImportError as e:
        logger.error(f"Import error (missing dependencies): {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=503,
            detail=f"Detection service unavailable - missing dependencies. Error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error processing frame for room {room_id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing frame: {str(e)}"
        )


@router.post("/batch-process")
async def batch_process_frames(
    requests_data: str = Form(...),
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """
    Process multiple frames in batch.
    
    Args:
        requests_data: JSON string containing list of {room_id, frame_data, draw_boxes}
    
    Returns:
        List of processed results
    """
    import json
    
    try:
        requests = json.loads(requests_data)
        if not isinstance(requests, list):
            raise ValueError("requests_data must be a JSON array")
        
        results = []
        detector = get_detector(model_name="yolov8n.pt", conf_threshold=0.4)
        
        for req in requests:
            room_id = req.get("room_id")
            frame_data = req.get("frame_data")
            draw_boxes = req.get("draw_boxes", True)
            
            if not room_id or not frame_data:
                results.append({
                    "room_id": room_id,
                    "error": "Missing room_id or frame_data"
                })
                continue
            
            try:
                person_count, output_frame, detection_details = detector.process_base64_frame(
                    frame_data,
                    draw_boxes=draw_boxes
                )
                
                room_obs = data_service.update_room_occupancy(room_id, person_count)
                
                results.append({
                    "room_id": room_id,
                    "person_count": person_count,
                    "occupancy_level": room_obs.get("occupancy_level"),
                    "output_frame": output_frame,
                    "status": "success"
                })
            
            except Exception as e:
                results.append({
                    "room_id": room_id,
                    "error": str(e),
                    "status": "error"
                })
        
        return {
            "total_requests": len(requests),
            "successful": len([r for r in results if r.get("status") == "success"]),
            "results": results
        }
    
    except Exception as e:
        logger.error(f"Error in batch process: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing batch: {str(e)}"
        )


@router.get("/room/{room_id}/occupancy")
async def get_room_occupancy(
    room_id: str,
    data_service: DataService = Depends(get_data_service)
) -> Dict[str, Any]:
    """
    Get current occupancy for a room.
    
    Args:
        room_id: ID of the room
    
    Returns:
        Current occupancy information
    """
    try:
        campus_data = data_service.get_campus_structure()
        observations = data_service.get_current_observations()
        
        if room_id not in campus_data.get("rooms", {}):
            raise HTTPException(
                status_code=404,
                detail=f"Room '{room_id}' not found"
            )
        
        room_config = campus_data["rooms"][room_id]
        room_obs = observations.get("rooms", {}).get(room_id, {})
        
        return {
            "room_id": room_id,
            "room_name": f"{room_id}",
            "capacity": room_config.get("capacity", 30),
            "occupancy": room_obs.get("occupancy", 0),
            "occupancy_level": room_obs.get("occupancy_level", "low"),
            "detection_method": room_obs.get("detection_method", "unknown"),
            "last_updated": room_obs.get("last_detection_time")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting occupancy for room {room_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/detect-from-image")
async def detect_from_image(
    image: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    Detect people in an uploaded image using YOLOv8.
    This is a standalone endpoint (no room_id required) for use in the
    room configuration panel — the frontend sends an image upload and
    receives a person count it can feed into the room config.

    Accepts: JPEG / PNG image file
    Returns:
        {
            "person_count": int,
            "output_frame": str (base64 JPEG with drawn boxes),
            "detection_details": { ... }
        }
    """
    try:
        # Validate content type
        if image.content_type not in ("image/jpeg", "image/png", "image/jpg", "image/webp"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image type '{image.content_type}'. Use JPEG or PNG."
            )

        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        frame_b64 = base64.b64encode(image_bytes).decode("utf-8")

        detector = get_detector(model_name="yolov8n.pt", conf_threshold=0.4)
        person_count, output_frame, detection_details = detector.process_base64_frame(
            frame_b64, draw_boxes=True
        )

        return {
            "person_count": person_count,
            "output_frame": output_frame,
            "detection_details": detection_details,
        }

    except HTTPException:
        raise
    except ImportError as e:
        logger.error(f"Import error (missing dependencies): {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=503,
            detail=f"Detection service unavailable — missing dependencies. Error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error detecting from uploaded image: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")


@router.get("/model-info")
async def get_model_info() -> Dict[str, Any]:
    """Get information about the detection model."""
    try:
        detector = get_detector()
        
        return {
            "model_name": detector.model_name,
            "device": detector.device.upper(),
            "confidence_threshold": detector.confidence_threshold,
            "class_id_for_person": detector.PERSON_CLASS_ID,
            "status": "ready"
        }
    
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
