# 🚀 EcoAgent API Demo Examples

Base URL: `https://ecoagent-clei.onrender.com`

---

## 1️⃣ Campus Analysis (GET Request)

### Simple Analysis (5 rooms, 2 buildings, low budget)

**cURL:**
```bash
curl "https://ecoagent-clei.onrender.com/api/analysis/current?num_rooms=5&num_buildings=2&budget_level=low"
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "https://ecoagent-clei.onrender.com/api/analysis/current?num_rooms=5&num_buildings=2&budget_level=low"
```

**JavaScript (fetch):**
```javascript
fetch('https://ecoagent-clei.onrender.com/api/analysis/current?num_rooms=5&num_buildings=2&budget_level=low')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### Full Analysis with Environmental Parameters

**cURL:**
```bash
curl -G "https://ecoagent-clei.onrender.com/api/analysis/current" \
  -d "num_rooms=10" \
  -d "num_buildings=3" \
  -d "budget_level=medium" \
  -d "avg_occupancy=25" \
  -d "lights_on=true" \
  -d "ac_on=true" \
  -d "ac_temperature=22" \
  -d "fans_on=false" \
  -d "projectors_on_percent=30" \
  -d "computers_count=5" \
  -d "time_of_day=afternoon" \
  -d "outdoor_temperature=30"
```

**PowerShell:**
```powershell
$params = @{
    num_rooms = 10
    num_buildings = 3
    budget_level = "medium"
    avg_occupancy = 25
    lights_on = $true
    ac_on = $true
    ac_temperature = 22
    fans_on = $false
    projectors_on_percent = 30
    computers_count = 5
    time_of_day = "afternoon"
    outdoor_temperature = 30
}

$query = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
Invoke-RestMethod -Uri "https://ecoagent-clei.onrender.com/api/analysis/current?$query"
```

**JavaScript:**
```javascript
const params = new URLSearchParams({
  num_rooms: 10,
  num_buildings: 3,
  budget_level: 'medium',
  avg_occupancy: 25,
  lights_on: true,
  ac_on: true,
  ac_temperature: 22,
  fans_on: false,
  projectors_on_percent: 30,
  computers_count: 5,
  time_of_day: 'afternoon',
  outdoor_temperature: 30
});

fetch(`https://ecoagent-clei.onrender.com/api/analysis/current?${params}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 2️⃣ What-If Simulation (POST Request)

### Scenario 1: Close Building After Hours

**cURL:**
```bash
curl -X POST "https://ecoagent-clei.onrender.com/api/simulation/run" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Close Library After 8 PM",
    "type": "close_building",
    "building_id": "lib",
    "parameters": {
      "num_rooms": 10,
      "num_buildings": 2,
      "budget_level": "low",
      "time": "20:00"
    }
  }'
```

**PowerShell:**
```powershell
$body = @{
    name = "Close Library After 8 PM"
    type = "close_building"
    building_id = "lib"
    parameters = @{
        num_rooms = 10
        num_buildings = 2
        budget_level = "low"
        time = "20:00"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://ecoagent-clei.onrender.com/api/simulation/run" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

**JavaScript:**
```javascript
fetch('https://ecoagent-clei.onrender.com/api/simulation/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Close Library After 8 PM',
    type: 'close_building',
    building_id: 'lib',
    parameters: {
      num_rooms: 10,
      num_buildings: 2,
      budget_level: 'low',
      time: '20:00'
    }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### Scenario 2: Reduce HVAC in Low Occupancy

**JSON Body:**
```json
{
  "name": "Reduce HVAC by 30%",
  "type": "reduce_hvac",
  "building_id": "eng",
  "parameters": {
    "num_rooms": 15,
    "num_buildings": 3,
    "budget_level": "medium",
    "reduction_percent": 30,
    "avg_occupancy": 10,
    "ac_temperature": 24
  }
}
```

**cURL:**
```bash
curl -X POST "https://ecoagent-clei.onrender.com/api/simulation/run" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "name": "Reduce HVAC by 30%",
  "type": "reduce_hvac",
  "building_id": "eng",
  "parameters": {
    "num_rooms": 15,
    "num_buildings": 3,
    "budget_level": "medium",
    "reduction_percent": 30,
    "avg_occupancy": 10,
    "ac_temperature": 24
  }
}
EOF
```

---

### Scenario 3: Shift Classes to Evening

**JSON Body:**
```json
{
  "name": "Evening Classes Schedule",
  "type": "shift_schedule",
  "parameters": {
    "num_rooms": 20,
    "num_buildings": 4,
    "budget_level": "high",
    "time_of_day": "evening",
    "avg_occupancy": 30,
    "outdoor_temperature": 25
  }
}
```

---

## 3️⃣ Other Useful Endpoints

### Health Check
```bash
curl "https://ecoagent-clei.onrender.com/health"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "campus_initialized": true,
  "data_loaded": true
}
```

---

### Get Analysis Summary (Fast)
```bash
curl "https://ecoagent-clei.onrender.com/api/analysis/summary"
```

---

### Get Specific Building Analysis
```bash
curl "https://ecoagent-clei.onrender.com/api/analysis/building/lib"
```

---

### Get Specific Room Analysis
```bash
curl "https://ecoagent-clei.onrender.com/api/analysis/room/lib_101"
```

---

### Get Campus Info
```bash
curl "https://ecoagent-clei.onrender.com/api/campus/info"
```

---

### Get Simulation Templates
```bash
curl "https://ecoagent-clei.onrender.com/api/simulation/templates"
```

---

## 4️⃣ Parameter Reference

### Analysis Endpoint Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `num_rooms` | int | null | Number of rooms to analyze (5-50) |
| `num_buildings` | int | null | Number of buildings (1-5) |
| `budget_level` | string | "medium" | API budget: "low", "medium", "high" |
| `avg_occupancy` | int | null | Average people per room |
| `lights_on` | bool | true | Are lights on? |
| `ac_on` | bool | true | Is AC running? |
| `ac_temperature` | int | 22 | AC temperature (°C) |
| `fans_on` | bool | false | Are fans running? |
| `projectors_on_percent` | int | 30 | % of rooms with projectors |
| `computers_count` | int | 5 | Computers per room |
| `time_of_day` | string | "afternoon" | Time period |
| `outdoor_temperature` | int | 30 | Outside temp (°C) |

### Time of Day Options
- `morning` (6 AM - 12 PM)
- `afternoon` (12 PM - 6 PM)
- `evening` (6 PM - 10 PM)
- `night` (10 PM - 6 AM)

### Budget Levels
- `low` - Minimal LLM calls, faster, cheaper
- `medium` - Balanced analysis
- `high` - Comprehensive LLM analysis

---

## 5️⃣ Example Response

```json
{
  "campus_name": "State University Campus",
  "timestamp": "2026-02-17T20:00:00",
  "summary": {
    "total_buildings": 2,
    "total_rooms": 10,
    "total_energy_kw": 125.5,
    "total_water_lph": 45.2,
    "total_occupancy": 150,
    "total_capacity": 300,
    "avg_occupancy_rate": 50.0,
    "estimated_cost_hourly": 15.06
  },
  "campus_metrics": {
    "total_energy_kw": 125.5,
    "potential_savings_percent": 22.5,
    "estimated_cost_per_hour": 15.06,
    "total_occupancy": 150,
    "total_capacity": 300,
    "avg_occupancy_rate": 50.0,
    "total_water_lph": 45.2,
    "avg_co2_ppm": 650
  },
  "building_states": {
    "lib": {
      "building_id": "lib",
      "building_name": "Central Library",
      "total_energy_kw": 65.5,
      "occupancy_rate": 45.0,
      "savings_analysis": {
        "total_potential_savings": 25.0,
        "estimated_kwh_saved": 16.38
      }
    }
  },
  "campus_recommendations": [
    "CAMPUS: Reduce HVAC in low-occupancy areas (est. 15-20% savings)",
    "CAMPUS: Consolidate evening classes to fewer buildings",
    "BUILDING lib: Close upper floors after 8 PM"
  ],
  "critical_buildings": [
    {
      "building_id": "eng",
      "reason": "High energy consumption with low occupancy",
      "energy_kw": 85.0,
      "occupancy_rate": 25.0
    }
  ],
  "execution_info": {
    "rooms_analyzed": 10,
    "buildings_analyzed": 2,
    "budget_level": "low",
    "environmental_params": {...}
  }
}
```

---

## 🧪 Testing Tips

### 1. Start with Health Check
```bash
curl https://ecoagent-clei.onrender.com/health
```

### 2. Test Small Analysis First
```bash
curl "https://ecoagent-clei.onrender.com/api/analysis/current?num_rooms=5&num_buildings=1&budget_level=low"
```

### 3. Use Postman/Thunder Client
Import this as a collection for easier testing.

### 4. Check CORS
If testing from browser, CORS is configured to allow all origins.

### 5. Monitor Response Time
- Low budget: ~10-15 seconds
- Medium budget: ~20-30 seconds  
- High budget: ~40-60 seconds

---

## 🔧 Troubleshooting

### Service Unavailable (503)
- Render free tier: Service may be spinning up (wait 30-60 seconds)
- High traffic: Service may be rate limited

### Timeout
- Reduce `num_rooms` and `num_buildings`
- Use `budget_level=low`

### Invalid Parameters
- Check parameter types (bool, int, string)
- Ensure values are within expected ranges

---

## 📊 Interactive API Documentation

Visit: `https://ecoagent-clei.onrender.com/docs`

This provides interactive Swagger UI to test all endpoints directly from your browser!
