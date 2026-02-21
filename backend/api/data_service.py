"""Data service for loading and managing campus data."""
import json
from typing import Dict, Any
from pathlib import Path
from datetime import datetime, timedelta
import random


class DataService:
    """Service to load and provide campus data."""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "data"
        self.campus_data = {}
        self.current_observations = {}
    
    async def load_campus_data(self):
        """Load campus structure and generate initial observations."""
        print("📂 Loading campus data...")
        
        # Load or generate campus structure
        self.campus_data = self._generate_campus_structure()
        
        # Generate current observations
        self.current_observations = self._generate_current_observations()
        
        print(f"✓ Loaded {len(self.campus_data.get('buildings', {}))} buildings")
        print(f"✓ Loaded {len(self.campus_data.get('rooms', {}))} rooms")
    
    def get_campus_structure(self) -> Dict[str, Any]:
        """Get campus structure (buildings, rooms, config)."""
        return self.campus_data
    
    def get_current_observations(self) -> Dict[str, Any]:
        """Get current room observations."""
        return self.current_observations

    def update_campus_structure(self, new_structure: Dict[str, Any]):
        """Update the campus structure from uploaded Excel and regenerate observations."""
        print(f"🔄 Updating campus structure with {len(new_structure.get('buildings', {}))} buildings and {len(new_structure.get('rooms', {}))} rooms")
        self.campus_data = new_structure
        self.current_observations = self._generate_current_observations()
        print(f"✅ Campus structure updated and observations regenerated")
    
    def update_room_occupancy(self, room_id: str, person_count: int) -> Dict[str, Any]:
        """
        Update a room's occupancy based on detected person count.
        
        Args:
            room_id: The ID of the room to update
            person_count: Number of people detected in the room
        
        Returns:
            Updated room observation data
        """
        if room_id not in self.campus_data.get("rooms", {}):
            raise ValueError(f"Room {room_id} not found in campus data")
        
        room_config = self.campus_data["rooms"][room_id]
        capacity = room_config.get("capacity", 30)
        
        # Update occupancy in observations
        occupancy = min(person_count, capacity)
        occupancy_ratio = occupancy / capacity if capacity > 0 else 0
        
        # Determine occupancy level
        if occupancy_ratio < 0.3:
            occupancy_level = "low"
        elif occupancy_ratio < 0.7:
            occupancy_level = "medium"
        else:
            occupancy_level = "high"
        
        # Update the observation
        if "rooms" not in self.current_observations:
            self.current_observations["rooms"] = {}
        
        if room_id not in self.current_observations["rooms"]:
            self.current_observations["rooms"][room_id] = {}
        
        old_occupancy = self.current_observations["rooms"][room_id].get("occupancy", 0)
        self.current_observations["rooms"][room_id].update({
            "occupancy": occupancy,
            "occupancy_level": occupancy_level,
            "last_detection_time": datetime.now().isoformat(),
            "detection_method": "yolo_camera",
            "capacity": capacity
        })
        
        print(f"[DATA_SERVICE] Room {room_id}: {old_occupancy} → {occupancy} people detected")
        
        return self.current_observations["rooms"][room_id]
    
    def apply_environmental_params(self, data: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply user-specified environmental parameters to room data."""
        modified_data = data.copy()
        rooms = modified_data.get('rooms', {})
        
        # Extract parameters with defaults
        avg_occupancy = params.get('avg_occupancy')
        lights_on = params.get('lights_on', True)
        ac_on = params.get('ac_on', True)
        ac_temp = params.get('ac_temperature', 22)
        fans_on = params.get('fans_on', False)
        projectors_percent = params.get('projectors_on_percent', 30)
        computers_count = params.get('computers_count', 5)
        time_of_day = params.get('time_of_day', 'afternoon')
        outdoor_temp = params.get('outdoor_temperature', 30)
        
        print(f"[DATA_SERVICE] apply_environmental_params called with avg_occupancy={avg_occupancy}")
        
        for room_id, room_data in rooms.items():
            room_type = room_data.get('type', 'classroom')
            raw_capacity = room_data.get('capacity')
            capacity = int(raw_capacity) if raw_capacity is not None else 30
            
            # Apply occupancy if specified, BUT SKIP if it was recently detected by YOLO
            if avg_occupancy is not None:
                if room_data.get('detection_method') == 'yolo_camera':
                    print(f"[DATA_SERVICE] Room {room_id}: Keeping real YOLO occupancy ({room_data.get('occupancy')})")
                else:
                    variation = random.randint(-5, 5)
                    old_occupancy = int(room_data.get('occupancy') or 0)
                    room_data['occupancy'] = max(0, min(int(avg_occupancy) + variation, capacity))
                    print(f"[DATA_SERVICE] Room {room_id}: {old_occupancy} → {room_data['occupancy']} (variation={variation})")
                    occupancy_ratio = room_data['occupancy'] / capacity if capacity > 0 else 0
                    if occupancy_ratio < 0.3:
                        room_data['occupancy_level'] = 'low'
                    elif occupancy_ratio < 0.7:
                        room_data['occupancy_level'] = 'medium'
                    else:
                        room_data['occupancy_level'] = 'high'
            
            # Build equipment list
            equipment = []
            if lights_on:
                equipment.append('lights')
            if ac_on:
                equipment.append(f'ac_{ac_temp}C')
            if fans_on:
                equipment.append('fans')
            
            # Add projector based on percentage
            if random.randint(0, 100) < projectors_percent:
                equipment.append('projector')
            
            # Add computers
            if computers_count > 0 and room_type in ['lab', 'classroom', 'library']:
                for i in range(min(computers_count, capacity // 2)):
                    equipment.append(f'computer_{i+1}')
            
            room_data['equipment_running'] = equipment
            
            # Determine temperature comfort based on outdoor temp and AC
            if ac_on:
                if outdoor_temp > 35:
                    room_data['temperature_comfort'] = 'too_hot' if not ac_on else 'comfortable'
                elif outdoor_temp < 15:
                    room_data['temperature_comfort'] = 'too_cold'
                else:
                    room_data['temperature_comfort'] = 'comfortable'
            else:
                if outdoor_temp > 30:
                    room_data['temperature_comfort'] = 'too_hot'
                elif outdoor_temp < 18:
                    room_data['temperature_comfort'] = 'too_cold'
                else:
                    room_data['temperature_comfort'] = 'comfortable'
            
            # Add time context
            room_data['time_of_day'] = time_of_day
            room_data['outdoor_temperature'] = outdoor_temp
        
        modified_data['rooms'] = rooms
        modified_data['environmental_context'] = {
            'time_of_day': time_of_day,
            'outdoor_temperature': outdoor_temp,
            'hvac_settings': {
                'ac_on': ac_on,
                'ac_temp': ac_temp,
                'fans_on': fans_on
            }
        }
        
        return modified_data
    
    def _generate_campus_structure(self) -> Dict[str, Any]:
        """Generate realistic campus structure."""
        campus = {
            "campus_info": {
                "name": "State University Campus",
                "location": "Main Campus",
                "total_area_sqm": 50000
            },
            "buildings": {},
            "rooms": {}
        }
        
        # Define buildings
        buildings_config = [
            {"id": "lib", "name": "University Library", "floors": 4, "room_types": ["library"]},
            {"id": "sci", "name": "Science Hall", "floors": 3, "room_types": ["lab", "classroom"]},
            {"id": "eng", "name": "Engineering Building", "floors": 4, "room_types": ["lab", "classroom"]},
            {"id": "dorm", "name": "Student Residence A", "floors": 5, "room_types": ["dorm"]},
            {"id": "cafe", "name": "Student Center", "floors": 2, "room_types": ["cafeteria", "classroom"]}
        ]
        
        room_id_counter = 1
        
        for building in buildings_config:
            b_id = building["id"]
            campus["buildings"][b_id] = {
                "name": building["name"],
                "floors": building["floors"],
                "type": building["room_types"][0]
            }
            
            # Generate rooms for this building
            for floor in range(1, building["floors"] + 1):
                rooms_per_floor = 8 if building["room_types"][0] != "dorm" else 12
                
                for room_num in range(1, rooms_per_floor + 1):
                    room_id = f"{b_id}-{floor}{room_num:02d}"
                    room_type = random.choice(building["room_types"])
                    
                    capacity = {
                        "classroom": random.randint(30, 60),
                        "lab": random.randint(20, 40),
                        "library": random.randint(50, 100),
                        "dorm": 2,
                        "cafeteria": random.randint(100, 200),
                        "bathroom": 10
                    }.get(room_type, 30)
                    
                    campus["rooms"][room_id] = {
                        "building_id": b_id,
                        "floor": floor,
                        "room_number": f"{floor}{room_num:02d}",
                        "type": room_type,
                        "capacity": capacity,
                        "area_sqm": capacity * 2
                    }
                    
                    room_id_counter += 1
        
        return campus
    
    def _generate_current_observations(self) -> Dict[str, Any]:
        """Generate realistic current observations for all rooms."""
        observations = {"rooms": {}}
        
        current_hour = datetime.now().hour
        is_daytime = 8 <= current_hour <= 18
        is_evening = 18 <= current_hour <= 22
        
        for room_id, room_config in self.campus_data.get("rooms", {}).items():
            room_type = room_config["type"]
            capacity = room_config["capacity"]
            
            # Generate realistic occupancy based on time and room type
            if room_type == "classroom":
                occupancy = random.randint(20, 50) if is_daytime else random.randint(0, 5)
            elif room_type == "lab":
                occupancy = random.randint(10, 30) if is_daytime else random.randint(5, 15)
            elif room_type == "library":
                occupancy = random.randint(30, 80) if is_evening else random.randint(10, 40)
            elif room_type == "dorm":
                occupancy = 2 if not is_daytime else random.randint(0, 1)
            elif room_type == "cafeteria":
                is_meal_time = current_hour in [7, 8, 12, 13, 18, 19]
                occupancy = random.randint(50, 150) if is_meal_time else random.randint(5, 20)
            else:
                occupancy = random.randint(0, capacity)
            
            occupancy = min(occupancy, capacity)
            occupancy_ratio = occupancy / capacity
            
            if occupancy_ratio < 0.3:
                occupancy_level = "low"
            elif occupancy_ratio < 0.7:
                occupancy_level = "medium"
            else:
                occupancy_level = "high"
            
            # Temperature comfort (random with bias)
            temp_options = ["too_cold", "comfortable", "too_hot"]
            temp_weights = [0.1, 0.7, 0.2] if is_daytime else [0.15, 0.75, 0.1]
            temperature_comfort = random.choices(temp_options, weights=temp_weights)[0]
            
            # Equipment running
            equipment = []
            if room_type == "classroom" and occupancy > 0:
                if random.random() > 0.3:
                    equipment.append("projector")
                equipment.append("lights")
                if random.random() > 0.5:
                    equipment.append("computers")
            elif room_type == "lab":
                equipment.extend(["lights", "computers", "lab_equipment"])
            elif room_type == "library":
                equipment.append("lights")
                if occupancy > 20:
                    equipment.append("computers")
            elif room_type == "cafeteria":
                equipment.extend(["lights", "kitchen_equipment"])
            
            # Water running
            water_running = room_type in ["cafeteria", "bathroom"] and occupancy > 0
            
            # Generate historical data (mock)
            occupancy_history = []
            for i in range(24):
                hist_hour = (current_hour - i) % 24
                hist_occupancy = random.randint(0, capacity)
                occupancy_history.append({
                    "time": f"{hist_hour:02d}:00",
                    "occupancy": hist_occupancy
                })
            
            observations["rooms"][room_id] = {
                "occupancy": occupancy,
                "occupancy_level": occupancy_level,
                "temperature_comfort": temperature_comfort,
                "equipment_running": equipment,
                "water_running": water_running,
                "occupancy_history": occupancy_history[:5],  # Last 5 hours
                "energy_history": [],
                "water_history": []
            }
        
        return observations
