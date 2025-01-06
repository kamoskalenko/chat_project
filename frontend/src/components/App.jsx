import "./App.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../index.css";
import io from "socket.io-client";
import CreateChatModal from "./CreateChatModal/CreateChatModal.jsx";
import { useNavigate } from "react-router-dom";
import API from "../API.jsx";

const socket = io(API);

function App() {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuthStatus();
      fetchChats();
    } else {
      toast.warn("Please log in to access the chat.");
      navigate("/login");
    }

    const handleNewMessage = ({ chatId, message }) => {
      toast(`New message in chat ${chatId}: ${message.text}`);
      fetchChats();
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  useEffect(() => {
    const filtered = chats.filter((chat) =>
      `${chat.firstName} ${chat.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchQuery, chats]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/auth-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLoggedIn(response.data.isLoggedIn);
    } catch (error) {
      toast.error("Session expired. Please log in again.");
      setIsLoggedIn(false);
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(response.data);
      setFilteredChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in.");
        setIsLoggedIn(false);
        localStorage.removeItem("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (chatData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must log in to create a chat.");
        navigate("/login");
        return;
      }

      await axios.post(`${API}/chats`, chatData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchChats();
      toast.success("Chat created successfully!");
    } catch (error) {
      toast.error("Failed to create chat. Please try again.");
    }
  };

  const sendMessage = async () => {
    if (selectedChat && newMessage) {
      try {
        await axios.post(
          `${API}/chats/${selectedChat}/messages`,
          { text: newMessage },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setNewMessage("");
        fetchChats();
        toast.success("Message sent successfully!");
      } catch (error) {
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`${API}/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchChats();
      if (selectedChat === chatId) {
        setSelectedChat(null);
      }
      toast.success("Chat deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete chat. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setChats([]);
    setSelectedChat(null);
    setFilteredChats([]);
    toast.info("Logged out successfully.");
    navigate("/login");
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Chat Application</h1>
        {isLoggedIn ? (
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Log In
          </button>
        )}
      </header>
      <div className="chat-content">
        <aside className="chat-sidebar">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isLoggedIn && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="create-chat-btn"
            >
              Create Chat
            </button>
          )}
          {loading ? (
            <p>Loading chats...</p>
          ) : (
            <ul className="chat-list">
              {filteredChats.length === 0 && <p>No chats available.</p>}
              {filteredChats.map((chat) => {
                return (
                  <li
                    key={chat._id}
                    className={`chat-item ${
                      chat._id === selectedChat ? "selected" : ""
                    }`}
                    onClick={() => setSelectedChat(chat._id)}
                  >
                    <div className="chat-avatar">{chat.firstName[0]}</div>
                    <div className="chat-info">
                      <p className="chat-name">
                        {chat.firstName} {chat.lastName}
                      </p>
                      <p className="chat-last-message">
                        {chat.messages[0]?.text || "No messages yet"}
                      </p>
                    </div>
                    <button
                      className="delete-chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat._id);
                      }}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
        <main className="chat-main">
          {selectedChat ? (
            <div className="chat-details">
              <h2>Chat Details</h2>
              <div className="chat-messages">
                {chats
                  .find((chat) => chat._id === selectedChat)
                  ?.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${
                        msg.isAutoResponse ? "auto-response" : ""
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message"
                />
                <button onClick={sendMessage} className="send-btn">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <p className="no-chat-selected">Select a chat to start messaging</p>
          )}
        </main>
      </div>
      <ToastContainer />
      <CreateChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateChat}
      />
    </div>
  );
}

export default App;
