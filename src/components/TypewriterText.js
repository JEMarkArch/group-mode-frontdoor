// TypewriterText.js - Component for animated typing effect
import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ text, onComplete, speed = 30, initialDelay = 300 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);
  
  // Animation logic
  useEffect(() => {
    // Start with empty text
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Initial delay before starting animation
    const startTyping = () => {
      // Function to add next character
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          // Add next character
          setDisplayedText(text.substring(0, currentIndex + 1));
          setCurrentIndex(prevIndex => prevIndex + 1);
        } else {
          // Animation complete
          setIsComplete(true);
          if (onComplete) onComplete();
        }
      };
      
      // Set dynamic typing speed based on punctuation
      let typingSpeed = speed;
      if (currentIndex < text.length) {
        const currentChar = text[currentIndex];
        // Pause longer at sentence breaks
        if (currentChar === '.' || currentChar === '?' || currentChar === '!') {
          typingSpeed = speed * 6;
        } 
        // Pause briefly at commas and semicolons
        else if (currentChar === ',' || currentChar === ';') {
          typingSpeed = speed * 3;
        }
      }
      
      // Schedule next character or complete
      if (currentIndex < text.length) {
        timeoutRef.current = setTimeout(typeNextChar, typingSpeed);
      } else {
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    };
    
    // Start typing after initial delay
    timeoutRef.current = setTimeout(startTyping, initialDelay);
    
    // Cleanup timeouts on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, currentIndex, speed, initialDelay, onComplete]);
  
  // Fast-forward animation on click
  const handleClick = () => {
    if (!isComplete) {
      // Clear animation timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Show full text immediately
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  };
  
  return (
    <div 
      style={{
        display: 'inline',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        cursor: isComplete ? 'default' : 'pointer',
      }}
      onClick={handleClick}
      title={!isComplete ? "Click to complete animation" : ""}
    >
      {displayedText}
      {!isComplete && (
        <span 
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            backgroundColor: '#333',
            verticalAlign: 'text-bottom',
            marginLeft: '2px',
            animation: 'blink 1s step-end infinite',
          }}
        ></span>
      )}
    </div>
  );
};

export default TypewriterText;