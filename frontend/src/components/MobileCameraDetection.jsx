import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Play, Square, Download, Users } from 'lucide-react';
import './MobileCameraDetection.css';

function MobileCameraDetection() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [personCount, setPersonCount] = useState(0);
  const [occupancyLevel, setOccupancyLevel] = useState('low');
  const [capacity, setCapacity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processedFrame, setProcessedFrame] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const processingIntervalRef = useRef(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err) {
      setError(`Camera access failed: ${err.message}`);
      console.error('Camera error:', err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setProcessedFrame(null);
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Capture and process frame
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !roomId) {
      setError('Camera not ready or room not selected');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Draw video frame to canvas
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      // Get base64 frame
      const base64Frame = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

      // Send to backend
      const formData = new FormData();
      formData.append('room_id', roomId);
      formData.append('frame_data', base64Frame);
      formData.append('draw_boxes', 'true');

      const response = await fetch('/api/detection/process-frame', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // Response was not JSON
        }
        throw new Error(`API error (${response.status}): ${errorMsg}`);
      }

      const result = await response.json();
      
      setPersonCount(result.person_count);
      setOccupancyLevel(result.occupancy_level);
      setCapacity(result.capacity);
      setProcessedFrame(result.output_frame);

      // Add to history
      setDetectionHistory(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        count: result.person_count,
        level: result.occupancy_level
      }].slice(-10)); // Keep last 10 detections

      setLoading(false);
    } catch (err) {
      setError(`Detection failed: ${err.message}`);
      console.error('Processing error:', err);
      setLoading(false);
    }
  }, [roomId]);

  // Start auto-processing
  const startAutoProcessing = useCallback(() => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }

    if (!roomId) {
      setError('Please select a room first');
      return;
    }

    startCamera();
    
    // Process frame every 2 seconds
    processingIntervalRef.current = setInterval(() => {
      captureAndProcess();
    }, 2000);
  }, [roomId, startCamera, captureAndProcess]);

  // Stop auto-processing
  const stopAutoProcessing = () => {
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    stopCamera();
  };

  // Download current frame
  const downloadFrame = () => {
    if (processedFrame) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${processedFrame}`;
      link.download = `room-${roomId}-${new Date().toISOString()}.jpg`;
      link.click();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="mobile-camera-fab"
          onClick={() => setIsOpen(true)}
          title="Open Person Counter"
        >
          📷
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="mobile-camera-modal">
          <div className="mobile-camera-container">
            {/* Header */}
            <div className="camera-header">
              <h2>
                <Users size={24} />
                Person Counter
              </h2>
              <button
                className="close-btn"
                onClick={() => {
                  setIsOpen(false);
                  stopAutoProcessing();
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Room Selection */}
            <div className="room-selection">
              <label htmlFor="room-input">Select Room:</label>
              <input
                id="room-input"
                type="text"
                placeholder="e.g., sci-101 (Science Hall, Room 101)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.trim())}
                disabled={isStreaming}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Video Feed */}
            {isStreaming && (
              <div className="video-container">
                <video
                  ref={videoRef}
                  className="video-feed"
                  autoPlay
                  playsInline
                />
              </div>
            )}

            {/* Processed Frame Display */}
            {processedFrame && (
              <div className="processed-frame-container">
                <img
                  src={`data:image/jpeg;base64,${processedFrame}`}
                  alt="Processed frame with detections"
                  className="processed-frame"
                />
              </div>
            )}

            {/* Detection Stats */}
            {(personCount > 0 || isStreaming) && (
              <div className="detection-stats">
                <div className="stat-card">
                  <div className="stat-label">People Detected</div>
                  <div className="stat-value">{personCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Occupancy Level</div>
                  <div className={`stat-value level-${occupancyLevel}`}>
                    {occupancyLevel.toUpperCase()}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Capacity</div>
                  <div className="stat-value">{capacity}</div>
                </div>
              </div>
            )}

            {/* Detection History */}
            {detectionHistory.length > 0 && (
              <div className="detection-history">
                <h3>Detection History</h3>
                <div className="history-list">
                  {detectionHistory.map((entry, idx) => (
                    <div key={idx} className="history-entry">
                      <span className="history-time">{entry.timestamp}</span>
                      <span className="history-count">{entry.count} people</span>
                      <span className={`history-level level-${entry.level}`}>
                        {entry.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="camera-controls">
              {!isStreaming ? (
                <button
                  className="btn btn-primary"
                  onClick={startAutoProcessing}
                  disabled={!roomId || loading}
                >
                  <Play size={18} />
                  Start Detection
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={captureAndProcess}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Capture Frame'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={stopAutoProcessing}
                  >
                    <Square size={18} />
                    Stop
                  </button>
                </>
              )}
              {processedFrame && (
                <button
                  className="btn btn-secondary"
                  onClick={downloadFrame}
                >
                  <Download size={18} />
                  Download
                </button>
              )}
            </div>

            {/* Info */}
            <div className="camera-info">
              <p>
                💡 <strong>Tip:</strong> Point your camera at the room to count people.
                Make sure there's good lighting for best results.
              </p>
            </div>

            {/* Hidden Canvas for Frame Capture */}
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default MobileCameraDetection;
