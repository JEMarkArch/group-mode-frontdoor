// frontend/src/components/results/SummaryView.js
import React from 'react';

const SummaryView = ({ graphData }) => {
  if (!graphData || !graphData.summary) {
    return (
      <div className="p-4 text-center">
        <p>No summary data available.</p>
      </div>
    );
  }
  
  const { mainThemes = [], keyInsights = [], potentialActions = [] } = graphData.summary;
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="heading-4 mb-3">Main Themes</h3>
        {mainThemes.length > 0 ? (
          <div className="grid" style={{ gap: '0.75rem' }}>
            {mainThemes.map((theme, index) => (
              <div key={index} className="card p-3" style={{ background: 'rgba(34, 197, 94, 0.1)', borderLeft: '4px solid var(--success)' }}>
                {theme}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-3 text-center">
            <p className="body-text">No theme data available.</p>
          </div>
        )}
      </div>
      
      <div className="divider"></div>
      
      <div className="mb-4">
        <h3 className="heading-4 mb-3">Key Insights</h3>
        {keyInsights.length > 0 ? (
          <div className="grid" style={{ gap: '0.75rem' }}>
            {keyInsights.map((insight, index) => (
              <div key={index} className="card p-3" style={{ background: 'rgba(32, 131, 252, 0.1)', borderLeft: '4px solid var(--accent-blue)' }}>
                {insight}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-3 text-center">
            <p className="body-text">No insight data available.</p>
          </div>
        )}
      </div>
      
      <div className="divider"></div>
      
      <div>
        <h3 className="heading-4 mb-3">Potential Actions</h3>
        {potentialActions.length > 0 ? (
          <div className="grid" style={{ gap: '0.75rem' }}>
            {potentialActions.map((action, index) => (
              <div key={index} className="card p-3" style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid var(--warning)' }}>
                {action}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-3 text-center">
            <p className="body-text">No action recommendations available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryView;