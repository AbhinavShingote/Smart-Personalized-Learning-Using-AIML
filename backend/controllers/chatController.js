// controllers/chatController.js
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { SystemMessage, HumanMessage, AIMessage } = require("@langchain/core/messages");
const prisma = require("../config/db");
const { executeWithKeyRotation, getGeminiKeys } = require("../utils/geminiHelper");

/**
 * Handles incoming chat messages from the AI tutor chatbot using Google Gemini and LangChain.
 * Saves messages to DB to maintain history.
 * POST /api/chat/message
 */
async function handleChatMessage(req, res) {
  const { message, history, courseName, currentTopic } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "message is required." });
  }

  const keys = getGeminiKeys();
  if (keys.length === 0) {
    return res.status(503).json({ success: false, message: "Gemini API key is not configured on backend." });
  }

  try {
    // 1. Save user's message to the database
    await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        sender: "user",
        text: message.trim(),
      },
    });

    // Build the tutor context prompt
    const systemPrompt = `You are a helpful, encouraging AI Study Buddy tutor for the "Smart Personalized Learning" platform.
Your task is to explain concepts clearly, answer student questions, and keep them motivated.

Guidelines:
- Explain things simply (use analogies or brief code snippets if relevant).
- Keep explanations concise, clear, and structured.
- If the student is currently studying a specific course or topic (Course: "${courseName || 'General'}"; Current Topic: "${currentTopic || 'General'}"), customize your response to match.
- Maintain a friendly, supportive tone. Use emojis occasionally (like 🚀, 💡, 🔥) to make learning fun!
- Avoid overly long paragraphs. Use bold headers or bullet points to improve readability.`;

    const messages = [new SystemMessage(systemPrompt)];

    // Populate conversation history
    if (Array.isArray(history)) {
      // Limit history to last 10 messages for token efficiency
      const recentHistory = history.slice(-10);
      recentHistory.forEach(msg => {
        const text = msg.text || msg.content;
        if (!text) return;
        
        if (msg.sender === "user" || msg.role === "user" || msg.role === "human") {
          messages.push(new HumanMessage(text));
        } else {
          messages.push(new AIMessage(text));
        }
      });
    }

    // Add current user message
    messages.push(new HumanMessage(message));

    console.log(`💬 [CHATBOT] Generating response for user question...`);
    
    const reply = await executeWithKeyRotation(async (apiKey) => {
      const model = new ChatGoogleGenerativeAI({
        apiKey,
        model: "gemini-2.5-flash",
        temperature: 0.7,
        maxRetries: 0,
      });
      const response = await model.invoke(messages);
      return response.content;
    });

    // 2. Save bot's reply to the database
    await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        sender: "bot",
        text: reply,
      },
    });

    return res.json({ success: true, reply });

  } catch (err) {
    console.error("❌ [CHATBOT] Error processing tutor chat, falling back to offline reply:", err);
    const reply = getOfflineTutorReply(message, courseName, currentTopic);
    
    // Save offline reply to database
    try {
      await prisma.chatMessage.create({
        data: {
          userId: req.user.id,
          sender: "bot",
          text: reply,
        },
      });
    } catch (dbErr) {
      console.error("❌ Failed to save offline chatbot reply to DB:", dbErr);
    }
    
    return res.json({ success: true, reply, isOffline: true });
  }
}

/**
 * Generates an offline fallback response for the study buddy chatbot based on keywords.
 */
function getOfflineTutorReply(userMessage, courseName, currentTopic) {
  const msg = userMessage.toLowerCase();
  
  let reply = "Hello! 🚀 I'm your offline Study Buddy. It looks like our AI connection is currently experiencing high traffic or limit quotas. \n\n";
  
  if (msg.includes("microservice") || msg.includes("microservices")) {
    reply += `To answer your question about **microservices**:
    
A **Microservices Architecture** is an architectural style that structures an application as a collection of small, autonomous services modeled around a business domain.

Key Concepts:
- **Decentralization**: Each microservice can be developed, deployed, and scaled independently.
- **Single Responsibility**: Each service does one thing well (e.g., payment service, user auth service).
- **Communication**: Services talk to each other via lightweight APIs (usually REST HTTP or message brokers like Kafka).

Common Gotchas:
- Microservices introduce operational complexity (logging, networking, distributed transactions). Only transition when your application becomes too large for a monolith! 💡`;
  } else if (msg.includes("java") || msg.includes("jdk") || msg.includes("jvm")) {
    reply += `Regarding **Java**:
    
Java is a class-based, object-oriented programming language designed to have as few implementation dependencies as possible (Write Once, Run Anywhere - WORA).

Key Concepts:
- **JVM (Java Virtual Machine)**: Executes bytecode.
- **JRE (Java Runtime Environment)**: Includes JVM + libraries to run Java apps.
- **JDK (Java Development Kit)**: Includes compiler + JRE to build and run Java apps. 🚀`;
  } else if (msg.includes("oop") || msg.includes("inheritance") || msg.includes("polymorphism")) {
    reply += `Regarding **OOP**:
    
Object-Oriented Programming (OOP) is a programming paradigm based on the concept of "objects", which contain data and code.

Key Pillars:
- **Encapsulation**: Hiding state and exposing it via methods.
- **Inheritance**: Creating new classes based on existing ones.
- **Polymorphism**: The ability of an object to take many forms.
- **Abstraction**: Hiding complex implementation details. 💡`;
  } else {
    reply += `I'm currently running in **offline study mode** due to AI key rate limits. 

However, you can still:
1. Click the **Book Icon** on your day's topic to read pre-loaded cheat sheets.
2. Complete your **quizzes** to gain XP and climb the **leaderboard**.
3. Re-try asking me about standard topics (e.g., OOP, Java, Microservices) for instant offline guides!`;
  }
  
  reply += "\n\n*(Note: This is an offline tutor fallback because your Gemini API keys have exceeded their daily request quotas).*";
  return reply;
}

/**
 * Fetches the user's conversation history.
 * GET /api/chat/history
 */
async function getChatHistory(req, res) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { timestamp: "asc" },
      take: 50, // Limit to last 50 messages to keep the load light
    });
    return res.json({ success: true, messages });
  } catch (err) {
    console.error("❌ [CHATBOT] Error fetching chat history:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch study chat history."
    });
  }
}

module.exports = { handleChatMessage, getChatHistory };
