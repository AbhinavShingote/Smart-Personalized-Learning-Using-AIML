// src/components/CheatSheetModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Sparkles, BookOpen } from "lucide-react";

export default function CheatSheetModal({ topic, courseName, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [cheatSheet, setCheatSheet] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    if (isOpen && topic) {
      fetchCheatSheet(controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, topic]);

  const fetchCheatSheet = async (signal) => {
    setLoading(true);
    setError("");
    setCheatSheet("");
    setCopied(false);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/roadmap/cheat-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal,
        body: JSON.stringify({
          courseName,
          topicTitle: topic.title
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate study notes.");
      }

      const data = await res.json();
      if (data.success) {
        setCheatSheet(data.cheatSheet);
      } else {
        throw new Error(data.message || "Failed to generate study notes.");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Cheat sheet fetch aborted.");
        return;
      }
      console.error("Cheat sheet generation error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleCopy = () => {
    if (!cheatSheet) return;
    navigator.clipboard.writeText(cheatSheet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic custom markdown parser to convert markdown into beautiful HTML elements
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    let inList = false;
    let listItems = [];
    const elements = [];

    const flushList = (key) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul_${key}`} className="list-disc pl-6 my-3 space-y-1.5 text-slate-300">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Handle Code Blocks
      if (trimmed.startsWith("```")) {
        flushList(index);
        return; // skip code block boundaries for simple styling
      }

      // Handle Headers
      if (trimmed.startsWith("#")) {
        flushList(index);
        const level = (trimmed.match(/^#+/) || ["#"])[0].length;
        const headerText = trimmed.replace(/^#+\s*/, "");
        const formattedText = parseBoldText(headerText);
        
        if (level === 1) {
          elements.push(<h1 key={index} className="text-2xl font-bold text-white mt-5 mb-3">{formattedText}</h1>);
        } else if (level === 2) {
          elements.push(<h2 key={index} className="text-xl font-bold text-white mt-4 mb-2">{formattedText}</h2>);
        } else {
          elements.push(<h3 key={index} className="text-lg font-semibold text-blue-200 mt-3 mb-2">{formattedText}</h3>);
        }
        return;
      }

      // Handle Lists
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        inList = true;
        const itemText = trimmed.replace(/^[-*]\s*/, "");
        listItems.push(<li key={`li_${index}`}>{parseBoldText(itemText)}</li>);
        return;
      }

      // Handle Empty lines
      if (trimmed === "") {
        flushList(index);
        return;
      }

      // Regular Paragraphs
      if (inList) {
        flushList(index);
      }
      elements.push(<p key={index} className="text-slate-300 text-sm leading-relaxed mb-3">{parseBoldText(trimmed)}</p>);
    });

    flushList("end");
    return elements;
  };

  // Helper to replace **text** with <strong>text</strong> React elements
  const parseBoldText = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-blue-300 font-bold">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl max-h-[85vh] rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Top gradient highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-sky-500" />

            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white truncate max-w-[340px]">
                  Study Notes: {topic ? topic.title : ""}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    <Sparkles className="absolute w-5 h-5 text-blue-300 animate-pulse" />
                  </div>
                  <p className="text-blue-200 text-sm font-medium animate-pulse">
                    AI is writing your cheat sheet...
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <p className="text-red-400 font-semibold mb-4">⚠️ {error}</p>
                  <button
                    onClick={fetchCheatSheet}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && cheatSheet && (
                <div className="prose prose-invert max-w-none">
                  {renderMarkdown(cheatSheet)}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && !error && cheatSheet && (
              <div className="px-6 py-4 border-t border-white/10 bg-slate-950/40 flex justify-end gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 active:scale-98 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Notes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 text-white hover:scale-102 active:scale-98 transition-all shadow-md"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
