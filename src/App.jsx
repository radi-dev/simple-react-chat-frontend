import React, { useState, useEffect, useRef } from "react";
import BotMessage from "./components/botMessage";
import HumanMessage from "./components/humanMessage";

function App() {
  const [messages, setMessages] = useState(() => {
    // Load messages from local storage on initial load
    const savedMessages = localStorage.getItem("messages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState(null);
  const containerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "ws://localhost:8000";
  const SOCKET_URL = API_URL + "/ws";
  const reconnectDelay = 3000; // 3 seconds

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    const socket = new WebSocket(SOCKET_URL);

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      try {
        // Parse the incoming message
        const data = JSON.parse(event.data);
        console.log("data :>> ", data);
        // Check for required fields in the JSON message
        if (data && data.type && data.content) {
          setMessages((prevMessages) => {
            const updatedMessages = [
              ...prevMessages,
              { text: data.content, isUser: false },
            ];
            localStorage.setItem("messages", JSON.stringify(updatedMessages));
            return updatedMessages;
          });
        } else {
          console.warn("Unexpected message format:", data);
        }
      } catch (error) {
        console.error("Failed to parse incoming WebSocket message:", error);
      }
    };

    socket.onclose = (event) => {
      console.warn("WebSocket connection closed", event.reason);
      // Attempt to reconnect after a delay
      setTimeout(() => initializeWebSocket(), reconnectDelay);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
      // Close the socket and attempt reconnection
      socket.close();
    };

    setWs(socket);
  };

  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // useEffect(() => {
  //   let pingInterval;
  //   if (ws) {
  //     pingInterval = setInterval(() => {
  //       if (ws.readyState === WebSocket.OPEN) {
  //         ws.send(JSON.stringify({ type: "ping" }));
  //       }
  //     }, 5000); // Send a ping every 5 seconds
  //   }
  //   return () => {
  //     clearInterval(pingInterval);
  //   };
  // }, [ws]);

  useEffect(() => {
    // Scroll to the bottom when messages change
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (messageInput.trim()) {
      const messageData = {
        type: "user_message",
        content: messageInput,
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => {
        const updatedMessages = [
          ...prevMessages,
          { text: messageInput, isUser: true },
        ];
        localStorage.setItem("messages", JSON.stringify(updatedMessages));
        return updatedMessages;
      });

      // Check WebSocket state and attempt reconnection if necessary
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData)); // Send JSON message to WebSocket server
      } else {
        console.error("WebSocket is not connected. Attempting to reconnect...");
        reconnectWebSocket(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageData));
          } else {
            console.error("Failed to reconnect WebSocket");
          }
        });
      }

      setMessageInput(""); // Clear input field
    }
  };

  // Add reconnection logic
  const reconnectWebSocket = (onReconnect) => {
    if (
      !ws ||
      ws.readyState === WebSocket.CLOSED ||
      ws.readyState === WebSocket.CLOSING
    ) {
      console.log("Reconnecting WebSocket...");
      initializeWebSocket();
      const checkConnectionInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log("WebSocket reconnected");
          clearInterval(checkConnectionInterval);
          if (onReconnect) onReconnect();
        }
      }, 1000); // Check every 1 second
    } else {
      console.log("WebSocket is already reconnecting or connected");
      if (onReconnect) onReconnect();
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
      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col justify-between">
        {/* Chat Header */}
        <div className="flex items-center mb-4">
          <div className="ml-3">
            <p className="text-xl font-medium">April</p>
            {ws && ws.readyState === WebSocket.OPEN ? (
              <p className="text-green-500">Online</p>
            ) : (
              <p className="text-gray-500">Offline</p>
            )}
          </div>
        </div>
        <hr className="py-1" />
        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto flex flex-col p-1 justify-end">
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
