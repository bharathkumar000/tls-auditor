import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Lock, 
  ChevronRight, 
  Terminal,
  ShieldCheck,
  Cpu,
  Mail,
  Loader2
} from 'lucide-react';
import { login, signUp, sendOtp } from '../services/authService';
import OTPVerify from '../components/OTPVerify';

function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [phone, setPhone] = useState('1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('1');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Mock bypass for dev/testing
    if (phone === '1' && password === '1' && isLogin) {
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess({ phone, email: 'admin@tls.dev', fullName: 'Lead Operator' });
      }, 1000);
      return;
    }
    
    try {
      if (isLogin) {
        // Log in via Email (The more stable dev path)
        const { error, data } = await login(email || 'admin@tls.dev', password);
        if (error) throw error;
        onLoginSuccess(data.user);
      } else {
        // Register with Metadata (Name, Phone stored in profile)
        const { error } = await signUp(email, password, phone, fullName);
        if (error) throw error;
        alert('Operator Registration successful! Check email for confirmation.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await sendOtp(phone);
      if (error) throw error;
      setShowOtp(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <div className="login-container">
        <OTPVerify 
          phone={phone} 
          onVerifySuccess={() => onLoginSuccess({ phone })} 
          onCancel={() => setShowOtp(false)} 
        />
      </div>
    );
  }

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
        <div className="dev-badge">{isLogin ? 'v1.1.0 // TLS_SECURE' : 'NEW_NODES // REGISTER'}</div>
        
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
          <div className="auth-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">

          <div className="form-group">
            <label className="label">Operator Email (Login ID)</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                name="node_operator_email"
                type="email" 
                className="input" 
                placeholder="admin@tls-auditor.sys"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Contact Number</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={18} />
              <input 
                name="node_operator_phone"
                type="tel" 
                className="input" 
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Access Token / Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                name="node_operator_token"
                type="password" 
                className="input" 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...(!isLogin ? { required: true } : {})}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                {isLogin ? 'INITIALIZE SESSION' : 'REGISTER NODE'} <ChevronRight size={18} />
              </>
            )}
          </button>
          
          {!isLogin && (
            <div className="form-group">
              <label className="label">Verification Code (Optional/Skip)</label>
              <div className="input-wrapper">
                <Cpu className="input-icon" size={18} />
                <input 
                  name="node_operator_name"
                  type="text" 
                  className="input" 
                  placeholder="System Identity Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          )}
        </form>

        <p className="footer-text">
          {isLogin ? (
            <>New System Operator? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Request Access</a></>
          ) : (
            <>Already have tokens? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Login to Node</a></>
          )}
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
