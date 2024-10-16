import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './index.css';

const StreamingChatComponent = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const chatBoxRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);
  
    try {
      const history = messages.map((msg) => [msg.sender, msg.text]);
      const response = await fetch('http://localhost:8000/predict/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input, history }),
      });
  
      if (!response.ok) throw new Error("Network response was not ok.");
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      // Create an initial bot message entry
      const botMessage = { sender: "bot", text: "" };
      setMessages((prev) => [...prev, botMessage]);
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
  
        // Update the bot's message text incrementally with a delay
        for (const char of chunk) {
          // Delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 50)); // Adjust the delay as needed
  
          setMessages((prev) => {
            const lastBotMessage = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...lastBotMessage, text: lastBotMessage.text + char }];
          });
        }
      }
  
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = { sender: "bot", text: "Sorry, an error occurred. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };
  
  

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container">
      <h1>Ask ALI</h1>
      <h2>Code of Alabama AI Assistant Beta</h2>
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${msg.sender}-message`}
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>
        ))}
        {isThinking && (
          <div className="bot-message">
            <span className="typing-indicator"></span>
          </div>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything about the Code of Alabama..."
          className="message-input"
        />
        <button onClick={handleSend} disabled={isThinking} className="send-button">
          Ask
        </button>
      </div>
    </div>
  );
};

export default StreamingChatComponent;
