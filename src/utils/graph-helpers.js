// frontend/src/utils/graph-helpers.js - Fixed with proper node references
import { useCallback } from 'react';

/**
 * Creates a deterministic hash from a string
 * @param {string} str - The string to hash
 * @return {number} - A numeric hash
 */
export const hashString = (str) => {
  if (!str) return 0;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Lightens a color by the given percentage
 * @param {string} color - The color to lighten (hex or rgba)
 * @param {number} percent - The percentage to lighten by (0-100)
 * @return {string} - The lightened color
 */
export const lightenColor = (color, percent) => {
  // Handle rgba strings
  if (color.startsWith('rgba')) {
    // Extract rgb values from rgba string
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      const [, r, g, b] = rgbaMatch.map(Number);
      const newR = Math.min(255, r + Math.round(2.55 * percent));
      const newG = Math.min(255, g + Math.round(2.55 * percent));
      const newB = Math.min(255, b + Math.round(2.55 * percent));
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    return color;
  }
  
  // Handle hex colors
  if (!color.startsWith('#')) return color;
  
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    Math.min(255, Math.max(0, R)) * 0x10000 +
    Math.min(255, Math.max(0, G)) * 0x100 +
    Math.min(255, Math.max(0, B))
  ).toString(16).slice(1);
};

/**
 * Hook to enhance graph data with additional metadata
 * @param {Function} setGraphData - Function to update graph data state
 * @return {Function} - Function to process raw graph data
 */
export const useGraphDataEnhancer = (setGraphData) => {
  return useCallback((rawData) => {
    if (!rawData) return null;
    
    const nodes = [...rawData.nodes];
    const edges = [...rawData.edges];
    
    // Add link types based on connected nodes
    edges.forEach(edge => {
      if (!edge.id) {
        // Generate a unique ID if missing
        edge.id = `edge-${edge.from}-${edge.to}`;
      }
      
      const sourceNode = nodes.find(n => n.id === edge.from);
      const targetNode = nodes.find(n => n.id === edge.to);
      
      if (sourceNode && targetNode) {
        if (sourceNode.type === 'user' && targetNode.type === 'idea') {
          edge.type = 'user_to_idea';
        } else if (sourceNode.type === 'idea' && targetNode.type === 'theme') {
          edge.type = 'idea_to_theme';
        } else if (sourceNode.type === 'theme' && targetNode.type === 'theme') {
          edge.type = 'theme_to_theme';
        } else if (sourceNode.type === 'theme' && targetNode.type === 'idea') {
          edge.type = 'theme_to_idea';
        } else {
          // Set a default type for unrecognized connections
          edge.type = 'default';
        }
      }
    });
    
    // Layout hints - place themes in the center, ideas around them, users on the outside
    nodes.forEach(node => {
      // Ensure node has a valid type
      if (!node.type) {
        node.type = 'unknown';
      }
      
      // Ensure node has a valid label
      if (!node.label) {
        node.label = node.id ? `Node ${node.id.substring(0, 8)}` : 'Unnamed Node';
      }
      
      switch(node.type) {
        case 'theme':
          // Give themes a central position hint
          node.x = Math.random() * 50 ;
          node.y = Math.random() * 25 - 25;
          break;
        case 'idea':
          // Ideas start in a middle ring
          const angle1 = Math.random() * 2 * Math.PI;
          node.x = Math.cos(angle1) * 150;
          node.y = Math.sin(angle1) * 150;
          break;
        case 'user':
          // Users start in an outer ring
          const angle2 = Math.random() * 2 * Math.PI;
          node.x = Math.cos(angle2) * 300;
          node.y = Math.sin(angle2) * 300;
          break;
        default:
          // Random position for unknown types
          node.x = (Math.random() - 0.5) ;
          node.y = (Math.random() - 0.5) * 400;
      }
    });
    
    const enhancedData = {
      ...rawData,
      nodes,
      edges
    };
    
    setGraphData(enhancedData);
    return enhancedData;
  }, [setGraphData]);
};

/**
 * Creates graph data appropriate for ForceGraph2D from API data
 * @param {Object} enhancedData - Enhanced graph data with nodes and edges
 * @return {Object|null} - Processed graph data for ForceGraph2D
 */
export const processGraphDataForForceGraph = (enhancedData) => {
  if (!enhancedData) return null;
  
  // CRITICAL FIX: Create nodes map for faster lookup
  const nodesMap = {};
  enhancedData.nodes.forEach(node => {
    nodesMap[node.id] = node;
  });
  
  // Create links with the actual node objects as source and target
  const links = enhancedData.edges.map(edge => {
    // Get source and target nodes by ID
    const sourceNode = nodesMap[edge.from];
    const targetNode = nodesMap[edge.to];
    
    // Skip invalid links
    if (!sourceNode || !targetNode) {
      console.warn(`Edge ${edge.id} has missing source or target: ${edge.from} -> ${edge.to}`);
      return null;
    }
    
    return {
      id: edge.id,
      // IMPORTANT: Use the actual node objects, not just IDs
      source: sourceNode,
      target: targetNode,
      relation: edge.relation,
      strength: edge.strength || 5,
      type: edge.type || 'default'
    };
  }).filter(Boolean); // Remove null entries
  
  return {
    nodes: enhancedData.nodes,
    links
  };
};

/**
 * Updates highlight data based on the selected node
 * @param {Object} graphData - The graph data with nodes and edges
 * @param {Object|null} node - The selected node
 * @param {Function} setHighlightNodes - Function to update highlighted nodes
 * @param {Function} setHighlightLinks - Function to update highlighted links
 */
export const updateNodeHighlights = (
  graphData, 
  node, 
  setHighlightNodes, 
  setHighlightLinks
) => {
  if (!graphData || !node) {
    // Clear highlights if no node is selected or no graph data exists
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    return;
  }
  
  const newHighlightNodes = new Set();
  const newHighlightLinks = new Set();
  
  newHighlightNodes.add(node.id);
  
  // Find connected links and nodes with proper traversal
  const nodeQueue = [node.id];
  const processedNodes = new Set(nodeQueue);
  const maxDepth = 2; // Only highlight connections up to 2 hops away
  
  // Build an adjacency map for faster lookups
  const adjacencyMap = {};
  graphData.edges.forEach(edge => {
    // Skip invalid edges
    if (!edge.from || !edge.to || !edge.id) return;
    
    if (!adjacencyMap[edge.from]) adjacencyMap[edge.from] = [];
    if (!adjacencyMap[edge.to]) adjacencyMap[edge.to] = [];
    
    adjacencyMap[edge.from].push({
      nodeId: edge.to,
      linkId: edge.id,
      relation: edge.relation,
      direction: 'outgoing'
    });
    
    adjacencyMap[edge.to].push({
      nodeId: edge.from,
      linkId: edge.id,
      relation: edge.relation,
      direction: 'incoming'
    });
  });
  
  // BFS traversal with depth tracking
  let currentDepth = 0;
  let currentLevelSize = nodeQueue.length;
  let nodesProcessed = 0;
  
  while (nodeQueue.length > 0 && currentDepth < maxDepth) {
    const currentNodeId = nodeQueue.shift();
    nodesProcessed++;
    
    // Process connections for this node
    if (adjacencyMap[currentNodeId]) {
      adjacencyMap[currentNodeId].forEach(conn => {
        // Add the link
        newHighlightLinks.add(conn.linkId);
        
        // Add the connected node if not already processed
        if (!processedNodes.has(conn.nodeId)) {
          newHighlightNodes.add(conn.nodeId);
          nodeQueue.push(conn.nodeId);
          processedNodes.add(conn.nodeId);
        }
      });
    }
    
    // Check if we've completed the current level
    if (nodesProcessed >= currentLevelSize) {
      currentDepth++;
      currentLevelSize = nodeQueue.length;
      nodesProcessed = 0;
    }
  }
  
  setHighlightNodes(newHighlightNodes);
  setHighlightLinks(newHighlightLinks);
};