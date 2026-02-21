import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Trash2, Loader, Smartphone, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import './ChatPanel.css';

function ChatPanel({ analysisData, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Mobile Torch State
  const [showQR, setShowQR] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [mobileConnected, setMobileConnected] = useState(false);
  const socketRef = useRef(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate session token on mount if not exists
    if (!sessionToken) {
      setSessionToken(`session-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  // Set up socket listener to know when mobile connects
  useEffect(() => {
    if (!sessionToken) return;

    // Connect to the same origin, Vite proxy will handle routing to the backend
    const serverUrl = window.location.origin;

    socketRef.current = io(serverUrl);

    // We wait for the connection_status event that our python socket server emits
    socketRef.current.on('connection_status', (data) => {
      console.log("Status update from socket:", data);
      if (data.status === 'connected') {
        setMobileConnected(true);
        setShowQR(false); // hide QR once connected
      }
    });

    // Make sure we join our session channel to listen to connection_status
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_room_event', { session: sessionToken });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [sessionToken]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      // When running in dev with Proxy, we can just use /api
      const apiUrl = import.meta.env.DEV ? '/api/chat/message' : `${import.meta.env.VITE_API_URL || 'https://ecoagent-clei.onrender.com/api'}/chat/message`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          analysis_data: analysisData,
          chat_history: messages,
          session_token: sessionToken // Pass session to backend tool
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
          <button
            onClick={() => setShowQR(!showQR)}
            className="icon-btn"
            title={mobileConnected ? "Mobile Connected" : "Connect Mobile"}
            style={{ color: mobileConnected ? '#10b981' : 'inherit' }}
          >
            {mobileConnected ? "🛜" : "📲"}
          </button>
          <button onClick={clearChat} className="icon-btn" title="Clear chat">
            🗑️
          </button>
          <button onClick={onClose} className="icon-btn" title="Close chat">
            ❌
          </button>
        </div>
      </div>

      {showQR && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          padding: '2rem 1rem',
          textAlign: 'center',
          backgroundColor: 'rgba(20, 25, 30, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <button
            onClick={() => setShowQR(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ❌
          </button>

          <h3 style={{ marginBottom: '1.5rem', marginTop: 0, color: 'white' }}>Mobile Companion</h3>

          <div style={{
            padding: '1rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '320px',
            height: '320px',
            flexDirection: 'column'
          }}>
            <QRCodeSVG value={`${window.location.origin}/mobile-companion?session=${sessionToken}`} style={{ display: 'block', width: '280px', height: '280px' }} />
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#666', wordBreak: 'break-all', textAlign: 'center' }}>
              URL: {window.location.origin}/mobile...
            </div>
          </div>

          <p style={{
            marginTop: '1.5rem',
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.8)',
            lineHeight: '1.5',
            maxWidth: '280px'
          }}>
            Scan this QR code with your phone to allow EcoAgent to control your torch.
            <br /><br />
            <strong style={{ color: '#fbbf24' }}>Note:</strong> Please accept the "Your connection is not private" warning on your phone to allow camera access.
          </p>
        </div>
      )}

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
