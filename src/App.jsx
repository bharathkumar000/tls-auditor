import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Github, 
  Chrome, 
  ChevronRight, 
  Terminal,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { supabase } from './supabase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      alert('Login successful!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="login-card"
      >
        <div className="dev-badge">v1.0.4 // TLS_SECURE</div>
        
        <div className="logo-section">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="logo-icon"
          >
            <Terminal size={32} />
          </motion.div>
          <h1 className="title">TLS AUDITOR</h1>
          <p className="subtitle">Secure Developer Infrastructure Access</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              background: 'rgba(255, 0, 0, 0.1)', 
              border: '1px solid rgba(255, 0, 0, 0.2)', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              color: '#ff6b6b',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label">Endpoint Identifier</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                className="input" 
                placeholder="developer@tls-auditor.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Access Token</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                className="input" 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="options">
            <label className="remember-me">
              <input type="checkbox" style={{ accentColor: '#D4AF37' }} />
              Keep session active
            </label>
            <a href="#" className="forgot-password">Reset Token</a>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? (
              "AUTHENTICATING..."
            ) : (
              <>
                INITIALIZE SESSION <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>External Auth Systems</span>
        </div>

        <div className="social-login">
          <button className="social-btn">
            <Github size={18} /> GitHub
          </button>
          <button className="social-btn">
            <Chrome size={18} /> Google
          </button>
        </div>

        <p className="footer-text">
          New System Operator? <a href="#">Request Access</a>
        </p>

        <div style={{ 
          marginTop: '1rem', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1.5rem',
          opacity: 0.3
        }}>
          <ShieldCheck size={20} />
          <Cpu size={20} />
        </div>
      </motion.div>
    </div>
  );
}

export default App;
