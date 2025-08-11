// frontend/src/components/results/NodeDetails.js - Updated for compatibility with fixed graph data
import React from 'react';

const NodeDetails = ({ 
  selectedNode, 
  highlightNodes, 
  getNodeColor, 
  graphData, 
  handleCloseDetails 
}) => {
  if (!selectedNode) return null;
  
  return (
    <div className="node-details">
      <div className="flex mb-2" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="heading-4 mb-0">{selectedNode.label}</h3>
        <button
          onClick={handleCloseDetails}
          className="btn btn-ghost btn-icon btn-small"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="badge-container mb-2">
        <span 
          className="badge" 
          style={{ 
            backgroundColor: getNodeColor(selectedNode),
            color: 'white'
          }}
        >
          {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
        </span>
        {highlightNodes.size > 1 && (
          <span className="badge badge-secondary">
            {highlightNodes.size - 1} connections
          </span>
        )}
      </div>
      
      {selectedNode.type === 'idea' && (
        <IdeaDetails selectedNode={selectedNode} />
      )}
      
      {selectedNode.type === 'theme' && (
        <ThemeDetails selectedNode={selectedNode} />
      )}
      
      {selectedNode.type === 'user' && (
        <UserDetails 
          selectedNode={selectedNode} 
          highlightNodes={highlightNodes} 
          graphData={graphData} 
        />
      )}
    </div>
  );
};

const IdeaDetails = ({ selectedNode }) => (
  <>
    <div className="divider my-2"></div>
    <p className="caption-text mb-1">
      Category: <span className="body-text">{selectedNode.category || 'Uncategorized'}</span>
    </p>
    <div className="importance-bar mb-2">
      <span className="caption-text">Importance:</span>
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ 
            width: `${((selectedNode.importance || 5) / 10) * 100}%`,
            backgroundColor: '#0070d8' 
          }}
        ></div>
      </div>
      <span className="value-text">{selectedNode.importance || 0}/10</span>
    </div>
    <p className="body-text details-box">{selectedNode.details || 'No details available'}</p>
  </>
);

const ThemeDetails = ({ selectedNode }) => (
  <>
    <div className="divider my-2"></div>
    <div className="importance-bar mb-2">
      <span className="caption-text">Relevance:</span>
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ 
            width: `${((selectedNode.relevance || 5) / 10) * 100}%`,
            backgroundColor: '#00a050' 
          }}
        ></div>
      </div>
      <span className="value-text">{selectedNode.relevance || 0}/10</span>
    </div>
    <p className="body-text details-box">{selectedNode.summary || 'No summary available'}</p>
  </>
);

const UserDetails = ({ selectedNode, highlightNodes, graphData }) => {
  // Create a lookup map for faster node finding
  const nodesMap = {};
  if (graphData && graphData.nodes) {
    graphData.nodes.forEach(node => {
      nodesMap[node.id] = node;
    });
  }
  
  // Get the actual connected node objects
  const connectedNodeIds = Array.from(highlightNodes).filter(id => id !== selectedNode.id);
  const connectedNodes = connectedNodeIds.map(id => nodesMap[id]).filter(Boolean);
  
  return (
    <>
      <div className="divider my-2"></div>
      <div className="importance-bar mb-2">
        <span className="caption-text">Contribution:</span>
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${((selectedNode.contribution || 5) / 10) * 100}%`,
              backgroundColor: '#e07c00' 
            }}
          ></div>
        </div>
        <span className="value-text">{selectedNode.contribution || 0}/10</span>
      </div>
      <p className="caption-text">
        Connected to {connectedNodes.length} ideas or themes
      </p>
      
      {connectedNodes.length > 0 && (
        <div className="connected-nodes mt-2">
          <p className="caption-text mb-1">Connected to:</p>
          <div className="connected-nodes-list">
            {connectedNodes.slice(0, 5).map(node => (
              <div 
                key={node.id} 
                className="connected-node-pill"
                style={{ 
                  backgroundColor: node.type === 'idea' 
                    ? 'rgba(0, 112, 216, 0.1)' 
                    : node.type === 'theme'
                      ? 'rgba(0, 160, 80, 0.1)'
                      : 'rgba(224, 124, 0, 0.1)',
                  borderColor: node.type === 'idea' 
                    ? 'rgba(0, 112, 216, 0.3)' 
                    : node.type === 'theme'
                      ? 'rgba(0, 160, 80, 0.3)'
                      : 'rgba(224, 124, 0, 0.3)',
                }}
              >
                <span className="node-type-indicator" style={{ 
                  backgroundColor: node.type === 'idea'
                    ? '#0070d8'
                    : node.type === 'theme'
                      ? '#00a050'
                      : '#e07c00'
                }}>
                  {node.type === 'idea' 
                    ? 'I' 
                    : node.type === 'theme'
                      ? 'T'
                      : 'U'}
                </span>
                <span className="node-label">{node.label}</span>
              </div>
            ))}
            {connectedNodes.length > 5 && (
              <div className="connected-node-pill">
                +{connectedNodes.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NodeDetails;