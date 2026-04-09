import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Sidebar ────────────────────────────────────────────────────────────────
const Sidebar = ({ activeTab, setActiveTab, chatHistory, imageHistory, videoHistory, onSelectHistory, user, onLogout }) => {
  const sections = [
    { id: 'chat', label: 'AI Chat', icon: '💬', history: chatHistory },
    { id: 'image', label: 'Image Gen', icon: '🎨', history: imageHistory },
    { id: 'video', label: 'Video Gen', icon: '🎥', history: videoHistory },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-black/60 backdrop-blur-xl border-r border-white/10 h-screen sticky top-0 flex flex-col p-4 overflow-y-auto scrollbar-hide">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <img
          src="https://static.prod-images.emergentagent.com/jobs/0d4a75e4-ef8a-4169-b51d-7659c62ca60d/images/15681a9d25361e7d3e82f81d25d59e29c441dc2c695cf4172ede6aca08eb6aee.png"
          alt="Infinity AI"
          className="h-8 w-8"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.5))' }}
        />
        <span className="text-lg font-bold text-[#00F0FF]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Infinity AI
        </span>
      </div>

      {/* Nav Tabs */}
      <nav className="space-y-1 mb-6">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            data-testid={`sidebar-${s.id}`}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 ${
              activeTab === s.id
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </nav>

      {/* History for active tab */}
      <div className="flex-1 min-h-0">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/30 mb-3 px-2">
          Recent History
        </p>
        <div className="space-y-1">
          {(sections.find((s) => s.id === activeTab)?.history || []).slice(0, 10).map((item, i) => (
            <button
              key={i}
              onClick={() => onSelectHistory(item, activeTab)}
              className="w-full text-left px-3 py-2 rounded-md text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all truncate"
              title={item.message || item.prompt}
            >
              {(item.message || item.prompt || 'Untitled').slice(0, 35)}...
            </button>
          ))}
          {(sections.find((s) => s.id === activeTab)?.history || []).length === 0 && (
            <p className="text-xs text-white/20 px-3 py-2 italic">No history yet</p>
          )}
        </div>
      </div>

      {/* User info + logout */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center text-sm text-[#00F0FF]">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-white/30 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          data-testid="logout-btn"
          className="w-full px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-all text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

// ─── AI Chat Panel ───────────────────────────────────────────────────────────
const ChatPanel = ({ history, onNewHistory }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('auto');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const models = [
    { value: 'auto', label: 'Auto Route' },
    { value: 'openai:gpt-5.2', label: 'GPT-5.2' },
    { value: 'gemini:gemini-3-flash-preview', label: 'Gemini 3 Flash' },
    { value: 'anthropic:claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  ];

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${API}/ai/chat`,
        { message: input, model },
        { withCredentials: true }
      );
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.response, model: res.data.model }]);
      onNewHistory();
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', text: err.response?.data?.detail || 'Request failed' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>AI Chat</h2>
          <p className="text-white/40 text-sm">Multi-model conversational AI</p>
        </div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          data-testid="model-select"
          className="bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-[#00F0FF] outline-none"
        >
          {models.map((m) => (
            <option key={m.value} value={m.value} className="bg-[#0A0A0A]">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-1">Ask anything — models are selected automatically</p>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-lg text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-white'
                    : msg.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-white/5 border border-white/10 text-white/90'
                }`}
              >
                {msg.role === 'assistant' && msg.model && (
                  <p className="text-[10px] text-white/30 mb-1 font-mono">{msg.model}</p>
                )}
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#00F0FF]/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            data-testid="chat-input"
            placeholder="Ask anything..."
            className="flex-1 px-4 py-3 bg-black/20 border border-white/10 rounded-md focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] text-white placeholder-white/30 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            data-testid="chat-send-btn"
            className="px-6 py-3 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-all active:scale-95 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Image Gen Panel ─────────────────────────────────────────────────────────
const ImagePanel = ({ onNewHistory }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const styles = [
    { value: 'realistic', label: 'Realistic' },
    { value: 'anime', label: 'Anime' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'futuristic', label: 'Futuristic' },
  ];

  const generate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axios.post(
        `${API}/ai/image`,
        { prompt, style },
        { withCredentials: true }
      );
      setResult(res.data);
      onNewHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Image generation failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Image Generator</h2>
        <p className="text-white/40 text-sm">Powered by Gemini Nano Banana</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <form onSubmit={generate} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              data-testid="image-prompt-input"
              placeholder="A futuristic cityscape at night with neon lights..."
              rows={3}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-md focus:border-[#8A2BE2] focus:ring-1 focus:ring-[#8A2BE2] text-white placeholder-white/30 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Style</label>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    style === s.value
                      ? 'bg-[#8A2BE2]/20 text-[#8A2BE2] border border-[#8A2BE2]/50'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            data-testid="generate-image-btn"
            className="px-8 py-3 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-all active:scale-95 disabled:opacity-40"
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>

        {loading && (
          <div className="text-center py-16 glass-surface rounded-lg">
            <div className="w-12 h-12 border-4 border-[#8A2BE2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">Creating your image...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-surface rounded-lg overflow-hidden"
          >
            <img
              src={`data:${result.mime_type};base64,${result.image_data}`}
              alt={result.prompt}
              className="w-full h-auto"
              data-testid="generated-image"
            />
            <div className="p-4 flex items-center justify-between">
              <p className="text-white/50 text-sm truncate flex-1">{result.prompt}</p>
              <a
                href={`data:${result.mime_type};base64,${result.image_data}`}
                download={`infinity-ai-${result.image_id}.png`}
                className="ml-4 px-4 py-2 bg-[#8A2BE2]/20 border border-[#8A2BE2]/40 text-[#8A2BE2] text-sm rounded-md hover:bg-[#8A2BE2]/30 transition-all"
              >
                Download
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── Video Gen Panel ─────────────────────────────────────────────────────────
const VideoPanel = ({ onNewHistory }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const styles = [
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'animation', label: 'Animation' },
    { value: 'storytelling', label: 'Storytelling' },
  ];

  const generate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await axios.post(
        `${API}/ai/video`,
        { prompt, style, duration, size: '1280x720' },
        { withCredentials: true }
      );
      setResult(res.data);
      onNewHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Video generation failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>4K Video Generator</h2>
        <p className="text-white/40 text-sm">Powered by Sora 2</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <form onSubmit={generate} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              data-testid="video-prompt-input"
              placeholder="A cinematic drone shot over a futuristic city at dawn..."
              rows={3}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-md focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] text-white placeholder-white/30 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Style</label>
              <div className="space-y-1">
                {styles.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    className={`w-full px-3 py-2 rounded-md text-sm text-left transition-all ${
                      style === s.value
                        ? 'bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/50'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">
                Duration: {duration}s
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                data-testid="video-duration-slider"
                className="w-full accent-[#FF5500]"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>2s</span>
                <span>10s</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            data-testid="generate-video-btn"
            className="px-8 py-3 bg-white text-black font-semibold rounded-md hover:bg-white/90 transition-all active:scale-95 disabled:opacity-40"
          >
            {loading ? 'Generating...' : 'Generate Video'}
          </button>
        </form>

        {loading && (
          <div className="text-center py-16 glass-surface rounded-lg">
            <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 mb-2">Generating your 4K video...</p>
            <p className="text-white/30 text-sm">This may take a minute</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-surface rounded-lg p-6"
            data-testid="video-result"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <span className="text-green-400">✓</span>
              </div>
              <div>
                <p className="text-white font-medium">Video Generated!</p>
                <p className="text-white/40 text-sm">ID: {result.video_id}</p>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-4">{result.prompt}</p>
            <a
              href={`${process.env.REACT_APP_BACKEND_URL}${result.download_url}`}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-block px-6 py-2 bg-[#FF5500]/20 border border-[#FF5500]/40 text-[#FF5500] text-sm rounded-md hover:bg-[#FF5500]/30 transition-all"
            >
              Download Video
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [videoHistory, setVideoHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchHistories = async () => {
    try {
      const [chatRes, imgRes, vidRes] = await Promise.allSettled([
        axios.get(`${API}/ai/chat/history`, { withCredentials: true }),
        axios.get(`${API}/ai/image/history`, { withCredentials: true }),
        axios.get(`${API}/ai/video/history`, { withCredentials: true }),
      ]);
      if (chatRes.status === 'fulfilled') setChatHistory(chatRes.value.data.history || []);
      if (imgRes.status === 'fulfilled') setImageHistory(imgRes.value.data.history || []);
      if (vidRes.status === 'fulfilled') setVideoHistory(vidRes.value.data.history || []);
    } catch (err) {
      console.error('History fetch error', err);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSelectHistory = (item, type) => {
    setActiveTab(type);
  };

  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden" data-testid="dashboard">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          chatHistory={chatHistory}
          imageHistory={imageHistory}
          videoHistory={videoHistory}
          onSelectHistory={handleSelectHistory}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/20">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-white/50 hover:text-white transition-colors text-lg"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm hidden sm:block">
              Welcome, {user?.name}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex items-center justify-center text-sm text-[#00F0FF]">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Panel */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <ChatPanel history={chatHistory} onNewHistory={fetchHistories} />
              </motion.div>
            )}
            {activeTab === 'image' && (
              <motion.div
                key="image"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <ImagePanel onNewHistory={fetchHistories} />
              </motion.div>
            )}
            {activeTab === 'video' && (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <VideoPanel onNewHistory={fetchHistories} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
