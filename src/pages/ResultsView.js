// frontend/src/pages/ResultsView.js - Updated with fixed graph processing
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSession, generateGraph } from '../services/api';
import GraphView from '../components/results/GraphView';
import SummaryView from '../components/results/SummaryView';
import GraphLegend from '../components/results/GraphLegend';
import { useGraphDataEnhancer, processGraphDataForForceGraph, updateNodeHighlights } from '../utils/graph-helpers';
import '../styles/graph-styles.css';

const ResultsView = () => {
  const [session, setSession] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'summary'
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodeFilters, setNodeFilters] = useState({
    idea: true,
    theme: true,
    user: true
  });
  
  const { sessionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const containerRef = useRef();
  
  // Handle graph data enhancement
  const enhanceGraphData = useGraphDataEnhancer(setGraphData);
  
  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await getSession(sessionId);
        setSession(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session data');
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchSessionData();
    } else {
      navigate('/login');
    }
  }, [sessionId, currentUser, navigate]);
  
  // Handle generate graph
  const handleGenerateGraph = async () => {
    setGenerating(true);
    setError('');
    
    try {
      const response = await generateGraph(sessionId);
      enhanceGraphData(response.data);
    } catch (error) {
      console.error('Error generating graph:', error);
      setError('Failed to generate idea graph. ' + (error.response?.data?.details || ''));
    } finally {
      setGenerating(false);
    }
  };
  
  // Toggle node filter
  const toggleNodeFilter = (type) => {
    setNodeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  // Update linked nodes and links when a node is selected
  const updateHighlights = useCallback((node) => {
    updateNodeHighlights(graphData, node, setHighlightNodes, setHighlightLinks);
  }, [graphData]);
  
  // Prepare graph data for rendering with enhanced layout
  const processedGraphData = React.useMemo(() => {
    return processGraphDataForForceGraph(graphData);
  }, [graphData]);
  
  // Handle graph container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: Math.max(height, 600) });
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial sizing
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Add logging to debug processed data
  useEffect(() => {
    if (processedGraphData) {
      console.log('Processed graph data ready:', 
        processedGraphData.nodes.length, 'nodes,', 
        processedGraphData.links.length, 'links'
      );
      
      // Check if links have proper source/target references
      const checkSample = processedGraphData.links.slice(0, 3);
      console.log('Sample links check:', checkSample.map(link => ({
        id: link.id,
        sourceIsObject: typeof link.source === 'object',
        targetIsObject: typeof link.target === 'object'
      })));
    }
  }, [processedGraphData]);
  
  if (loading) {
    return (
      <div className="page-container bg-light flex-center">
        <div className="card p-4 text-center">
          <div className="mb-3">
            <div className="spinner"></div>
          </div>
          <p className="body-text">Loading session data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page-container bg-light flex-center">
        <div className="card p-4 text-center" style={{ maxWidth: '480px' }}>
          <div className="mb-3 text-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="heading-3 mb-2 text-error">Error</h2>
          <p className="body-text mb-4">{error}</p>
          <button 
            onClick={() => navigate('/admin')}
            className="btn btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container bg-light">
      <header className="bg-black text-white p-3 mb-4">
        <div className="container">
          <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="heading-3 mb-1">Session Results</h1>
              <p className="caption-text text-white">
                {session?.name} <span className="mono-text">(ID: {sessionId})</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="btn btn-secondary btn-small"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>
      
      <div className="container" ref={containerRef}>
        {!graphData ? (
          <div className="card mb-4">
            <div className="card-header">
              <h2 className="heading-4">Idea Network Analysis</h2>
              <button
                onClick={handleGenerateGraph}
                disabled={generating}
                className="btn btn-primary"
              >
                {generating ? (
                  <>
                    <span className="spinner mr-2" style={{ width: '1rem', height: '1rem' }}></span>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Analysis</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                      <line x1="16" y1="8" x2="2" y2="22"></line>
                      <line x1="17.5" y1="15" x2="9" y2="15"></line>
                    </svg>
                  </>
                )}
              </button>
            </div>
            
            <div className="card-body" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {generating ? (
                <div className="text-center">
                  <div className="spinner mb-3"></div>
                  <p className="body-text mb-2">Analyzing responses and generating idea network...</p>
                  <p className="caption-text">This may take a minute or two.</p>
                </div>
              ) : (
                <div className="text-center">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <p className="body-text mt-3">
                    Click "Generate Analysis" to analyze all user responses and create an idea network.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="card mb-4">
              <div className="card-header">
                <h2 className="heading-4">Idea Network Analysis</h2>
                <div className="flex gap-2">
                  <div className="btn-group">
                    <button
                      onClick={() => setViewMode('graph')}
                      className={`btn ${viewMode === 'graph' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      <span>Graph View</span>
                    </button>
                    <button
                      onClick={() => setViewMode('summary')}
                      className={`btn ${viewMode === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                      <span>Summary</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-0">
                {viewMode === 'graph' ? (
                  <GraphView 
                    graphData={graphData} 
                    processedGraphData={processedGraphData}
                    dimensions={dimensions}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    highlightNodes={highlightNodes}
                    setHighlightNodes={setHighlightNodes}
                    highlightLinks={highlightLinks}
                    setHighlightLinks={setHighlightLinks}
                    hoverNode={hoverNode}
                    setHoverNode={setHoverNode}
                    nodeFilters={nodeFilters}
                    toggleNodeFilter={toggleNodeFilter}
                    updateHighlights={updateHighlights}
                  />
                ) : (
                  <SummaryView graphData={graphData} />
                )}
              </div>
            </div>
            
            <GraphLegend />
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsView;