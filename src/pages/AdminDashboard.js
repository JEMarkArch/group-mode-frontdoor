// Improved AdminDashboard.js with inline styling
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllSessions } from '../services/api';

const AdminDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await getAllSessions();
        setSessions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Failed to load sessions');
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Styles
  const styles = {
    pageContainer: {
      backgroundColor: '#F8F8F8',
      minHeight: '100vh',
      padding: '1.5rem 0'
    },
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    header: {
      backgroundColor: '#FFFFFF',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerLeft: {
      display: 'flex',
      flexDirection: 'column'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    heading: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '0.25rem'
    },
    subheading: {
      fontSize: '0.875rem',
      color: '#666666'
    },
    userProfile: {
      display: 'flex',
      alignItems: 'center'
    },
    avatar: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '50%',
      backgroundColor: '#2083fc',
      color: '#FFFFFF',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '0.75rem'
    },
    userInfo: {
      display: 'flex',
      flexDirection: 'column'
    },
    userName: {
      fontWeight: '500',
      marginBottom: '0.125rem'
    },
    userRole: {
      fontSize: '0.75rem',
      color: '#666666'
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: '1px solid #E0E0E0',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    cardHeader: {
      padding: '1.25rem',
      borderBottom: '1px solid #E0E0E0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    cardHeaderContent: {
      display: 'flex',
      flexDirection: 'column'
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '0.25rem'
    },
    cardSubtitle: {
      fontSize: '0.875rem',
      color: '#666666'
    },
    createButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      border: 'none',
      textDecoration: 'none'
    },
    alert: {
      padding: '1rem',
      borderRadius: '0.5rem',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    alertIcon: {
      marginRight: '0.75rem'
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 0'
    },
    spinner: {
      display: 'inline-block',
      width: '2rem',
      height: '2rem',
      border: '2px solid #E0E0E0',
      borderTopColor: '#000000',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
      marginBottom: '1rem'
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center'
    },
    emptyIcon: {
      width: '3.5rem',
      height: '3.5rem',
      backgroundColor: '#F2F2F2',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem'
    },
    emptyTitle: {
      fontWeight: '600',
      fontSize: '1.125rem',
      marginBottom: '0.5rem'
    },
    emptyDescription: {
      color: '#666666',
      maxWidth: '24rem',
      marginBottom: '1.5rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0
    },
    tableHeaderCell: {
      backgroundColor: '#F2F2F2',
      fontWeight: '600',
      padding: '1rem',
      textAlign: 'left',
      borderBottom: '1px solid #E0E0E0'
    },
    tableCell: {
      padding: '1rem',
      borderTop: '1px solid #E0E0E0',
      verticalAlign: 'middle'
    },
    sessionId: {
      fontFamily: 'var(--font-mono)',
      color: '#666666'
    },
    sessionName: {
      fontWeight: '500'
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.5rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: '#F2F2F2',
      color: '#666666'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      color: '#22c55e'
    },
    statusIndicator: {
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '50%',
      backgroundColor: '#22c55e',
      marginRight: '0.375rem'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    viewButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.375rem 0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #E0E0E0',
      backgroundColor: '#FFFFFF',
      color: '#000000',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      textDecoration: 'none'
    },
    menuButton: {
      width: '2rem',
      height: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '0.5rem',
      border: '1px solid #E0E0E0',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.25rem',
      borderTop: '1px solid #E0E0E0'
    },
    paginationInfo: {
      fontSize: '0.875rem',
      color: '#666666'
    },
    paginationButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    tableRowEven: {
      backgroundColor: '#FFFFFF'
    },
    tableRowOdd: {
      backgroundColor: '#F8F8F8'
    },
    tableRowHover: {
      transition: 'background-color 0.15s ease',
      ':hover': {
        backgroundColor: 'rgba(0, 112, 216, 0.05)'
      }
    },
    textCenter: {
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        {/* Header Section with Improved Styling */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <h1 style={styles.heading}>Admin Dashboard</h1>
              <p style={styles.subheading}>Manage your brainstorming sessions</p>
            </div>
            
            <div style={styles.headerRight}>
              <div style={styles.userProfile}>
                <div style={styles.avatar}>
                  {currentUser?.userName?.charAt(0) || 'U'}
                </div>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{currentUser?.userName || 'User'}</p>
                  <p style={styles.userRole}>Administrator</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                style={styles.logoutButton}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Error Alert with Improved Styling */}
        {error && (
          <div style={styles.alert}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.alertIcon}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Main Content */}
        <main>
          {/* Sessions Card with Improved Layout */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderContent}>
                <h2 style={styles.cardTitle}>Sessions</h2>
                <p style={styles.cardSubtitle}>{sessions.length} total sessions</p>
              </div>
              
              <Link
                to="/admin/create-session"
                style={styles.createButton}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Create New Session</span>
              </Link>
            </div>

            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={{ color: '#666666' }}>Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <h3 style={styles.emptyTitle}>No Sessions Available</h3>
                <p style={styles.emptyDescription}>You haven't created any brainstorming sessions yet. Create your first session to get started.</p>
                <Link
                  to="/admin/create-session"
                  style={styles.createButton}
                >
                  Create Your First Session
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeaderCell}>Session ID</th>
                      <th style={styles.tableHeaderCell}>Name</th>
                      <th style={styles.tableHeaderCell}>Created</th>
                      <th style={{...styles.tableHeaderCell, ...styles.textCenter}}>Questions</th>
                      <th style={styles.tableHeaderCell}>Status</th>
                      <th style={styles.tableHeaderCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => (
                      <tr 
                        key={session._id} 
                        style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
                      >
                        <td style={{...styles.tableCell, ...styles.sessionId}}>{session.sessionId}</td>
                        <td style={{...styles.tableCell, ...styles.sessionName}}>{session.name}</td>
                        <td style={styles.tableCell}>{formatDate(session.createdAt)}</td>
                        <td style={{...styles.tableCell, ...styles.textCenter}}>
                          <span style={styles.badge}>{session.questions.length}</span>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.statusBadge}>
                            <span style={styles.statusIndicator}></span>
                            Active
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.actionButtons}>
                            <Link
                              to={`/results/${session.sessionId}`}
                              style={styles.viewButton}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 11 12 14 22 4"></polyline>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                              </svg>
                              <span>Results</span>
                            </Link>
                            
                            <button style={styles.menuButton}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination - only shown when there are sessions */}
            {sessions.length > 0 && (
              <div style={styles.pagination}>
                <div style={styles.paginationInfo}>
                  Showing <span style={{ fontWeight: '500' }}>{sessions.length}</span> sessions
                </div>
                
                <div style={styles.paginationButtons}>
                  <button style={{...styles.logoutButton, opacity: 0.5}} disabled={true}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Previous</span>
                  </button>
                  
                  <button style={{...styles.logoutButton, opacity: 0.5}} disabled={true}>
                    <span>Next</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;