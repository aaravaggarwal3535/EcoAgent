import {
  Lightbulb,
  TrendingDown,
  Leaf,
  Sparkles,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Wind,
  Sun,
  Droplets,
} from "lucide-react";
import "./RecommendationPanel.css";

function RecommendationPanel({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Filter to only show accurate, actionable recommendations
  const filteredRecs = recommendations
    .filter(rec => {
      // Exclude generic/low-confidence suggestions
      const text = rec.toLowerCase();
      return !text.includes("no immediate actions") &&
             !text.includes("operating efficiently") &&
             !text.includes("monitor") &&
             rec.trim().length > 10; // Minimum length to filter out fragments
    })
    .slice(0, 5); // Show only top 5 most accurate recommendations

  if (filteredRecs.length === 0) {
    return null;
  }

  return (
    <section className="recommendation-panel">
      <div className="panel-header">
        <div className="header-icon">
          <Lightbulb size={24} />
        </div>
        <div className="header-content">
          <h2>Actionable Recommendations</h2>
          <p className="header-subtitle">
            {filteredRecs.length} optimization{filteredRecs.length !== 1 ? 's' : ''} identified
          </p>
        </div>
      </div>

      <div className="recommendations-list">
        {filteredRecs.map((rec, idx) => (
          <RecommendationCard
            key={idx}
            recommendation={rec}
            index={idx}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ recommendation, index }) {
  // Parse savings percentage and impact
  const savingsMatch = recommendation.match(/(\d+)%/);
  const savings = savingsMatch ? savingsMatch[1] : null;

  // Determine impact level based on savings potential
  const getImpactLevel = () => {
    if (!savings) return "medium";
    const savingsNum = parseInt(savings);
    if (savingsNum >= 20) return "critical";
    if (savingsNum >= 15) return "high";
    if (savingsNum >= 10) return "medium";
    return "low";
  };

  // Get icon based on recommendation type
  const getIcon = () => {
    const text = recommendation.toLowerCase();
    if (text.includes("hvac") || text.includes("temperature")) return <Wind size={20} />;
    if (text.includes("light")) return <Sun size={20} />;
    if (text.includes("water")) return <Droplets size={20} />;
    if (text.includes("equipment")) return <Zap size={20} />;
    return <Lightbulb size={20} />;
  };

  const impact = getImpactLevel();
  const cleanText = recommendation.replace(/^\d+\.\s*/, "").replace(/^- /, "").replace(/^ACTION:\s*/i, "");

  return (
    <div className={`recommendation-card ${impact}`}>
      <div className="card-main">
        <div className={`card-icon ${impact}`}>
          {getIcon()}
        </div>
        <div className="card-content">
          <p className="rec-text">{cleanText}</p>
          {savings && (
            <div className="impact-row">
              <span className={`impact-badge ${impact}`}>
                {savings}% savings
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecommendationPanel;
