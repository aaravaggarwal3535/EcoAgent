import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Users,
  Upload,
  FileJson,
  ChevronDown,
  Check,
  AlertCircle,
  Grid3x3,
  LayoutList,
  RotateCcw,
  Camera,
  Loader,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { detectionAPI } from "../services/api";
import "./RoomConfigPanel.css";

/**
 * Component for configuring room-specific parameters
 * Supports Bulk (Global), Individual (Tabbed), and Table views
 */
export default function RoomConfigPanel({
  numRooms,
  numBuildings,
  globalConfig,
  onConfigChange,
}) {
  const [mode, setMode] = useState("bulk"); // 'bulk' | 'individual' | 'table'
  const [viewType, setViewType] = useState("tabs"); // 'tabs' | 'table'
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomConfigs, setRoomConfigs] = useState({});
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // --- Image-based person detection (YOLO) ---
  const imageInputRefs = useRef({});          // per-room hidden file inputs
  const [detectingRoom, setDetectingRoom] = useState(null);  // room id currently processing
  const [detectionPreviews, setDetectionPreviews] = useState({}); // room id → { outputFrame, count }
  const [detectionError, setDetectionError] = useState(null);

  const handleImageDetect = async (roomId, file) => {
    if (!file) return;
    setDetectingRoom(roomId);
    setDetectionError(null);
    try {
      const res = await detectionAPI.detectFromImage(file);
      const { person_count, output_frame } = res.data;
      // Update the occupancy for this room
      handleRoomChange(roomId, "avgOccupancy", person_count);
      // Store preview
      setDetectionPreviews((prev) => ({
        ...prev,
        [roomId]: { outputFrame: output_frame, count: person_count },
      }));
    } catch (err) {
      console.error("YOLO detection failed:", err);
      setDetectionError(
        err?.response?.data?.detail || "Detection failed. Make sure the backend is running."
      );
    } finally {
      setDetectingRoom(null);
    }
  };

  const clearDetectionPreview = (roomId) => {
    setDetectionPreviews((prev) => {
      const copy = { ...prev };
      delete copy[roomId];
      return copy;
    });
  };

  // Initialize room configs when scope changes
  useEffect(() => {
    // 1. Calculate the target room distribution
    // numRooms = rooms per building, numBuildings = number of buildings
    const validRoomIds = [];

    for (let b = 1; b <= numBuildings; b++) {
      for (let r = 1; r <= numRooms; r++) {
        validRoomIds.push({
          id: `b${b}-r${r}`,
          name: `Building ${b} - Room ${r}`,
        });
      }
    }

    // 2. Reconcile with existing state
    setRoomConfigs((prevConfigs) => {
      const nextConfigs = {};
      let hasChanges = false;

      // Keep existing valid rooms, add new ones
      validRoomIds.forEach((room) => {
        if (prevConfigs[room.id]) {
          nextConfigs[room.id] = prevConfigs[room.id];
        } else {
          nextConfigs[room.id] = {
            ...globalConfig,
            id: room.id,
            name: room.name,
            isModified: false,
          };
          hasChanges = true;
        }
      });

      // Check if any keys were removed (length difference)
      if (Object.keys(prevConfigs).length !== validRoomIds.length) {
        hasChanges = true;
      }

      return hasChanges ? nextConfigs : prevConfigs;
    });

    // 3. Fix selection if it disappeared
    // We use a timeout or separate effect to avoid race conditions with state updates,
    // but here we can check against the calculated list directly.
    if (!validRoomIds.find((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(validRoomIds[0]?.id || null);
    }
  }, [numRooms, numBuildings]); // Intentionally exclude globalConfig to avoid overwrites

  // Propagate changes up to Dashboard
  useEffect(() => {
    onConfigChange({
      mode,
      global: globalConfig,
      rooms: roomConfigs,
    });
  }, [roomConfigs, mode]);

  const handleGlobalChange = (key, value) => {
    // Update global config
    const newGlobal = { ...globalConfig, [key]: value };

    // Also update all rooms to match global (since we are in bulk mode)
    const newRoomConfigs = {};
    Object.keys(roomConfigs).forEach((id) => {
      newRoomConfigs[id] = { ...roomConfigs[id], [key]: value };
    });

    setRoomConfigs(newRoomConfigs);
    onConfigChange({ mode: "bulk", global: newGlobal, rooms: newRoomConfigs });
  };

  const handleRoomChange = (roomId, key, value) => {
    const newConfigs = {
      ...roomConfigs,
      [roomId]: { ...roomConfigs[roomId], [key]: value, isModified: true },
    };
    setRoomConfigs(newConfigs);
  };

  const resetRoomToGlobal = (roomId) => {
    const newConfigs = {
      ...roomConfigs,
      [roomId]: {
        ...globalConfig,
        id: roomId,
        name: roomConfigs[roomId].name,
        isModified: false,
      },
    };
    setRoomConfigs(newConfigs);
  };

  const resetAllToGlobal = () => {
    const newConfigs = {};
    Object.keys(roomConfigs).forEach((id) => {
      newConfigs[id] = {
        ...globalConfig,
        id: id,
        name: roomConfigs[id].name,
        isModified: false,
      };
    });
    setRoomConfigs(newConfigs);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        // Simple CSV parse: RoomID,Occupancy,Temp
        const lines = text.split("\n");
        const newConfigs = { ...roomConfigs };

        lines.slice(1).forEach((line) => {
          const [id, occ, temp] = line.split(",");
          if (id && newConfigs[id.trim()]) {
            const roomId = id.trim();
            if (occ) newConfigs[roomId].avgOccupancy = parseInt(occ);
            if (temp) newConfigs[roomId].acTemp = parseInt(temp);
            newConfigs[roomId].isModified = true;
          }
        });

        setRoomConfigs(newConfigs);
        setMode("individual");
        setImportError(null);
        alert("Configuration imported successfully!");
      } catch (err) {
        setImportError(
          "Failed to parse CSV. Format: RoomID,Occupancy,Temperature",
        );
      }
    };
    reader.readAsText(file);
  };

  const currentConfig =
    mode === "bulk"
      ? globalConfig
      : roomConfigs[selectedRoomId] || globalConfig;

  // Helper component to render control inputs
  const RoomControlsComponent = ({ config, roomId, isBulk = false }) => (
    <div className="controls-grid">
      <div className="control-item">
        <label>Avg Occupancy</label>
        <div className="range-wrapper">
          <input
            type="range"
            min="0"
            max="100"
            value={config.avgOccupancy || 0}
            onChange={(e) =>
              isBulk
                ? handleGlobalChange("avgOccupancy", parseInt(e.target.value))
                : handleRoomChange(roomId, "avgOccupancy", parseInt(e.target.value))
            }
          />
          <span>{config.avgOccupancy} ppl</span>
        </div>

        {/* --- Image upload for YOLO person detection (individual mode only) --- */}
        {!isBulk && (
          <div className="image-detect-section">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              ref={(el) => (imageInputRefs.current[roomId] = el)}
              onChange={(e) => handleImageDetect(roomId, e.target.files[0])}
            />
            <button
              className="detect-btn"
              disabled={detectingRoom === roomId}
              onClick={() => imageInputRefs.current[roomId]?.click()}
              title="Upload a room photo to auto-detect people using AI (YOLOv8)"
            >
              {detectingRoom === roomId ? (
                <><Loader size={14} className="spin" /> Detecting…</>
              ) : (
                <><Camera size={14} /> Detect from Image</>
              )}
            </button>

            {detectionPreviews[roomId] && (
              <div className="detection-preview">
                <div className="detection-preview-header">
                  <span className="detected-count">
                    <Users size={14} /> {detectionPreviews[roomId].count} person{detectionPreviews[roomId].count !== 1 ? "s" : ""} detected
                  </span>
                  <button className="clear-preview" onClick={() => clearDetectionPreview(roomId)} title="Dismiss preview">
                    <X size={12} />
                  </button>
                </div>
                <img
                  src={`data:image/jpeg;base64,${detectionPreviews[roomId].outputFrame}`}
                  alt="Detection result"
                  className="detection-result-img"
                />
              </div>
            )}

            {detectionError && detectingRoom === null && (
              <p className="detection-error"><AlertCircle size={12} /> {detectionError}</p>
            )}
          </div>
        )}
      </div>

      <div className="control-item">
        <label>AC Temperature</label>
        <div className="range-wrapper">
          <input
            type="range"
            min="16"
            max="30"
            value={config.acTemp || 22}
            onChange={(e) =>
              isBulk
                ? handleGlobalChange("acTemp", parseInt(e.target.value))
                : handleRoomChange(roomId, "acTemp", parseInt(e.target.value))
            }
          />
          <span>{config.acTemp}°C</span>
        </div>
      </div>

      <div className="control-item">
        <label>Computers Running</label>
        <div className="range-wrapper">
          <input
            type="range"
            min="0"
            max="50"
            value={config.computersOn || 0}
            onChange={(e) =>
              isBulk
                ? handleGlobalChange("computersOn", parseInt(e.target.value))
                : handleRoomChange(roomId, "computersOn", parseInt(e.target.value))
            }
          />
          <span>{config.computersOn} PCs</span>
        </div>
      </div>

      <div className="control-item checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.lightsOn !== false}
            onChange={(e) =>
              isBulk
                ? handleGlobalChange("lightsOn", e.target.checked)
                : handleRoomChange(roomId, "lightsOn", e.target.checked)
            }
          />
          💡 Lights
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.acOn !== false}
            onChange={(e) =>
              isBulk
                ? handleGlobalChange("acOn", e.target.checked)
                : handleRoomChange(roomId, "acOn", e.target.checked)
            }
          />
          ❄️ AC
        </label>
      </div>
    </div>
  );

  return (
    <div className="room-config-panel">
      {/* Header with Mode Toggle */}
      <div className="config-header">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "bulk" ? "active" : ""}`}
            onClick={() => setMode("bulk")}
            title="Apply same settings to all rooms"
          >
            <Users size={16} /> Bulk Edit
          </button>
          <button
            className={`mode-btn ${mode === "individual" ? "active" : ""}`}
            onClick={() => {
              setMode("individual");
              setSelectedRoomId(
                selectedRoomId || Object.keys(roomConfigs)[0] || null,
              );
            }}
            title="Customize individual rooms"
          >
            <Settings size={16} /> Individual
          </button>
        </div>

        {mode === "individual" && (
          <div className="individual-actions">
            <div className="view-toggle">
              <button
                className={`view-btn ${viewType === "tabs" ? "active" : ""}`}
                onClick={() => setViewType("tabs")}
                title="Tabbed editor view"
              >
                <LayoutList size={14} /> Tabs
              </button>
              <button
                className={`view-btn ${viewType === "table" ? "active" : ""}`}
                onClick={() => setViewType("table")}
                title="Table grid view"
              >
                <Grid3x3 size={14} /> Table
              </button>
            </div>

            <div className="import-action">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".csv"
                onChange={handleFileUpload}
              />
              <button
                className="import-btn"
                onClick={() => fileInputRef.current.click()}
                title="Import CSV configuration"
              >
                <Upload size={14} /> Import CSV
              </button>
            </div>

            <button
              className="reset-btn"
              onClick={resetAllToGlobal}
              title="Reset all rooms to global settings"
            >
              <RotateCcw size={14} /> Reset All
            </button>
          </div>
        )}
      </div>

      {/* BULK MODE */}
      {mode === "bulk" && (
        <div className="mode-content bulk-mode">
          <p className="mode-description">
            All {Object.keys(roomConfigs).length} rooms ({numRooms} per building × {numBuildings} building{numBuildings > 1 ? 's' : ''}) will use these settings:
          </p>
          <RoomControlsComponent
            config={globalConfig}
            roomId="bulk"
            isBulk={true}
          />
          <div className="image-detect-hint">
            <Camera size={16} />
            <span>
              Want to detect occupancy from a room photo using AI?
              Switch to <button className="inline-link" onClick={() => { setMode("individual"); setSelectedRoomId(selectedRoomId || Object.keys(roomConfigs)[0] || null); }}>Individual</button> mode and use <strong>"Detect from Image"</strong> on any room.
            </span>
          </div>
        </div>
      )}

      {/* INDIVIDUAL MODE - TABS VIEW */}
      {mode === "individual" && viewType === "tabs" && (
        <div className="mode-content individual-tabs">
          <div className="tabs-header">
            <div className="tabs-list">
              {Object.values(roomConfigs).map((room) => (
                <button
                  key={room.id}
                  className={`tab-button ${
                    selectedRoomId === room.id ? "active" : ""
                  } ${room.isModified ? "modified" : ""}`}
                  onClick={() => setSelectedRoomId(room.id)}
                  title={room.name}
                >
                  <span className="tab-label">{room.name.split(" - ")[1]}</span>
                  {room.isModified && <span className="modified-dot">●</span>}
                </button>
              ))}
            </div>
          </div>

          {selectedRoomId && (
            <div className="tab-content">
              <div className="tab-header">
                <h4>{roomConfigs[selectedRoomId]?.name}</h4>
                <button
                  className="reset-room-btn"
                  onClick={() => resetRoomToGlobal(selectedRoomId)}
                  title="Reset this room to global settings"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Prominent image upload section */}
              <div className="detect-upload-card">
                <div className="detect-upload-header">
                  <Camera size={18} />
                  <div>
                    <strong>Detect Occupancy from Image</strong>
                    <p>Upload a photo of this room — YOLOv8 AI will count the people automatically.</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  ref={(el) => (imageInputRefs.current[`card-${selectedRoomId}`] = el)}
                  onChange={(e) => handleImageDetect(selectedRoomId, e.target.files[0])}
                />
                <button
                  className="detect-upload-btn"
                  disabled={detectingRoom === selectedRoomId}
                  onClick={() => imageInputRefs.current[`card-${selectedRoomId}`]?.click()}
                >
                  {detectingRoom === selectedRoomId ? (
                    <><Loader size={16} className="spin" /> Detecting…</>
                  ) : (
                    <><Upload size={16} /> Upload Room Photo</>
                  )}
                </button>

                {detectionPreviews[selectedRoomId] && (
                  <div className="detection-preview">
                    <div className="detection-preview-header">
                      <span className="detected-count">
                        <Users size={14} /> {detectionPreviews[selectedRoomId].count} person{detectionPreviews[selectedRoomId].count !== 1 ? "s" : ""} detected — occupancy updated!
                      </span>
                      <button className="clear-preview" onClick={() => clearDetectionPreview(selectedRoomId)} title="Dismiss preview">
                        <X size={12} />
                      </button>
                    </div>
                    <img
                      src={`data:image/jpeg;base64,${detectionPreviews[selectedRoomId].outputFrame}`}
                      alt="Detection result"
                      className="detection-result-img"
                    />
                  </div>
                )}

                {detectionError && detectingRoom === null && (
                  <p className="detection-error"><AlertCircle size={12} /> {detectionError}</p>
                )}
              </div>

              <RoomControlsComponent
                config={roomConfigs[selectedRoomId]}
                roomId={selectedRoomId}
                isBulk={false}
              />
            </div>
          )}
        </div>
      )}

      {/* INDIVIDUAL MODE - TABLE VIEW */}
      {mode === "individual" && viewType === "table" && (
        <div className="mode-content individual-table">
          <div className="table-wrapper">
            <table className="config-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Occupancy</th>
                  <th>AC Temp</th>
                  <th>Computers</th>
                  <th>Lights</th>
                  <th>AC</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(roomConfigs).map((room) => (
                  <tr key={room.id} className={room.isModified ? "modified" : ""}>
                    <td className="room-cell">
                      <button
                        className="room-link"
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setViewType("tabs");
                        }}
                      >
                        {room.name}
                      </button>
                    </td>
                    <td className="number-cell">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={room.avgOccupancy || 0}
                        onChange={(e) =>
                          handleRoomChange(
                            room.id,
                            "avgOccupancy",
                            parseInt(e.target.value),
                          )
                        }
                        className="cell-input"
                      />
                      <span className="unit">ppl</span>
                      {/* Table-row image detect button */}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: "none" }}
                        ref={(el) => (imageInputRefs.current[`tbl-${room.id}`] = el)}
                        onChange={(e) => handleImageDetect(room.id, e.target.files[0])}
                      />
                      <button
                        className="table-detect-btn"
                        disabled={detectingRoom === room.id}
                        onClick={() => imageInputRefs.current[`tbl-${room.id}`]?.click()}
                        title="Upload image to detect occupancy"
                      >
                        {detectingRoom === room.id ? <Loader size={12} className="spin" /> : <Camera size={12} />}
                      </button>
                    </td>
                    <td className="number-cell">
                      <input
                        type="number"
                        min="16"
                        max="30"
                        value={room.acTemp || 22}
                        onChange={(e) =>
                          handleRoomChange(
                            room.id,
                            "acTemp",
                            parseInt(e.target.value),
                          )
                        }
                        className="cell-input"
                      />
                      <span className="unit">°C</span>
                    </td>
                    <td className="number-cell">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={room.computersOn || 0}
                        onChange={(e) =>
                          handleRoomChange(
                            room.id,
                            "computersOn",
                            parseInt(e.target.value),
                          )
                        }
                        className="cell-input"
                      />
                    </td>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={room.lightsOn !== false}
                        onChange={(e) =>
                          handleRoomChange(room.id, "lightsOn", e.target.checked)
                        }
                      />
                    </td>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={room.acOn !== false}
                        onChange={(e) =>
                          handleRoomChange(room.id, "acOn", e.target.checked)
                        }
                      />
                    </td>
                    <td className="status-cell">
                      {room.isModified ? (
                        <span className="status-badge modified">Modified</span>
                      ) : (
                        <span className="status-badge">Default</span>
                      )}
                    </td>
                    <td className="action-cell">
                      <button
                        className="action-btn"
                        onClick={() => resetRoomToGlobal(room.id)}
                        title="Reset to global settings"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-summary">
            <span>
              {Object.values(roomConfigs).filter((r) => r.isModified).length} of{" "}
              {Object.keys(roomConfigs).length} rooms modified
            </span>
          </div>
        </div>
      )}

      {importError && (
        <div className="error-message">
          <AlertCircle size={14} /> {importError}
        </div>
      )}
    </div>
  );
}
