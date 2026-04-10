import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.detail || 'Server error'}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'No response' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not reach the server.' }]);
    }
    setLoading(false);
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    setGeneratedImage(null);
    setImageError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: imagePrompt, style: selectedStyle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImageError(data.detail || 'Image generation failed');
      } else if (data.image_data) {
        setGeneratedImage(`data:${data.mime_type};base64,${data.image_data}`);
      }
    } catch {
      setImageError('Error: Could not reach the server.');
    }
    setImageLoading(false);
  };

  const styles = ['realistic', 'anime', 'cinematic', 'futuristic'];

  return (
    <div style={{ minHeight: '100vh', background: '#030303', color: 'white', fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(90deg, #00F0FF, #8A2BE2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ∞ Infinity AI
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>👋 {user?.name || user?.email}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['chat', 'image'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            background: activeTab === tab ? 'linear-gradient(90deg, #00F0FF, #8A2BE2)' : 'rgba(255,255,255,0.07)',
            color: 'white',
          }}>
            {tab === 'chat' ? '💬 AI Chat' : '🎨 Image Gen'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '24px', maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: '80px', fontSize: '18px' }}>
                  Start a conversation with Infinity AI ✨
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%', padding: '12px 16px', borderRadius: '12px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #00F0FF22, #8A2BE222)' : 'rgba(255,255,255,0.07)',
                  border: msg.role === 'user' ? '1px solid #00F0FF44' : '1px solid rgba(255,255,255,0.1)',
                  fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask anything..."
                style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '15px', outline: 'none' }}
              />
              <button onClick={sendMessage} disabled={loading} style={{
                padding: '14px 24px', background: 'linear-gradient(90deg, #00F0FF, #8A2BE2)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px'
              }}>
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ color: '#8A2BE2', margin: 0 }}>🎨 AI Image Generation</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {styles.map(s => (
                <button key={s} onClick={() => setSelectedStyle(s)} style={{
                  padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  background: selectedStyle === s ? 'linear-gradient(90deg, #8A2BE2, #FF5500)' : 'rgba(255,255,255,0.07)',
                  color: 'white', textTransform: 'capitalize'
                }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={imagePrompt}
                onChange={e => setImagePrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateImage()}
                placeholder="Describe an image to generate..."
                style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'white', fontSize: '15px', outline: 'none' }}
              />
              <button onClick={generateImage} disabled={imageLoading} style={{
                padding: '14px 24px', background: 'linear-gradient(90deg, #8A2BE2, #FF5500)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px'
              }}>
                {imageLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {imageError && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '8px', color: '#ff6b6b' }}>
                ⚠️ {imageError}
              </div>
            )}
            {imageLoading && (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>✨ Creating your image...</div>
            )}
            {generatedImage && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={generatedImage} alt="AI Generated" style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{imagePrompt}</span>
                  <a href={generatedImage} download="infinity-ai-image.png" style={{ color: '#00F0FF', fontSize: '13px', textDecoration: 'none' }}>⬇ Download</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
