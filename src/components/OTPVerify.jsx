import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { verifyOtp } from '../services/authService';

function OTPVerify({ phone, onVerifySuccess, onCancel }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter valid 6-digit code.');
    
    setLoading(true);
    setError(null);
    try {
      const { error } = await verifyOtp(phone, otp);
      if (error) throw error;
      onVerifySuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <ShieldCheck className="gold-text" size={40} />
        <h1>SECURE_OTP_VERIFICATION</h1>
        <p>Sent to: {phone}</p>
      </div>

      <form onSubmit={handleVerify} className="auth-form">
        <div className="form-group">
          <label>One-Time Code</label>
          <input
            type="text"
            placeholder="......"
            className="auth-input"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'VERIFY_IDENTITY'}
        </button>
        
        <button type="button" className="switch-btn" onClick={onCancel}>
          BACK_TO_LOGIN
        </button>
      </form>
    </div>
  );
}

export default OTPVerify;
