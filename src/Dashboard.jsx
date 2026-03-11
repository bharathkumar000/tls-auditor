import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Upload, 
  Globe, 
  Zap,
  LayoutDashboard,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Terminal
} from 'lucide-react';

function Dashboard({ onLogout }) {
  const [url, setUrl] = useState(() => sessionStorage.getItem('tls_audit_url') || '');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState(() => {
    const saved = sessionStorage.getItem('tls_audit_results');
    return saved ? JSON.parse(saved) : null;
  });
  const [showResults, setShowResults] = useState(() => {
    return sessionStorage.getItem('tls_show_results') === 'true';
  });
  const [terminalLogs, setTerminalLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'info', msg: 'System initialized. Waiting for input...' }
  ]);

  useEffect(() => {
    sessionStorage.setItem('tls_audit_url', url);
    sessionStorage.setItem('tls_audit_results', JSON.stringify(auditResults));
    sessionStorage.setItem('tls_show_results', showResults);
  }, [url, auditResults, showResults]);

  const addLog = (msg, type = 'info') => {
    setTerminalLogs(prev => [...prev.slice(-8), { 
      time: new Date().toLocaleTimeString(), 
      type, 
      msg 
    }]);
  };

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsAuditing(true);
    setAuditResults(null);
    addLog(`Initializing audit for: ${url}`, 'info');
    
    try {
      const response = await fetch('http://localhost:3001/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      setAuditResults(data);
      
      if (data.overallStatus === 'SECURE') {
        addLog(`Audit Complete: ${data.target} is SECURE`, 'success');
      } else {
        addLog(`Audit Complete: Vulnerabilities detected in ${data.target}`, 'warn');
      }
      
      data.scans.forEach(scan => {
        addLog(`Protocol Support: ${scan.protocol} with ${scan.cipher}`, 'info');
        if (scan.issues.length > 0) {
          scan.issues.forEach(issue => addLog(`ISSUE: ${issue}`, 'warn'));
        }
      });

      // Automatically show results after short delay for effect
      setTimeout(() => setShowResults(true), 1500);

    } catch (err) {
      addLog(`AUDIT_FAIL: ${err.message}`, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  if (showResults && auditResults) {
    const vulnerabilities = auditResults.scans.flatMap(s => s.issues);
    const recommendations = auditResults.scans.flatMap(s => s.recommendations);
    const safetyScore = auditResults.overallStatus === 'SECURE' ? 98 : Math.max(20, 100 - (vulnerabilities.length * 15));
    const strokeDasharray = `${(safetyScore * 314) / 100}, 314`;

    const getStatusInfo = (score) => {
      if (score >= 80) return { color: '#4ade80', text: 'SAFE' };
      if (score >= 60) return { color: '#ECBE7B', text: 'NOT SAFE' };
      if (score >= 40) return { color: '#ff4b4b', text: 'VULNERABLE' };
      return { color: '#8b0000', text: 'CRITICAL' };
    };

    const statusObj = getStatusInfo(safetyScore);

    return (
      <div className="dashboard-container">
        <div className="bg-mesh"></div>
        <div className="bg-grid"></div>

        <nav className="side-nav">
          <div className="nav-brand"><Zap className="gold-text" size={24} /></div>
          <div className="nav-links">
            <button className="nav-btn active"><LayoutDashboard size={20} /></button>
            <button className="nav-btn"><Shield size={20} /></button>
          </div>
          <button className="logout-btn" onClick={onLogout}><LogOut size={20} /></button>
        </nav>

        <main className="main-content results-view">
          <button className="back-btn" onClick={() => setShowResults(false)}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> CLOSE REPORT
          </button>

          <header className="results-header">
            <h1 className="title">AUDIT_SECURITY_REPORT</h1>
            <div className="url-banner">{auditResults.target}</div>
          </header>

          <div className="safety-grid">
            <div className="safety-score-card">
              <p className="percentage-label">Percentage of Safety</p>
              <h2 className="percentage-value" style={{ color: statusObj.color }}>{safetyScore}%</h2>
              <div style={{ 
                marginTop: '1rem', 
                fontSize: '0.9rem', 
                fontWeight: 'bold', 
                color: statusObj.color,
                letterSpacing: '0.1em',
                background: `${statusObj.color}15`,
                padding: '0.4rem 1rem',
                borderRadius: '2rem',
                display: 'inline-block'
              }}>
                STATUS: {statusObj.text}
              </div>
            </div>
            <div className="chart-container">
              <svg viewBox="0 0 110 110" className="circular-chart">
                <circle className="circle-bg" cx="55" cy="55" r="50"></circle>
                <circle 
                  className="circle" 
                  cx="55" cy="55" r="50" 
                  style={{ 
                    strokeDasharray, 
                    stroke: statusObj.color,
                    filter: `drop-shadow(0 0 8px ${statusObj.color}80)`
                  }}
                ></circle>
              </svg>
            </div>
          </div>

          <div className="dual-info-grid">
            <div className="info-box">
              <h3><AlertTriangle size={18} /> Vulnerabilities</h3>
              <ul className="vulnerability-list">
                {vulnerabilities.length > 0 ? (
                  vulnerabilities.map((v, i) => <li key={i}>{v}</li>)
                ) : (
                  <li style={{ background: 'rgba(152, 190, 101, 0.1)', borderLeftColor: '#98be65' }}>
                    No security vulnerabilities detected.
                  </li>
                )}
              </ul>
            </div>
            <div className="info-box">
              <h3><Zap size={18} /> Recommended Changes</h3>
              <ul className="changes-list">
                {recommendations.length > 0 ? (
                  [...new Set(recommendations)].map((r, i) => <li key={i}>{r}</li>)
                ) : (
                  <li>System operating at optimal security parameters.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="info-box" style={{ marginBottom: '3rem', width: '100%', borderColor: 'rgba(212, 175, 55, 0.2)' }}>
            <h3><Terminal size={18} /> Security Analysis & Rationale</h3>
            <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1rem' }}>
                <span className="gold-text">ANALYSIS:</span> Our automated engine detected that the server infrastructure 
                {vulnerabilities.length > 0 
                  ? ` is using outdated handshake protocols which are susceptible to downgrade attacks (like POODLE).`
                  : ` is correctly enforcing modern encryption standards (TLS 1.2+).`
                }
              </p>
              <p>
                <span className="gold-text">RATIONALE:</span> The proposed configuration below enforces <span className="gold-text">Strict Transport Security</span>. 
                By disabling older ciphers and versions (SSL/TLS 1.0/1.1), we eliminate over 90% of common automated exploit vectors targeting web-facing infrastructure. 
                Using <span className="gold-text">ECDHE</span> ensure "Perfect Forward Secrecy," meaning even if the private key is compromised later, past sessions remain encrypted.
              </p>
            </div>
          </div>

          <div className="best-code-section">
            <div className="code-header">
              <span className="code-label">SECURE_TLS_CONFIG.js</span>
              <button className="run-btn" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>COPY CODE</button>
            </div>
            <div className="code-block">
{`const SECURE_TLS_CONFIG = {
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256',
  honorCipherOrder: true,
  rejectUnauthorized: true
};`}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>

      {/* Sidebar / Navigation */}
      <nav className="side-nav">
        <div className="nav-brand">
          <Zap className="gold-text" size={24} />
        </div>
        <div className="nav-links">
          <button className="nav-btn active"><LayoutDashboard size={20} /></button>
          <button className="nav-btn"><Shield size={20} /></button>
          <button className="nav-btn"><Globe size={20} /></button>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={20} />
        </button>
      </nav>

      <main className="main-content">
        <header className="dash-header">
          <div className="user-profile">
            <h1 className="title">OPERATOR_ACCESS</h1>
            <p className="subtitle">ID: 001 // SECURE_NODE_ALPHA</p>
          </div>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="SEARCH SYSTEM..." className="dash-input" />
          </div>
        </header>

        <div className="stats-grid">
          <motion.div 
            whileHover={{ y: -5 }}
            className={`stat-card ${auditResults?.overallStatus === 'VULNERABLE' ? 'vulnerable' : ''}`}
          >
            <div className="stat-header">
              <Shield className="gold-text" size={20} />
              <span>TLS_SECURITY_RESULT</span>
            </div>
            <div className="stat-value">
              {isAuditing ? 'ANALYZING...' : (auditResults?.overallStatus || 'READY')}
            </div>
            <div className="stat-footer">
              {auditResults ? `${auditResults.scans.length} PROTOCOLS TESTED` : 'WAITING FOR INITIALIZATION'}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="stat-card"
          >
            <div className="stat-header">
              <Zap className="gold-text" size={20} />
              <span>CERT_ISSUER</span>
            </div>
            <div className="stat-value">
              {auditResults?.scans[0]?.cert?.issuer || 'N/A'}
            </div>
            <div className="stat-footer">
              VERIFIED BY SECURE TRUST
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="upload-section"
        >
          <form onSubmit={handleAudit} className="upload-container">
            <Upload className="gold-text" size={24} />
            <input 
              type="text" 
              placeholder="ENTER URL TO AUDIT (e.g. google.com)" 
              className="upload-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit" className="run-btn" disabled={isAuditing}>
              {isAuditing ? <Loader2 className="animate-spin" size={20} /> : 'INITIALIZE AUDIT'}
            </button>
          </form>
        </motion.div>

        <section className="terminal-preview">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span></span><span></span><span></span>
            </div>
            <span className="terminal-title">system_logs.sh — {url || 'idle'}</span>
          </div>
          <div className="terminal-body">
            {terminalLogs.map((log, i) => (
              <p key={i} className="log-line">
                <span className="log-time">[{log.time}]</span>{' '}
                <span className={`log-${log.type}`}>{log.type.toUpperCase()}:</span> {log.msg}
              </p>
            ))}
            {isAuditing && <p className="log-line cursor-log">_</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
