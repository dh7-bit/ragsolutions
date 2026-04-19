import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const sessionId = localStorage.getItem("session_id");

  // 🔽 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔽 Send message
  const sendMessage = async () => {
    if (!query.trim() || loading) return;

    const userMessage = { type: "user", text: query };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          session_id: sessionId,
        }),
      });

      const data = await res.json();

      const botMessage = {
        type: "bot",
        text: data.answer || "No response",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Error fetching response" },
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* 🔷 Header with Back Button */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between shadow">
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm"
        >
          ← Back
        </button>

        <h1 className="font-semibold text-lg">AI PDF Chatbot</h1>

        {/* Empty div for spacing symmetry */}
        <div className="w-12"></div>
      </div>

      {/* 🔷 Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            Ask questions about your uploaded document 📄
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl shadow text-sm ${
                msg.type === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* 🔄 Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl shadow text-gray-500 text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 🔷 Input */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask something..."
          className="flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}