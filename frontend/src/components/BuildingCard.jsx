import { Building2, Zap, Users, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import './BuildingCard.css';

function BuildingCard({ building }) {
  const occupancyLevel = building.occupancy_rate || 0;
  const statusColor = 
    occupancyLevel > 70 ? 'high' : 
    occupancyLevel > 40 ? 'medium' : 
    'low';

  const energyKw = building.total_energy_kw?.toFixed(1) || 0;
  const savings = building.savings_potential || building.savings_analysis?.total_potential_savings || 0;

  return (
    <div className={`building-card ${statusColor}`}>
      <div className="building-header">
        <div className="building-icon">
          <Building2 size={28} />
        </div>
        <div className="building-title">
          <h3>{building.building_name || building.building_id}</h3>
          <span className={`status-pill ${statusColor}`}>
            {statusColor === 'high' ? 'High Load' : statusColor === 'medium' ? 'Moderate' : 'Optimal'}
          </span>
        </div>
      </div>

      <div className="building-stats">
        <div className="stat energy">
          <div className="stat-icon">
            <Zap size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Energy Usage</span>
            <span className="stat-value">{energyKw} <span className="unit">kW</span></span>
          </div>
        </div>

        <div className="stat occupancy">
          <div className="stat-icon">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Occupancy Rate</span>
            <span className="stat-value">{occupancyLevel.toFixed(0)}<span className="unit">%</span></span>
          </div>
        </div>

        <div className="stat savings">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Savings Potential</span>
            <span className="stat-value">{typeof savings === 'number' ? savings.toFixed(1) : savings}<span className="unit">%</span></span>
          </div>
        </div>
      </div>

      {building.anomalies?.length > 0 && (
        <div className="building-alerts">
          <AlertCircle size={16} />
          <span>{building.anomalies.length} anomalies detected</span>
        </div>
      )}

      <div className="building-recommendations">
        <div className="rec-header">
          <Lightbulb size={16} />
          <h4>AI Recommendations</h4>
        </div>
        <ul>
          {(building.recommendations || building.building_recommendations || [])
            .filter(rec => {
              const text = rec.toLowerCase();
              return !text.includes("no immediate") &&
                     !text.includes("operating efficiently") &&
                     rec.trim().length > 10;
            })
            .slice(0, 2)
            .map((rec, idx) => (
              <li key={idx}>
                <span className="rec-bullet">→</span>
                {rec}
              </li>
            ))}
        </ul>
      </div>

      <div className="building-footer">
        <div className="footer-item">
          <span className="footer-label">Rooms</span>
          <span className="footer-value">{building.total_rooms || 0}</span>
        </div>
        <div className="footer-divider"></div>
        <div className="footer-item">
          <span className="footer-label">Capacity</span>
          <span className="footer-value">{building.total_occupancy || 0}/{building.total_capacity || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default BuildingCard;
