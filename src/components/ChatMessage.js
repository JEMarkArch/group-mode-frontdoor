// Enhanced ChatMessage.js with Swiss Style animated border
import React, { useEffect, useRef } from 'react';

const ChatMessage = ({ message, userName }) => {
  const canvasRef = useRef(null);
  const progress = useRef(0);
  
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
    },
    // Additional styles for our canvas animation
    canvasContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
    },
    textContent: {
      position: 'relative',
      zIndex: 1,
    }
  };
 
  const isUser = message.sender === 'user';
  
  useEffect(() => {
    // Only set up canvas for non-user messages
    if (isUser || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    const draw = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Parameters for the grid system
      const moduleSize = Math.min(width, height) / 12;
      const margin = moduleSize / 2;
      
      // Calculate outer frame
      const outerX = margin;
      const outerY = margin;
      const outerWidth = width - (2 * margin);
      const outerHeight = height - (2 * margin);
      
      // Draw subtle grid structure
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.lineWidth = 0.5;
      
      // Draw vertical grid lines
      for (let i = 0; i <= 12; i++) {
        const x = margin + (i * moduleSize);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw horizontal grid lines
      for (let i = 0; i <= 12; i++) {
        const y = margin + (i * moduleSize);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Draw outer border (very subtle)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(outerX, outerY, outerWidth, outerHeight);
      
      // Draw precise corner details (Swiss style)
      const cornerLength = moduleSize * 0.4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 0.75;
      
      // Top-left outer corner
      ctx.beginPath();
      ctx.moveTo(outerX, outerY + cornerLength);
      ctx.lineTo(outerX, outerY);
      ctx.lineTo(outerX + cornerLength, outerY);
      ctx.stroke();
      
      // Top-right outer corner
      ctx.beginPath();
      ctx.moveTo(outerX + outerWidth - cornerLength, outerY);
      ctx.lineTo(outerX + outerWidth, outerY);
      ctx.lineTo(outerX + outerWidth, outerY + cornerLength);
      ctx.stroke();
      
      // Bottom-right outer corner
      ctx.beginPath();
      ctx.moveTo(outerX + outerWidth, outerY + outerHeight - cornerLength);
      ctx.lineTo(outerX + outerWidth, outerY + outerHeight);
      ctx.lineTo(outerX + outerWidth - cornerLength, outerY + outerHeight);
      ctx.stroke();
      
      // Bottom-left outer corner
      ctx.beginPath();
      ctx.moveTo(outerX + cornerLength, outerY + outerHeight);
      ctx.lineTo(outerX, outerY + outerHeight);
      ctx.lineTo(outerX, outerY + outerHeight - cornerLength);
      ctx.stroke();
      
      // Animate dot along border (subtle)
      progress.current = (progress.current + 0.0008) % 1; // Very slow movement
      
      // Calculate dot position along border
      let dotX, dotY;
      const p = progress.current;
      
      if (p < 0.25) {
        // Top edge
        dotX = outerX + (p * 4 * outerWidth);
        dotY = outerY;
      } else if (p < 0.5) {
        // Right edge
        dotX = outerX + outerWidth;
        dotY = outerY + ((p - 0.25) * 4 * outerHeight);
      } else if (p < 0.75) {
        // Bottom edge
        dotX = outerX + outerWidth - ((p - 0.5) * 4 * outerWidth);
        dotY = outerY + outerHeight;
      } else {
        // Left edge
        dotX = outerX;
        dotY = outerY + outerHeight - ((p - 0.75) * 4 * outerHeight);
      }
      
      // Draw the dot
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.arc(dotX, dotY, 1.25, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw minimal dot trail
      const trailLength = 4;
      for (let i = 1; i <= trailLength; i++) {
        const trailProgress = (progress.current - (i * 0.004)) % 1;
        if (trailProgress < 0) continue;
        
        let trailX, trailY;
        
        if (trailProgress < 0.25) {
          trailX = outerX + (trailProgress * 4 * outerWidth);
          trailY = outerY;
        } else if (trailProgress < 0.5) {
          trailX = outerX + outerWidth;
          trailY = outerY + ((trailProgress - 0.25) * 4 * outerHeight);
        } else if (trailProgress < 0.75) {
          trailX = outerX + outerWidth - ((trailProgress - 0.5) * 4 * outerWidth);
          trailY = outerY + outerHeight;
        } else {
          trailX = outerX;
          trailY = outerY + outerHeight - ((trailProgress - 0.75) * 4 * outerHeight);
        }
        
        const opacity = 0.15 * (1 - (i / trailLength));
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.arc(trailX, trailY, 0.75 * (1 - (i / trailLength * 0.5)), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Request next frame
      animationFrameId = requestAnimationFrame(draw);
    };
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start the animation
    draw();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isUser]);
 
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
        {/* Canvas for animated border (only for non-user messages) */}
        {!isUser && (
          <div style={styles.canvasContainer}>
            <canvas 
              ref={canvasRef}
              style={{width: '100%', height: '100%'}}
            />
          </div>
        )}
        
        {/* Message text */}
        <div style={styles.textContent}>
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
    </div>
  );
};

export default ChatMessage;