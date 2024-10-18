import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './index.css';
import DOMPurify from 'dompurify'; // Sanitize HTML to avoid XSS

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
  
    // Initialize botMessageText here so it's accessible in the finally block
    let botMessageText = "";
  
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
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
  
        // Update the bot's message text incrementally with a delay
        for (const char of chunk) {
          // Delay to simulate streaming
          await new Promise((resolve) => setTimeout(resolve, 50)); // Adjust the delay as needed
  
          // Append to the bot's message text
          botMessageText += char;
  
          // Update the messages only when there's actual text
          setMessages((prev) => {
            if (botMessageText.length === 1) {
              // Only create a new entry if we have received the first character
              return [...prev, { sender: "bot", text: botMessageText }];
            }
            // Otherwise, update the last bot message
            const lastBotMessage = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...lastBotMessage, text: botMessageText }];
          });
  
          // Set isThinking to false after the first character
          if (botMessageText.length === 1) {
            setIsThinking(false);
          }
        }
      }
  
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = { sender: "bot", text: "Sorry, an error occurred. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // You may not need this check anymore since we handle isThinking within the loop
      if (botMessageText.length > 0) {
        setIsThinking(false);
      }
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
            {msg.sender === "bot" ? (
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        {isThinking && (
          <div className="bot-message">
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
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
