// frontend/src/pages/CreateSession.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../services/api';

const CreateSession = () => {
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!name.trim()) {
      setError('Please enter a session name');
      return;
    }

    const validQuestions = questions.filter(q => q.trim() !== '');
    if (validQuestions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createSession({
        name,
        questions: validQuestions
      });
      
      navigate('/admin');
    } catch (error) {
      console.error('Error creating session:', error);
      setError(error.response?.data?.error || 'Failed to create session');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container bg-light">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card shadow-lg">
          <div className="card-header">
            <h1 className="heading-3">Create New Session</h1>
          </div>
          
          <div className="card-body">
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
                <label className="form-label" htmlFor="name">
                  Session Name
                </label>
                <input
                  className="form-input"
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter session name"
                />
                <div className="caption-text mt-1">Give your session a descriptive name that participants will recognize.</div>
              </div>
              
              <div className="form-group mt-4">
                <label className="form-label mb-3">
                  Questions
                </label>
                
                {questions.map((question, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                      <div className="badge badge-secondary" style={{ minWidth: '24px' }}>{index + 1}</div>
                      <input
                        className="form-input"
                        type="text"
                        value={question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                        placeholder={`Enter question ${index + 1}`}
                        style={{ flex: 1 }}
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          className="btn btn-ghost btn-icon"
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
                ))}
                
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn btn-secondary btn-small mt-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Question</span>
                </button>
              </div>
            </form>
          </div>
          
          <div className="card-footer">
            <div className="flex" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner mr-2" style={{ width: '1rem', height: '1rem' }}></span>
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
      </div>
    </div>
  );
};

export default CreateSession;