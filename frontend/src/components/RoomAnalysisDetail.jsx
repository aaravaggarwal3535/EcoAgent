import { useState } from 'react';
import {
  Zap,
  Users,
  Droplets,
  Wind,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import './RoomAnalysisDetail.css';

function RoomAnalysisDetail({ buildings, onClose }) {
  const [expandedRooms, setExpandedRooms] = useState({});
  const [filterLevel, setFilterLevel] = useState('all'); // 'all', 'high', 'medium', 'low'

  const toggleRoomExpand = (roomId) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  // Collect all rooms from all buildings
  const allRooms = [];
  Object.entries(buildings).forEach(([buildingId, buildingData]) => {
    if (buildingData.room_states) {
      Object.entries(buildingData.room_states).forEach(([roomId, roomData]) => {
        allRooms.push({
          roomId,
          buildingId,
          buildingName: buildingData.building_name || buildingId,
          ...roomData,
        });
      });
    }
  });

  // Filter rooms based on occupancy level
  const filteredRooms = filterLevel === 'all'
    ? allRooms
    : allRooms.filter((room) => room.occupancy_level === filterLevel);

  const getOccupancyColor = (level) => {
    switch (level) {
      case 'high':
        return 'occupancy-high';
      case 'medium':
        return 'occupancy-medium';
      case 'low':
        return 'occupancy-low';
      default:
        return '';
    }
  };

  const getEnergyStatus = (energyKw, occupancy, capacity) => {
    const occupancyRate = (occupancy / capacity) * 100;
    const energyPerPerson = occupancy > 0 ? energyKw / occupancy : 0;

    if (energyPerPerson > 0.08) return 'high';
    if (energyPerPerson > 0.04) return 'medium';
    return 'low';
  };

  return (
    <div className="room-analysis-detail">
      {/* Header Section */}
      <div className="room-analysis-header">
        <div className="header-info">
          <h2>📊 Room-by-Room Analysis</h2>
          <p className="header-subtitle">
            Detailed performance metrics for each room on campus
          </p>
        </div>
        <button className="close-btn" onClick={onClose} title="Close room analysis">
          <X size={24} />
        </button>
      </div>

      {/* Legend Section */}
      <div className="room-analysis-legend">
        <div className="legend-title">
          <span>📋 Understanding the Data</span>
        </div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-badge occupancy-high"></div>
            <span><strong>High Occupancy</strong> - Room is 70%+ full</span>
          </div>
          <div className="legend-item">
            <div className="legend-badge occupancy-medium"></div>
            <span><strong>Medium Occupancy</strong> - Room is 30-70% full</span>
          </div>
          <div className="legend-item">
            <div className="legend-badge occupancy-low"></div>
            <span><strong>Low Occupancy</strong> - Room is less than 30% full</span>
          </div>
          <div className="legend-item">
            <span className="energy-indicator high">HIGH ENERGY</span>
            <span>Room using more power than needed for occupancy</span>
          </div>
          <div className="legend-item">
            <span className="energy-indicator medium">MEDIUM ENERGY</span>
            <span>Room using moderate power for occupancy level</span>
          </div>
          <div className="legend-item">
            <span className="energy-indicator low">LOW ENERGY</span>
            <span>Room using efficient power for occupancy level</span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="room-filters">
        <div className="filter-group">
          <label>
            <span className="filter-label">🎯 Filter by Occupancy Level</span>
            <span className="filter-hint">See rooms grouped by how full they are</span>
          </label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterLevel === 'all' ? 'active' : ''}`}
              onClick={() => setFilterLevel('all')}
              title="Show all rooms"
            >
              <span className="filter-count">{allRooms.length}</span>
              <span>All Rooms</span>
            </button>
            <button
              className={`filter-btn ${filterLevel === 'high' ? 'active' : ''}`}
              onClick={() => setFilterLevel('high')}
              title="Show rooms with 70%+ occupancy"
            >
              <span className="filter-count">{allRooms.filter((r) => r.occupancy_level === 'high').length}</span>
              <span>High Usage</span>
            </button>
            <button
              className={`filter-btn ${filterLevel === 'medium' ? 'active' : ''}`}
              onClick={() => setFilterLevel('medium')}
              title="Show rooms with 30-70% occupancy"
            >
              <span className="filter-count">{allRooms.filter((r) => r.occupancy_level === 'medium').length}</span>
              <span>Moderate</span>
            </button>
            <button
              className={`filter-btn ${filterLevel === 'low' ? 'active' : ''}`}
              onClick={() => setFilterLevel('low')}
              title="Show rooms with less than 30% occupancy"
            >
              <span className="filter-count">{allRooms.filter((r) => r.occupancy_level === 'low').length}</span>
              <span>Low Usage</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rooms-list">
        {filteredRooms.length === 0 ? (
          <div className="no-rooms">
            <p>✅ Great news! No rooms match this category.</p>
            <p className="no-rooms-hint">Try adjusting your filters to see all available rooms.</p>
          </div>
        ) : (
          <>
            <div className="rooms-count-info">
              <span className="count-badge">{filteredRooms.length}</span>
              <span>
                {filteredRooms.length === 1 ? 'Room' : 'Rooms'} displayed
                {filterLevel !== 'all' && ` (${filterLevel} occupancy)`}
              </span>
            </div>
            {filteredRooms.map((room) => {
            const isExpanded = expandedRooms[room.roomId];
            const energyStatus = getEnergyStatus(
              room.estimated_energy_kw,
              room.current_occupancy,
              room.capacity
            );

            return (
              <div
                key={room.roomId}
                className={`room-card ${getOccupancyColor(room.occupancy_level)} ${energyStatus === 'high' ? 'energy-alert' : ''}`}
              >
                <div
                  className="room-card-header"
                  onClick={() => toggleRoomExpand(room.roomId)}
                >
                  <div className="room-title-section">
                    <div className="room-identifier">
                      <h3>{room.roomId}</h3>
                      <span className="building-tag">📍 {room.buildingName}</span>
                    </div>
                    <div className="occupancy-badge">
                      <span className={`level ${room.occupancy_level}`}>
                        {room.occupancy_level === 'high' && '🔴 High'}
                        {room.occupancy_level === 'medium' && '🟡 Medium'}
                        {room.occupancy_level === 'low' && '🟢 Low'}
                      </span>
                    </div>
                  </div>

                  <div className="room-quick-stats">
                    <div className="quick-stat" title="Number of people in the room">
                      <Users size={16} />
                      <span>
                        {room.current_occupancy}/{room.capacity}
                        <small>people</small>
                      </span>
                    </div>
                    <div className="quick-stat" title="Energy being used right now">
                      <Zap size={16} />
                      <span>
                        {room.estimated_energy_kw?.toFixed(2)}
                        <small>kW</small>
                      </span>
                    </div>
                    <div
                      className={`quick-stat energy-status ${energyStatus}`}
                      title={`Energy efficiency: ${energyStatus} power usage`}
                    >
                      <span>
                        {energyStatus === 'high' && '⚡ High Power'}
                        {energyStatus === 'medium' && '⚡ Moderate'}
                        {energyStatus === 'low' && '⚡ Efficient'}
                      </span>
                    </div>
                  </div>

                  <button className="expand-btn" title="Click to see detailed metrics">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="room-details">
                    {/* Environmental Metrics */}
                    <div className="details-section">
                      <h4>📈 Environmental Metrics</h4>
                      <p className="section-description">
                        Real-time measurements of how the room space is being used and its environmental impact
                      </p>
                      <div className="metrics-grid">
                        <div className="metric">
                          <div className="metric-header">
                            <Users size={18} />
                            <span>Occupancy Rate</span>
                            <span className="metric-hint" title="Percentage of room capacity currently in use">?</span>
                          </div>
                          <div className="metric-value">
                            {room.current_occupancy}/{room.capacity}
                          </div>
                          <div className="metric-bar">
                            <div
                              className="metric-fill"
                              style={{
                                width: `${(room.current_occupancy / room.capacity) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <div className="metric-percent">
                            {((room.current_occupancy / room.capacity) * 100).toFixed(1)}% full
                          </div>
                        </div>

                        <div className="metric">
                          <div className="metric-header">
                            <Zap size={18} />
                            <span>Energy Usage</span>
                            <span className="metric-hint" title="Current power consumption">?</span>
                          </div>
                          <div className="metric-value">
                            {room.estimated_energy_kw?.toFixed(2)} <span className="unit">kW</span>
                          </div>
                          <div className="metric-info">
                            {room.current_occupancy > 0
                              ? `${(room.estimated_energy_kw / room.current_occupancy).toFixed(3)} kW per person`
                              : 'No occupants - potential idle usage'}
                          </div>
                        </div>

                        <div className="metric">
                          <div className="metric-header">
                            <Droplets size={18} />
                            <span>Water Usage</span>
                            <span className="metric-hint" title="Water consumption per hour">?</span>
                          </div>
                          <div className="metric-value">
                            {room.estimated_water_lph?.toFixed(1) || '0'} <span className="unit">L/h</span>
                          </div>
                          <div className="metric-info">
                            {room.current_occupancy > 0
                              ? `${(room.estimated_water_lph / room.current_occupancy).toFixed(2)} L/person/hour`
                              : 'No occupants - minimal water use expected'}
                          </div>
                        </div>

                        <div className="metric">
                          <div className="metric-header">
                            <Wind size={18} />
                            <span>Air Quality (CO₂)</span>
                            <span className="metric-hint" title="Carbon dioxide concentration level">?</span>
                          </div>
                          <div className="metric-value">
                            {room.estimated_co2_ppm || 450} <span className="unit">ppm</span>
                          </div>
                          <div className="metric-info">
                            {room.estimated_co2_ppm > 1000
                              ? '⚠️ Poor - ventilation needed'
                              : room.estimated_co2_ppm > 700
                                ? '⚡ Acceptable - good comfort'
                                : '✅ Excellent - fresh air'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Anomalies */}
                    {room.anomalies && room.anomalies.length > 0 && (
                      <div className="details-section anomalies-section">
                        <h4>🚨 Issues Detected</h4>
                        <p className="section-description">
                          Unusual patterns or problems detected in this room
                        </p>
                        <div className="anomalies-list">
                          {room.anomalies.map((anomaly, idx) => (
                            <div key={idx} className="anomaly-item">
                              <AlertCircle size={18} />
                              <div>
                                <span>{anomaly}</span>
                                <small>This could indicate inefficient resource use</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {room.recommendations && 
                     room.recommendations.filter(rec => {
                       const text = rec.toLowerCase();
                       return !text.includes("no immediate") &&
                              !text.includes("operating efficiently") &&
                              rec.trim().length > 10;
                     }).length > 0 && (
                      <div className="details-section recommendations-section">
                        <h4>
                          <Lightbulb size={18} />
                          Recommendations
                        </h4>
                        <p className="section-description">
                          AI-powered suggestions to optimize energy use and comfort in this room
                        </p>
                        <div className="recommendations-list">
                          {room.recommendations
                            .filter(rec => {
                              const text = rec.toLowerCase();
                              return !text.includes("no immediate") &&
                                     !text.includes("operating efficiently") &&
                                     rec.trim().length > 10;
                            })
                            .map((rec, idx) => (
                              <div key={idx} className="recommendation-item">
                                <CheckCircle size={16} />
                                <span>{rec}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Savings Potential */}
                    {room.savings_potential !== undefined && (
                      <div className="details-section savings-section">
                        <h4>
                          <TrendingUp size={18} />
                          Optimization Potential
                        </h4>
                        <p className="section-description">
                          Estimated energy reduction possible with recommended changes
                        </p>
                        <div className="savings-card">
                          <div className="savings-value">
                            {parseFloat(room.savings_potential).toFixed(1)}%
                          </div>
                          <div className="savings-bar">
                            <div
                              className="savings-fill"
                              style={{
                                width: `${Math.min(100, parseFloat(room.savings_potential))}%`,
                              }}
                            ></div>
                          </div>
                          <p className="savings-text">
                            💡 Implementing recommendations could reduce energy consumption by this percentage
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
            }
          </>
        )}
      </div>
    </div>
  );
}

export default RoomAnalysisDetail;
