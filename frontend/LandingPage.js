import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#030303] overflow-hidden">
      {/* Navigation */}
      <nav className="glass-surface fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://static.prod-images.emergentagent.com/jobs/0d4a75e4-ef8a-4169-b51d-7659c62ca60d/images/15681a9d25361e7d3e82f81d25d59e29c441dc2c695cf4172ede6aca08eb6aee.png"
              alt="Infinity AI"
              className="h-10 w-10 infinity-logo"
            />
            <span className="text-2xl font-bold neon-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Infinity AI
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              to="/login"
              data-testid="nav-login-btn"
              className="px-6 py-2 text-white/70 hover:text-white transition-all duration-300"
            >
              Login
            </Link>
            <Link
              to="/register"
              data-testid="nav-register-btn"
              className="px-6 py-2 bg-white text-black font-semibold hover:bg-white/90 rounded-md transition-all duration-300 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6">
        {/* Background */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/0d4a75e4-ef8a-4169-b51d-7659c62ca60d/images/b6622f51d3e03fb4fff9fd60a1cce0bbd5ac192ebb7c3c81b5c9c27bd3193a84.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Neon gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 via-[#8A2BE2]/5 to-[#FF5500]/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-block mb-4 px-4 py-1 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 text-[#00F0FF] text-xs font-bold tracking-[0.2em] uppercase">
              Next-Gen AI Platform
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-semibold tracking-tighter leading-tight mb-6"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              The Future of AI
              <br />
              <span className="neon-text">In One Platform</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-white/70 max-w-2xl mx-auto mb-10">
              Chat with advanced AI models, generate stunning 4K videos, create breathtaking images.
              Experience the infinite possibilities of AI — all in one unified ecosystem.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/register"
                data-testid="hero-cta-btn"
                className="inline-block px-8 py-4 bg-white text-black font-semibold text-lg hover:bg-white/90 rounded-md transition-all duration-300 active:scale-95"
              >
                Start Creating Free
              </Link>
              <Link
                to="/login"
                className="inline-block px-8 py-4 bg-transparent border border-[#00F0FF]/50 text-[#00F0FF] font-semibold text-lg hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] rounded-md transition-all duration-300"
                style={{ boxShadow: '0 0 15px rgba(0,240,255,0.1)' }}
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-center mb-12"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Unified AI Ecosystem
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '💬',
                color: '#00F0FF',
                title: 'AI Chat',
                desc: 'Intelligent conversations with auto-routing across GPT-5.2, Gemini 3, and Claude Sonnet 4.5',
                testid: 'feature-chat',
              },
              {
                icon: '🎨',
                color: '#8A2BE2',
                title: 'Image Generation',
                desc: 'Create stunning images in multiple styles — Realistic, Anime, Cinematic, Futuristic',
                testid: 'feature-image',
              },
              {
                icon: '🎥',
                color: '#FF5500',
                title: '4K Video',
                desc: 'Generate cinematic 4K videos with Sora 2. Download and share with one click.',
                testid: 'feature-video',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-surface p-8 rounded-lg cursor-pointer group relative overflow-hidden"
                data-testid={f.testid}
                style={{ borderColor: `${f.color}20` }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}10, transparent 70%)` }}
                />
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3
                  className="text-xl font-medium tracking-tight mb-3"
                  style={{ fontFamily: 'Outfit, sans-serif', color: f.color }}
                >
                  {f.title}
                </h3>
                <p className="text-base leading-relaxed text-white/70">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Images */}
      <section className="py-20 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-12 text-white/80"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Built to Impress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg overflow-hidden border border-white/10"
            >
              <img
                src="https://static.prod-images.emergentagent.com/jobs/0d4a75e4-ef8a-4169-b51d-7659c62ca60d/images/efec78e45089c5b209cc6637c2fef4cd9676f149c2d5cf431bfcd71a6ce187b2.png"
                alt="AI Video Preview"
                className="w-full h-auto object-cover"
              />
              <div className="p-4 bg-black/60">
                <p className="text-white/50 text-sm">AI Video Generation — Sora 2</p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg overflow-hidden border border-white/10"
            >
              <img
                src="https://static.prod-images.emergentagent.com/jobs/0d4a75e4-ef8a-4169-b51d-7659c62ca60d/images/aac8a0d656fc14547606d7bb4ca9c23df307cbf0d8d4407e51a8de2f039b023d.png"
                alt="AI Image Preview"
                className="w-full h-auto object-cover"
              />
              <div className="p-4 bg-black/60">
                <p className="text-white/50 text-sm">AI Image Generation — Gemini</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center glass-surface p-12 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 via-transparent to-[#8A2BE2]/5 pointer-events-none" />
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Ready to Explore Infinity?
          </h2>
          <p className="text-base leading-relaxed text-white/70 mb-8">
            Join thousands of creators building with AI. No credit card required.
          </p>
          <Link
            to="/register"
            data-testid="footer-cta-btn"
            className="inline-block px-10 py-4 bg-white text-black font-semibold text-lg hover:bg-white/90 rounded-md transition-all duration-300 active:scale-95"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-white/30 text-sm">© 2025 Infinity AI. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/login" className="text-white/30 text-sm hover:text-white/60 transition-colors">Login</Link>
            <Link to="/register" className="text-white/30 text-sm hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
