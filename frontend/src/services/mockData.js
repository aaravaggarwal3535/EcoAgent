/**
 * Frontend-only simulation data for demo mode
 * Used when backend is not available
 */

const buildingNames = {
  'lib': 'Central Library',
  'sci': 'Science Hall',
  'eng': 'Engineering Building',
  'dorm': 'Student Dormitory',
  'cafe': 'Student Center'
};

const roomTypes = ['classroom', 'lab', 'library', 'dorm', 'cafeteria', 'bathroom'];

function getTimeBasedOccupancy() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17) return 0.7; // Daytime
  if (hour >= 18 && hour <= 22) return 0.4; // Evening
  return 0.1; // Night
}

function generateMockRoomData(roomId, buildingId, envParams = {}) {
  const occupancyFactor = getTimeBasedOccupancy();
  const capacity = Math.floor(Math.random() * 40) + 20;
  
  // Use environmental parameters if provided
  const avgOccupancy = envParams.avg_occupancy || Math.floor(capacity * occupancyFactor * (0.5 + Math.random() * 0.5));
  const occupancy = Math.min(avgOccupancy + Math.floor(Math.random() * 10 - 5), capacity);
  const occupancyPct = (occupancy / capacity * 100);
  
  const baseEnergy = {
    'lib': 2.5,
    'sci': 8.0,
    'eng': 6.5,
    'dorm': 1.5,
    'cafe': 12.0
  }[buildingId] || 3.0;
  
  // Factor in equipment parameters
  let energyMultiplier = 0.3 + occupancyPct / 100 * 0.7;
  if (envParams.lights_on === false) energyMultiplier *= 0.7;
  if (envParams.ac_on === false) energyMultiplier *= 0.6;
  if (envParams.fans_on) energyMultiplier *= 1.1;
  if (envParams.computers_count > 0) energyMultiplier *= (1 + envParams.computers_count * 0.05);
  
  const energy = baseEnergy * energyMultiplier * (0.8 + Math.random() * 0.4);
  
  const recommendations = [];
  if (occupancyPct < 20 && energy > 2) {
    recommendations.push("Reduce HVAC - low occupancy");
    recommendations.push("Auto-dim lights to 40%");
  }
  if (occupancyPct > 80) {
    recommendations.push("Increase ventilation");
    recommendations.push("Monitor temperature closely");
  }
  if (envParams.outdoor_temperature > 35 && !envParams.ac_on) {
    recommendations.push("⚠️ High outdoor temp - consider enabling AC");
  }
  if (envParams.computers_count > 10) {
    recommendations.push("High computer usage - monitor power load");
  }
  if (Math.random() > 0.7) {
    recommendations.push("Schedule maintenance check");
  }
  
  return {
    room_id: roomId,
    current_occupancy: occupancy,
    capacity: capacity,
    occupancy_level: occupancyPct > 70 ? 'high' : occupancyPct > 30 ? 'medium' : 'low',
    estimated_energy_kw: parseFloat(energy.toFixed(2)),
    estimated_water_lph: parseFloat((Math.random() * 5).toFixed(1)),
    estimated_co2_ppm: Math.floor(400 + occupancyPct * 4),
    recommendations: recommendations.slice(0, 3),
    anomalies: occupancy === 0 && energy > 2 ? ["Equipment running with no occupants"] : [],
    savings_potential: parseFloat((Math.random() * 30 + 10).toFixed(1))
  };
}

function generateMockBuildingData(buildingId, envParams = {}) {
  const numRooms = Math.floor(Math.random() * 8) + 8;
  const rooms = {};
  
  for (let i = 1; i <= numRooms; i++) {
    const roomId = `${buildingId}-${String(i).padStart(3, '0')}`;
    rooms[roomId] = generateMockRoomData(roomId, buildingId, envParams);
  }
  
  const totalEnergy = Object.values(rooms).reduce((sum, r) => sum + r.estimated_energy_kw, 0);
  const totalOccupancy = Object.values(rooms).reduce((sum, r) => sum + r.current_occupancy, 0);
  const totalCapacity = Object.values(rooms).reduce((sum, r) => sum + r.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity * 100) : 0;
  
  const buildingRecs = [
    `Close floors with <20% occupancy → Save ${Math.floor(Math.random() * 15 + 10)} kW`,
    "Enable smart HVAC scheduling",
    "Consolidate activities to fewer zones",
    "Implement demand-based lighting"
  ];
  
  return {
    building_id: buildingId,
    building_name: buildingNames[buildingId] || buildingId.toUpperCase(),
    total_rooms: numRooms,
    total_energy_kw: parseFloat(totalEnergy.toFixed(2)),
    total_occupancy: totalOccupancy,
    total_capacity: totalCapacity,
    occupancy_rate: parseFloat(occupancyRate.toFixed(1)),
    avg_energy_per_room: parseFloat((totalEnergy / numRooms).toFixed(2)),
    recommendations: buildingRecs.slice(0, 3),
    savings_potential: parseFloat((Math.random() * 20 + 15).toFixed(1)),
    room_states: rooms
  };
}

export function generateMockCampusAnalysis(envParams = {}) {
  const buildings = {};
  const buildingIds = ['lib', 'sci', 'eng', 'dorm', 'cafe'];
  
  buildingIds.forEach(id => {
    buildings[id] = generateMockBuildingData(id, envParams);
  });
  
  const totalEnergy = Object.values(buildings).reduce((sum, b) => sum + b.total_energy_kw, 0);
  const totalOccupancy = Object.values(buildings).reduce((sum, b) => sum + b.total_occupancy, 0);
  const totalCapacity = Object.values(buildings).reduce((sum, b) => sum + b.total_capacity, 0);
  const totalWater = parseFloat((Math.random() * 150 + 100).toFixed(1));
  const avgOccupancyRate = Object.values(buildings).reduce((sum, b) => sum + b.occupancy_rate, 0) / buildingIds.length;
  
  const campusRecs = [
    "🏢 Peak energy demand 2-6 PM across Science & Engineering",
    "💡 Smart grid implementation: 20-25% reduction potential",
    "🌡️ HVAC optimization: 30% of total savings opportunity",
    "📊 Consolidate after-hours classes: reduce active spaces 40%",
    "🎯 Priority: Science Hall highest savings (28%)",
    "💧 Water conservation in dorms & cafeteria recommended"
  ];
  
  const criticalBuildings = Object.values(buildings)
    .filter(b => b.total_energy_kw > 50)
    .map(b => ({
      building_id: b.building_id,
      building_name: b.building_name,
      energy_kw: b.total_energy_kw,
      occupancy_rate: b.occupancy_rate,
      reason: "High energy consumption"
    }));
  
  return {
    timestamp: new Date().toISOString(),
    campus_name: "Demo University Campus",
    campus_metrics: {
      total_energy_kw: parseFloat(totalEnergy.toFixed(2)),
      total_water_lph: totalWater,
      total_occupancy: totalOccupancy,
      total_capacity: totalCapacity,
      total_buildings: buildingIds.length,
      total_rooms: Object.values(buildings).reduce((sum, b) => sum + b.total_rooms, 0),
      occupancy_rate: parseFloat(avgOccupancyRate.toFixed(1)),
      avg_occupancy_rate: parseFloat(avgOccupancyRate.toFixed(1)),
      estimated_cost_per_hour: parseFloat((totalEnergy * 0.12 + totalWater * 0.002).toFixed(2)),
      potential_savings_percent: parseFloat((Math.random() * 15 + 18).toFixed(1))
    },
    savings_potential: {
      total_kwh_saved: parseFloat((totalEnergy * 0.25).toFixed(2)),
      estimated_cost_savings_hourly: parseFloat((totalEnergy * 0.25 * 0.12).toFixed(2))
    },
    building_states: buildings,
    campus_recommendations: campusRecs,
    critical_buildings: criticalBuildings,
    analysis_type: 'FRONTEND_SIMULATION',
    note: '⚠️ Demo mode - Backend unavailable. Showing simulated data.'
  };
}

export function generateMockSimulationTemplates() {
  return [
    {
      id: 'close_building',
      name: 'Close Building After Hours',
      description: 'Simulate closing a building after 8 PM',
      params: {
        building_id: 'sci',
        time_start: '20:00',
        action: 'close'
      }
    },
    {
      id: 'reduce_hvac',
      name: 'Smart HVAC Reduction',
      description: 'Reduce HVAC when occupancy < 30%',
      params: {
        occupancy_threshold: 30,
        hvac_reduction: 40
      }
    },
    {
      id: 'consolidate',
      name: 'Consolidate Classes',
      description: 'Move classes to fewer buildings',
      params: {
        target_buildings: ['lib', 'eng'],
        time_period: 'evening'
      }
    }
  ];
}
