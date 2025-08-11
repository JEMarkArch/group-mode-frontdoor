// frontend/src/components/ChatMessage.js
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

  return (
    <div className={`message ${message.sender === 'user' ? 'message-user' : 'message-dot'}`}>
      <div className="message-avatar">
        {getInitial()}
      </div>
      <div className="message-content">
        {message.text}
        <div className="message-time">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;