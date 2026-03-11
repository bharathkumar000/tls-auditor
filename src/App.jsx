import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { logout } from './services/authService';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import HistoryPage from './pages/History';
import TopNav from './components/TopNav';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('tls_session_active') === 'true';
  });
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'vulndb'
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tls_user_data');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Check for existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        const userData = {
          phone: session.user.phone || '',
          email: session.user.user_metadata?.email || '',
          fullName: session.user.user_metadata?.full_name || ''
        };
        setUser(userData);
        localStorage.setItem('tls_user_data', JSON.stringify(userData));
        localStorage.setItem('tls_session_active', 'true');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        const userData = {
          phone: session.user.phone || '',
          email: session.user.user_metadata?.email || '',
          fullName: session.user.user_metadata?.full_name || ''
        };
        setUser(userData);
        localStorage.setItem('tls_user_data', JSON.stringify(userData));
        localStorage.setItem('tls_session_active', 'true');
      } else {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('tls_session_active');
        localStorage.removeItem('tls_user_data');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setActiveView('dashboard'); // Ensure we always land on home/dashboard
    
    // Clear previous scan results to land on a fresh "Home" page
    sessionStorage.removeItem('tls_show_results');
    sessionStorage.removeItem('tls_audit_results');
    
    localStorage.setItem('tls_session_active', 'true');
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('tls_session_active');
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard-container">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      
      <TopNav 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onLogout={handleLogout} 
      />

      {activeView === 'dashboard' ? (
        <DashboardPage user={user} onLogout={handleLogout} />
      ) : (
        <HistoryPage user={user} onReAudit={(target) => {
          setActiveView('dashboard');
          // If we had a setter for url in DashboardPage, we'd pass it here.
          // For now, it will use sessionStorage if shared, or we can add a bridge.
          if (target) sessionStorage.setItem('tls_audit_url', target);
        }} />
      )}
    </div>
  );
}

export default App;
