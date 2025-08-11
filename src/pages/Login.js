// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSession } from '../services/api';

const Login = () => {
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!sessionId.trim() || !userName.trim()) {
      setError('Please enter both session ID and your name');
      setIsLoading(false);
      return;
    }

    try {
      // Validate session exists
      const response = await getSession(sessionId);
      
      // Generate a unique user ID for this session
      const userId = `user_${Date.now()}`;
      
      // Store user info
      login({
        userId,
        userName,
        sessionId,
        role: 'user'
      });
      
      // Redirect to chat interface
      navigate(`/chat/${sessionId}`);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Invalid session ID');
      setIsLoading(false);
    }
  };

  const handleAdminLogin = () => {
    // For demo purposes, using a simple admin login
    login({
      userId: 'admin',
      userName: 'Administrator',
      role: 'admin'
    });
    navigate('/admin');
  };

  return (
    <div className="page-container bg-light flex-center">
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="card shadow-lg p-4">
          <div className="card-body">
            <h1 className="heading-3 text-center mb-4">Join a Dot AI Session</h1>
            <div className="divider mb-4"></div>
            
            {error && (
              <div className="alert alert-error mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="ml-2">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="sessionId">
                  Session ID
                </label>
                <input
                  className="form-input"
                  id="sessionId"
                  type="text"
                  placeholder="Enter session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label" htmlFor="userName">
                  Your Name
                </label>
                <input
                  className="form-input"
                  id="userName"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              
              <button
                className="btn btn-primary w-100 mb-3"
                type="submit"
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner mr-2"></span>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Join Session</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="M12 5l7 7-7 7"></path>
                    </svg>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleAdminLogin}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                <span>Admin Login</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center caption-text mt-4">
          Need help? <a href="#" className="text-accent">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default Login;