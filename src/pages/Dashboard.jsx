import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Upload, 
  Zap,
  CheckCircle,
  Loader2,
  ChevronRight,
  Terminal,
  X,
  ExternalLink
} from 'lucide-react';
import { runAudit, saveAuditLog } from '../services/auditService';

function DashboardPage({ user, onLogout }) {
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
  const [showReportButton, setShowReportButton] = useState(false);

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
    setShowReportButton(false);
    addLog(`Initiating audit for: ${url}`, 'warn');
    
    try {
      addLog('Scanning server certificate protocols...', 'info');
      const results = await runAudit(url);
      
      addLog('Retrieving third-party threat scores...', 'info');
      addLog('Analyzing cryptographic integrity...', 'success');
      
      setAuditResults(results);
      addLog('Audit complete. Secure record generated.', 'success');
      setShowReportButton(true);

      // Persist to user's history
      await saveAuditLog(url, user, results);
      addLog('Inventory entry successfully synchronized.', 'info');
      
    } catch (err) {
      addLog(`AUDIT_FAILED: ${err.message}`, 'error');
      alert(`Connection Error: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatusInfo = (score) => {
    if (score >= 80) return { color: '#4ade80', text: 'SAFE' };
    if (score >= 60) return { color: '#ECBE7B', text: 'NOT SAFE' };
    if (score >= 40) return { color: '#ff4b4b', text: 'VULNERABLE' };
    return { color: '#8b0000', text: 'CRITICAL' };
  };

  // Rendering logic for Results or Scanner
  if (showResults && auditResults) {
    const vulnerabilities = auditResults.scans.flatMap(s => s.issues);
    const matchedVulns = auditResults.scans.flatMap(s => s.matchedVulnerabilities || []);
    const safetyScoreLocal = auditResults.overallStatus === 'SECURE' ? 98 : Math.max(20, 100 - (vulnerabilities.length * 15));
    const externalScore = auditResults.externalSafety?.score || safetyScoreLocal;
    const safetyScore = Math.round((safetyScoreLocal * 0.4) + (externalScore * 0.6));
    const statusObj = getStatusInfo(safetyScore);
    const strokeDasharray = `${(safetyScore * 314) / 100}, 314`;

    return (
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
            <p className="percentage-label">Unified Threat Index</p>
            <h2 className="percentage-value" style={{ color: statusObj.color }}>{safetyScore}%</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-gray)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>INTERNAL</div>
                <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{safetyScoreLocal}%</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-gray)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>EXTERNAL</div>
                <div style={{ color: '#51afef', fontWeight: 'bold' }}>{externalScore}%</div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', background: `${statusObj.color}15`, padding: '0.4rem 1rem', borderRadius: '2rem', display: 'inline-block', fontWeight: 'bold', color: statusObj.color }}>
              STATUS: {statusObj.text}
            </div>
          </div>

          <div className="chart-container">
            <svg viewBox="0 0 110 110" className="circular-chart" style={{ width: '220px', height: '220px' }}>
              <circle className="circle-bg" cx="55" cy="55" r="50"></circle>
              <circle className="circle" cx="55" cy="55" r="50" style={{ strokeDasharray, stroke: statusObj.color }}></circle>
            </svg>
          </div>
        </div>

        {/* Detailed Scans List */}
        <div className="vulnerability-list" style={{ marginTop: '3rem' }}>
          <h3 style={{ borderLeft: '3px solid var(--gold-primary)', paddingLeft: '1rem', marginBottom: '2rem' }}>TLS_PROTOCOL_STACK_ANALYSIS</h3>
          {auditResults.scans.map((scan, i) => (
            <div key={i} className="vuln-card">
              <div className="vuln-header">
                <div className={`severity-badge ${scan.status === 'SECURE' ? 'low' : 'high'}`}>{scan.status}</div>
                <h4 className="vuln-title">{scan.protocol} :: {scan.ciphersFound} Ciphers</h4>
              </div>
              <p className="vuln-description">Extraction methodology: Active certificate handshake analysis.</p>
              {scan.issues.length > 0 && (
                <div className="vuln-tags">
                  {scan.issues.map((iss, j) => <span key={j} className="tag">{iss}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <header className="dash-header">
        <div>
          <h1 className="title">TLS_SECURITY_AUDITOR</h1>
          <p className="subtitle">High-Fidelity Automated Infrastructure Scanning</p>
        </div>
        <div className="dev-badge">OPERATOR_ACCESS_NODE // {user?.phone}</div>
      </header>

      <div className="upload-container">
        <form onSubmit={handleAudit} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="SYSTEM_ENDPOINT_URL (e.g., google.com)" 
              className="dash-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button className="run-btn" disabled={isAuditing} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuditing ? <Loader2 className="animate-spin" size={18} /> : <><Shield size={18} /> RUN_AUDIT</>}
          </button>
        </form>

        <AnimatePresence>
          {showReportButton && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="view-report-btn"
              onClick={() => setShowResults(true)}
              style={{ position: 'absolute', bottom: '-4rem', left: '0' }}
            >
              <ExternalLink size={18} /> OPEN_MISSION_REPORT
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <Shield size={14} /> ACCESS_NODE
          </div>
          <div className="stat-value">{user?.phone}</div>
          <div className="stat-footer">IP_ENCRYPTED_TUNNEL</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <CheckCircle size={14} /> SYSTEM_STATUS
          </div>
          <div className="stat-value">READY_TO_AUDIT</div>
          <div className="stat-footer">CORE_LOGIC_ONLINE</div>
        </div>
      </div>

      <div className="terminal-preview">
        <div className="terminal-header">
          <div className="terminal-dots"><span></span><span></span><span></span></div>
          <div className="terminal-title">operator@tls-auditor: ~/scout</div>
        </div>
        <div className="terminal-body">
          {terminalLogs.map((log, i) => (
            <div key={i} className={`terminal-line ${log.type}`}>
              <span className="time">[{log.time}]</span>
              <span className="msg">{log.msg}</span>
            </div>
          ))}
          {isAuditing && (
            <div className="terminal-line typing">
              <span className="time">[{new Date().toLocaleTimeString()}]</span>
              <span className="msg">Executing hardware-level scan...</span>
              <span className="cursor"></span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
