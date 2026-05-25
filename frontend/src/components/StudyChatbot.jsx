// src/components/StudyChatbot.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, User, Bot, HelpCircle } from "lucide-react";
import { useLearning } from "../contexts/LearningContext";

export default function StudyChatbot() {
  const { currentRoadmap } = useLearning();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hi there! I am your AI Study Buddy. Ask me anything about your custom roadmaps, quizzes, or general learning topics! 🚀",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history from DB on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_URL || "https://smart-personalized-learning-using-aiml-1.onrender.com/api";
        const res = await fetch(`${API_BASE}/chat/history`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
            const formattedHistory = data.messages.map(m => ({
              id: m.id,
              sender: m.sender,
              text: m.text,
              timestamp: new Date(m.timestamp),
            }));
            setMessages(prev => [prev[0], ...formattedHistory]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    fetchHistory();
  }, []);

  // Set active topic context from the active roadmap if available
  useEffect(() => {
    if (currentRoadmap) {
      // Find the first uncompleted topic or just the course name
      setActiveTopic(currentRoadmap.courseName);
    } else {
      setActiveTopic("");
    }
  }, [currentRoadmap]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || "https://smart-personalized-learning-using-aiml-1.onrender.com/api";
      
      // Prepare history to send to backend (excluding welcome message)
      const chatHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          content: m.text,
        }));

      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send JWT cookie
        body: JSON.stringify({
          message: userMessage.text,
          history: chatHistory,
          courseName: currentRoadmap?.courseName || "",
          currentTopic: activeTopic || "",
        }),
      });

      if (!res.ok) {
        throw new Error("Chat service failed to respond.");
      }

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `reply_${Date.now()}`,
            sender: "bot",
            text: data.reply,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.message || "Unsuccessful reply.");
      }
    } catch (err) {
      console.error("Chatbot response error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          sender: "bot",
          text: "⚠️ Oops! Something went wrong on my circuits. Please try asking again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-[0_4px_20px_rgba(59,130,246,0.5)] border border-blue-400/30 hover:scale-105 active:scale-95 transition-transform duration-200"
            aria-label="Open study tutor"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat"
            initial={{ y: 80, scale: 0.9, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 80, scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-[380px] max-w-[calc(100vw-32px)] h-[460px] max-h-[calc(100vh-64px)] rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-900/40 via-indigo-950/20 to-slate-900/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white tracking-wide">
                    Study Buddy AI
                  </h4>
                  <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Gemini Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context bar if course active */}
            {currentRoadmap && (
              <div className="bg-blue-950/30 border-b border-white/[0.06] px-4 py-2 flex items-center gap-2 text-xs text-blue-200">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">
                  Tuning responses for: <strong>{currentRoadmap.courseName}</strong>
                </span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-blue-400 mt-0.5 shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-md ${
                        isUser
                          ? "bg-gradient-to-br from-blue-600 to-sky-600 text-white rounded-tr-none"
                          : "bg-white/[0.04] border border-white/[0.08] text-slate-100 rounded-tl-none"
                      }`}
                    >
                      {/* Markdown support fallback - newline replace */}
                      {msg.text.split("\n").map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600/35 border border-blue-500/30 flex items-center justify-center text-white mt-0.5 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bouncing typing indicators when AI loading */}
              {loading && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-blue-400 mt-0.5 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-none px-4 py-3 shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-slate-900/50 border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your tutor anything..."
                disabled={loading}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[13.5px] text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/50 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md hover:scale-102 active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
