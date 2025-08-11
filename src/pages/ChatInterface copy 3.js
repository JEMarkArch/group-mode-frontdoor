// Enhanced ChatInterface.js with multi-line input and modern design
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
  const [inputHeight, setInputHeight] = useState(40); // Default height for the textarea
  
  const { sessionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Resize textarea based on content
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height (scrollHeight up to a max of 120px)
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      
      // Set the new height
      textareaRef.current.style.height = `${newHeight}px`;
      setInputHeight(newHeight);
    }
  };
  
  // Handle input change and auto-resize
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    // Use setTimeout to ensure the content has been updated
    setTimeout(autoResizeTextarea, 0);
  };
  
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
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      setInputHeight(40);
    }
    
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
  
  // Handle Enter key to submit, Shift+Enter for new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit(e);
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

  // Styles
  const styles = {
    pageContainer: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F9F9F9',
      position: 'relative',
      padding: 0,
    },
    chatHeader: {
      backgroundColor: '#111111',
      color: '#FFFFFF',
      padding: '16px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      zIndex: 10,
    },
    headerContainer: {
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '0 20px',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '6px',
    },
    headerDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionId: {
      fontSize: '13px',
      opacity: 0.8,
      fontFamily: 'monospace',
    },
    questionBadge: {
      backgroundColor: '#2083FC',
      color: 'white',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
    },
    container: {
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '12px 20px',
      flexGrow: 1,
      display: 'flex',
    },
    chatContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 100px)',
      width: '100%',
      overflow: 'hidden',
    },
    chatMessages: {
      flexGrow: 1,
      overflow: 'auto',
      padding: '20px',
      scrollBehavior: 'smooth',
    },
    chatInputArea: {
      borderTop: '1px solid #EEEEEE',
      padding: '16px 20px',
      backgroundColor: '#FFFFFF',
    },
    inputForm: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '10px',
    },
    textareaWrapper: {
      position: 'relative',
      flex: 1,
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '15px',
      lineHeight: '1.5',
      border: '1px solid #DDDDDD',
      borderRadius: '24px',
      resize: 'none',
      maxHeight: '120px',
      overflowY: 'auto',
      transition: 'border-color 0.2s ease',
      outline: 'none',
    },
    textareaFocused: {
      borderColor: '#2083FC',
      boxShadow: '0 0 0 2px rgba(32, 131, 252, 0.2)',
    },
    sendButton: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      backgroundColor: '#2083FC',
      color: '#FFFFFF',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.2s ease',
      padding: 0,
    },
    sendButtonDisabled: {
      backgroundColor: '#CCCCCC',
      cursor: 'not-allowed',
    },
    voiceControls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '16px',
    },
    voiceButton: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: '2px solid #EEEEEE',
      backgroundColor: '#FFFFFF',
      transition: 'all 0.2s ease',
    },
    recordingButton: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
      color: '#FFFFFF',
      animation: 'pulse 1.5s infinite',
    },
    processingText: {
      fontSize: '13px',
      marginLeft: '10px',
      color: '#666666',
    },
    progressContainer: {
      marginTop: '16px',
    },
    progressBar: {
      height: '4px',
      borderRadius: '2px',
      backgroundColor: '#EEEEEE',
      overflow: 'hidden',
      marginBottom: '8px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#2083FC',
      transition: 'width 0.3s ease',
    },
    progressText: {
      fontSize: '13px',
      textAlign: 'center',
      color: '#666666',
    },
    spinner: {
      width: '18px',
      height: '18px',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderTopColor: '#FFFFFF',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    errorContainer: {
      padding: '20px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '0 auto',
    },
    errorIcon: {
      color: '#ef4444',
      marginBottom: '16px',
    },
    errorTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#ef4444',
      marginBottom: '8px',
    },
    errorText: {
      fontSize: '16px',
      marginBottom: '24px',
    },
    returnButton: {
      padding: '12px 24px',
      backgroundColor: '#111111',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
    },
    loadingSpinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #EEEEEE',
      borderTopColor: '#111111',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px',
    },
    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)',
      },
      '70%': {
        boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)',
      },
      '100%': {
        boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)',
      },
    },
    '@keyframes spin': {
      to: {
        transform: 'rotate(360deg)',
      },
    },
  };
  
  // Render loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={{ fontSize: '16px' }}>Loading conversation...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 style={styles.errorTitle}>Error</h2>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={() => navigate('/')}
            style={styles.returnButton}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.pageContainer}>
      <header style={styles.chatHeader}>
        <div style={styles.headerContainer}>
          <h1 style={styles.headerTitle}>Dot AI - {session?.name}</h1>
          <div style={styles.headerDetails}>
            <span style={styles.sessionId}>
              Session ID: {sessionId}
            </span>
            {inQuestionMode && session?.questions && (
              <span style={styles.questionBadge}>
                Question {questionIndex + 1} of {session?.questions?.length}
              </span>
            )}
          </div>
        </div>
      </header>
      
      <div style={styles.container}>
        <div style={styles.chatContainer}>
          <div 
            ref={chatContainerRef}
            style={styles.chatMessages}
          >
            {messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message}
                userName={currentUser?.userName}
              />
            ))}
            <div ref={messageEndRef} />
          </div>
          
          <div style={styles.chatInputArea}>
            <form onSubmit={handleInputSubmit} style={styles.inputForm}>
              <div style={styles.textareaWrapper}>
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "Recording..." : "Type your message... (Shift+Enter for new line)"}
                  disabled={isRecording || processingAudio || sendingMessage}
                  style={{
                    ...styles.textarea,
                    height: `${inputHeight}px`,
                  }}
                  rows={1}
                />
              </div>
              
              <button
                type="submit"
                disabled={!userInput.trim() || isRecording || processingAudio || sendingMessage}
                style={{
                  ...styles.sendButton,
                  ...(!userInput.trim() || isRecording || processingAudio || sendingMessage ? styles.sendButtonDisabled : {})
                }}
                aria-label="Send message"
              >
                {sendingMessage ? (
                  <div style={styles.spinner}></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </form>
            
            <div style={styles.voiceControls}>
              <div 
                onClick={isRecording ? stopRecording : !processingAudio ? startRecording : undefined}
                style={{
                  ...styles.voiceButton,
                  ...(isRecording ? styles.recordingButton : {})
                }}
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
                <span style={{...styles.processingText, color: '#ef4444'}}>Recording...</span>
              )}
              
              {processingAudio && (
                <span style={{...styles.processingText, color: '#2083FC'}}>Processing audio...</span>
              )}
            </div>
            
            {inQuestionMode && session?.questions && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div style={{ 
                    ...styles.progressFill, 
                    width: `${(questionIndex + 1) / session?.questions?.length * 100}%`
                  }}></div>
                </div>
                <div style={styles.progressText}>
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