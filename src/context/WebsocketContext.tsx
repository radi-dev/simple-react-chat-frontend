import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type WSMessage = {
  customer_phone: string,
  sender_role: "user" | "bot" | "agent",
  content: string,
  created_at: string,
};

type WSContextType = {
  socket: WebSocket | null,
  latestMessage: WSMessage | null,
};

const WebSocketContext =
  createContext < WSContextType > { socket: null, latestMessage: null };

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode,
}) => {
  const [latestMessage, setLatestMessage] =
    (useState < WSMessage) | (null > null);
  const socketRef = (useRef < WebSocket) | (null > null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/admin");
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLatestMessage(message);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    socket.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ socket: socketRef.current, latestMessage }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
