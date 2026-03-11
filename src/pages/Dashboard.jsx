import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
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
  const [url, setUrl] = useState('');
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
  const generateReport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const vulnerabilities = auditResults.scans.flatMap(s => s.issues);
    const matchedVulns = auditResults.scans.flatMap(s => s.matchedVulnerabilities || []);
    let safetyScoreLocal = auditResults.overallStatus === 'SECURE' ? 95 : Math.max(10, 100 - (vulnerabilities.length * 20));
    const extScore = auditResults.externalSafety?.score ?? safetyScoreLocal;
    const unified = Math.round((safetyScoreLocal * 0.4) + (extScore * 0.6));
    const statusLabel = unified >= 85 ? 'SAFE' : unified >= 60 ? 'NOT SAFE' : 'VULNERABLE';
    const ts = new Date().toLocaleString();

    // ── Background ──
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, W, 297, 'F');

    // ── Header bar ──
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, W, 38, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(0, 38, W, 38);

    // ── Logo text ──
    doc.setFont('courier', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('⚡ TLS_AUDITOR', 14, 20);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('CLASSIFIED SECURITY ASSESSMENT REPORT', 14, 28);
    doc.text(`GENERATED: ${ts}`, 14, 33);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('CONFIDENTIAL // FOR AUTHORIZED PERSONNEL ONLY', W - 14, 20, { align: 'right' });

    // ── Target ──
    let y = 50;
    doc.setFillColor(25, 25, 25);
    doc.roundedRect(14, y - 5, W - 28, 16, 2, 2, 'F');
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y - 5, W - 28, 16, 2, 2, 'S');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(212, 175, 55);
    doc.text('TARGET_ENDPOINT', 20, y + 2);
    doc.setFont('courier', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(auditResults.target, 75, y + 2);
    y += 22;

    // ── Score Grid ──
    const cards = [
      { label: 'UNIFIED THREAT INDEX', value: `${unified}%`, color: unified >= 85 ? [39,201,63] : unified >= 60 ? [255,189,46] : [255,75,75] },
      { label: 'INTERNAL AUDIT', value: `${safetyScoreLocal}%`, color: [212,175,55] },
      { label: 'EXTERNAL INTEL', value: `${extScore}%`, color: [81,175,239] },
      { label: 'OVERALL STATUS', value: statusLabel, color: unified >= 85 ? [39,201,63] : unified >= 60 ? [255,189,46] : [255,75,75] },
    ];
    const cardW = (W - 28 - 9) / 4;
    cards.forEach((c, i) => {
      const x = 14 + i * (cardW + 3);
      doc.setFillColor(20, 20, 20);
      doc.roundedRect(x, y, cardW, 24, 2, 2, 'F');
      doc.setDrawColor(c.color[0], c.color[1], c.color[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(x, y, cardW, 24, 2, 2, 'S');
      doc.setFont('courier', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(150, 150, 150);
      doc.text(c.label, x + cardW / 2, y + 7, { align: 'center' });
      doc.setFont('courier', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.value, x + cardW / 2, y + 18, { align: 'center' });
    });
    y += 32;

    // ── Intelligence source ──
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`INTELLIGENCE_SOURCE: ${auditResults.externalSafety?.provider || 'UNKNOWN'}`, 14, y);
    y += 12;

    // ── Section divider ──
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.3);
    doc.line(14, y, W - 14, y);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(212, 175, 55);
    doc.text('│ TLS_PROTOCOL_STACK_ANALYSIS', 14, y + 7);
    y += 14;

    // ── Protocol entries ──
    auditResults.scans.forEach((scan, i) => {
      if (y > 270) { doc.addPage(); doc.setFillColor(10,10,10); doc.rect(0,0,W,297,'F'); y = 20; }
      doc.setFillColor(18, 18, 18);
      doc.roundedRect(14, y, W - 28, scan.issues.length > 0 ? 10 + scan.issues.length * 7 : 16, 2, 2, 'F');

      const statusColor = scan.status === 'SECURE' ? [39,201,63] : [255,189,46];
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`[${String(i+1).padStart(2,'0')}]  ${scan.protocol} :: ${scan.cipher}`, 20, y + 7);

      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Extraction methodology: Active certificate handshake analysis.', 20, y + 13);

      let issY = y + 19;
      scan.issues.forEach(iss => {
        const c = iss.startsWith('[CRITICAL]') ? [255,75,75] : iss.startsWith('[HIGH]') ? [255,189,46] : [224,172,87];
        doc.setFont('courier', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(c[0], c[1], c[2]);
        const lines = doc.splitTextToSize(`  ${iss}`, W - 40);
        doc.text(lines, 22, issY);
        issY += lines.length * 5.5;
      });

      y += (scan.issues.length > 0 ? 14 + scan.issues.length * 7 : 20);
    });

    // ── Footer ──
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.3);
      doc.line(14, 285, W - 14, 285);
      doc.setFont('courier', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(80, 80, 80);
      doc.text('TLS_AUDITOR // CLASSIFIED REPORT', 14, 290);
      doc.text(`Page ${p} of ${totalPages}`, W - 14, 290, { align: 'right' });
    }

    doc.save(`TLS_AUDIT_${auditResults.target.replace(/[^a-z0-9]/gi,'_')}_${Date.now()}.pdf`);
  };

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

          <div className="safety-score-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <p className="percentage-label">Visual Threat Vector</p>
            <div className="chart-container" style={{ 
              marginTop: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              width: '100%' 
            }}>
              <svg viewBox="0 0 110 110" className="circular-chart" style={{ width: '220px', height: '220px' }}>
                {/* Unified Score - Outer Ring */}
                <circle className="circle-bg" cx="55" cy="55" r="50"></circle>
                <circle className="circle" cx="55" cy="55" r="50" style={{ strokeDasharray, stroke: statusObj.color, strokeWidth: '3.8' }}></circle>
                
                {/* External Intel - Inner Ring */}
                <circle className="circle-bg" cx="55" cy="55" r="38" style={{ strokeWidth: '2', opacity: '0.3' }}></circle>
                <circle className="circle" cx="55" cy="55" r="38" style={{ strokeDasharray: strokeDasharrayExternal, stroke: '#51afef', strokeWidth: '3.5', opacity: '0.8' }}></circle>
              </svg>
              
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                marginTop: '1.5rem', 
                fontSize: '0.7rem', 
                opacity: 0.8,
                letterSpacing: '0.1em',
                fontWeight: 'bold'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusObj.color }}></div> UNIFIED
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#51afef' }}></div> EXTERNAL
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
              <div key={i} style={{ marginBottom: '0.25rem' }}>
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

        {/* ── Download Report Button (Relocated to bottom) ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem', paddingBottom: '3rem' }}>
          <button
            onClick={generateReport}
            style={{
              background: 'linear-gradient(135deg, #d4af37, #f0c040)',
              color: '#000',
              border: 'none',
              borderRadius: '0.6rem',
              padding: '0.9rem 2.8rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '900',
              fontSize: '0.9rem',
              letterSpacing: '0.15rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              boxShadow: '0 10px 30px rgba(212,175,55,0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 15px 45px rgba(212,175,55,0.4)';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(212,175,55,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ⬇ DOWNLOAD_SECURITY_REPORT.PDF
          </button>
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
              autoComplete="off"
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

      <div className="terminal-preview" style={{ marginTop: '1.5rem' }}>
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
