// frontend/src/components/results/GraphView.js - Fixed node connections
import React, { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3';
import GraphControls from './GraphControls';
import NodeDetails from './NodeDetails';
import { lightenColor } from '../../utils/graph-helpers';

const GraphView = ({ 
  graphData, 
  processedGraphData, 
  dimensions,
  selectedNode,
  setSelectedNode,
  highlightNodes,
  setHighlightNodes,
  highlightLinks,
  setHighlightLinks,
  hoverNode,
  setHoverNode,
  nodeFilters,
  toggleNodeFilter,
  updateHighlights
}) => {
  const graphRef = useRef();
  
  // Optimized and beautified node colors
  const getNodeColor = useCallback((node) => {
    if (!node || !node.type) return '#a0a0a0'; // Default color for nodes with missing type
    
    if (highlightNodes.has(node.id) || node.id === hoverNode?.id) {
      // Highlighted node - brighter version
      switch (node.type) {
        case 'idea':
          return '#1a91ff'; // Brighter blue
        case 'theme':
          return '#10c060'; // Brighter green
        case 'user':
          return '#ff9500'; // Brighter orange
        default:
          return '#a0a0a0';
      }
    }
    
    // Regular node colors
    switch (node.type) {
      case 'idea':
        return '#0070d8'; // Rich blue
      case 'theme':
        return '#00a050'; // Rich green
      case 'user':
        return '#e07c00'; // Rich orange
      default:
        return '#888888';
    }
  }, [highlightNodes, hoverNode]);
  
  // Optimized node sizing
  const getNodeSize = useCallback((node) => {
    if (!node || !node.type) return 8; // Default size for nodes with missing type
    
    let baseSize;
    switch (node.type) {
      case 'idea':
        baseSize = 6 + (node.importance || 5) * 1.2;
        break;
      case 'theme':
        baseSize = 10 + (node.relevance || 5) * 1.5;
        break;
      case 'user':
        baseSize = 8 + (node.contribution || 5) * 1.3;
        break;
      default:
        baseSize = 8;
    }
    
    return highlightNodes.has(node.id) || node.id === hoverNode?.id 
      ? baseSize * 1.3  // Increase size for highlighted nodes
      : baseSize;
  }, [highlightNodes, hoverNode]);
  
  // Improved link styling
  const getLinkColor = useCallback((link) => {
    if (!link || !link.type) return 'rgba(40, 40, 40, 0.3)'; // Default color for links with missing type
    
    // If link is highlighted
    if (highlightLinks.has(link.id)) {
      switch (link.type) {
        case 'user_to_idea':
          return 'rgba(224, 124, 0, 0.8)'; // Orange for user connections
        case 'idea_to_theme':
          return 'rgba(0, 112, 216, 0.8)'; // Blue for idea-theme connections
        case 'theme_to_theme':
          return 'rgba(0, 160, 80, 0.8)'; // Green for theme-theme connections
        default:
          return 'rgba(40, 40, 40, 0.8)';
      }
    }
    
    // Regular links - more subtle
    const strength = link.strength || 5;
    const opacity = 0.1 + ((strength - 1) * 0.07);
    
    switch (link.type) {
      case 'user_to_idea':
        return `rgba(224, 124, 0, ${opacity})`; // Orange for user connections
      case 'idea_to_theme':
        return `rgba(0, 112, 216, ${opacity})`; // Blue for idea-theme connections
      case 'theme_to_theme':
        return `rgba(0, 160, 80, ${opacity})`; // Green for theme-theme connections
      default:
        return `rgba(40, 40, 40, ${opacity})`;
    }
  }, [highlightLinks]);
  
  const getLinkWidth = useCallback((link) => {
    if (!link) return 1; // Default width for invalid links
    
    const baseWidth = (link.strength || 5) / 3.5;
    return highlightLinks.has(link.id) ? baseWidth * 2 : baseWidth;
  }, [highlightLinks]);
  
  // Handle node click
  const handleNodeClick = useCallback((node) => {
    if (!node) {
      setSelectedNode(null);
      updateHighlights(null);
      return;
    }
    
    setSelectedNode(prevSelected => {
      // Toggle selection if clicking the same node
      if (prevSelected && prevSelected.id === node.id) {
        updateHighlights(null);
        return null;
      }
      updateHighlights(node);
      return node;
    });
  }, [updateHighlights, setSelectedNode]);
  
  // Handle node hover
  const handleNodeHover = useCallback((node) => {
    setHoverNode(node || null);
    
    // Only update highlights on hover if no node is already selected
    if (!selectedNode) {
      updateHighlights(node);
    }
  }, [selectedNode, updateHighlights, setHoverNode]);
  
  // Clear selection when clicking background
  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  }, [setSelectedNode, setHighlightNodes, setHighlightLinks]);
  
  // Custom node painting function with improved visuals
const paintNode = useCallback((node, ctx, globalScale) => {
  // Skip rendering if node is invalid
  if (!node || !node.id) return;
  
  // Skip rendering if node type is filtered out
  if (node.type && !nodeFilters[node.type]) return;
  
  const size = getNodeSize(node);
  // THIS IS THE KEY FIX:
  // The x and y should be 0, because ForceGraph2D already 
  // translates the context to the node position
  const x = 0;
  const y = 0;
  
  // Create glow effect for highlighted nodes
  if (highlightNodes.has(node.id) || node.id === hoverNode?.id) {
    ctx.beginPath();
    const glowColor = getNodeColor(node);
    const gradient = ctx.createRadialGradient(x, y, size, x, y, size * 1.5);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.arc(x, y, size * 1.5, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  // Draw node circle with better styling
  ctx.beginPath();
  
  // Get node color
  const color = getNodeColor(node);
  
  // Add gradient fill for more dimension
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, lightenColor(color, 30));
  gradient.addColorStop(1, color);
  
  ctx.fillStyle = gradient;
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add shading for 3D effect
  ctx.beginPath();
  const shadowGradient = ctx.createRadialGradient(
    x + size * 0.2, 
    y - size * 0.2,
    0,
    x,
    y,
    size
  );
  shadowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  shadowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = shadowGradient;
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();
  
  // Border
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.strokeStyle = highlightNodes.has(node.id) ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = highlightNodes.has(node.id) ? 2 : 1;
  ctx.stroke();
  
  // Add icon inside the node
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = `${highlightNodes.has(node.id) ? 'bold ' : ''}${Math.max(size * 0.6, 10)}px Arial`;
  
  let iconText = '';
  switch (node.type) {
    case 'idea':
      iconText = 'I';
      break;
    case 'theme':
      iconText = 'T';
      break;
    case 'user':
      iconText = node.label?.charAt(0) || 'U';
      break;
    default:
      iconText = '?';
  }
  
  ctx.fillText(iconText, x, y);
  
  // Draw label if node is highlighted, hovered, or zoomed in
  if (highlightNodes.has(node.id) || node.id === hoverNode?.id || globalScale > 1.5) {
    const label = node.label || '';
    
    // Set a maximum label length to prevent overflow
    const maxLabelLength = 25;
    const displayLabel = label.length > maxLabelLength 
      ? label.substring(0, maxLabelLength) + '...' 
      : label;
    
    // Calculate text size with proper font settings
    ctx.font = `${highlightNodes.has(node.id) ? 'bold ' : ''}${Math.max(size * 0.5, 9)}px Arial`;
    const textMetrics = ctx.measureText(displayLabel);
    const textWidth = textMetrics.width;
    const textHeight = size * 0.6;
    
    // Draw background for label with rounded corners
    const padding = 4;
    const bgX = x - textWidth/2 - padding;
    const bgY = y + size + 2;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding;
    const radius = 4;
    
    // Create rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(bgX + radius, bgY);
    ctx.lineTo(bgX + bgWidth - radius, bgY);
    ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
    ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
    ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
    ctx.lineTo(bgX + radius, bgY + bgHeight);
    ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
    ctx.lineTo(bgX, bgY + radius);
    ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
    ctx.closePath();
    
    // Fill with semi-transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    
    // Add subtle border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(displayLabel, x, bgY + bgHeight/2);
  }
}, [getNodeColor, getNodeSize, highlightNodes, hoverNode, nodeFilters]);
  
  // Handle node detail close
  const handleCloseDetails = useCallback(() => {
    setSelectedNode(null);
    setHighlightLinks(new Set());
    setHighlightNodes(new Set());
  }, [setSelectedNode, setHighlightLinks, setHighlightNodes]);
  
  // Zoom to fit handler
  const handleZoomToFit = useCallback(() => {
    if (graphRef.current && typeof graphRef.current.zoomToFit === 'function') {
      graphRef.current.zoomToFit(400, 40);
    }
  }, []);
  
  // Setup force simulation on initial render of graph
  useEffect(() => {
    if (graphRef.current && processedGraphData?.nodes?.length > 0) {
      // Apply automatic clustering force
      if (graphRef.current && typeof graphRef.current.d3Force === 'function') {
        graphRef.current.d3Force('charge', d3.forceManyBody().strength(node => {
          if (!node || !node.type) return -100;
          
          switch(node.type) {
            case 'theme': return -300;
            case 'idea': return -150;
            case 'user': return -100;
            default: return -100;
          }
        }));
        
        // CRITICAL FIX: Define proper link force with correct distance settings
        graphRef.current.d3Force('link', d3.forceLink()
          .id(node => node.id)
          .distance(link => {
            // Calculate appropriate distance based on node types
            const sourceType = link.source.type || 'unknown';
            const targetType = link.target.type || 'unknown';
            
            // Apply different distances based on node types
            if (sourceType === 'theme' && targetType === 'theme') {
              return 100; // Theme-theme connections
            } else if ((sourceType === 'idea' && targetType === 'theme') || 
                       (sourceType === 'theme' && targetType === 'idea')) {
              return 80;  // Idea-theme connections
            } else if (sourceType === 'user' || targetType === 'user') {
              return 120; // User connections
            }
            return 100; // Default
          })
        );
        
        // Add collision force to prevent overlap
        graphRef.current.d3Force('collision', d3.forceCollide(node => getNodeSize(node) * 1.8));
        
        // Center force
        graphRef.current.d3Force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));
        
        // Add x and y forces for stability
        graphRef.current.d3Force('x', d3.forceX(dimensions.width / 2).strength(0.05));
        graphRef.current.d3Force('y', d3.forceY(dimensions.height / 2).strength(0.05));
      }
      
      // Initial zoom to fit
      handleZoomToFit();
      
      // Reset the simulation with higher alpha for better initial layout
      graphRef.current.d3ReheatSimulation();
    }
  }, [processedGraphData, dimensions, getNodeSize, handleZoomToFit]);
  
  // Apply force update when filters change
  useEffect(() => {
    if (graphRef.current && processedGraphData) {
      // Force reheat the simulation when filters change
      graphRef.current.d3ReheatSimulation();
    }
  }, [nodeFilters, processedGraphData]);
  
  return (
    <div className="graph-view">
      <div className="graph-container">
        {processedGraphData && (
          <ForceGraph2D
            ref={graphRef}
            graphData={processedGraphData}
            nodeId="id"
            nodeCanvasObject={paintNode}
            linkColor={link => getLinkColor(link)}
            linkWidth={link => getLinkWidth(link)}
            linkDirectionalParticles={link => highlightLinks.has(link.id) ? 4 : 0}
            linkDirectionalParticleWidth={link => highlightLinks.has(link.id) ? 2 : 0}
            linkDirectionalParticleSpeed={0.002}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.15}
            cooldownTicks={100}
            cooldownTime={2000}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onBackgroundClick={handleBackgroundClick}
            nodeRelSize={6}
            backgroundColor="#ffffff"
            width={dimensions.width}
            height={dimensions.height || 600}
          />
        )}
        
        <GraphControls 
          nodeFilters={nodeFilters} 
          toggleNodeFilter={toggleNodeFilter} 
          handleZoomToFit={handleZoomToFit}
        />
        
        <NodeDetails 
          selectedNode={selectedNode} 
          highlightNodes={highlightNodes} 
          getNodeColor={getNodeColor} 
          graphData={graphData} 
          handleCloseDetails={handleCloseDetails}
        />
      </div>
    </div>
  );
};

export default GraphView;