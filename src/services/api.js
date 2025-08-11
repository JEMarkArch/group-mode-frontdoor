// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Session APIs
export const createSession = (sessionData) => {
  return apiClient.post('/sessions', sessionData);
};

export const getSession = (sessionId) => {
  return apiClient.get(`/sessions/${sessionId}`);
};

export const getAllSessions = () => {
  return apiClient.get('/sessions');
};

// Initialize session and get first message/question
export const initializeSession = (sessionId, userData) => {
  return apiClient.post(`/sessions/${sessionId}/initialize`, userData);
};

// Response APIs
export const saveResponse = (responseData) => {
  return apiClient.post('/responses', responseData);
};

// Chat APIs
export const sendChatMessage = (messageData) => {
  return apiClient.post('/chat', messageData);
};

export const getChatHistory = (sessionId, userId) => {
  return apiClient.get(`/chat/${sessionId}/${userId}`);
};

export const getConversationState = (sessionId, userId) => {
  return apiClient.get(`/conversation-state/${sessionId}/${userId}`);
};

// Audio transcription
export const transcribeAudio = (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  return axios.post(`${API_URL}/transcribe`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Graph generation
export const generateGraph = (sessionId) => {
  return apiClient.post('/generate-graph', { sessionId });
};