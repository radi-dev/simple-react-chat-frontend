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
    const [chatData, setChatData] = useState("chat")
    const containerRef = useRef(null);

    const reconnectDelay = 3000; // 3 seconds

    console.log('chatData :>> ', chatData);

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

    return (<div className="flex flex-col-reverse lg:flex-row items-top"><div className=" flex lg:hidden items-center "><a href="/chats"><div className="bg-green-300 border-2 border-green-600 p-4 rounded-md m-3">View Chats</div></a></div><div className="hidden lg:flex flex-col items-center "><button className="bg-green-300 border-2 border-green-600 w-1/2 rounded-md m-3" onClick={() => setChatData("chat")}>Chat with bot</button><RecentChats isDesktop={true} setChatData={setChatData} /></div>
        {chatData === "chat" ? <div className="max-w-lg w-full mx-auto h-screen flex flex-col justify-center p-2">
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
        </div> : <ChatView phone_no={chatData} />}</div>
    );
};

const RecentChats = ({ isDesktop = false, setChatData = () => { } }: { isDesktop?: boolean; setChatData: (data: string) => void }) => {

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
        // const cachedChats = localStorage.getItem(`chats-page-${page}`);
        // if (cachedChats) {
        //     setChats(JSON.parse(cachedChats));
        // }

        try {
            const res = await axios.get(
                `${API_URL}/chats/recent?skip=${chats.length}&limit=10`
            );
            setChats((prevChats) => {
                const newChats = [...prevChats, ...res.data];
                // localStorage.setItem(`chats-page-${page}`, JSON.stringify(newChats));
                return newChats;
            });
        } catch (error) {
            console.error("Failed to fetch chats:", error);
        }
    };

    return (
        <div className="p-4 max-w-lg w-full mx-auto h-[80vh] overflow-y-auto">
            <h1 className="text-xl font-bold mb-4">Recent Chats</h1>
            <ul>
                {chats.map((chat) => (
                    <li key={chat.customer_phone} className="mb-3 p-2 border rounded-2xl h-20 overflow-hidden shadow-lg hover:shadow-xl hover:bg-gray-100 hover:scale-95 duration-700">
                        {isDesktop ? <div
                            // to={`/chats/${chat.customer_phone}`}
                            onClick={() => setChatData(chat.customer_phone)}

                            className="block hover:cursor-pointer"
                        >
                            <strong>{chat.customer_name || chat.customer_email || chat.customer_phone}</strong><p><small>{chat.customer_phone}</small></p><small className="text-gray-300 text-sm">{new Date(chat.messages.at(-1)?.created_at)?.toLocaleString([], {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}</small>
                            <p className="text-gray-500 text-sm">
                                {chat.messages.at(-1)?.content}
                            </p>
                        </div> : <Link
                            to={`/chats/${chat.customer_phone}`}
                            className="block hover:underline"
                        >
                                <strong>{chat.customer_name || chat.customer_email || chat.customer_phone}</strong><p><small>{chat.customer_phone}</small></p><small className="text-gray-300 text-sm">{new Date(chat.messages.at(-1)?.created_at)?.toLocaleString([], {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}</small>
                            <p className="text-gray-500 text-sm">
                                {chat.messages.at(-1)?.content}
                            </p>
                        </Link>}
                    </li>
                ))}
            </ul>
            <div className="mt-4">
                <button
                    onClick={() => setPage((prevPage) => prevPage + 1)}
                    className="w-full py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                    Load More
                </button>
            </div>
        </div>
    );
};

const ChatView = ({ phone_no = "" }) => {
    const { phone } = phone_no ? { phone: phone_no } : useParams();
    interface Message {
        id?: string;
        content: string;
        sender_role?: string;
        isUser?: boolean;
        created_at?: string;
        customer_phone?: string;
        // sender_name?: string;
    }

    interface ChatMesages {
        customer_name?: string;
        customer_email?: string;
        customer_phone?: string;
        messages: Message[];
    }

    const [messages, setMessages] = useState<ChatMesages>({
        messages: [],
    });
    const [page, setPage] = useState(0);
    console.log('phone dd:>> ', phone);

    useEffect(() => {
        fetchMessages();
    }, [page, phone_no]);

    useEffect(() => {
        setMessages({
            messages: [],
        });
    }, [phone_no]);

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
        // const cachedMessages = localStorage.getItem(`messages-${phone}-${page}`);
        // if (cachedMessages) {
        //     setMessages(JSON.parse(cachedMessages));
        // }
            const res = await axios.get(
                `${API_URL}/chats/chat/${phone}?skip=${messages.messages.length}&limit=20`
            );
        setMessages((existingMessages) => {
            const prevMessages = existingMessages.messages;
            const newMessages = [...prevMessages, ...res.data.messages];
            const newMessage: ChatMesages = {
                messages: newMessages,
                customer_name: res.data.customer_name,
                customer_email: res.data.customer_email,
                customer_phone: res.data.customer_phone,
            }
            localStorage.setItem(`messages-${phone}-${page}`, JSON.stringify(newMessage));
            return newMessage;
            });

    };

    return (
        <div className="p-4 max-w-lg w-full mx-auto h-screen overflow-auto bg-teal-100">
            <h1 className="text-xl font-bold">Chat with {messages.customer_name || messages.customer_email || messages.customer_phone}</h1><small className="text-xs text-gray-500 mb-4">{messages.customer_phone}</small>
            <div className="space-y-2">
                {messages.messages.map((msg) =>
                    msg.sender_role === "user" ? (
                        <HumanMessage key={msg.id} text={msg.content} time={new Date(msg.created_at)?.toLocaleString([], {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                        })} />
                    ) : (
                            <BotMessage key={msg.id} text={msg.content} time={new Date(msg.created_at)?.toLocaleString([], {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                            })} />
                    )
                )}
            </div>
            <div className="mt-4">
                <button
                    onClick={() => setPage((prevPage) => prevPage + 1)}
                    className="w-full py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                >
                    Load More
                </button>
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
