// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Session APIs
export const createSession = (sessionData) => {
  return api.post('/sessions', sessionData);
};

export const getSession = (sessionId) => {
  return api.get(`/sessions/${sessionId}`);
};

export const getAllSessions = () => {
  return api.get('/sessions');
};

// Response APIs
export const saveResponse = (responseData) => {
  return api.post('/responses', responseData);
};

// Chat APIs
export const sendChatMessage = (messageData) => {
  return api.post('/chat', messageData);
};

export const getChatHistory = (sessionId, userId) => {
  return api.get(`/chat/${sessionId}/${userId}`);
};

// Transcription API
export const transcribeAudio = (audioFile) => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  return api.post('/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Graph Generation API
export const generateGraph = (sessionId) => {
  return api.post('/generate-graph', { sessionId });
};

export default api;