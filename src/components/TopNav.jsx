import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  Shield,
  LogOut
} from 'lucide-react';
import LogoutButton from './LogoutButton';

function TopNav({ activeView, onViewChange, onLogout }) {
  return (
    <nav className="top-nav">
      <div className="nav-left">
        <div className="nav-brand"><Zap className="gold-text" size={24} /></div>
        <span className="brand-text">TLS_AUDITOR</span>
      </div>
      
      <div className="nav-center">
        <button 
          className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <LayoutDashboard size={20} /> <span>DASHBOARD</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'records' ? 'active' : ''}`}
          onClick={() => onViewChange('records')}
        >
          <Shield size={20} /> <span>RECORDS_VAULT</span>
        </button>
      </div>

      <div className="nav-right">
        <LogoutButton onLogoutSuccess={onLogout} />
      </div>
    </nav>
  );
}

export default TopNav;
