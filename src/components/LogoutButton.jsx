import React from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '../services/authService';

function LogoutButton({ onLogoutSuccess }) {
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('tls_session_active');
      onLogoutSuccess();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>
      <LogOut size={20} /> <span className="hide-mobile">SIGNOUT</span>
    </button>
  );
}

export default LogoutButton;
