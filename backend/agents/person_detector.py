"""
Real-time Person Detection Module using YOLOv8
Detects and counts the number of people in captured frames.
"""

import numpy as np
from typing import Tuple, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Try importing YOLOv8 and OpenCV
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available - install with: pip install opencv-python-headless")

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("YOLOv8 not available - install with: pip install ultralytics")


class PersonDetector:
    """Detects and counts people in images/video frames using YOLOv8."""
    
    # COCO class index for "person"
    PERSON_CLASS_ID = 0
    
    # Display colors (BGR format)
    BOX_COLOR = (0, 255, 0)        # Green bounding box
    TEXT_BG_COLOR = (0, 0, 0)       # Black text background
    TEXT_COLOR = (255, 255, 255)    # White text
    
    def __init__(
        self,
        model_name: str = "yolov8n.pt",
        conf_threshold: float = 0.4,
        device: str = "cpu"
    ):
        """
        Initialize the PersonDetector.
        
        Args:
            model_name: YOLOv8 model variant (yolov8n/s/m/l/x, default: nano for speed)
            conf_threshold: Confidence threshold for detections (0.0-1.0)
            device: Device to run inference on ('cpu' or 'cuda' for GPU)
        """
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        self.device = device
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self) -> None:
        """Load the YOLOv8 model."""
        if not YOLO_AVAILABLE:
            raise RuntimeError(
                "YOLOv8 not available. Install with: pip install ultralytics"
            )
        if not CV2_AVAILABLE:
            raise RuntimeError(
                "OpenCV not available. Install with: pip install opencv-python-headless"
            )
        
        try:
            logger.info(f"Loading YOLOv8 model: {self.model_name}")
            self.model = YOLO(self.model_name)
            self.model.to(self.device)
            logger.info(f"✓ Model loaded successfully on {self.device.upper()}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def detect_people(
        self,
        frame: np.ndarray,
        draw_boxes: bool = True
    ) -> Tuple[int, np.ndarray, Dict[str, Any]]:
        """
        Detect people in a frame using YOLOv8.
        
        Args:
            frame: Input image/frame (numpy array, BGR format)
            draw_boxes: Whether to draw bounding boxes on the output
        
        Returns:
            Tuple of (person_count, processed_frame, detection_details)
        """
        if self.model is None:
            raise RuntimeError("Model not initialized. Call _initialize_model() first.")
        if not CV2_AVAILABLE:
            raise RuntimeError("OpenCV not available for drawing boxes")
        
        # Run inference
        results = self.model(frame, conf=self.conf_threshold, verbose=False)
        
        person_count = 0
        detection_details = {
            "frame_shape": frame.shape,
            "total_detections": 0,
            "person_detections": [],
            "confidence_scores": []
        }
        
        # Process detections
        output_frame = frame.copy() if draw_boxes else frame
        
        if results and len(results) > 0:
            boxes = results[0].boxes
            detection_details["total_detections"] = len(boxes)
            
            for box in boxes:
                # Get class ID and confidence
                cls_id = int(box.cls)
                confidence = float(box.conf)
                
                # Only count people (class 0 in COCO)
                if cls_id == self.PERSON_CLASS_ID:
                    person_count += 1
                    detection_details["person_detections"].append({
                        "confidence": confidence,
                        "box": box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    })
                    detection_details["confidence_scores"].append(confidence)
                    
                    # Draw bounding box if requested
                    if draw_boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cv2.rectangle(
                            output_frame,
                            (x1, y1),
                            (x2, y2),
                            self.BOX_COLOR,
                            2
                        )
                        
                        # Draw label with confidence
                        label = f"Person {confidence:.2f}"
                        label_size = cv2.getTextSize(
                            label,
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            1
                        )[0]
                        
                        cv2.rectangle(
                            output_frame,
                            (x1, y1 - label_size[1] - 4),
                            (x1 + label_size[0], y1),
                            self.TEXT_BG_COLOR,
                            -1
                        )
                        cv2.putText(
                            output_frame,
                            label,
                            (x1, y1 - 2),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            self.TEXT_COLOR,
                            1
                        )
        
        # Draw count banner if boxes were drawn
        if draw_boxes:
            output_frame = self._draw_count_banner(output_frame, person_count)
        
        return person_count, output_frame, detection_details
    
    def _draw_count_banner(
        self,
        frame: np.ndarray,
        person_count: int
    ) -> np.ndarray:
        """
        Draw a banner at the top showing the person count.
        
        Args:
            frame: Input frame
            person_count: Number of people detected
        
        Returns:
            Frame with banner drawn
        """
        if not CV2_AVAILABLE:
            return frame
        
        banner_height = 50
        banner = np.zeros(
            (banner_height, frame.shape[1], 3),
            dtype=np.uint8
        )
        
        # Semi-transparent overlay
        overlay = frame.copy()
        overlay[:banner_height, :] = banner
        frame = cv2.addWeighted(overlay, 0.3, frame, 0.7, 0)
        
        # Draw count text
        text = f"People Detected: {person_count}"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 1.5
        thickness = 2
        text_size = cv2.getTextSize(text, font, font_scale, thickness)[0]
        
        x = (frame.shape[1] - text_size[0]) // 2
        y = (banner_height + text_size[1]) // 2
        
        cv2.putText(
            frame,
            text,
            (x, y),
            font,
            font_scale,
            self.TEXT_COLOR,
            thickness
        )
        
        return frame
    
    def process_base64_frame(
        self,
        frame_data: str,
        draw_boxes: bool = True
    ) -> Tuple[int, str, Dict[str, Any]]:
        """
        Process a base64-encoded frame.
        
        Args:
            frame_data: Base64 encoded JPEG frame (without "data:image/jpeg;base64," prefix)
            draw_boxes: Whether to draw bounding boxes
        
        Returns:
            Tuple of (person_count, base64_output_frame, detection_details)
        """
        if not CV2_AVAILABLE:
            raise RuntimeError("OpenCV not available. Install with: pip install opencv-python-headless")
        
        import base64
        import io
        from PIL import Image
        
        try:
            # Decode base64 to image
            image_bytes = base64.b64decode(frame_data)
            img = Image.open(io.BytesIO(image_bytes))
            frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            
            # Detect people
            count, output_frame, details = self.detect_people(frame, draw_boxes)
            
            # Encode output frame back to base64
            _, buffer = cv2.imencode('.jpg', output_frame)
            output_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return count, output_base64, details
        
        except Exception as e:
            logger.error(f"Error processing base64 frame: {e}")
            raise


# Global detector instance (lazy loaded)
_detector_instance: PersonDetector = None


def get_detector(
    model_name: str = "yolov8n.pt",
    conf_threshold: float = 0.4
) -> PersonDetector:
    """
    Get or create the global PersonDetector instance.
    
    Args:
        model_name: YOLOv8 model variant
        conf_threshold: Confidence threshold for detections
    
    Returns:
        PersonDetector instance
    """
    global _detector_instance
    
    if _detector_instance is None:
        try:
            device = "cuda" if _check_gpu_available() else "cpu"
            _detector_instance = PersonDetector(
                model_name=model_name,
                conf_threshold=conf_threshold,
                device=device
            )
        except Exception as e:
            logger.error(f"Failed to initialize detector: {e}")
            raise
    
    return _detector_instance


def _check_gpu_available() -> bool:
    """Check if CUDA GPU is available."""
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False
