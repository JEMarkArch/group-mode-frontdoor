// Enhanced CreateSession.js with inline styling
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../services/api';

const CreateSession = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // New field for session description
  const [questions, setQuestions] = useState(['']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Predefined question templates
  const questionTemplates = [
    "What challenges have you encountered with...?",
    "How might we improve...?",
    "What opportunities do you see for...?",
    "What's your experience with...?",
    "If you could change one thing about..., what would it be?"
  ];

  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
    
    // Clear validation error for this question if it's now valid
    if (value.trim() !== '') {
      const newValidationErrors = { ...validationErrors };
      delete newValidationErrors[`question_${index}`];
      setValidationErrors(newValidationErrors);
    }
  };

  const applyTemplate = (index, template) => {
    handleQuestionChange(index, template);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Session name is required';
      isValid = false;
    }

    let hasValidQuestion = false;
    questions.forEach((question, index) => {
      if (question.trim() !== '') {
        hasValidQuestion = true;
      } else if (index === 0 || questions.length === 1) {
        // Only show error for first question or if it's the only question
        errors[`question_${index}`] = 'At least one question is required';
      }
    });

    if (!hasValidQuestion) {
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    const validQuestions = questions.filter(q => q.trim() !== '');
    setIsSubmitting(true);

    try {
      const sessionData = {
        name,
        questions: validQuestions
      };
      
      // Add description if provided
      if (description.trim()) {
        sessionData.description = description;
      }
      
      await createSession(sessionData);
      navigate('/admin');
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error.response?.data?.error || 'Failed to create session');
      setIsSubmitting(false);
    }
  };

  // Styles
  const styles = {
    pageContainer: {
      backgroundColor: '#F8F8F8',
      minHeight: '100vh',
      padding: '2rem 0'
    },
    container: {
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    header: {
      marginBottom: '2rem',
      textAlign: 'center'
    },
    headerTitle: {
      fontSize: '1.75rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#111111'
    },
    headerSubtitle: {
      fontSize: '1rem',
      color: '#666666',
      maxWidth: '600px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    },
    cardHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #E0E0E0',
      backgroundColor: '#FFFFFF'
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#111111'
    },
    cardBody: {
      padding: '1.5rem'
    },
    cardFooter: {
      padding: '1.25rem 1.5rem',
      borderTop: '1px solid #E0E0E0',
      backgroundColor: '#FAFAFA',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    formLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#111111'
    },
    formInput: {
      display: 'block',
      width: '100%',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      lineHeight: '1.5',
      color: '#111111',
      backgroundColor: '#FFFFFF',
      border: '1px solid #CCCCCC',
      borderRadius: '0.5rem',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
    },
    formInputError: {
      border: '1px solid #ef4444',
      boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.2)'
    },
    formTextarea: {
      display: 'block',
      width: '100%',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      lineHeight: '1.5',
      color: '#111111',
      backgroundColor: '#FFFFFF',
      border: '1px solid #CCCCCC',
      borderRadius: '0.5rem',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      minHeight: '100px',
      resize: 'vertical'
    },
    formHint: {
      fontSize: '0.875rem',
      color: '#666666',
      marginTop: '0.5rem'
    },
    errorText: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '0.5rem'
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
    flex: {
      display: 'flex'
    },
    flexAlign: {
      alignItems: 'center'
    },
    flexBetween: {
      justifyContent: 'space-between'
    },
    flexEnd: {
      justifyContent: 'flex-end'
    },
    gap1: {
      gap: '0.5rem'
    },
    gap2: {
      gap: '1rem'
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '2rem',
      height: '2rem',
      backgroundColor: '#F2F2F2',
      color: '#666666',
      fontWeight: '600',
      borderRadius: '50%',
      fontSize: '0.875rem'
    },
    buttonPrimary: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '500',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    buttonSecondary: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.25rem',
      backgroundColor: '#FFFFFF',
      color: '#111111',
      border: '1px solid #CCCCCC',
      borderRadius: '0.5rem',
      fontWeight: '500',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    },
    buttonSmall: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem'
    },
    buttonGhost: {
      backgroundColor: 'transparent',
      border: 'none',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#666666',
      borderRadius: '0.375rem',
      transition: 'all 0.15s ease'
    },
    buttonIcon: {
      width: '2.5rem',
      height: '2.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E0E0E0',
      cursor: 'pointer'
    },
    questionContainer: {
      position: 'relative',
      padding: '1.25rem',
      border: '1px solid #E0E0E0',
      borderRadius: '0.75rem',
      marginBottom: '1rem',
      transition: 'all 0.15s ease',
      backgroundColor: '#FFFFFF'
    },
    questionContainerDragging: {
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
      borderColor: '#CCCCCC'
    },
    questionContainerError: {
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.05)'
    },
    questionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.75rem'
    },
    questionNumber: {
      fontWeight: '600',
      color: '#666666'
    },
    questionActions: {
      display: 'flex',
      gap: '0.5rem'
    },
    templateButton: {
      backgroundColor: '#F8F8F8',
      border: '1px solid #E0E0E0',
      borderRadius: '0.375rem',
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: '#666666',
      cursor: 'pointer',
      marginRight: '0.5rem',
      marginBottom: '0.5rem',
      transition: 'all 0.15s ease'
    },
    spinner: {
      display: 'inline-block',
      width: '1rem',
      height: '1rem',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#FFFFFF',
      borderRadius: '50%',
      animation: 'spin 0.75s linear infinite',
      marginRight: '0.5rem'
    },
    // Special styles
    flexGrow: {
      flexGrow: 1
    },
    mb1: {
      marginBottom: '0.5rem'
    },
    mb2: {
      marginBottom: '1rem'
    },
    mt1: {
      marginTop: '0.5rem'
    },
    mt2: {
      marginTop: '1rem'
    },
    mt3: {
      marginTop: '1.5rem'
    },
    templateContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      marginTop: '0.75rem'
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>Create New Session</h1>
          <p style={styles.headerSubtitle}>
            Set up your brainstorming session with a descriptive name and questions to gather responses from participants.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Session Details</h2>
            </div>
            
            <div style={styles.cardBody}>
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
              
              {/* Session Name */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel} htmlFor="name">
                  Session Name*
                </label>
                <input
                  style={{
                    ...styles.formInput,
                    ...(validationErrors.name ? styles.formInputError : {})
                  }}
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim() && validationErrors.name) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.name;
                      setValidationErrors(newErrors);
                    }
                  }}
                  placeholder="e.g., Product Feedback Q2 2025"
                />
                {validationErrors.name && (
                  <div style={styles.errorText}>{validationErrors.name}</div>
                )}
                <div style={styles.formHint}>
                  Give your session a descriptive name that participants will recognize.
                </div>
              </div>
              
              {/* Session Description */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel} htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  style={styles.formTextarea}
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about the purpose of this session..."
                />
                <div style={styles.formHint}>
                  Provide context about the session goals and what kind of feedback you're looking for.
                </div>
              </div>
              
              {/* Questions Section */}
              <div style={{...styles.formGroup, marginTop: '2rem'}}>
                <div style={{...styles.flex, ...styles.flexBetween, ...styles.flexAlign, marginBottom: '1rem'}}>
                  <label style={styles.formLabel} htmlFor="questions">
                    Questions*
                  </label>
                  <span style={{fontSize: '0.875rem', color: '#666666'}}>
                    {questions.filter(q => q.trim() !== '').length} question(s)
                  </span>
                </div>
                
                {questions.map((question, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.questionContainer,
                      ...(validationErrors[`question_${index}`] ? styles.questionContainerError : {})
                    }}
                  >
                    <div style={styles.questionHeader}>
                      <div style={styles.questionNumber}>Question {index + 1}</div>
                      <div style={styles.questionActions}>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(index)}
                            style={styles.buttonGhost}
                            aria-label="Remove question"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <input
                      style={{
                        ...styles.formInput,
                        ...(validationErrors[`question_${index}`] ? styles.formInputError : {})
                      }}
                      type="text"
                      value={question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      placeholder="Enter your question..."
                    />
                    
                    {validationErrors[`question_${index}`] && (
                      <div style={styles.errorText}>{validationErrors[`question_${index}`]}</div>
                    )}
                    
                    {/* Question Templates */}
                    {question.trim() === '' && (
                      <div style={styles.mt1}>
                        <div style={{fontSize: '0.875rem', color: '#666666', marginBottom: '0.5rem'}}>
                          Try one of these templates:
                        </div>
                        <div style={styles.templateContainer}>
                          {questionTemplates.map((template, tIndex) => (
                            <button
                              key={tIndex}
                              type="button"
                              onClick={() => applyTemplate(index, template)}
                              style={styles.templateButton}
                            >
                              {template.length > 30 ? template.substring(0, 30) + '...' : template}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  style={{...styles.buttonSecondary, ...styles.buttonSmall, marginTop: '0.5rem'}}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Question</span>
                </button>
                
                <div style={{...styles.formHint, marginTop: '1rem'}}>
                  Add all the questions you want participants to answer. You need at least one question.
                </div>
              </div>
            </div>
            
            <div style={styles.cardFooter}>
              <div>
                <span style={{fontSize: '0.875rem', color: '#666666'}}>* Required fields</span>
              </div>
              <div style={{...styles.flex, ...styles.gap2}}>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={styles.buttonPrimary}
                >
                  {isSubmitting ? (
                    <>
                      <div style={styles.spinner}></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Session</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"></path>
                        <path d="M12 5l7 7-7 7"></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;