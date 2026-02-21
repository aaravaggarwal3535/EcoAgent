# API Error Troubleshooting Guide

## Common Issues & Solutions

### 1. "Detection failed: API error (503)" - Missing Dependencies

**Problem**: YOLOv8 or OpenCV not installed properly

**Root Cause**: The `opencv-python` package requires system dependencies in containerized environments. This is a known issue in Docker/dev containers.

**Solution**:

```bash
# Step 1: Navigate to backend
cd /workspaces/EcoAgent/backend

# Step 2: Remove problematic opencv-python
pip uninstall -y opencv-python

# Step 3: Install headless version (works in containers)
pip install opencv-python-headless

# Step 4: Verify
python -c "from ultralytics import YOLO; print('✓ Ready')"

# Step 5: Restart backend
python main.py
```

**What changed**: `requirements.txt` now uses `opencv-python-headless` instead of `opencv-python`

---

### 2. "Detection failed: API error (404)" - Invalid Room ID

**Problem**: Room not found in database

**Solution**: 
- Use correct room format: `{building}-{room_number}`
- Valid buildings: `lib`, `sci`, `eng`, `dorm`, `cafe`
- Valid room numbers: two digits (e.g., `01`, `05`, `15`)

**Examples**:
- ✅ `sci-101` (Science Hall, Room 101)
- ✅ `lib-304` (Library, Room 304)  
- ✅ `eng-201` (Engineering, Room 201)
- ❌ `123` (Invalid - no building code)
- ❌ `science-101` (Invalid - wrong building code)

**To see all available rooms**:
```bash
curl http://localhost:8000/api/campus/info | python -m json.tool
```

---

### 3. "Detection failed: API error" - Backend Not Running

**Problem**: Cannot connect to API

**Solution**:

```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running:
cd /workspaces/EcoAgent/backend
python main.py

# Check CORS is enabled (should see success):
curl -i http://localhost:8000/api/detection/model-info
```

---

### 4. Video Stream Shows Black / Camera Not Capturing

**Problem**: Frame is not being captured from camera

**Check**:
1. Browser has camera permission
2. Good lighting in the room
3. Camera is accessible via browser:
   - Chrome: Works ✅
   - Firefox: Works ✅ 
   - Safari: Works ✅ (iOS 14.5+)

**Solution**:
```javascript
// Test camera access in browser console
navigator.mediaDevices.getUserMedia({ video: {} })
  .then(stream => {
    console.log('✓ Camera access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('✗ Camera access denied:', err));
```

---

### 5. "0 people detected" When There Are People

**Problem**: Model not detecting people

**Possible Causes**:
- Lighting too dark
- People partially out of frame
- Confidence threshold too high (0.4 by default)
- Model downloading (first run is slow)

**Solutions**:

```python
# Option A: Lower confidence threshold
# In /workspaces/EcoAgent/backend/agents/person_detector.py:
CONF_THRESHOLD = 0.3  # Default is 0.4, try 0.3 or 0.2

# Option B: Use a more accurate model (slower)
# In MobileCameraDetection.jsx, use:
detector.model_name = "yolov8s.pt"  # Small model is more accurate than nano
```

---

### 6. Slow Processing / Frames Take Long to Process

**Problem**: Detection takes 5+ seconds per frame

**Solution**:
```javascript
// In MobileCameraDetection.jsx, increase processing interval:
// From: processingIntervalRef.current = setInterval(..., 2000);
// To:   processingIntervalRef.current = setInterval(..., 4000);  // 4 seconds
```

Or check GPU availability:
```python
# In person_detector.py
import torch
print("GPU Available:", torch.cuda.is_available())
```

---

### 7. CORS Error in Browser Console

**Problem**: `Access-Control-Allow-Origin` error

**Solution**: CORS should be enabled by default in `main.py`. If still failing:

```python
# Verify in /workspaces/EcoAgent/backend/main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Installation Checklist

### ✅ Quick Install

```bash
# 1. Install dependencies
cd /workspaces/EcoAgent/backend
pip install -r requirements.txt

# 2. Remove problematic opencv (if needed)
pip uninstall -y opencv-python
pip install opencv-python-headless

# 3. Test imports
python -c "from ultralytics import YOLO; from agents.person_detector import PersonDetector; print('✓ All set!')"

# 4. Start backend
python main.py

# 5. In another terminal, start frontend
cd /workspaces/EcoAgent/frontend
npm run dev
```

### ✅ Verification Steps

```bash
# Health check
curl http://localhost:8000/health

# Model info
curl http://localhost:8000/api/detection/model-info

# Available rooms
curl http://localhost:8000/api/campus/info | grep -o '"id": "[^"]*"'
```

---

## Log Files & Debugging

### Check Backend Logs

```bash
# Run backend with verbose output
cd /workspaces/EcoAgent/backend
python main.py

# Look for these lines:
# ✓ Model loaded successfully on CPU
# [DATA_SERVICE] Room {id}: {old} → {new} people detected
```

### Browser Console Debugging

```javascript
// Add to MobileCameraDetection.jsx for debugging:
console.log('API Response:', result);
console.log('Error:', err.message);
```

### Test Detection Endpoint Directly

```bash
# Create a test image (after you've started the server)
curl -X POST http://localhost:8000/api/detection/process-frame \
  -F "room_id=sci-101" \
  -F "frame_data=@test_frame.b64" \
  -F "draw_boxes=true"
```

---

## System Requirements

| Component | Requirement | Status |
|-----------|-------------|--------|
| Python | 3.8+ | ✅ |
| OpenCV | opencv-python-headless | ✅ (Headless) |
| YOLOv8 | ultralytics>=8.1.0 | ✅ |
| Browser | Modern (Chrome/Firefox/Safari) | ✅ |
| Camera | Any USB/Built-in | ✅ |
| RAM | 1GB min, 4GB recommended | ✅ |
| Disk | 500MB for model cache | ✅ |

---

## Performance Tips

1. **Use headless OpenCV**: `opencv-python-headless` (not `opencv-python`)
2. **Use nano model**: `yolov8n.pt` for speed (already configured)
3. **Increase processing interval**: Set to 3-5 seconds instead of 2
4. **Lower confidence**: 0.3 instead of 0.4 if missing detections
5. **Enable GPU**: If CUDA available, it's detected automatically

---

## Still Having Issues?

### Collect Information

```bash
# System info
python --version
pip list | grep -E "opencv|ultralytics|fastapi"
curl -v http://localhost:8000/api/detection/model-info 2>&1

# Backend logs (with timestamp)
cd /workspaces/EcoAgent/backend && python -u main.py 2>&1 | tee backend.log
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `ImportError: libGL.so.1` | OpenCV GUI lib missing | Use `opencv-python-headless` |
| `No module named 'ultralytics'` | Not installed | `pip install ultralytics` |
| `Connection refused` | Backend not running | `python main.py` |
| `404 Not Found` | Invalid room ID | Use format `building-room` |
| `CORS error` | Frontend/backend mismatch | Check CORS config in main.py |
| `Device busy` | Camera already in use | Close other camera apps |

---

## Need More Help?

1. Check the [MOBILE_CAMERA_GUIDE.md](../MOBILE_CAMERA_GUIDE.md) for full documentation
2. Review logs in the terminal running the backend
3. Check browser console (F12 → Console tab)
4. Verify all commands in this guide were executed

---

**Last Updated**: February 20, 2024
