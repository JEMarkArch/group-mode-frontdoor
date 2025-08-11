// frontend/src/components/results/GraphLegend.js
import React from 'react';

const GraphLegend = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="heading-4">Legend</h2>
      </div>
      <div className="card-body">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card p-3">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#0070d8' }}></div>
              <span className="body-text">Ideas (I)</span>
            </div>
            <p className="caption-text">
              Key concepts and suggestions shared by users during the session.
              Size indicates importance rating.
            </p>
          </div>
          
          <div className="card p-3">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#00a050' }}></div>
              <span className="body-text">Themes (T)</span>
            </div>
            <p className="caption-text">
              Broader categories that connect multiple ideas.
              Size indicates relevance to the overall discussion.
            </p>
          </div>
          
          <div className="card p-3">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#e07c00' }}></div>
              <span className="body-text">Users</span>
            </div>
            <p className="caption-text">
              Participants who contributed to the discussion.
              Size indicates contribution level.
            </p>
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h3 className="heading-4 mb-2">Connection Strength</h3>
            <div className="flex" style={{ gap: '1rem', alignItems: 'center' }}>
              <div className="flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ height: '1px', width: '2rem', backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
                <span className="caption-text">Weak</span>
              </div>
              <div className="flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ height: '2px', width: '2rem', backgroundColor: 'rgba(0,0,0,0.4)' }}></div>
                <span className="caption-text">Medium</span>
              </div>
              <div className="flex" style={{ alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ height: '3px', width: '2rem', backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
                <span className="caption-text">Strong</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="heading-4 mb-2">Graph Tips</h3>
            <ul className="tip-list">
              <li className="caption-text">Click on a node to see details and connections</li>
              <li className="caption-text">Hover over nodes to see their labels</li>
              <li className="caption-text">Use mouse wheel to zoom in/out</li>
              <li className="caption-text">Drag to pan around the graph</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphLegend;