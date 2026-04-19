import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Upload from "./upload"
import Chat from "./chat"; // your chatbot file
import './input.css'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;