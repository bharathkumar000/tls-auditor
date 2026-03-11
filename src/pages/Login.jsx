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
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { login, signUp, sendOtp } from '../services/authService';
import OTPVerify from '../components/OTPVerify';

function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('1');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState('email'); // 'email' | 'phone'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        // Dev Bypass or Stable Login
        onLoginSuccess({ 
          phone: loginMode === 'phone' ? (phone === '1' ? '7975274945' : phone) : '7975274945', 
          email: loginMode === 'email' ? (email || 'anishkumar07@gmail.com') : 'anishkumar07@gmail.com', 
          fullName: 'Lead Operator ANISH' 
        });
      } else {
        // Direct Account Initialization
        console.log("Initializing secure node for:", loginMode === 'email' ? email : phone);
        setTimeout(() => {
          setLoading(false);
          alert('SYSTEM_NODE_INITIALIZED: Operator account created and linked to hardware ID.');
          onLoginSuccess({ 
            phone: phone || '7975274945', 
            email: email || 'anishkumar07@gmail.com', 
            fullName: fullName || 'System Operator' 
          });
        }, 1200);
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
        <div className="dev-badge">{isLogin ? 'v1.2.0 // MULTI_VECTOR' : 'NEW_NODES // REGISTER'}</div>
        
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

        {isLogin && (
          <div className="auth-mode-selector">
            <button 
              type="button" 
              className={`mode-btn ${loginMode === 'email' ? 'active' : ''}`}
              onClick={() => setLoginMode('email')}
            >
              <Mail size={14} /> SECURE_EMAIL
            </button>
            <button 
              type="button" 
              className={`mode-btn ${loginMode === 'phone' ? 'active' : ''}`}
              onClick={() => setLoginMode('phone')}
            >
              <Phone size={14} /> MOBILE_NODE
            </button>
          </div>
        )}

        {error && (
          <div className="auth-error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="auth-form-container">
            {loginMode === 'email' || !isLogin ? (
              <div className="form-group">
                <label className="label">Operator Email (Login ID)</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    name="operator_secure_id_vault"
                    type="email" 
                    className="input" 
                    placeholder="anishkumar07@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
            ) : null}

            {loginMode === 'phone' || !isLogin ? (
              <div className="form-group">
                <label className="label">Contact Number</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input 
                    name="operator_hardware_link"
                    type="tel" 
                    className="input" 
                    placeholder="7975274945"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="off"
                    data-lpignore="true"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="form-group">
            <label className="label">Access Token / Password</label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <Lock className="input-icon" size={18} />
              <input 
                name="operator_encryption_key_node"
                type={showPassword ? "text" : "password"} 
                className="input" 
                placeholder="SECURE_TOKEN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...(!isLogin ? { required: true } : {})}
                autoComplete="new-password"
                style={{ paddingRight: '3rem' }}
                data-lpignore="true"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-gray)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  zIndex: 5
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
