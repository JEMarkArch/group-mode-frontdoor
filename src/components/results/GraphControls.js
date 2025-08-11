// frontend/src/components/results/GraphControls.js
import React from 'react';

const GraphControls = ({ nodeFilters, toggleNodeFilter, handleZoomToFit }) => {
  return (
    <div className="graph-controls">
      <button 
        className="btn btn-icon btn-secondary" 
        onClick={handleZoomToFit}
        title="Zoom to fit"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
        </svg>
      </button>
      
      <div className="filter-buttons">
        <button 
          className={`filter-btn ${nodeFilters.idea ? '' : 'filter-btn-disabled'}`}
          style={{ backgroundColor: nodeFilters.idea ? "#0070d8" : "#cccccc" }}
          title="Show/hide Ideas"
          onClick={() => toggleNodeFilter('idea')}
        >
          I
        </button>
        <button 
          className={`filter-btn ${nodeFilters.theme ? '' : 'filter-btn-disabled'}`}
          style={{ backgroundColor: nodeFilters.theme ? "#00a050" : "#cccccc" }}
          title="Show/hide Themes"
          onClick={() => toggleNodeFilter('theme')}
        >
          T
        </button>
        <button 
          className={`filter-btn ${nodeFilters.user ? '' : 'filter-btn-disabled'}`}
          style={{ backgroundColor: nodeFilters.user ? "#e07c00" : "#cccccc" }}
          title="Show/hide Users"
          onClick={() => toggleNodeFilter('user')}
        >
          U
        </button>
      </div>
    </div>
  );
};

export default GraphControls;