import {
  Lightbulb,
  TrendingDown,
  Leaf,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import "./RecommendationPanel.css";

function RecommendationPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="recommendation-panel">
      <div className="panel-header">
        <div className="header-icon">
          <Sparkles size={28} />
        </div>
        <div className="header-content">
          <h2>AI-Powered Sustainability Insights</h2>
          <p className="header-subtitle">
            Smart recommendations for campus optimization
          </p>
        </div>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, idx) => (
          <RecommendationCard
            key={idx}
            recommendation={rec}
            index={idx}
            isPriority={idx < 3}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ recommendation, index, isPriority }) {
  // Parse savings if present in recommendation text
  const savingsMatch = recommendation.match(/(\d+)%/);
  const savings = savingsMatch ? savingsMatch[1] : null;

  const getIcon = () => {
    if (isPriority) return <Zap size={22} />;
    if (index < 5) return <Target size={22} />;
    return <Leaf size={22} />;
  };

  const getPriorityLabel = () => {
    if (index === 0) return { label: "Critical", color: "critical" };
    if (index < 3) return { label: "High Priority", color: "high" };
    if (index < 6) return { label: "Medium", color: "medium" };
    return { label: "Low", color: "low" };
  };

  const priority = getPriorityLabel();

  const cleanText = recommendation.replace(/^\d+\.\s*/, "").replace(/^- /, "");

  return (
    <div className={`recommendation-card ${priority.color}`}>
      <div className="card-badge">{index + 1}</div>
      <div className="rec-icon">{getIcon()}</div>
      <div className="rec-content">
        <div className="rec-header-row">
          <span className={`priority-badge ${priority.color}`}>
            {priority.label}
          </span>
          {savings && (
            <span className="savings-tag">
              <TrendingDown size={14} />
              {savings}% savings
            </span>
          )}
        </div>
        <p className="rec-text">{cleanText}</p>
      </div>
    </div>
  );
}

export default RecommendationPanel;
