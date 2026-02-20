import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Trash2, Loader } from 'lucide-react';
import './ChatPanel.css';

function ChatPanel({ analysisData, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://ecoagent-clei.onrender.com/api'}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          analysis_data: analysisData,
          chat_history: messages
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();
      setMessages(data.chat_history);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ Sorry, I encountered an error. Please make sure the backend is running with Ollama.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">
          💬
          <span>AI Assistant</span>
        </div>
        <div className="chat-actions">
          <button onClick={clearChat} className="icon-btn" title="Clear chat">
            🗑️
          </button>
          <button onClick={onClose} className="icon-btn" title="Close chat">
            ❌
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            💬
            <h3>Ask me anything about this analysis</h3>
            <p>I can help you understand the data, metrics, and recommendations.</p>
            <div className="suggested-questions">
              <button onClick={() => setInput("What are the top energy-saving opportunities?")} className="suggestion">
                What are the top energy-saving opportunities?
              </button>
              <button onClick={() => setInput("Which building needs the most attention?")} className="suggestion">
                Which building needs the most attention?
              </button>
              <button onClick={() => setInput("Explain the savings potential")} className="suggestion">
                Explain the savings potential
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <Loader size={16} className="spinning" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about the analysis..."
          className="chat-input"
          rows="2"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="send-btn"
        >
          📤
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
