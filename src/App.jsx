import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { sendMessage } from './services/groqService';

function App() {
  const [inputText, setInputText]               = useState('');
  const [messages, setMessages]                 = useState([
    { id: 1, text: "Hello!! 🌸 I'm GenLab-Mini, and I'm so happy to see you! How can I make your day wonderful? ✨", sender: 'bot' }
  ]);
  const [isRecording, setIsRecording]           = useState(false);
  const [isLoadingNews, setIsLoadingNews]       = useState(false);
  const [selectedVersion, setSelectedVersion]   = useState('v1');
  const [isTyping, setIsTyping]                 = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const chatEndRef = useRef(null);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Markdown renderer ───────────────────────────────────────────────────────
  const formatMessage = (text) => {
    if (!text) return null;

    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```/g, '').replace(/^[a-z]+\n/, '');
        return <pre key={i} className="code-block"><code>{code}</code></pre>;
      }

      let formatted = part.split(/(\*\*.*?\*\*)/g).map((sub, j) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return <strong key={j}>{sub.slice(2, -2)}</strong>;
        }
        return sub;
      });

      formatted = formatted.map((f, k) => {
        if (typeof f === 'string') {
          return f.split(/(\*.*?\*)/g).map((ital, l) => {
            if (ital.startsWith('*') && ital.endsWith('*')) {
              return <em key={l}>{ital.slice(1, -1)}</em>;
            }
            return ital;
          });
        }
        return f;
      });

      return <span key={i}>{formatted}</span>;
    });
  };

  // ── News fetcher ────────────────────────────────────────────────────────────
  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      // For now, we'll return a message since Gemini doesn't have real-time news
      // You can integrate a news API here if needed
      return {
        type: 'text',
        text: "I don't have access to real-time news right now, but I'd be happy to discuss any news topics you're interested in! 📰"
      };
    } catch (error) {
      console.error("News fetch error:", error);
      return {
        type: 'text',
        text: "I'm so sorry, I had a little trouble with that request. 😔 Maybe try asking something else?"
      };
    } finally {
      setIsLoadingNews(false);
    }
  };

  // ── Core send handler ───────────────────────────────────────────────────────
  const handleSendMessage = async (textOverride = null) => {
    const textToSend = textOverride || inputText.trim();
    if (!textToSend) return;

    // Immediately show user message
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, text: textToSend, sender: 'user' }]);
    if (!textOverride) setInputText('');
    setIsTyping(true);

    // Small delay so typing indicator feels natural
    const thinkingTime = selectedVersion === 'v1' ? 600 : selectedVersion === 'v2' ? 1200 : 2000;

    setTimeout(async () => {
      try {
        const lowerText = textToSend.toLowerCase();
        let response;

        // ── News keyword → use news endpoint ──────────────────────────────────
        if (lowerText.includes('news') || lowerText.includes('headlines') || lowerText.includes('update')) {
          const news = await fetchNews();
          response = { text: news.text, news: news.content || null, type: news.type };

        } else {
          // ── Real AI call → Gemini API ─────────────────────────────────────
          const reply = await sendMessage(textToSend, selectedVersion);
          response = { text: reply, news: null, type: "text" };
        }

        setIsTyping(false);

        // ── Stream the response word-by-word ───────────────────────────────
        const botMsgId = Date.now() + 1;
        setMessages(prev => [...prev, {
          id:          botMsgId,
          text:        '',
          news:        response.news || null,
          type:        response.type || 'text',
          sender:      'bot',
          version:     selectedVersion,
          isStreaming: true
        }]);
        setStreamingMessageId(botMsgId);

        const words = (response.text || '').split(' ');
        let idx = 0;

        const interval = setInterval(() => {
          if (idx < words.length) {
            const nextText = words.slice(0, idx + 1).join(' ');
            setMessages(prev => prev.map(msg =>
              msg.id === botMsgId ? { ...msg, text: nextText } : msg
            ));
            idx++;
          } else {
            clearInterval(interval);
            setMessages(prev => prev.map(msg =>
              msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
            ));
            setStreamingMessageId(null);
          }
        }, 50);

      } catch (error) {
        // Log the real error to console for debugging
        console.error("[GenLab-Mini] Groq API error:", error.message);
        setIsTyping(false);

        // Show a friendly message in the chat
        const friendlyText = error.message.includes("API key")
          ? "There seems to be an issue with the API configuration. Please check that your Groq API key is correctly set. 🔑"
          : "Sorry, I couldn't reach the Groq API right now. Please check your internet connection and try again. 😔";

        setMessages(prev => [...prev, {
          id:          Date.now() + 1,
          text:        friendlyText,
          news:        null,
          type:        'text',
          sender:      'bot',
          version:     selectedVersion,
          isStreaming: false
        }]);
        setStreamingMessageId(null);
      }
    }, thinkingTime);
  };

  // ── Voice recording ─────────────────────────────────────────────────────────
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendMessage("Voice Message 🎤");
    } else {
      setIsRecording(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // ── Logo component ──────────────────────────────────────────────────────────
  const GenLabLogo = ({ className }) => (
    <img
      src="https://res.cloudinary.com/dyarrjhv7/image/upload/v1772115926/green_egn4ol.png"
      alt="GenLab Logo"
      className={className}
    />
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="main-container app-gpt-layout">

      {/* Sticky Top Nav */}
      <nav className="gpt-top-nav">
        <div className="nav-brand">
          <GenLabLogo className="nav-logo" />
          <span className="nav-title">GenLab-Mini</span>
        </div>
        <div className="version-selector">
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="model-dropdown"
          >
            <option value="v1">GenLab-Mini V1</option>
            <option value="v2">GenLab-Mini V2</option>
            <option value="pro">GenLab-Mini Pro</option>
          </select>
          <div className="version-badge">{selectedVersion.toUpperCase()}</div>
        </div>
      </nav>

      {/* Main Chat Feed */}
      <main className="gpt-main">
        <div className="chat-history gpt-history">

          {/* Welcome screen shown before any user messages */}
          {messages.length <= 1 && (
            <div className="gpt-welcome">
              <div className="welcome-icon"><GenLabLogo className="main-logo" /></div>
              <h1 className="welcome-title">GenLab-Mini</h1>
              <p className="welcome-subtitle">The Gen Z Creators' Space</p>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}-row`}>
              <div className="gpt-avatar">
                {msg.sender === 'bot' ? <GenLabLogo className="avatar-logo" /> : 'U'}
              </div>
              <div className="message-content-wrapper">
                <div className="sender-label">
                  {msg.sender === 'bot' ? `GenLab-Mini ${msg.version || 'v1'}` : 'You'}
                </div>
                <div className="message-content">
                  {formatMessage(msg.text)}
                  {msg.isStreaming && <span className="streaming-cursor">|</span>}
                  {msg.news && (
                    <div className="news-container">
                      {msg.news.map((item, index) => (
                        <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className="news-item">
                          <div className="news-header">
                            <span className="news-source">{item.source}</span>
                            <span className="news-time">{item.pubDate}</span>
                          </div>
                          <div className="news-title">{item.title}</div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message-row bot-row">
              <div className="gpt-avatar"><GenLabLogo className="avatar-logo" /></div>
              <div className="message-content-wrapper">
                <div className="sender-label">GenLab-Mini is thinking...</div>
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="gpt-input-area">
          <div className="gpt-input-wrapper">
            <button
              className={`action-btn voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? "Stop Recording" : "Record Voice Message"}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Ask me anything..."
              className="gpt-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isRecording || isTyping}
            />
            <button
              className="gpt-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isRecording || isTyping || !inputText.trim()}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <div className="gpt-footer-note">
            Mini can make mistakes. Consider checking important information.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
