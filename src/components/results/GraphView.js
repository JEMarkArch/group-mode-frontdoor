// Fixed GraphView.js - using proper ForceGraph API methods

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
  
  // Simplified node painting function for better reliability
 const paintNode = useCallback((node, ctx, globalScale) => {
  // Skip rendering if node is invalid or filtered out
  if (!node || !node.id || (node.type && !nodeFilters[node.type])) return;
  
  // Make sure node has valid coordinates
  if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
  
  // Get node size and color
  const size = getNodeSize(node);
  const color = getNodeColor(node);
  
  // IMPORTANT: Use the node's actual coordinates directly
  // instead of relying on ForceGraph's context translation
  const x = node.x;
  const y = node.y;
  
  // Draw node circle at the actual coordinates
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Add border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Add text label (centered in the node)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.max(size * 0.6, 10)}px Arial`;
  
  // Pick appropriate icon text
  let iconText = '?';
  switch (node.type) {
    case 'idea': iconText = 'I'; break;
    case 'theme': iconText = 'T'; break;
    case 'user': iconText = 'U'; break;
  }
  
  // Draw the icon text at the node center
  ctx.fillText(iconText, x, y);
  
  // Only draw labels for highlighted nodes or when zoomed in
  if (highlightNodes.has(node.id) || node.id === hoverNode?.id || globalScale > 1.5) {
    const label = node.label || '';
    
    // Set font for label
    ctx.font = `${Math.max(size * 0.5, 9)}px Arial`;
    const textWidth = ctx.measureText(label).width;
    
    // Draw label below the node
    const labelY = y + size + 4;
    
    // Draw label background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x - textWidth/2 - 4, labelY, textWidth + 8, 18);
    
    // Draw label text
    ctx.fillStyle = color;
    ctx.fillText(label, x, labelY + 9);
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
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 40);
    }
  }, []);
  
  // Setup force simulation using public API methods
  useEffect(() => {
    if (graphRef.current && processedGraphData?.nodes?.length > 0) {
      // Use the d3Force public API method to configure forces
      try {
        // Set charge force (node repulsion)
        graphRef.current.d3Force('charge', d3.forceManyBody()
          .strength(node => {
            if (!node || !node.type) return -100;
            
            switch(node.type) {
              case 'theme': return -300;
              case 'idea': return -150;
              case 'user': return -100;
              default: return -100;
            }
          })
        );
        
        // Set link force
        graphRef.current.d3Force('link', d3.forceLink()
          .id(node => node.id)
          .distance(link => {
            if (!link.source || !link.target) return 100;
            
            const sourceType = link.source.type || 'unknown';
            const targetType = link.target.type || 'unknown';
            
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
        
        // Add collision force
        graphRef.current.d3Force('collision', d3.forceCollide()
          .radius(node => getNodeSize(node) * 1.8)
        );
        
        // Add center force
        graphRef.current.d3Force('center', d3.forceCenter(
          dimensions.width / 2, 
          dimensions.height / 2
        ));
        
        // Add x and y forces
        graphRef.current.d3Force('x', d3.forceX(dimensions.width / 2).strength(0.05));
        graphRef.current.d3Force('y', d3.forceY(dimensions.height / 2).strength(0.05));
        
        // Reheat the simulation
        graphRef.current.d3ReheatSimulation();
        
        // Initial zoom to fit
        setTimeout(handleZoomToFit, 100);
      } catch (error) {
        console.error('Error configuring force simulation:', error);
      }
    }
  }, [dimensions, getNodeSize, handleZoomToFit, processedGraphData]);
  
  // Debug logging
  useEffect(() => {
    if (processedGraphData) {
      console.log('Processed graph data:', 
        processedGraphData.nodes.length, 'nodes,', 
        processedGraphData.links.length, 'links'
      );
    }
  }, [processedGraphData]);
  
  return (
    <div className="graph-view">
      <div className="graph-container">
        {processedGraphData && (
          <ForceGraph2D
            ref={graphRef}
            graphData={processedGraphData}
            nodeRelSize={6}
            nodeId="id"
            nodeCanvasObject={paintNode}
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            linkDirectionalParticles={link => highlightLinks.has(link.id) ? 4 : 0}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.003}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.15}
            cooldownTicks={100}
            cooldownTime={2000}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onBackgroundClick={handleBackgroundClick}
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