import React, { useState, useEffect, useRef } from "react";
import BotMessage from "./components/botMessage";
import HumanMessage from "./components/humanMessage";

function App() {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState(null);
  const containerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "ws://localhost:8000";
  const SOCKET_URL = API_URL + "/ws";
  // Initialize WebSocket connection when the component mounts
  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL);
    setWs(socket);

    socket.onmessage = (event) => {
      // Handle incoming messages
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: event.data, isUser: false },
      ]);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      // setWs(null);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
      // setWs(null);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message via WebSocket
  const sendMessage = () => {
    if (messageInput.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: messageInput, isUser: true },
      ]);
      ws.send(messageInput); // Send message to WebSocket server
      setMessageInput(""); // Clear input field
    }
  };

  // Handle Enter key for sending message
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col justify-center p-2">
      {/* <!-- Chat Container --> */}
      <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col justify-between">
        {/* <!-- Chat Header --> */}
        <div className="flex items-center mb-4">
          <div className="ml-3">
            <p className="text-xl font-medium">April</p>
            {ws ? (
              <p className="text-green-500">Online</p>
            ) : (
              <p className="text-gray-500">Offline</p>
            )}
          </div>
        </div>
        <hr className="py-1" />
        {/* <!-- Chat Messages --> */}
        <div className=" flex-grow overflow-y-auto flex flex-col p-1 justify-end">
          <div
            ref={containerRef}
            className="space-y-4 p-2 rounded-lg overflow-y-auto"
          >
            {messages.map((message, index) =>
              message.isUser ? (
                <HumanMessage key={index} text={message.text} />
              ) : (
                <BotMessage key={index} text={message.text} />
              )
            )}
          </div>
          <div className="mt-4 flex items-center">
            <textarea
              id="messageInput"
              rows="1"
              placeholder="Type your message..."
              className="flex-1 py-2 px-3 rounded-full bg-gray-50 w-full p-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
            ></textarea>
            <button
              id="sendBtn"
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded-full ml-3 hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
