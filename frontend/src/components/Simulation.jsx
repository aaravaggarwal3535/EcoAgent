import { useState, useEffect } from 'react';
import { simulationAPI } from '../services/api';
import { PlayCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import './Simulation.css';

function Simulation() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentProgress, setAgentProgress] = useState('');
  
  // User-configurable parameters
  const [numRooms, setNumRooms] = useState(10);
  const [numBuildings, setNumBuildings] = useState(2);
  const [budgetLevel, setBudgetLevel] = useState('low');
  const [useCustomSettings, setUseCustomSettings] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await simulationAPI.getTemplates();
      setTemplates(response.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const runSimulation = async (template) => {
    setLoading(true);
    setSelectedTemplate(template);
    setResult(null);
    
    try {
      // Show agent execution progress
      setAgentProgress('Initializing agents...');
      
      const scenario = {
        name: template.name,
        type: template.type,
        building_id: template.building_id || 'lib',
        parameters: useCustomSettings ? {
          num_rooms: numRooms,
          num_buildings: numBuildings,
          budget_level: budgetLevel
        } : {}
      };
      
      setAgentProgress('Running room agents...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setAgentProgress('Aggregating building data...');
      const response = await simulationAPI.run(scenario);
      
      setAgentProgress('Generating campus insights...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResult(response.data);
      setAgentProgress('Complete!');
    } catch (err) {
      console.error('Simulation failed:', err);
      setAgentProgress('Error occurred');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setAgentProgress('');
      }, 1000);
    }
  };

  return (
    <div className="simulation-page">
      <header className="simulation-header">
        <h1>🔮 What-If Scenarios</h1>
        <p>Test sustainability policies before implementation</p>
      </header>

      <div className="simulation-content">
        <section className="control-panel">
          <h2>🎛️ Configure Agent Execution</h2>
          <p className="control-description">
            Control the scope of agent analysis to conserve API usage and demonstrate the system to judges.
            Lower values = faster execution and less API usage.
          </p>
          
          <div className="controls-grid">
            <div className="control-item">
              <label htmlFor="numRooms">
                Number of Rooms to Analyze
                <span className="control-hint">(Recommended: 5-20 for demos)</span>
              </label>
              <input
                id="numRooms"
                type="range"
                min="5"
                max="50"
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value))}
                className="slider"
              />
              <span className="value-display">{numRooms} rooms</span>
            </div>

            <div className="control-item">
              <label htmlFor="numBuildings">
                Number of Buildings
                <span className="control-hint">(Recommended: 1-3 for demos)</span>
              </label>
              <input
                id="numBuildings"
                type="range"
                min="1"
                max="5"
                value={numBuildings}
                onChange={(e) => setNumBuildings(parseInt(e.target.value))}
                className="slider"
              />
              <span className="value-display">{numBuildings} buildings</span>
            </div>

            <div className="control-item">
              <label htmlFor="budgetLevel">
                API Key Budget
                <span className="control-hint">(Controls analysis depth)</span>
              </label>
              <select
                id="budgetLevel"
                value={budgetLevel}
                onChange={(e) => setBudgetLevel(e.target.value)}
                className="budget-select"
              >
                <option value="low">Low (Fast, minimal API usage)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Deep analysis)</option>
              </select>
            </div>

            <div className="control-item checkbox-item">
              <label>
                <input
                  type="checkbox"
                  checked={useCustomSettings}
                  onChange={(e) => setUseCustomSettings(e.target.checked)}
                />
                Use custom settings (uncheck for full campus analysis)
              </label>
            </div>
          </div>

          <div className="execution-info">
            <p><strong>Current Configuration:</strong></p>
            <ul>
              <li>Will analyze {useCustomSettings ? numRooms : 'all'} rooms across {useCustomSettings ? numBuildings : 'all'} buildings</li>
              <li>Budget level: {budgetLevel.toUpperCase()}</li>
              <li>Estimated API calls: ~{useCustomSettings ? Math.ceil(numRooms * 0.3 + numBuildings * 0.5) : '50+'}</li>
            </ul>
          </div>
        </section>

        <section className="templates-section">
          <h2>Available Scenarios</h2>
          <p className="scenario-description">
            Click "Run Simulation" to trigger the agents with your configured settings.
            Agents will only execute when you explicitly start the simulation.
          </p>
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card">
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <span className="impact-badge">{template.estimated_impact}</span>
                <button 
                  onClick={() => runSimulation(template)}
                  disabled={loading}
                  className="run-btn"
                >
                  <PlayCircle size={18} />
                  Run Simulation
                </button>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <div className="simulation-loading">
            <Loader className="spinning" size={48} />
            <h2>Running simulation...</h2>
            <p>Scenario: {selectedTemplate?.name}</p>
            <div className="agent-progress">
              <p className="progress-step">{agentProgress}</p>
              <div className="progress-details">
                <span>🤖 Room Agents → 🏢 Building Agents → 🌍 Campus Agent</span>
              </div>
            </div>
          </div>
        )}

        {result && !loading && (
          <section className="results-section">
            <h2>Simulation Results: {result.scenario?.name}</h2>
            
            {result.execution_info && (
              <div className="execution-summary">
                <h3>🤖 Agent Execution Summary</h3>
                <div className="execution-stats">
                  <span>✓ Analyzed {result.execution_info.rooms_analyzed} rooms</span>
                  <span>✓ Across {result.execution_info.buildings_analyzed} buildings</span>
                  <span>✓ Budget level: {result.execution_info.budget_level.toUpperCase()}</span>
                </div>
              </div>
            )}
            
            <div className="comparison-grid">
              <div className="comparison-card baseline">
                <h3>Current State</h3>
                <div className="metric">
                  <span>Energy</span>
                  <strong>{result.baseline?.total_energy_kw} kW</strong>
                </div>
                <div className="metric">
                  <span>Water</span>
                  <strong>{result.baseline?.total_water_lph} L/h</strong>
                </div>
                <div className="metric">
                  <span>Occupancy</span>
                  <strong>{result.baseline?.occupancy_rate}%</strong>
                </div>
              </div>

              <div className="comparison-arrow">→</div>

              <div className="comparison-card simulated">
                <h3>After Implementation</h3>
                <div className="metric">
                  <span>Energy</span>
                  <strong>{result.simulated?.total_energy_kw} kW</strong>
                </div>
                <div className="metric">
                  <span>Water</span>
                  <strong>{result.simulated?.total_water_lph} L/h</strong>
                </div>
                <div className="metric">
                  <span>Occupancy</span>
                  <strong>{result.simulated?.occupancy_rate}%</strong>
                </div>
              </div>
            </div>

            <div className="savings-summary">
              <h3>Impact Analysis</h3>
              <div className="savings-grid">
                <div className="savings-card">
                  <span className="savings-label">Energy Savings</span>
                  <span className="savings-value success">
                    {result.comparison?.energy_savings_kw} kW
                    ({result.comparison?.energy_savings_pct}%)
                  </span>
                </div>
                <div className="savings-card">
                  <span className="savings-label">Water Savings</span>
                  <span className="savings-value success">
                    {result.comparison?.water_savings_lph} L/h
                    ({result.comparison?.water_savings_pct}%)
                  </span>
                </div>
                <div className="savings-card">
                  <span className="savings-label">Cost Savings</span>
                  <span className="savings-value success">
                    ${result.comparison?.cost_savings_hourly}/hour
                  </span>
                </div>
              </div>

              <div className="recommendation-box">
                {result.recommendation === 'Implement' ? (
                  <div className="rec-success">
                    <CheckCircle size={24} />
                    <span>✅ Recommended for Implementation</span>
                  </div>
                ) : (
                  <div className="rec-review">
                    <XCircle size={24} />
                    <span>⚠️ Needs Further Review</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Simulation;
