// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { z } = require('zod');
const { zodResponseFormat } = require('openai/helpers/zod');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Flag to determine storage method (local or MongoDB)
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';

// Data stores
let localSessions = [];
let localResponses = [];
let localChatMessages = [];
let localConversationStates = []; // Track conversation state for each user

// Connect to MongoDB if needed
let mongoose;
let Session;
let UserResponse;
let ChatMessage;
let ConversationState;

if (!USE_LOCAL_STORAGE) {
  mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

  // Define MongoDB Models
  const SessionSchema = new mongoose.Schema({
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    questions: [{
      text: String,
      order: Number
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  const UserResponseSchema = new mongoose.Schema({
    sessionId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    questionId: String,
    questionText: String,
    response: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  const ChatMessageSchema = new mongoose.Schema({
    sessionId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    userName: String,
    sender: {
      type: String,
      enum: ['user', 'dot'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  });

  // New schema to track conversation state for each user
  const ConversationStateSchema = new mongoose.Schema({
    sessionId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    questionMode: {
      type: Boolean,
      default: true
    },
    completedQuestionIds: [String],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  });

  Session = mongoose.model('Session', SessionSchema);
  UserResponse = mongoose.model('UserResponse', UserResponseSchema);
  ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
  ConversationState = mongoose.model('ConversationState', ConversationStateSchema);
}

// Data access methods (abstract storage details)
const dataStore = {
  // Sessions
  async createSession(sessionData) {
    if (USE_LOCAL_STORAGE) {
      const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newSession = {
        _id: Date.now().toString(),
        sessionId,
        name: sessionData.name,
        questions: sessionData.questions.map((q, index) => ({ text: q, order: index })),
        createdAt: new Date()
      };
      localSessions.push(newSession);
      return newSession;
    } else {
      const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const session = new Session({
        sessionId,
        name: sessionData.name,
        questions: sessionData.questions.map((q, index) => ({ text: q, order: index }))
      });
      return await session.save();
    }
  },

  async getSession(sessionId) {
    if (USE_LOCAL_STORAGE) {
      return localSessions.find(s => s.sessionId === sessionId);
    } else {
      return await Session.findOne({ sessionId });
    }
  },

  async getAllSessions() {
    if (USE_LOCAL_STORAGE) {
      return localSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      return await Session.find().sort({ createdAt: -1 });
    }
  },

  // Responses
  async saveResponse(responseData) {
    if (USE_LOCAL_STORAGE) {
      const newResponse = {
        _id: Date.now().toString(),
        ...responseData,
        createdAt: new Date()
      };
      localResponses.push(newResponse);
      return newResponse;
    } else {
      const userResponse = new UserResponse(responseData);
      return await userResponse.save();
    }
  },

  async getResponsesBySession(sessionId) {
    if (USE_LOCAL_STORAGE) {
      return localResponses.filter(r => r.sessionId === sessionId);
    } else {
      return await UserResponse.find({ sessionId });
    }
  },

  async getResponsesBySessionAndUser(sessionId, userId) {
    if (USE_LOCAL_STORAGE) {
      return localResponses.filter(r => r.sessionId === sessionId && r.userId === userId);
    } else {
      return await UserResponse.find({ sessionId, userId });
    }
  },

  // Chat messages
  async saveChatMessage(messageData) {
    if (USE_LOCAL_STORAGE) {
      const newMessage = {
        _id: Date.now().toString(),
        ...messageData,
        timestamp: new Date()
      };
      localChatMessages.push(newMessage);

      // Limit to last 100 messages per user in the session
      const userSessionMessages = localChatMessages.filter(
        m => m.sessionId === messageData.sessionId && m.userId === messageData.userId
      );

      if (userSessionMessages.length > 100) {
        // Remove oldest messages
        const messagesToRemove = userSessionMessages
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(0, userSessionMessages.length - 100)
          .map(m => m._id);

        localChatMessages = localChatMessages.filter(m => !messagesToRemove.includes(m._id));
      }

      return newMessage;
    } else {
      const chatMessage = new ChatMessage(messageData);
      await chatMessage.save();

      // Limit to last 100 messages per user in the session
      const messageCount = await ChatMessage.countDocuments({
        sessionId: messageData.sessionId,
        userId: messageData.userId
      });

      if (messageCount > 100) {
        // Find and remove oldest messages
        const oldestMessages = await ChatMessage
          .find({ sessionId: messageData.sessionId, userId: messageData.userId })
          .sort({ timestamp: 1 })
          .limit(messageCount - 100);

        if (oldestMessages.length > 0) {
          await ChatMessage.deleteMany({
            _id: { $in: oldestMessages.map(m => m._id) }
          });
        }
      }

      return chatMessage;
    }
  },

  async getChatMessagesBySession(sessionId, userId) {
    if (USE_LOCAL_STORAGE) {
      return localChatMessages
        .filter(m => m.sessionId === sessionId && m.userId === userId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else {
      return await ChatMessage
        .find({ sessionId, userId })
        .sort({ timestamp: 1 });
    }
  },

  // Conversation State
  async getConversationState(sessionId, userId) {
    if (USE_LOCAL_STORAGE) {
      let state = localConversationStates.find(
        s => s.sessionId === sessionId && s.userId === userId
      );

      if (!state) {
        state = {
          sessionId,
          userId,
          currentQuestionIndex: 0,
          questionMode: true,
          completedQuestionIds: [],
          lastUpdated: new Date()
        };
        localConversationStates.push(state);
      }

      return state;
    } else {
      let state = await ConversationState.findOne({ sessionId, userId });

      if (!state) {
        state = new ConversationState({
          sessionId,
          userId,
          currentQuestionIndex: 0,
          questionMode: true,
          completedQuestionIds: [],
        });
        await state.save();
      }

      return state;
    }
  },

  async updateConversationState(sessionId, userId, updates) {
    if (USE_LOCAL_STORAGE) {
      const stateIndex = localConversationStates.findIndex(
        s => s.sessionId === sessionId && s.userId === userId
      );

      if (stateIndex >= 0) {
        localConversationStates[stateIndex] = {
          ...localConversationStates[stateIndex],
          ...updates,
          lastUpdated: new Date()
        };
        return localConversationStates[stateIndex];
      } else {
        const newState = {
          sessionId,
          userId,
          currentQuestionIndex: 0,
          questionMode: true,
          completedQuestionIds: [],
          ...updates,
          lastUpdated: new Date()
        };
        localConversationStates.push(newState);
        return newState;
      }
    } else {
      const state = await ConversationState.findOneAndUpdate(
        { sessionId, userId },
        { ...updates, lastUpdated: new Date() },
        { new: true, upsert: true }
      );
      return state;
    }
  }
};

// Decision AI Schema
const DecisionSchema = z.object({
  decision: z.enum(['continue_conversation', 'move_to_next_question', 'finish_questions']),
  reasoning: z.string(),
  response: z.string(),
  questionComplete: z.boolean(),
});

// OpenAI Chat Functions

// Generate a welcome message
async function generateWelcomeMessage(userName, sessionName) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are Dot, an AI assistant designed to engage users in productive conversations and gather feedback.
          
          Generate a warm, friendly welcome message for a new user in a feedback session.
          Your response should:
          1. Welcome the user by name
          2. Briefly introduce yourself as Dot
          3. Explain that you'll be asking some questions to gather feedback
          4. Be concise (2-3 sentences)
          5. Include an emoji to add a friendly touch`
        },
        {
          role: "user",
          content: `Create a welcome message for user "${userName}" who is joining a session called "${sessionName}".`
        }
      ],
      max_tokens: 150
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating welcome message:', error);
    return `Hello ${userName}! 👋 I'm Dot, your AI assistant for this session. I'll be asking you a few questions to gather your feedback.`;
  }
}

// Rephrase a question from the admin
async function rephraseQuestion(originalQuestion, userName, sessionName, questionNumber, totalQuestions) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are Dot, an AI assistant designed to engage users in productive conversations and gather feedback.
          
          Your task is to rephrase a question from the session administrator to make it more conversational and engaging.
          Your response should:
          1. Maintain the core meaning of the original question
          2. Be conversational in tone
          3. Be friendly and approachable
          4. Be concise (1-2 sentences)
          5. Not include any numbering or "Question X:" prefixes - just ask the question naturally`
        },
        {
          role: "user",
          content: `Rephrase this question: "${originalQuestion}"
          
          Context:
          - User's name: ${userName}
          - Session name: ${sessionName}
          - This is question ${questionNumber} of ${totalQuestions}`
        }
      ],
      max_tokens: 150
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error rephrasing question:', error);
    return originalQuestion;
  }
}

// Process user response and decide next action
async function processUserResponse(userMessage, conversationHistory, currentQuestion, userName, sessionName, questionNumber, totalQuestions) {
  try {
    // Format conversation history
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));
    
    // Create system prompt
    const systemPrompt = `You are Dot, an AI assistant designed to engage users in productive conversations and gather feedback.
    
    You are currently asking the user a series of questions in a feedback session.
    
    Current session: "${sessionName}"
    Current user: ${userName}
    Current question (${questionNumber} of ${totalQuestions}): "${currentQuestion}"
    
    Based on the user's response to the current question, determine:
    1. Whether the user has sufficiently answered the current question
    2. Whether to continue the conversation about this question or move to the next one
    3. What your response should be
    
    Consider:
    - Has the user provided a substantive answer to the current question?
    - Would follow-up questions get more valuable insights?
    - Has the conversation about this question reached a natural conclusion?`;
    
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: userMessage }
      ],
      response_format: zodResponseFormat(DecisionSchema, "decision_analysis"),
    });
    
    return completion.choices[0].message.parsed;
  } catch (error) {
    console.error('Error processing user response:', error);
    // Fallback response
    return {
      decision: 'continue_conversation',
      reasoning: 'Error in processing user response.',
      response: "I'm sorry, I'm having trouble processing that. Could you tell me more about your thoughts on this question?",
      questionComplete: false
    };
  }
}

// Get conversation history with context for ChatGPT
async function getChatContextHistory(sessionId, userId, sessionName) {
  // Get user messages
  const messages = await dataStore.getChatMessagesBySession(sessionId, userId);
  
  // Get user responses to structured questions
  const structuredResponses = await dataStore.getResponsesBySessionAndUser(sessionId, userId);
  
  // Format message history for OpenAI context
  const messageHistory = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.message
  }));
  
  // Add system message at the beginning
  const systemMessage = {
    role: "system",
    content: `You are Dot, an AI assistant designed to engage users in productive conversations and gather feedback.
    
    Session name: "${sessionName}"
    
    Your personality:
    - Friendly and approachable
    - Focused on understanding the user's thoughts
    - Empathetic and thoughtful
    - Concise in your responses (typically 1-3 sentences)
    
    Your goal is to have a natural, flowing conversation while gathering high-quality feedback.
    Ask follow-up questions when appropriate to dig deeper into the user's thoughts.`
  };
  
  return [systemMessage, ...messageHistory];
}

// Chat with OpenAI (Dot AI functionality)
async function getChatResponse(message, sessionId, userId, userName) {
  try {
    // Get session info
    const session = await dataStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Get conversation context
    const conversationContext = await getChatContextHistory(sessionId, userId, session.name);
    
    // Add user's current message
    conversationContext.push({
      role: "user",
      content: message
    });
    
    // Keep only the last 100 messages if context gets too large
    const maxContextSize = 100;
    if (conversationContext.length > maxContextSize) {
      // Keep system message and remove oldest messages
      conversationContext.splice(1, conversationContext.length - maxContextSize);
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: conversationContext,
      max_tokens: 300
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting chat response:', error);
    return "I'm having trouble processing that right now. Could you try again?";
  }
}

// Routes

// Create a new session
app.post('/api/sessions', async (req, res) => {
  try {
    const { name, questions } = req.body;
    const session = await dataStore.createSession({ name, questions });
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Error creating session' });
  }
});

// Get session by ID
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const session = await dataStore.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Error fetching session' });
  }
});

// Get all sessions (for admin)
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await dataStore.getAllSessions();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Error fetching sessions' });
  }
});

// Initialize user session and get first message/question
app.post('/api/sessions/:sessionId/initialize', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, userName } = req.body;
    
    // Get session
    const session = await dataStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check for existing chat history
    const existingMessages = await dataStore.getChatMessagesBySession(sessionId, userId);
    
    // If user already has messages, return existing state
    if (existingMessages.length > 0) {
      const conversationState = await dataStore.getConversationState(sessionId, userId);
      return res.json({
        existing: true,
        messages: existingMessages,
        conversationState
      });
    }
    
    // Generate welcome message
    const welcomeMessage = await generateWelcomeMessage(userName, session.name);
    
    // Save welcome message
    await dataStore.saveChatMessage({
      sessionId,
      userId,
      sender: 'dot',
      message: welcomeMessage
    });
    
    // If there are questions, get the first one
    let firstQuestionMessage = null;
    if (session.questions && session.questions.length > 0) {
      // Rephrase the first question
      const originalQuestion = session.questions[0].text;
      const rephrased = await rephraseQuestion(
        originalQuestion,
        userName,
        session.name,
        1,
        session.questions.length
      );
      
      // Save first question
      firstQuestionMessage = await dataStore.saveChatMessage({
        sessionId,
        userId,
        sender: 'dot',
        message: rephrased
      });
      
      // Initialize conversation state
      await dataStore.updateConversationState(sessionId, userId, {
        currentQuestionIndex: 0,
        questionMode: true,
        completedQuestionIds: []
      });
    } else {
      // No questions, go straight to chat mode
      await dataStore.updateConversationState(sessionId, userId, {
        questionMode: false
      });
    }
    
    // Get updated messages
    const messages = await dataStore.getChatMessagesBySession(sessionId, userId);
    const conversationState = await dataStore.getConversationState(sessionId, userId);
    
    res.json({
      existing: false,
      messages,
      conversationState
    });
  } catch (error) {
    console.error('Error initializing session:', error);
    res.status(500).json({ error: 'Error initializing session' });
  }
});

// Add user response (for structured questions)
app.post('/api/responses', async (req, res) => {
  try {
    const { sessionId, userId, userName, questionId, questionText, response } = req.body;
    
    // Get session
    const session = await dataStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get conversation state
    const conversationState = await dataStore.getConversationState(sessionId, userId);
    
    // Get chat history
    const chatHistory = await dataStore.getChatMessagesBySession(sessionId, userId);
    
    // Save user response
    await dataStore.saveResponse({
      sessionId,
      userId,
      userName,
      questionId,
      questionText,
      response
    });
    
    // Save user message
    await dataStore.saveChatMessage({
      sessionId,
      userId,
      userName,
      sender: 'user',
      message: response
    });
    
    // Process the response
    const currentQuestion = session.questions[conversationState.currentQuestionIndex].text;
    const currentQuestionNumber = conversationState.currentQuestionIndex + 1;
    
    const decision = await processUserResponse(
      response,
      chatHistory,
      currentQuestion,
      userName,
      session.name,
      currentQuestionNumber,
      session.questions.length
    );
    
    // Save Dot's response
    const dotResponse = await dataStore.saveChatMessage({
      sessionId,
      userId,
      sender: 'dot',
      message: decision.response
    });
    
    let nextQuestionMessage = null;
    
    // Handle decision
    if (decision.decision === 'move_to_next_question' || decision.decision === 'finish_questions') {
      // Mark current question as completed
      let completedQuestionIds = [...conversationState.completedQuestionIds];
      if (questionId && !completedQuestionIds.includes(questionId)) {
        completedQuestionIds.push(questionId);
      }
      
      // Move to next question if available
      if (decision.decision === 'move_to_next_question' && 
          conversationState.currentQuestionIndex < session.questions.length - 1) {
        // Move to next question
        const nextIndex = conversationState.currentQuestionIndex + 1;
        const nextQuestion = session.questions[nextIndex];
        
        // Rephrase next question
        const rephrased = await rephraseQuestion(
          nextQuestion.text,
          userName,
          session.name,
          nextIndex + 1,
          session.questions.length
        );
        
        // Add a small delay before asking next question
        setTimeout(async () => {
          // Save next question message
          await dataStore.saveChatMessage({
            sessionId,
            userId,
            sender: 'dot',
            message: rephrased
          });
        }, 1500);
        
        // Update conversation state
        await dataStore.updateConversationState(sessionId, userId, {
          currentQuestionIndex: nextIndex,
          completedQuestionIds
        });
      } else if (decision.decision === 'finish_questions' || 
                 conversationState.currentQuestionIndex >= session.questions.length - 1) {
        // All questions completed
        setTimeout(async () => {
          // Send completion message
          const completionMessage = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
              {
                role: "system",
                content: `Create a message thanking the user for completing all the questions and inviting them to continue chatting freely.
                Keep it friendly, brief (2-3 sentences), and encouraging.`
              }
            ],
            max_tokens: 150
          });
          
          // Save completion message
          await dataStore.saveChatMessage({
            sessionId,
            userId,
            sender: 'dot',
            message: completionMessage.choices[0].message.content
          });
        }, 1500);
        
        // Update conversation state
        await dataStore.updateConversationState(sessionId, userId, {
          questionMode: false,
          completedQuestionIds
        });
      }
    }
    
    // Get updated conversation state
    const updatedState = await dataStore.getConversationState(sessionId, userId);
    
    res.status(201).json({
      userResponse: { response },
      dotResponse,
      conversationState: updatedState
    });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Error saving response' });
  }
});

// Chat message API (for free-form chatting)
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, userId, userName, message } = req.body;
    
    // Save user message
    await dataStore.saveChatMessage({
      sessionId,
      userId,
      userName,
      sender: 'user',
      message
    });
    
    // Get session info for context
    const session = await dataStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get conversation state
    const conversationState = await dataStore.getConversationState(sessionId, userId);
    
    // If in question mode, process as a response
    if (conversationState.questionMode) {
      // Get current question
      const currentQuestion = session.questions[conversationState.currentQuestionIndex];
      
      // Process as a response to structured question
      return await processStructuredQuestionResponse(
        req,
        res,
        sessionId,
        userId,
        userName,
        currentQuestion._id,
        currentQuestion.text,
        message
      );
    }
    
    // Get Dot's response for free-form chat
    const dotResponse = await getChatResponse(message, sessionId, userId, userName);
    
    // Save Dot's response
    const savedResponse = await dataStore.saveChatMessage({
      sessionId,
      userId,
      sender: 'dot',
      message: dotResponse
    });
    
    res.status(201).json(savedResponse);
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Error processing chat message' });
  }
});

// Helper function to process structured question responses
async function processStructuredQuestionResponse(req, res, sessionId, userId, userName, questionId, questionText, response) {
  try {
    // Save as structured response
    await dataStore.saveResponse({
      sessionId,
      userId,
      userName,
      questionId,
      questionText,
      response
    });
    
    // Get session
    const session = await dataStore.getSession(sessionId);
    
    // Get conversation state
    const conversationState = await dataStore.getConversationState(sessionId, userId);
    
    // Get chat history
    const chatHistory = await dataStore.getChatMessagesBySession(sessionId, userId);
    
    // Process the response
    const currentQuestion = session.questions[conversationState.currentQuestionIndex].text;
    const currentQuestionNumber = conversationState.currentQuestionIndex + 1;
    
    const decision = await processUserResponse(
      response,
      chatHistory,
      currentQuestion,
      userName,
      session.name,
      currentQuestionNumber,
      session.questions.length
    );
    
    // Save Dot's response
    const dotResponse = await dataStore.saveChatMessage({
      sessionId,
      userId,
      sender: 'dot',
      message: decision.response
    });
    
    // Handle decision
    if (decision.decision === 'move_to_next_question' || decision.decision === 'finish_questions') {
      // Mark current question as completed
      let completedQuestionIds = [...conversationState.completedQuestionIds];
      if (questionId && !completedQuestionIds.includes(questionId)) {
        completedQuestionIds.push(questionId);
      }
      
      // Move to next question if available
      if (decision.decision === 'move_to_next_question' && 
          conversationState.currentQuestionIndex < session.questions.length - 1) {
        // Move to next question
        const nextIndex = conversationState.currentQuestionIndex + 1;
        const nextQuestion = session.questions[nextIndex];
        
        // Rephrase next question
        const rephrased = await rephraseQuestion(
          nextQuestion.text,
          userName,
          session.name,
          nextIndex + 1,
          session.questions.length
        );
        
        // Add a small delay before asking next question
        setTimeout(async () => {
          // Save next question message
          await dataStore.saveChatMessage({
            sessionId,
            userId,
            sender: 'dot',
            message: rephrased
          });
        }, 1500);
        
        // Update conversation state
        await dataStore.updateConversationState(sessionId, userId, {
          currentQuestionIndex: nextIndex,
          completedQuestionIds
        });
      } else if (decision.decision === 'finish_questions' || 
                 conversationState.currentQuestionIndex >= session.questions.length - 1) {
        // All questions completed
        setTimeout(async () => {
          // Send completion message
          const completionMessage = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
              {
                role: "system",
                content: `Create a message thanking the user for completing all the questions and inviting them to continue chatting freely.
                Keep it friendly, brief (2-3 sentences), and encouraging.`
              }
            ],
            max_tokens: 150
          });
          
          // Save completion message
          await dataStore.saveChatMessage({
            sessionId,
            userId,
            sender: 'dot',
            message: completionMessage.choices[0].message.content
          });
        }, 1500);
        
        // Update conversation state
        await dataStore.updateConversationState(sessionId, userId, {
          questionMode: false,
          completedQuestionIds
        });
      }
    }
    
    // Get updated conversation state
    const updatedState = await dataStore.getConversationState(sessionId, userId);
    
    res.status(201).json({
      message: dotResponse.message,
      conversationState: updatedState
    });
  } catch (error) {
    console.error('Error processing structured question response:', error);
    res.status(500).json({ error: 'Error processing response' });
  }
}

// Get chat history for a user in a session
app.get('/api/chat/:sessionId/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const messages = await dataStore.getChatMessagesBySession(sessionId, userId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Error fetching chat messages' });
  }
});

// Transcribe audio
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    const audioPath = req.file.path;
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });
    
    // Delete the file after transcription
    fs.unlinkSync(audioPath);
    
    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Error transcribing audio' });
  }
});

// Get conversation state
app.get('/api/conversation-state/:sessionId/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const state = await dataStore.getConversationState(sessionId, userId);
    res.json(state);
  } catch (error) {
    console.error('Error fetching conversation state:', error);
    res.status(500).json({ error: 'Error fetching conversation state' });
  }
});

// Generate graph from responses
app.post('/api/generate-graph', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Get all responses for this session
    const responses = await dataStore.getResponsesBySession(sessionId);
    
    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this session' });
    }
    
    // Get chat messages for this session
    const allChatMessages = await Promise.all(
      // Get unique user IDs
      [...new Set(responses.map(r => r.userId))].map(userId => 
        dataStore.getChatMessagesBySession(sessionId, userId)
      )
    );
    
    // Flatten chat messages
    const chatMessages = allChatMessages.flat();
    
    // Format responses for OpenAI
    const responsesText = responses.map(r => `User ${r.userName}: Question: "${r.questionText}" Response: "${r.response}"`).join('\n\n');
    
    // Format chat messages
    const chatText = chatMessages
      .filter(m => m.sender === 'user')
      .map(m => `User ${m.userName || m.userId}: "${m.message}"`)
      .join('\n\n');
    
    // Combine all text
    const fullText = `STRUCTURED RESPONSES:\n${responsesText}\n\nCHAT MESSAGES:\n${chatText}`;
    
    // Create the structured outputs with OpenAI
    // Enhanced Graph schema based on the math reasoning example
    const IdeaNode = z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['idea']),
      category: z.string(),
      importance: z.number(),
      details: z.string()
    });
    
    const ThemeNode = z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['theme']),
      relevance: z.number(),
      summary: z.string()
    });
    
    const UserNode = z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['user']),
      contribution: z.number()
    });
    
    const NodeUnion = z.discriminatedUnion('type', [
      IdeaNode,
      ThemeNode,
      UserNode
    ]);
    
    const Edge = z.object({
      id: z.string(),
      from: z.string(),
      to: z.string(),
      relation: z.string(),
      strength: z.number()
    });
    
    const GraphAnalysis = z.object({
      nodes: z.array(NodeUnion),
      edges: z.array(Edge),
      summary: z.object({
        mainThemes: z.array(z.string()),
        keyInsights: z.array(z.string()),
        potentialActions: z.array(z.string())
      })
    });
    
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        { 
          role: "system", 
          content: `Analyze user responses and conversations to create a comprehensive graph network of ideas.
          
          Your task is to:
          1. Extract key ideas from user responses and conversations
          2. Identify themes that connect multiple ideas
          3. Connect users to their contributed ideas
          4. Link related ideas and themes with appropriate relationships
          5. Provide a summary of main themes, key insights, and potential actions
          
          For each idea node:
          - Assign a descriptive label
          - Categorize it appropriately
          - Rate its importance (1-10)
          - Provide details that explain the idea
          
          For each theme node:
          - Create a clear label that captures the theme
          - Rate its relevance to the overall discussion (1-10)
          - Write a summary explaining what this theme encompasses
          
          For user nodes:
          - Use the username as the label
          - Rate their contribution level to the discussion (1-10)
          
          For edges (connections):
          - Create a unique ID
          - Identify the source and target nodes
          - Describe the relation between nodes
          - Rate the strength of the connection (1-10)
          
          In the summary section:
          - List 3-5 main themes from the discussion
          - Provide 3-7 key insights derived from the analysis
          - Suggest 2-4 potential actions based on the feedback`
        },
        { 
          role: "user", 
          content: `Here are the user responses and chat messages from session ${sessionId}:\n\n${fullText}\n\nCreate a comprehensive graph network of ideas from this data.` 
        },
      ],
      response_format: zodResponseFormat(GraphAnalysis, "graph_analysis"),
    });
    
    const graphData = completion.choices[0].message.parsed;
    res.json(graphData);
  } catch (error) {
    console.error('Error generating graph:', error);
    res.status(500).json({ 
      error: 'Error generating graph', 
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using ${USE_LOCAL_STORAGE ? 'local storage' : 'MongoDB'} for data storage`);
});