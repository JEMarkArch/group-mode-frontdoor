// Enhanced ChatMessage.js with modern design
import React from 'react';

const ChatMessage = ({ message, userName }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getInitial = () => {
    if (message.sender === 'user' && userName) {
      return userName.charAt(0).toUpperCase();
    }
    return 'D';
  };
  
  // Inline styles
  const styles = {
    messageContainer: {
      display: 'flex',
      marginBottom: '16px',
      position: 'relative',
    },
    userMessage: {
      flexDirection: 'row-reverse',
    },
    avatar: {
      width: '36px',
      height: '36px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '14px',
      flexShrink: 0,
      margin: '0 12px',
    },
    userAvatar: {
      backgroundColor: '#2083fc',
      color: '#FFFFFF',
    },
    dotAvatar: {
      backgroundColor: '#111111',
      color: '#FFFFFF',
    },
    content: {
      maxWidth: '70%',
      padding: '14px 18px',
      borderRadius: '18px',
      position: 'relative',
      fontSize: '15px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    userContent: {
      backgroundColor: '#E6F2FF',
      color: '#111111',
      borderBottomRightRadius: '4px',
      marginRight: '4px',
    },
    dotContent: {
      backgroundColor: '#F2F2F2',
      color: '#111111',
      borderBottomLeftRadius: '4px',
      marginLeft: '4px',
    },
    timestamp: {
      fontSize: '11px',
      opacity: '0.6',
      marginTop: '6px',
      textAlign: 'right',
    },
    userTimestamp: {
      color: '#555555',
    },
    dotTimestamp: {
      color: '#555555',
    }
  };
  
  const isUser = message.sender === 'user';
  
  return (
    <div 
      style={{
        ...styles.messageContainer,
        ...(isUser ? styles.userMessage : {})
      }}
    >
      <div 
        style={{
          ...styles.avatar,
          ...(isUser ? styles.userAvatar : styles.dotAvatar)
        }}
      >
        {getInitial()}
      </div>
      
      <div 
        style={{
          ...styles.content,
          ...(isUser ? styles.userContent : styles.dotContent)
        }}
      >
        {message.text}
        <div 
          style={{
            ...styles.timestamp,
            ...(isUser ? styles.userTimestamp : styles.dotTimestamp)
          }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;