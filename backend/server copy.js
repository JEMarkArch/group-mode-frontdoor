// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

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

// Connect to MongoDB if needed
let mongoose;
let Session;
let UserResponse;
let ChatMessage;

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

  Session = mongoose.model('Session', SessionSchema);
  UserResponse = mongoose.model('UserResponse', UserResponseSchema);
  ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
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

  // Chat messages
  async saveChatMessage(messageData) {
    if (USE_LOCAL_STORAGE) {
      const newMessage = {
        _id: Date.now().toString(),
        ...messageData,
        timestamp: new Date()
      };
      localChatMessages.push(newMessage);
      return newMessage;
    } else {
      const chatMessage = new ChatMessage(messageData);
      return await chatMessage.save();
    }
  },

  async getChatMessagesBySession(sessionId, userId) {
    if (USE_LOCAL_STORAGE) {
      return localChatMessages.filter(
        m => m.sessionId === sessionId && (m.userId === userId || m.sender === 'dot')
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else {
      return await ChatMessage.find({
        sessionId,
        $or: [{ userId }, { sender: 'dot' }]
      }).sort({ timestamp: 1 });
    }
  }
};

// Chat with OpenAI (Dot AI functionality)
async function getChatResponse(message, sessionContext) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `You are Dot, an AI assistant designed to engage users in productive conversations and gather feedback.
          
          Your name is Dot. You are friendly, empathetic, and focused on understanding the user's thoughts and ideas.
          
          Context about the current session:
          Session name: ${sessionContext.name}
          This session is focused on: ${sessionContext.name}
          
          You should help users elaborate on their answers and encourage thoughtful responses. 
          Ask follow-up questions to help users develop their ideas further.
          
          Keep responses concise and conversational, under 3 sentences when possible.`
        },
        {
          role: "user", 
          content: message
        }
      ],
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

// Add user response (for structured questions)
app.post('/api/responses', async (req, res) => {
  try {
    const { sessionId, userId, userName, questionId, questionText, response } = req.body;
    
    const userResponse = await dataStore.saveResponse({
      sessionId,
      userId,
      userName,
      questionId,
      questionText,
      response
    });
    
    res.status(201).json(userResponse);
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
    
    // Get Dot's response
    const dotResponse = await getChatResponse(message, session);
    
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
      responses.map(r => dataStore.getChatMessagesBySession(sessionId, r.userId))
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
    const z = require('zod');
    const { zodResponseFormat } = require('openai/helpers/zod');
    
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