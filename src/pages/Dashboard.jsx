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
    
    // 🧠 INTELLIGENT SCORING: No protocols = 0% safety.
    let safetyScore;
    let safetyScoreLocal;
    let externalScore = auditResults.externalSafety?.score ?? 0;

    if (auditResults.scans.length === 1 && auditResults.scans[0].protocol === 'NONE_DETECTED') {
      safetyScoreLocal = 0;
      safetyScore = 0;
      externalScore = 0;
    } else {
      safetyScoreLocal = auditResults.overallStatus === 'SECURE' ? 95 : Math.max(10, 100 - (vulnerabilities.length * 20));
      const finalExternal = auditResults.externalSafety?.score ?? safetyScoreLocal;
      safetyScore = Math.round((safetyScoreLocal * 0.4) + (finalExternal * 0.6));
    }
    
    const statusObj = getStatusInfo(safetyScore);
    const strokeDasharray = `${(safetyScore * 314) / 100}, 314`;
    const strokeDasharrayExternal = `${(externalScore * 238) / 100}, 238`;

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

            <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-gray)', letterSpacing: '0.15em', fontWeight: '800' }}>INTELLIGENCE_SOURCE:</span>
              <span style={{ 
                background: auditResults.externalSafety.provider !== 'SIMULATED' ? 'var(--gold-primary)20' : 'rgba(255,255,255,0.05)', 
                color: auditResults.externalSafety.provider !== 'SIMULATED' ? 'var(--gold-primary)' : 'var(--text-gray)',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.25rem',
                fontSize: '0.7rem',
                fontWeight: '900',
                fontFamily: 'var(--font-mono)',
                border: `1px solid ${auditResults.externalSafety.provider !== 'SIMULATED' ? 'var(--gold-primary)40' : 'rgba(255,255,255,0.1)'}`
              }}>
                {auditResults.externalSafety.provider}
              </span>
            </div>
            {auditResults.cryptCheck?.grade && auditResults.externalSafety.provider === 'CRYPTCHECK' && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-gray)', opacity: 0.6 }}>
                ASSESSMENT_GRADE: <span style={{ color: 'white' }}>{auditResults.cryptCheck.grade}</span>
              </div>
            )}
          </div>

          <div className="safety-score-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p className="percentage-label">Visual Threat Vector</p>
            <div className="chart-container" style={{ marginTop: '1rem' }}>
              <svg viewBox="0 0 110 110" className="circular-chart" style={{ width: '220px', height: '220px' }}>
                {/* Unified Score - Outer Ring */}
                <circle className="circle-bg" cx="55" cy="55" r="50"></circle>
                <circle className="circle" cx="55" cy="55" r="50" style={{ strokeDasharray, stroke: statusObj.color, strokeWidth: '3.8' }}></circle>
                
                {/* External Intel - Inner Ring */}
                <circle className="circle-bg" cx="55" cy="55" r="38" style={{ strokeWidth: '2', opacity: '0.3' }}></circle>
                <circle className="circle" cx="55" cy="55" r="38" style={{ strokeDasharray: strokeDasharrayExternal, stroke: '#51afef', strokeWidth: '3.5', opacity: '0.8' }}></circle>
              </svg>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.6rem', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusObj.color }}></div> UNIFIED
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#51afef' }}></div> EXTERNAL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Scans List - Full Terminal Style */}
        <div className="terminal-preview" style={{ marginTop: '3rem' }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <span style={{ backgroundColor: '#ff5f56' }}></span>
              <span style={{ backgroundColor: '#ffbd2e' }}></span>
              <span style={{ backgroundColor: '#27c93f' }}></span>
            </div>
            <div className="terminal-title">TLS_PROTOCOL_STACK_ANALYSIS // {auditResults.target}</div>
          </div>
          <div className="terminal-body">
            {auditResults.scans.map((scan, i) => (
              <div key={i} style={{ marginBottom: '0.75rem' }}>
                <div className="terminal-line success">
                  <span className="time">[{String(i + 1).padStart(2, '0')}]</span>
                  <span className="msg" style={{ color: scan.status === 'SECURE' ? '#27c93f' : '#ffbd2e', fontWeight: 'bold' }}>
                    {scan.protocol} :: {scan.cipher} — <span style={{ opacity: 0.8 }}>{scan.status}</span>
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="time" style={{ opacity: 0 }}>[00]</span>
                  <span className="msg" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                    Extraction methodology: Active certificate handshake analysis.
                  </span>
                </div>
                {scan.issues.map((iss, j) => (
                  <div key={j} className="terminal-line error">
                    <span className="time" style={{ opacity: 0 }}>[00]</span>
                    <span className="msg" style={{ color: iss.startsWith('[CRITICAL]') ? '#ff4b4b' : iss.startsWith('[HIGH]') ? '#ffbd2e' : '#e0ac57' }}>
                      {iss}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {auditResults.scans.length === 0 && (
              <div className="terminal-line error">
                <span className="msg">No protocol entries detected.</span>
              </div>
            )}
          </div>
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

      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
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

      <div className="upload-container">
        <form onSubmit={handleAudit} style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="SYSTEM_ENDPOINT_URL (e.g., google.com)" 
              className="dash-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ width: '100%', paddingRight: '10rem' }}
            />
            <button 
              className="run-btn" 
              disabled={isAuditing} 
              style={{ 
                position: 'absolute', 
                right: '0.5rem', 
                padding: '0.6rem 1.5rem',
                fontSize: '0.8rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}
            >
              {isAuditing ? <Loader2 className="animate-spin" size={16} /> : <><Shield size={16} /> RUN_AUDIT</>}
            </button>
          </div>
        </form>
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

      <AnimatePresence>
        {showReportButton && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}
          >
            <button 
              className="view-report-btn"
              onClick={() => setShowResults(true)}
            >
              <ExternalLink size={18} /> OPEN_MISSION_REPORT
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default DashboardPage;
