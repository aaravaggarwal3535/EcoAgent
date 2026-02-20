import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Users,
  Upload,
  FileJson,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";
import "./RoomConfigPanel.css";

/**
 * Component for configuring room-specific parameters
 * Supports both Bulk (Global) and Individual room configuration
 */
export default function RoomConfigPanel({
  numRooms,
  numBuildings,
  globalConfig,
  onConfigChange,
}) {
  const [mode, setMode] = useState("bulk"); // 'bulk' | 'individual'
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomConfigs, setRoomConfigs] = useState({});
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize room configs when scope changes
  useEffect(() => {
    // 1. Calculate the target room distribution
    const validRoomIds = [];
    let roomsAllocated = 0;

    for (let b = 1; b <= numBuildings; b++) {
      // Better distribution logic: remaining rooms / remaining buildings
      const remainingBuildings = numBuildings - (b - 1);
      const remainingRooms = numRooms - roomsAllocated;
      const count = Math.ceil(remainingRooms / remainingBuildings);

      for (let r = 1; r <= count; r++) {
        validRoomIds.push({
          id: `b${b}-r${r}`,
          name: `Building ${b} - Room ${r}`,
        });
      }
      roomsAllocated += count;
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

  return (
    <div className="room-config-panel">
      <div className="config-header">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "bulk" ? "active" : ""}`}
            onClick={() => setMode("bulk")}
          >
            <Users size={16} /> Bulk Edit (All)
          </button>
          <button
            className={`mode-btn ${mode === "individual" ? "active" : ""}`}
            onClick={() => setMode("individual")}
          >
            <Settings size={16} /> Individual
          </button>
        </div>

        {mode === "individual" && (
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
            >
              <Upload size={14} /> Import CSV
            </button>
          </div>
        )}
      </div>

      {mode === "individual" && (
        <div className="room-selector">
          <label>Select Room to Configure:</label>
          <div className="select-wrapper">
            <select
              value={selectedRoomId || ""}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="room-dropdown"
            >
              {Object.values(roomConfigs).map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} {room.isModified ? "(Modified)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
        </div>
      )}

      <div className="controls-grid">
        <div className="control-item">
          <label>Avg Occupancy</label>
          <div className="range-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={currentConfig.avgOccupancy || 0}
              onChange={(e) =>
                mode === "bulk"
                  ? handleGlobalChange("avgOccupancy", parseInt(e.target.value))
                  : handleRoomChange(
                      selectedRoomId,
                      "avgOccupancy",
                      parseInt(e.target.value),
                    )
              }
            />
            <span>{currentConfig.avgOccupancy} ppl</span>
          </div>
        </div>

        <div className="control-item">
          <label>AC Temperature</label>
          <div className="range-wrapper">
            <input
              type="range"
              min="16"
              max="30"
              value={currentConfig.acTemp || 22}
              onChange={(e) =>
                mode === "bulk"
                  ? handleGlobalChange("acTemp", parseInt(e.target.value))
                  : handleRoomChange(
                      selectedRoomId,
                      "acTemp",
                      parseInt(e.target.value),
                    )
              }
            />
            <span>{currentConfig.acTemp}°C</span>
          </div>
        </div>

        <div className="control-item">
          <label>Computers Running</label>
          <div className="range-wrapper">
            <input
              type="range"
              min="0"
              max="50"
              value={currentConfig.computersOn || 0}
              onChange={(e) =>
                mode === "bulk"
                  ? handleGlobalChange("computersOn", parseInt(e.target.value))
                  : handleRoomChange(
                      selectedRoomId,
                      "computersOn",
                      parseInt(e.target.value),
                    )
              }
            />
            <span>{currentConfig.computersOn} PCs</span>
          </div>
        </div>

        <div className="control-item checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={currentConfig.lightsOn !== false}
              onChange={(e) =>
                mode === "bulk"
                  ? handleGlobalChange("lightsOn", e.target.checked)
                  : handleRoomChange(
                      selectedRoomId,
                      "lightsOn",
                      e.target.checked,
                    )
              }
            />
            💡 Lights
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={currentConfig.acOn !== false}
              onChange={(e) =>
                mode === "bulk"
                  ? handleGlobalChange("acOn", e.target.checked)
                  : handleRoomChange(selectedRoomId, "acOn", e.target.checked)
              }
            />
            ❄️ AC
          </label>
        </div>
      </div>

      {importError && (
        <div className="error-message">
          <AlertCircle size={14} /> {importError}
        </div>
      )}
    </div>
  );
}
