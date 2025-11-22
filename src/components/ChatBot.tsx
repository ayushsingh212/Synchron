import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Speech Recognition Setup
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      mic.current = new SpeechRecognition();
      mic.current.continuous = false;
      mic.current.interimResults = false;
      mic.current.lang = "en-US";
    }
  }, []);

  // Load Chat History
  useEffect(() => {
    const saved = localStorage.getItem("sync_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save messages + auto scroll
  useEffect(() => {
    try {
      localStorage.setItem("sync_chat_history", JSON.stringify(messages));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [open]);

  // Clean text
  const sanitizeMessage = useCallback((text) => {
    if (typeof text !== "string") return "";
    return text.replace(/undefined/gi, "").trim();
  }, []);

  // Send user message
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;

    setError("");

    const userMsg = {
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/chatbot/chat`,
        { message: userMsg.text },
        { withCredentials: true }
      );

      setTyping(false);
      typeBotMessage(sanitizeMessage(res.data.reply));
    } catch (err) {
      setTyping(false);
      setError("Failed to send message.");
      typeBotMessage("I'm having trouble responding right now.");
    }
  };

  // FIXED TYPEWRITER — no duplication, no corruption
  const typeBotMessage = useCallback((text) => {
    let i = 0;
    const botMsg = { sender: "bot", text: "", timestamp: Date.now() };

    setMessages((prev) => [...prev, botMsg]);

    const interval = setInterval(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;

        if (!updated[last] || updated[last].sender !== "bot") return updated;

        updated[last] = {
          ...updated[last],
          text: text.slice(0, i + 1), // <-- FIXED (no + text[i])
        };

        return updated;
      });

      i++;
      if (i >= text.length) clearInterval(interval);
    }, 20);
  }, []);

  // Voice input
  const startListening = () => {
    if (!mic.current) return setError("Speech recognition not supported");

    setListening(true);
    mic.current.start();

    mic.current.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };

    mic.current.onerror = () => {
      setError("Speech recognition error");
      setListening(false);
    };
  };

  const stopListening = () => {
    mic.current?.stop();
    setListening(false);
  };

  // Voice output
  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setError("");
    localStorage.removeItem("sync_chat_history");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-110"
      >
        🤖
      </button>

      {/* Chat UI */}
      {open && (
        <div
          className={`fixed bg-white rounded-2xl shadow-2xl flex flex-col border transition-all duration-300 ${
            full
              ? "top-4 right-4 bottom-4 left-4"
              : "bottom-24 right-0 w-80 h-[560px] md:right-6"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <span className="font-semibold block">Synchron Assistant</span>
                <span className="text-blue-100 text-xs">AI-powered support</span>
              </div>
            </div>

            <div className="flex gap-2 text-xl">
              <button onClick={() => setFull((p) => !p)}>
                {full ? "🗕" : "🗖"}
              </button>
              <button onClick={clearChat}>🗑️</button>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.timestamp || index}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Bot avatar */}
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    🤖
                  </div>
                )}

                {/* Message bubble */}
                <div className="max-w-[80%]">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white border border-gray-200 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Time + Speak Button */}
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>

                    {msg.sender === "bot" && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        🔊 Speak
                      </button>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.sender === "user" && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    👤
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t rounded-b-2xl">
            <div className="flex gap-2 items-end">
              {/* Mic Button */}
              <button
                onClick={listening ? stopListening : startListening}
                className={`p-3 rounded-xl ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                🎤
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                className="flex-1 px-4 py-3 border rounded-xl resize-none text-sm"
                rows="1"
                placeholder={listening ? "Listening..." : "Type your message..."}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                style={{ minHeight: "48px", maxHeight: "120px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />

              {/* Send */}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || typing}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl disabled:bg-gray-400"
              >
                Send
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-1">
              Press Enter to send • Shift+Enter for newline
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
