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
        // Try OTP Login if user wants? Or just standard? 
        // For hackathon, let's provide standard but the user's snippet suggested sendOtp.
        // We'll stick to Password login for now unless they provided NO password.
        const { error, data } = await login(phone, password);
        if (error) throw error;
        onLoginSuccess(data.user);
      } else {
        const { error } = await signUp(phone, password, email, fullName);
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
          {!isLogin && (
            <>
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
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Operator Email</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    className="input" 
                    placeholder="admin@tls-auditor.sys"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="label">Contact Number</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={18} />
              <input 
                type="tel" 
                className="input" 
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Access Token / Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
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
          
          {isLogin && (
            <button 
              type="button" 
              className="otp-link-btn"
              onClick={handleSendOtp}
              style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', color: 'var(--gold-primary)', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Alternative: Sign in with OTP Code
            </button>
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
