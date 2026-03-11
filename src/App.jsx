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
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('1');
  const [password, setPassword] = useState('1');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Mock bypass for dev/testing
    if (email === '1' && password === '1' && isLogin) {
      setTimeout(() => {
        setLoading(false);
        alert('ACCESS GRANTED: Developer Session Initialized');
      }, 1000);
      return;
    }
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        alert('Login successful!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        alert('Registration successful! Please check your email for confirmation.');
        setIsLogin(true);
      }
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
        key={isLogin ? 'login' : 'signup'}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="login-card"
      >
        <div className="dev-badge">{isLogin ? 'v1.0.4 // TLS_SECURE' : 'NEW_NODES // REGISTER'}</div>
        
        <div className="logo-section">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="logo-icon"
          >
            {isLogin ? <Terminal size={32} /> : <ShieldCheck size={32} />}
          </motion.div>
          <h1 className="title">{isLogin ? 'TLS AUDITOR' : 'CREATE OPERATOR'}</h1>
          <p className="subtitle">
            {isLogin ? 'Secure Developer Infrastructure Access' : 'Register New System Architecture Node'}
          </p>
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
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="label">Operator Name</label>
              <div className="input-wrapper">
                <Cpu className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="System Admin / Lead Dev"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

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

          {isLogin && (
            <div className="options">
              <label className="remember-me">
                <input type="checkbox" style={{ accentColor: '#D4AF37' }} />
                Keep session active
              </label>
              <a href="#" className="forgot-password">Reset Token</a>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? (
              "PROCESSING..."
            ) : (
              <>
                {isLogin ? 'INITIALIZE SESSION' : 'REGISTER NODE'} <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span>External Auth Systems</span>
        </div>

        <div className="social-login">
          <button className="social-btn">
            <Chrome size={18} /> Google
          </button>
          <button className="social-btn">
            <Github size={18} /> GitHub
          </button>
        </div>

        <p className="footer-text">
          {isLogin ? (
            <>New System Operator? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Request Access</a></>
          ) : (
            <>Already have tokens? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Login to Node</a></>
          )}
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
