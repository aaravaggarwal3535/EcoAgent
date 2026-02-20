import { createContext, useState, useContext } from 'react';

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [analysis, setAnalysis] = useState(null);
  const [analysisParams, setAnalysisParams] = useState(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState(null);

  const updateAnalysis = (newAnalysis, params = null) => {
    setAnalysis(newAnalysis);
    setAnalysisParams(params);
    setAnalysisTimestamp(new Date());
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setAnalysisParams(null);
    setAnalysisTimestamp(null);
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        analysisParams,
        analysisTimestamp,
        updateAnalysis,
        clearAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
}
