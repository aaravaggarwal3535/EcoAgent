import { useState, useEffect } from 'react';
import {
  Zap,
  Users,
  Droplets,
  Wind,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Search,
  Filter,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import './RoomAnalysisPage.css';

function RoomAnalysisPage() {
  const { analysis, analysisParams, analysisTimestamp } = useAnalysis();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, high-priority, low-priority, classroom, lab, etc.
  const [sortBy, setSortBy] = useState('priority'); // priority, occupancy, energy

  useEffect(() => {
    if (analysis) {
      extractRoomData();
    } else {
      setLoading(true);
    }
  }, [analysis]);

  useEffect(() => {
    filterAndSortRooms();
  }, [rooms, searchQuery, filterType, sortBy]);

  const extractRoomData = () => {
    setLoading(true);
    try {
      // Extract and flatten room data with building information
      const allRooms = [];
      if (analysis.building_states) {
        Object.entries(analysis.building_states).forEach(([buildingId, buildingState]) => {
          // Handle both room_states as object or array
          let roomsData = buildingState.room_states || {};
          
          // If room_states is an array, convert to object
          if (Array.isArray(roomsData)) {
            roomsData = roomsData.reduce((acc, room) => {
              acc[room.room_id] = room;
              return acc;
            }, {});
          }
          
          Object.entries(roomsData).forEach(([roomId, roomState]) => {
            // Ensure required fields exist with defaults
            const roomData = {
              room_id: roomId,
              building_id: buildingId,
              building_name: buildingId,
              room_type: roomState.room_type || 'unknown',
              current_occupancy: roomState.current_occupancy || 0,
              capacity: roomState.capacity || 30,
              estimated_energy_kw: roomState.estimated_energy_kw || 0,
              estimated_water_lph: roomState.estimated_water_lph || 0,
              estimated_co2_ppm: roomState.estimated_co2_ppm || 400,
              temperature_comfort: roomState.temperature_comfort || 'comfortable',
              equipment_running: roomState.equipment_running || [],
              recommendations: roomState.recommendations || [],
              anomalies: roomState.anomalies || [],
              savings_potential: roomState.savings_potential || 0,
              predicted_occupancy_1h: roomState.predicted_occupancy_1h,
              predicted_energy_1h: roomState.predicted_energy_1h,
              ...roomState,
            };
            allRooms.push(roomData);
          });
        });
      }
      
      if (allRooms.length === 0) {
        console.warn('No rooms found in analysis response.');
      } else {
        console.log(`✅ Successfully loaded ${allRooms.length} rooms for analysis`);
      }
      setRooms(allRooms);
    } catch (error) {
      console.error('Failed to extract room analysis:', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRooms = () => {
    let filtered = [...rooms];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.room_id?.toLowerCase().includes(query) ||
          room.building_name?.toLowerCase().includes(query) ||
          room.room_type?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'high-priority') {
        filtered = filtered.filter((room) => getRoomPriority(room) === 'high');
      } else if (filterType === 'low-priority') {
        filtered = filtered.filter((room) => getRoomPriority(room) !== 'high');
      } else {
        filtered = filtered.filter((room) => room.room_type === filterType);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (
          (priorityOrder[getRoomPriority(a)] || 2) -
          (priorityOrder[getRoomPriority(b)] || 2)
        );
      } else if (sortBy === 'occupancy') {
        return (b.current_occupancy || 0) - (a.current_occupancy || 0);
      } else if (sortBy === 'energy') {
        return (b.estimated_energy_kw || 0) - (a.estimated_energy_kw || 0);
      }
      return 0;
    });

    setFilteredRooms(filtered);
  };

  const toggleRoomExpand = (roomId) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const getOccupancyLevel = (occupancy, capacity) => {
    if (!capacity) return 'unknown';
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 70) return 'high';
    if (percentage >= 30) return 'medium';
    return 'low';
  };

  const getRoomPriority = (room) => {
    const issues = [];
    
    // Check energy efficiency
    if (room.estimated_energy_kw && room.current_occupancy) {
      const energyPerPerson = room.estimated_energy_kw / room.current_occupancy;
      if (energyPerPerson > 0.08) issues.push('high-energy');
    }

    // Check occupancy vs equipment
    if (room.current_occupancy === 0 && room.equipment_running?.length > 0) {
      issues.push('idle-equipment');
    }

    // Check temperature issues
    if (room.temperature_comfort === 'too_hot' || room.temperature_comfort === 'too_cold') {
      issues.push('temperature');
    }

    // Check water usage
    if (room.estimated_water_lph > 10 && room.current_occupancy === 0) {
      issues.push('water-waste');
    }

    return issues.length > 0 ? 'high' : 'medium';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f59e0b'; // amber
      case 'low':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getRoomTypeIcon = (roomType) => {
    const icons = {
      classroom: '🎓',
      lab: '🔬',
      library: '📚',
      bathroom: '🚿',
      cafeteria: '🍽️',
      office: '💼',
      dorm: '🛏️',
      common: '🏢',
    };
    return icons[roomType?.toLowerCase()] || '🏠';
  };

  if (loading || !analysis) {
    return (
      <div className="room-analysis-page">
        <div className="loading-container">
          {loading ? (
            <>
              <RefreshCw size={40} className="spinning" />
              <p>Loading room analysis...</p>
            </>
          ) : (
            <>
              <Lightbulb size={40} />
              <h2>No Analysis Available</h2>
              <p>Run an analysis from the Dashboard first to see detailed room-by-room insights.</p>
              <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '1rem' }}>
                Once you run an analysis, this page will display detailed recommendations and metrics for each room.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const uniqueRoomTypes = [...new Set(rooms.map((r) => r.room_type))];
  const priority = getRoomPriority(filteredRooms[0] || {});

  return (
    <div className="room-analysis-page">
      {/* Header */}
      <div className="rap-header">
        <div className="rap-header-content">
          <h1>🏢 Room-by-Room Analysis</h1>
          <p className="rap-subtitle">
            Detailed sustainability insights with AI-powered recommendations for each room
          </p>
          {analysisTimestamp && (
            <p style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.5rem' }}>
              Analysis generated: {analysisTimestamp.toLocaleString()}
              {analysisParams && analysisParams.num_rooms && 
                ` • Rooms: ${analysisParams.num_rooms} • Buildings: ${analysisParams.num_buildings}`}
            </p>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="rap-stats">
        <div className="rap-stat-card">
          <span className="rap-stat-label">Total Rooms</span>
          <span className="rap-stat-value">{rooms.length}</span>
        </div>
        <div className="rap-stat-card">
          <span className="rap-stat-label">High Priority</span>
          <span className="rap-stat-value high">
            {rooms.filter((r) => getRoomPriority(r) === 'high').length}
          </span>
        </div>
        <div className="rap-stat-card">
          <span className="rap-stat-label">Currently Occupied</span>
          <span className="rap-stat-value">
            {rooms.filter((r) => r.current_occupancy > 0).length}
          </span>
        </div>
        <div className="rap-stat-card">
          <span className="rap-stat-label">Avg Energy Use</span>
          <span className="rap-stat-value">
            {(
              rooms.reduce((sum, r) => sum + (r.estimated_energy_kw || 0), 0) / rooms.length
            ).toFixed(2)}{' '}
            kW
          </span>
        </div>
      </div>

      {/* Controls Section */}
      <div className="rap-controls">
        <div className="rap-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by room ID, building, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rap-search-input"
          />
        </div>

        <div className="rap-filters">
          <div className="rap-filter-group">
            <Filter size={16} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rap-filter-select"
            >
              <option value="all">All Rooms</option>
              <option value="high-priority">High Priority Only</option>
              <option value="low-priority">Low Priority Only</option>
              {uniqueRoomTypes.map((type) => (
                <option key={type} value={type}>
                  {getRoomTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="rap-filter-group">
            <TrendingUp size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rap-filter-select"
            >
              <option value="priority">Sort by Priority</option>
              <option value="occupancy">Sort by Occupancy</option>
              <option value="energy">Sort by Energy Use</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="rap-rooms-list">
        {filteredRooms.length === 0 ? (
          <div className="rap-empty-state">
            <p>No rooms match your search criteria</p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isExpanded = expandedRooms[room.room_id];
            const priority = getRoomPriority(room);
            const occupancyLevel = getOccupancyLevel(
              room.current_occupancy,
              room.capacity
            );
            const occupancyPercent = room.capacity
              ? ((room.current_occupancy / room.capacity) * 100).toFixed(0)
              : 0;

            return (
              <div
                key={room.room_id}
                className={`rap-room-card rap-priority-${priority}`}
              >
                {/* Room Header */}
                <div
                  className="rap-room-header"
                  onClick={() => toggleRoomExpand(room.room_id)}
                >
                  <div className="rap-room-info">
                    <div className="rap-room-title">
                      <span className="rap-room-icon">
                        {getRoomTypeIcon(room.room_type)}
                      </span>
                      <div>
                        <h3>{room.room_id}</h3>
                        <p className="rap-room-location">
                          {room.building_name} • {room.room_type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rap-room-quick-stats">
                    <div className="rap-quick-stat">
                      <Users size={16} />
                      <span>
                        {room.current_occupancy}/{room.capacity} ({occupancyPercent}%)
                      </span>
                    </div>
                    <div className="rap-quick-stat">
                      <Zap size={16} />
                      <span>{(room.estimated_energy_kw || 0).toFixed(2)} kW</span>
                    </div>
                    <div
                      className="rap-priority-badge"
                      style={{
                        backgroundColor: getPriorityColor(priority),
                      }}
                    >
                      {priority.toUpperCase()}
                    </div>
                    <button className="rap-expand-btn">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="rap-room-details">
                    {/* Detailed Metrics */}
                    <div className="rap-metrics-grid">
                      <div className="rap-metric">
                        <label>Occupancy</label>
                        <div className="rap-metric-bar">
                          <div
                            className={`rap-metric-fill occupancy-${occupancyLevel}`}
                            style={{ width: `${occupancyPercent}%` }}
                          />
                        </div>
                        <span className="rap-metric-value">
                          {room.current_occupancy}/{room.capacity} ({occupancyPercent}%)
                        </span>
                      </div>

                      <div className="rap-metric">
                        <label>Energy Usage</label>
                        <div className="rap-metric-value high">
                          {(room.estimated_energy_kw || 0).toFixed(2)} kW
                        </div>
                      </div>

                      <div className="rap-metric">
                        <label>Water Usage</label>
                        <div className="rap-metric-value">
                          {(room.estimated_water_lph || 0).toFixed(1)} L/h
                        </div>
                      </div>

                      <div className="rap-metric">
                        <label>Temperature</label>
                        <div className="rap-metric-value">
                          {room.temperature_comfort === 'comfortable' ? (
                            <span style={{ color: '#10b981' }}>✓ Comfortable</span>
                          ) : (
                            <span style={{ color: '#ef4444' }}>
                              ⚠ {room.temperature_comfort?.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rap-metric">
                        <label>CO₂ Level</label>
                        <div className="rap-metric-value">
                          {room.estimated_co2_ppm || 'N/A'} ppm
                        </div>
                      </div>

                      <div className="rap-metric">
                        <label>Equipment Running</label>
                        <div className="rap-equipment-list">
                          {room.equipment_running && room.equipment_running.length > 0 ? (
                            room.equipment_running.map((eq) => (
                              <span key={eq} className="rap-equipment-tag">
                                {eq}
                              </span>
                            ))
                          ) : (
                            <span className="rap-equipment-tag inactive">None</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Anomalies/Issues */}
                    {room.anomalies && room.anomalies.length > 0 && (
                      <div className="rap-section">
                        <h4>
                          <AlertCircle size={18} />
                          Issues Detected
                        </h4>
                        <div className="rap-anomalies">
                          {room.anomalies.map((anomaly, idx) => (
                            <div key={idx} className="rap-anomaly">
                              <span className="rap-anomaly-dot">●</span>
                              {anomaly}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Recommendations */}
                    {room.recommendations && room.recommendations.length > 0 && (
                      <div className="rap-section">
                        <h4>
                          <Lightbulb size={18} />
                          AI Recommendations
                        </h4>
                        <div className="rap-recommendations">
                          {room.recommendations.map((rec, idx) => (
                            <div key={idx} className="rap-recommendation">
                              <span className="rap-rec-icon">💡</span>
                              <div className="rap-rec-content">
                                <p>{rec}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Savings Potential */}
                    {room.savings_potential !== undefined && (
                      <div className="rap-section">
                        <h4>
                          <TrendingUp size={18} />
                          Savings Potential
                        </h4>
                        <div className="rap-savings">
                          <div className="rap-savings-bar">
                            <div
                              className="rap-savings-fill"
                              style={{ width: `${room.savings_potential}%` }}
                            />
                          </div>
                          <span className="rap-savings-percent">
                            {room.savings_potential.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Predicted vs Actual */}
                    {room.predicted_occupancy_1h !== undefined && (
                      <div className="rap-section">
                        <h4>📈 1-Hour Prediction</h4>
                        <div className="rap-prediction">
                          <div>
                            <span>Predicted Occupancy:</span>
                            <strong>{room.predicted_occupancy_1h} people</strong>
                          </div>
                          <div>
                            <span>Predicted Energy:</span>
                            <strong>
                              {(room.predicted_energy_1h || 0).toFixed(2)} kW
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RoomAnalysisPage;
