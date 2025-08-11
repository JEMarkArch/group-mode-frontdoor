// frontend/src/pages/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getSession, 
  saveResponse, 
  transcribeAudio, 
  sendChatMessage, 
  getChatHistory,
  initializeSession,
  getConversationState
} from '../services/api';
import ChatMessage from '../components/ChatMessage';
import VoiceRecorder from '../components/VoiceRecorder';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioInput, setAudioInput] = useState(null);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatComplete, setChatComplete] = useState(false);
  const [inQuestionMode, setInQuestionMode] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationState, setConversationState] = useState(null);
  
  const { sessionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Fetch session data and initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get session data
        const sessionResponse = await getSession(sessionId);
        setSession(sessionResponse.data);
        
        // Initialize user in session
        if (currentUser) {
          const initResponse = await initializeSession(sessionId, {
            userId: currentUser.userId,
            userName: currentUser.userName
          });
          
          // Set messages from initialization
          setMessages(initResponse.data.messages.map(msg => ({
            id: msg._id,
            sender: msg.sender,
            text: msg.message,
            timestamp: new Date(msg.timestamp)
          })));
          
          // Set conversation state
          const state = initResponse.data.conversationState;
          setConversationState(state);
          setInQuestionMode(state.questionMode);
          setQuestionIndex(state.currentQuestionIndex);
          setChatComplete(!state.questionMode);
          
          // Set current question if in question mode
          if (state.questionMode && sessionResponse.data.questions) {
            setCurrentQuestion(sessionResponse.data.questions[state.currentQuestionIndex]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat session');
        setLoading(false);
      }
    };
    
    if (currentUser) {
      initializeChat();
    } else {
      navigate(`/login?redirect=/chat/${sessionId}`);
    }
  }, [sessionId, currentUser, navigate]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Request microphone permission
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Audio recording is not supported in this browser');
    }

    return () => {
      // Cleanup recording on unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  const addMessage = (sender, text) => {
    const newMessage = {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Unable to access microphone');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const processAudioInput = async () => {
    if (!audioInput) return;
    
    setProcessingAudio(true);
    
    try {
      const response = await transcribeAudio(audioInput);
      const transcribedText = response.data.text;
      
      // Add user message with transcribed text
      addMessage('user', transcribedText);
      
      if (inQuestionMode) {
        // In structured question mode
        await handleStructuredResponse(transcribedText);
      } else {
        // In free-form chat mode
        await handleChatMessage(transcribedText);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setProcessingAudio(false);
      setAudioInput(null);
    }
  };
  
  const handleStructuredResponse = async (responseText) => {
    try {
      setSendingMessage(true);
      
      // Save the structured response
      const response = await saveResponse({
        sessionId,
        userId: currentUser.userId,
        userName: currentUser.userName,
        questionId: currentQuestion?._id,
        questionText: currentQuestion?.text,
        response: responseText
      });
      
      if (response.data.dotResponse) {
        addMessage('dot', response.data.dotResponse.message);
      }
      
      // Update conversation state
      const newState = response.data.conversationState;
      setConversationState(newState);
      setInQuestionMode(newState.questionMode);
      setQuestionIndex(newState.currentQuestionIndex);
      setChatComplete(!newState.questionMode);
      
      // Update current question if still in question mode
      if (newState.questionMode && session?.questions) {
        setCurrentQuestion(session.questions[newState.currentQuestionIndex]);
      }
      
      // Refresh messages to get any new messages (like next question)
      setTimeout(async () => {
        const historyResponse = await getChatHistory(sessionId, currentUser.userId);
        
        if (historyResponse.data.length > 0) {
          setMessages(historyResponse.data.map(msg => ({
            id: msg._id,
            sender: msg.sender,
            text: msg.message,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error saving structured response:', error);
      setError('Failed to save your response. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleChatMessage = async (messageText) => {
    try {
      // Send the chat message to the server
      const response = await sendChatMessage({
        sessionId,
        userId: currentUser.userId,
        userName: currentUser.userName,
        message: messageText
      });
      
      // Add Dot's response
      addMessage('dot', response.data.message);
      
      // Check for updated conversation state
      if (response.data.conversationState) {
        const newState = response.data.conversationState;
        setConversationState(newState);
        setInQuestionMode(newState.questionMode);
        setQuestionIndex(newState.currentQuestionIndex);
        setChatComplete(!newState.questionMode);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setError('Failed to get a response. Please try again.');
    }
  };
  
  const handleInputSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim() || sendingMessage) return;
    
    const messageText = userInput.trim();
    addMessage('user', messageText);
    setUserInput('');
    setSendingMessage(true);
    
    try {
      if (inQuestionMode) {
        await handleStructuredResponse(messageText);
      } else {
        await handleChatMessage(messageText);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setError('Failed to process your message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Process audio when recording is stopped and audio is available
  useEffect(() => {
    if (audioInput && !isRecording && !processingAudio) {
      processAudioInput();
    }
  }, [audioInput, isRecording, processingAudio]);
  
  // Check for conversation state updates
  useEffect(() => {
    const pollConversationState = async () => {
      if (!currentUser || !sessionId) return;
      
      try {
        const response = await getConversationState(sessionId, currentUser.userId);
        const newState = response.data;
        
        if (newState && 
            (newState.currentQuestionIndex !== conversationState?.currentQuestionIndex ||
             newState.questionMode !== conversationState?.questionMode)) {
          
          setConversationState(newState);
          setInQuestionMode(newState.questionMode);
          setQuestionIndex(newState.currentQuestionIndex);
          setChatComplete(!newState.questionMode);
          
          // Update current question if still in question mode
          if (newState.questionMode && session?.questions) {
            setCurrentQuestion(session.questions[newState.currentQuestionIndex]);
          }
          
          // Refresh messages to get any new messages
          const historyResponse = await getChatHistory(sessionId, currentUser.userId);
          
          if (historyResponse.data.length > 0) {
            setMessages(historyResponse.data.map(msg => ({
              id: msg._id,
              sender: msg.sender,
              text: msg.message,
              timestamp: new Date(msg.timestamp)
            })));
          }
        }
      } catch (error) {
        console.error('Error polling conversation state:', error);
      }
    };
    
    // Poll for updates every 5 seconds
    const intervalId = setInterval(pollConversationState, 5000);
    
    return () => clearInterval(intervalId);
  }, [sessionId, currentUser, conversationState, session]);
  
  if (loading) {
    return (
      <div className="page-container bg-light flex-center">
        <div className="card p-4 text-center">
          <div className="mb-3">
            <div className="spinner"></div>
          </div>
          <p className="body-text">Loading conversation...</p>
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
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container" style={{ padding: 0 }}>
      <header className="chat-header">
        <div className="container">
          <div className="flex-column">
            <h1 className="heading-3 mb-1">Dot AI - {session?.name}</h1>
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="caption-text text-white">
                Session ID: <span className="mono-text">{sessionId}</span>
              </span>
              {inQuestionMode && session?.questions && (
                <span className="badge badge-accent">
                  Question {questionIndex + 1} of {session?.questions?.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <div className="container py-3">
        <div className="chat-container">
          <div 
            ref={chatContainerRef}
            className="chat-messages"
          >
            {messages.map(message => (
              <div key={message.id} className={`message ${message.sender === 'user' ? 'message-user' : 'message-dot'}`}>
                <div className="message-avatar">
                  {message.sender === 'user' 
                    ? currentUser.userName?.charAt(0).toUpperCase() || 'U'
                    : 'D'
                  }
                </div>
                <div className="message-content">
                  {message.text}
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
          
          <div className="chat-input-area">
            <form onSubmit={handleInputSubmit}>
              <div className="flex" style={{ gap: '0.5rem' }}>
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder={isRecording ? "Recording..." : "Type your message..."}
                  className="form-input"
                  disabled={isRecording || processingAudio || sendingMessage}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isRecording || processingAudio || sendingMessage}
                  className="btn btn-primary btn-icon"
                  aria-label="Send message"
                >
                  {sendingMessage ? (
                    <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </div>
            </form>
            
            <div className="flex-center mt-3">
              <div 
                onClick={isRecording ? stopRecording : !processingAudio ? startRecording : undefined}
                className={`voice-recorder ${isRecording ? 'recording' : ''}`}
              >
                {isRecording ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="1"></rect>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                )}
              </div>
              
              {isRecording && (
                <span className="caption-text text-error ml-2">Recording...</span>
              )}
              
              {processingAudio && (
                <span className="caption-text text-accent ml-2">Processing audio...</span>
              )}
            </div>
            
            {inQuestionMode && session?.questions && (
              <div className="mt-3">
                <div style={{ 
                  height: '4px', 
                  background: '#eee', 
                  borderRadius: '2px', 
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(questionIndex + 1) / session?.questions?.length * 100}%`,
                    background: 'var(--accent-blue)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div className="caption-text text-center">
                  Question {questionIndex + 1} of {session?.questions?.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;