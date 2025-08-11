// frontend/src/components/VoiceRecorder.js
import React from 'react';

const VoiceRecorder = ({ isRecording, processingAudio, startRecording, stopRecording }) => {
  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!processingAudio) {
      startRecording();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={processingAudio}
      className={`voice-recorder ${isRecording ? 'recording' : ''}`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
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
    </button>
  );
};

export default VoiceRecorder;