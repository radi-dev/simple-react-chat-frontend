import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import axios from "axios";
import BotMessage from "./components/botMessage";
import HumanMessage from "./components/humanMessage";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SOCKET_URL = WS_URL + "/ws";
const SOCKET_URL_ADMIN = WS_URL + "/ws/admin";

const Chat = () => {
  const [messages, setMessages] = useState(() => {
    // Load messages from local storage on initial load
    const savedMessages = localStorage.getItem("messages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState(null);
  const containerRef = useRef(null);

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
};

const RecentChats = () => {
  const [chats, setChats] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchChats();
  }, [page]);

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL_ADMIN);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "new_message") {
        fetchChats();
      }
    };
    return () => socket.close();
  }, []);

  const fetchChats = async () => {
    const res = await axios.get(
      `${API_URL}/chats/recent?skip=${page * 10}&limit=10`
    );
    setChats(res.data);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Recent Chats</h1>
      <ul>
        {chats.map((chat) => (
          <li key={chat.customer_phone} className="mb-3 p-2 border rounded">
            <Link
              to={`/chats/${chat.customer_phone}`}
              className="block hover:underline"
            >
              <strong>{chat.customer_phone}</strong>
              <p className="text-gray-500 text-sm">
                {chat.messages.at(-1)?.content}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-4">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
};

const ChatView = () => {
  const { phone } = useParams();
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [page]);

  useEffect(() => {
    const socket = new WebSocket(SOCKET_URL_ADMIN);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "new_message" && data?.customer_phone === phone) {
        fetchMessages();
      }
    };
    return () => socket.close();
  }, [phone]);

  const fetchMessages = async () => {
    const res = await axios.get(
      `${API_URL}/chats/chat/${phone}?skip=${page * 20}&limit=20`
    );
    setMessages(res.data);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Chat with {phone}</h1>
      <div className="space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded ${
              msg.sender_role === "user" ? "bg-blue-100" : "bg-green-100"
            }`}
          >
            <p>{msg.content}</p>
            <span className="text-xs text-gray-500">
              {new Date(msg.created_at).toLocaleString([], {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Chat />} />
      <Route path="/chats" element={<RecentChats />} />
      <Route path="/chats/:phone" element={<ChatView />} />
    </Routes>
  </Router>
);


export default App;
