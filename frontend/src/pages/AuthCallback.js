import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthCallback = () => {
  const [status, setStatus] = useState('Processing login...');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Parse session_id from URL fragment: /#session_id=xxx
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', '?'));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setError('No session ID found. Please try logging in again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        setStatus('Verifying your identity...');
        const response = await axios.get(`${API}/auth/google/session`, {
          headers: { 'X-Session-ID': sessionId },
          withCredentials: true,
        });

        setUser(response.data);
        setStatus('Login successful! Redirecting...');

        // Clear the hash from URL
        window.history.replaceState(null, '', '/dashboard');
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (err) {
        const msg = err.response?.data?.detail || 'Authentication failed. Please try again.';
        setError(msg);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6">
      <div className="text-center glass-surface p-12 rounded-lg max-w-md w-full">
        {!error ? (
          <>
            <div className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {status}
            </h2>
            <p className="text-white/50 text-sm">Please wait a moment...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2
              className="text-xl font-semibold mb-2 text-red-400"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Authentication Error
            </h2>
            <p className="text-white/50 text-sm mb-4">{error}</p>
            <p className="text-white/30 text-xs">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
