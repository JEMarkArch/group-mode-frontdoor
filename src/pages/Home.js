// frontend/src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="page-container bg-white">
      <div className="container">
        <div className="flex-center" style={{ minHeight: '80vh' }}>
          <div className="card p-5 text-center" style={{ maxWidth: '600px' }}>
            <h1 className="heading-1 mb-3">Welcome to Dot AI</h1>
            <div className="divider mx-auto" style={{ width: '60px' }}></div>
            
            <p className="body-text mb-4 mt-4">
              An intelligent feedback collection and analysis platform that transforms
              conversations into actionable insights.
            </p>
            
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem', marginTop: '2.5rem' }}>
              <div className="text-center">
                <div className="flex-center mb-2" style={{ height: '3rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h4 className="heading-4 mb-1">Intelligent Conversations</h4>
                <p className="caption-text">AI-guided feedback sessions</p>
              </div>
              
              <div className="text-center">
                <div className="flex-center mb-2" style={{ height: '3rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <h4 className="heading-4 mb-1">Visual Insights</h4>
                <p className="caption-text">Data-driven visualizations</p>
              </div>
              
              <div className="text-center">
                <div className="flex-center mb-2" style={{ height: '3rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                </div>
                <h4 className="heading-4 mb-1">Seamless Sessions</h4>
                <p className="caption-text">Easy to create and manage</p>
              </div>
            </div>
            
            <div className="btn-group-vertical mt-5">
              <Link to="/login" className="btn btn-primary btn-large">
                Join a Session
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </Link>
              
              <Link to="/admin" className="btn btn-secondary btn-large mt-2">
                Admin Login
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </Link>
            </div>
            
            <p className="caption-text mt-5">© 2025 Dot AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;