import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import {
  FiMessageSquare,
  FiMic,
  FiSend,
  FiTrash2,
  FiMaximize,
  FiMinimize,
  FiX,
  FiVolume2,
} from "react-icons/fi";

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

  const SpeechRecognition =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const mic = useRef(null);
  const lastSentRef = useRef(0);
  const queue = useRef([]);
  const processing = useRef(false);

  useEffect(() => {
    if (SpeechRecognition) {
      mic.current = new SpeechRecognition();
      mic.current.continuous = false;
      mic.current.interimResults = false;
      mic.current.lang = "en-US";
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sync_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sync_chat_history", JSON.stringify(messages));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 250);
    }
  }, [open]);

  const sanitizeMessage = useCallback((text) => {
    if (typeof text !== "string") return "";
    return text.replace(/undefined/gi, "").trim();
  }, []);

  const fetchWithRetry = async (fn, retries = 3) => {
    try {
      return await fn();
    } catch (err) {
      const status = err?.response?.status;
      if (retries > 0 && (status === 429 || !err.response)) {
        const delay = Math.pow(2, 4 - retries) * 300;
        await new Promise((r) => setTimeout(r, delay));
        return fetchWithRetry(fn, retries - 1);
      }
      throw err;
    }
  };

  const enqueue = (task) => {
    queue.current.push(task);
    processQueue();
  };

  const processQueue = async () => {
    if (processing.current || queue.current.length === 0) return;
    processing.current = true;
    const job = queue.current.shift();
    try {
      await job();
    } catch {}
    processing.current = false;
    setTimeout(processQueue, 400);
  };

  const sendToServer = async (text) => {
    const res = await fetchWithRetry(
      () =>
        axios.post(
          `${API_BASE_URL}/chatbot/chat`,
          { message: text },
          { withCredentials: true, timeout: 45000 }
        ),
      3
    );
    return res;
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;
    const now = Date.now();
    if (now - lastSentRef.current < 1200) {
      setError("You're sending messages too quickly. Please wait a moment.");
      setTimeout(() => setError(""), 2000);
      return;
    }
    lastSentRef.current = now;
    setError("");
    const userMsg = {
      id: `${Date.now()}-u`,
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    enqueue(async () => {
      try {
        const res = await sendToServer(userMsg.text);
        const reply = sanitizeMessage(res.data?.reply || res.data?.data?.reply || "");
        setTyping(false);
        if (!reply) {
          setError("No response from assistant.");
          typeBotMessage("I'm having trouble responding right now.");
          return;
        }
        typeBotMessage(reply);
      } catch (err) {
        setTyping(false);
        if (err?.response?.status === 429) {
          setError("Service is busy. Please try again shortly.");
          typeBotMessage("I'm currently busy. Please try again in a moment.");
        } else {
          setError("Failed to send message.");
          typeBotMessage("I'm having trouble responding right now.");
        }
      }
    });
  };

  const typeBotMessage = useCallback((text) => {
    if (typeof text !== "string" || text.trim() === "") {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-b`, sender: "bot", text: "No response.", timestamp: Date.now() },
      ]);
      return;
    }

    const botId = `${Date.now()}-b`;
    setMessages((prev) => [...prev, { id: botId, sender: "bot", text: "", timestamp: Date.now() }]);

    let i = 0;
    const interval = setInterval(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((m) => m.id === botId);
        if (idx === -1) return updated;
        updated[idx] = { ...updated[idx], text: text.slice(0, i + 1) };
        return updated;
      });
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 18);
  }, []);

  const startListening = () => {
    if (!mic.current) return setError("Speech recognition not supported");
    setListening(true);
    setError("");
    mic.current.start();
    mic.current.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
      mic.current.stop();
      setTimeout(() => inputRef.current?.focus(), 200);
    };
    mic.current.onerror = () => {
      setError("Speech recognition error");
      setListening(false);
      try {
        mic.current.stop();
      } catch {}
    };
  };

  const stopListening = () => {
    try {
      mic.current?.stop();
    } catch {}
    setListening(false);
  };

  const speakText = (text) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

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
    new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={() => setOpen((p) => !p)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
        aria-label="Toggle chat"
      >
        <FiMessageSquare size={20} />
      </button>

      {open && (
        <div
          className={`fixed bg-white rounded-2xl shadow-2xl flex flex-col border transition-all duration-300 ${
            full
              ? "top-4 right-4 bottom-4 left-4"
              : "bottom-24 right-0 w-80 h-[560px] md:right-6"
          }`}
        >
          <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <FiMessageSquare size={22} />
              <div>
                <span className="font-semibold block">SchedulifyAi Assistant</span>
                <span className="text-blue-100 text-xs">AI-powered support</span>
              </div>
            </div>

            <div className="flex gap-2 text-xl">
              <button
                onClick={() => setFull((p) => !p)}
                className="p-2 rounded-md hover:bg-blue-500/20 transition"
                aria-label="Toggle fullscreen"
              >
                {full ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
              </button>
              <button onClick={clearChat} className="p-2 rounded-md hover:bg-blue-500/20 transition" aria-label="Clear chat">
                <FiTrash2 size={16} />
              </button>
              <button onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-blue-500/20 transition" aria-label="Close chat">
                <FiX size={16} />
              </button>
            </div>
          </div>

          {error && <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">⚠️ {error}</div>}

          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id || msg.timestamp || index}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                    <FiMessageSquare />
                  </div>
                )}

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

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    {msg.sender === "bot" && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        aria-label="Speak message"
                      >
                        <FiVolume2 /> Speak
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" fill="currentColor" />
                      <path d="M4 20v-1c0-1.66 3.58-3 8-3s8 1.34 8 3v1H4z" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                  <FiMessageSquare />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t rounded-b-2xl">
            <div className="flex gap-2 items-end">
              <button
                onClick={listening ? stopListening : startListening}
                className={`p-3 rounded-xl ${listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                aria-label="Toggle microphone"
              >
                <FiMic />
              </button>

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
                aria-label="Chat input"
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || typing}
                className="bg-blue-600 text-white px-4 py-3 rounded-xl disabled:bg-gray-400 flex items-center gap-2"
                aria-label="Send message"
              >
                <FiSend />
                <span className="text-sm">Send</span>
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-1">Press Enter to send • Shift+Enter for newline</p>
          </div>
        </div>
      )}
    </div>
  );
}
