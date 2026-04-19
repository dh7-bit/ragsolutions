import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

function getSessionId() {
  let sessionId = localStorage.getItem("session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);
  }

  return sessionId;
}

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [sessionId, setSessionId] = useState("");

  // 🧠 NEW STATES FOR UI
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setShowHeader(true);
    setSessionId(getSessionId());
    const isDone = localStorage.getItem("upload_done");
  if (isDone === "true") {
    setDone(true);
  }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDone(false);
  };

  // 🚀 SSE + Upload streaming logic
  const handleUpload = async () => {
    if (!file || loading) return;

    setLoading(true);
    setDone(false);
    setProgress(0);
    setStatus("Starting...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("session_id", sessionId);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        const text = decoder.decode(value);

        // split SSE messages
        const lines = text.split("\n\n");

        for (let line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.replace("data: ", ""));

            console.log(data);

            if (data.progress !== undefined) {
              setProgress(data.progress);
            }

            if (data.status) {
              setStatus(data.status);
            }

            if (data.status === "done") {
              toast.success("PDF processed successfully");
              setDone(true);
               localStorage.setItem("upload_done", "true");

              // ⏳ auto close overlay after delay
              setTimeout(() => {
                setLoading(false);
              }, 1200);
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Upload failed");
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      {/* 🔥 FULL SCREEN PROCESSING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
          
          {/* Title */}
          <h1 className="text-white text-xl mb-6 animate-pulse">
            Processing Document...
          </h1>

          {/* Status */}
          <p className="text-green-400 mb-4">{status}</p>

          {/* Progress Bar Container */}
          <div className="w-[80%] max-w-md h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage */}
          <p className="text-white mt-3">{progress}%</p>
        </div>
      )}

      {/* MAIN UI */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        
        {/* Header */}
        <div
          className={`mb-6 transition-all duration-700 ease-out transform ${
            showHeader ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">
            RAG Document Intelligence System
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Upload your document and enable AI-powered Q&A
          </p>
        </div>

        {/* Session */}
        <p className="text-xs text-gray-500 mb-2">
          Session ID: {sessionId}
        </p>

        {/* Upload Box */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-10 text-center">
          
          <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition">
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-gray-600">
              {file ? file.name : "Click to select PDF / Document"}
            </p>
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            Upload
          </button>
          <button
  disabled={!done}
  onClick={() => window.location.href = "/chat"}
  className={`mt-4 w-full py-3 rounded-xl font-semibold transition 
    ${done 
      ? "bg-green-600 hover:bg-green-700 text-white" 
      : "bg-gray-300 text-gray-500 cursor-not-allowed"}
  `}
>
  Open Chatbot
</button>
          {done && !loading && (
            <div className="mt-5 text-green-600 font-semibold">
              Uploaded Successfully ✓
            </div>
          )}
        </div>
      </div>
    </>
  );
}