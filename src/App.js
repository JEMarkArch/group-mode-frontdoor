// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CreateSession from './pages/CreateSession';
import ChatInterface from './pages/ChatInterface';
import ResultsView from './pages/ResultsView';

// Import the monochrome design system
import './styles/monochrome.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/create-session" element={
              <PrivateRoute>
                <CreateSession />
              </PrivateRoute>
            } />
            <Route path="/chat/:sessionId" element={<ChatInterface />} />
            <Route path="/results/:sessionId" element={
              <PrivateRoute>
                <ResultsView />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;