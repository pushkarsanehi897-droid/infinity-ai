import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6">
      <div className="glass-surface p-8 rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Sign In</h2>
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded focus:border-[#00F0FF] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded focus:border-[#00F0FF] outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full py-2 bg-white text-black font-semibold rounded hover:bg-white/90 transition">Login</button>
        </form>
        <p className="text-center text-white/50 text-sm mt-6">
          Don't have an account? <Link to="/register" className="text-[#00F0FF] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
export default LoginPage;