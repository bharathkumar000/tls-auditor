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
  ExternalLink,
  Edit3,
  Download,
  RefreshCw,
  ShieldCheck,
  FileText,
  Code2
} from 'lucide-react';
import { runAudit, saveAuditLog, isDomainRegistered, createModificationRequest } from '../services/auditService';

function DashboardPage({ user, onLogout }) {
  const [url, setUrl] = useState(() => {
    return sessionStorage.getItem('tls_audit_url') || '';
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState(() => {
    const saved = sessionStorage.getItem('tls_audit_results');
    return saved ? JSON.parse(saved) : null;
  });
  const [showResults, setShowResults] = useState(() => {
    return sessionStorage.getItem('tls_show_results') === 'true';
  });
  const [terminalLogs, setTerminalLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'info', msg: 'CORE_ENGINE_READY: High-Fidelity Scanning Module Online.' },
    { time: new Date().toLocaleTimeString(), type: 'success', msg: 'Tactical Interface v2.8 stabilized. Awaiting Mission Parameter...' }
  ]);
  const [showReportButton, setShowReportButton] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('tls_audit_results', JSON.stringify(auditResults));
    sessionStorage.setItem('tls_show_results', showResults);
  }, [auditResults, showResults]);

  // Consume injected URL and clear it for future mission fresh starts
  useEffect(() => {
    if (sessionStorage.getItem('tls_audit_url')) {
      sessionStorage.removeItem('tls_audit_url');
    }
  }, []);

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
      
      // Authorized Node Verification
      const registered = await isDomainRegistered(url, user);
      setIsRegistered(registered);
      
      if (registered) {
        addLog(`AUTHORIZED_INFRASTRUCTURE: [${url}] identified in operator vault.`, 'success');
        addLog('Enabling administrative modification protocols (REQUEST_CHANGES).', 'info');
      } else {
        addLog(`GUEST_INFRASTRUCTURE: [${url}] is outside authorized perimeter. Monitoring only.`, 'warn');
      }

      addLog('Audit complete. Cryptographic safety report generated.', 'success');
      setShowReportButton(true);

      // Persist to user's history
      await saveAuditLog(url, user, results);
      addLog('Mission history updated with high-fidelity scan artifacts.', 'info');
      
    } catch (err) {
      addLog(`AUDIT_FAILED: ${err.message}`, 'error');
      // Tactical Error Intercept
      if (err.message.includes('getaddrinfo') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
        setUrlError(`MISSION_CRITICAL: URL NOT FOUND. [${url}] is not globally deployed or has been decommissioned.`);
      } else {
        alert(`Connection Error: ${err.message}`);
      }
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
    const isPlaintext = auditResults.scans.some(s => s.protocol === 'PLAINTEXT_HTTP');
    let safetyScoreLocal = auditResults.overallStatus === 'SECURE' ? 95 : Math.max(10, 100 - (vulnerabilities.length * 20));
    let extScore = auditResults.externalSafety?.score ?? safetyScoreLocal;
    
    if (isPlaintext || auditResults.overallStatus === 'CRITICAL') {
      safetyScoreLocal = 0;
      extScore = 0;
    }

    const unified = Math.round((safetyScoreLocal * 0.4) + (extScore * 0.6));
    const statusLabel = unified >= 80 ? 'SAFE' : unified >= 60 ? 'NOT SAFE' : unified >= 40 ? 'VULNERABLE' : 'CRITICAL';
    const ts = new Date().toLocaleString();

    // ── Background ──
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, W, 297, 'F');

    // ── Header bar ──
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, W, 38, 'F');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.line(0, 38, W, 38);

    // ── Logo Section ──
    doc.setFont('courier', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    doc.text('⚡ TLS_AUDITOR', 15, 20);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('CLASSIFIED SECURITY ASSESSMENT REPORT // V1.3.0', 15, 28);
    doc.text(`MISSION_GENEREATED: ${ts}`, 15, 33);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('CONFIDENTIAL // MISSION_CRITICAL', W - 15, 20, { align: 'right' });

    // ── Target Identification ──
    let y = 50;
    doc.setFillColor(25, 25, 25);
    doc.roundedRect(15, y - 5, W - 30, 20, 2, 2, 'F');
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, y - 5, W - 30, 20, 2, 2, 'S');
    
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text('TARGET_ENDPOINT_ID:', 22, y + 7);
    
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(auditResults.target, 80, y + 7);
    y += 28;

    // ── Tactical Score Grid ──
    const cards = [
      { label: 'UNIFIED INDEX', value: `${unified}%`, color: unified >= 85 ? [39,201,63] : [212,175,55] },
      { label: 'INTERNAL SCAN', value: `${safetyScoreLocal}%`, color: [212,175,55] },
      { label: 'EXTERNAL INTEL', value: `${extScore}%`, color: [81,175,239] },
      { label: 'THREAT_STATUS', value: statusLabel, color: unified >= 85 ? [39,201,63] : unified >= 60 ? [212,175,55] : [255,75,75] },
    ];
    
    const cardW = (W - 30 - 9) / 4;
    cards.forEach((c, i) => {
      const x = 15 + i * (cardW + 3);
      doc.setFillColor(22, 22, 22);
      doc.roundedRect(x, y, cardW, 28, 2, 2, 'F');
      doc.setDrawColor(c.color[0], c.color[1], c.color[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, 28, 2, 2, 'S');
      
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text(c.label, x + cardW / 2, y + 9, { align: 'center' });
      
      doc.setFont('courier', 'bolder');
      doc.setFontSize(13);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.value, x + cardW / 2, y + 21, { align: 'center' });
    });
    y += 38;

    // ── Intelligence Metadata ──
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(`INTELLIGENCE_STREAM: ${auditResults.externalSafety?.provider || 'INTERNAL_SCANNER'}`, 15, y);
    y += 12;

    // ── Section Divider ──
    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.5);
    doc.line(15, y, W - 15, y);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(212, 175, 55);
    doc.text('│ TLS_PROTOCOL_STACK_ANALYSIS', 15, y + 8);
    y += 16;

    // ── Protocol Stack Entries ──
    auditResults.scans.forEach((scan, i) => {
      const blockHeight = Math.max(22, 15 + scan.issues.length * 8);
      if (y + blockHeight > 275) { 
        doc.addPage(); 
        doc.setFillColor(10, 10, 10); 
        doc.rect(0, 0, W, 297, 'F'); 
        y = 30; 
      }
      
      doc.setFillColor(18, 18, 18);
      doc.roundedRect(15, y, W - 30, blockHeight, 2, 2, 'F');
      doc.setDrawColor(40, 40, 40);
      doc.roundedRect(15, y, W - 30, blockHeight, 2, 2, 'S');

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      const protoColor = scan.status === 'SECURE' ? [39,201,63] : [212,175,55];
      doc.setTextColor(protoColor[0], protoColor[1], protoColor[2]);
      doc.text(`[${String(i+1).padStart(2,'0')}] ${scan.protocol} :: ${scan.cipher} [${scan.cipherBits}-BIT]`, 22, y + 8);

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Extraction methodology: Active hardware-level handshake analysis.', 22, y + 14);

      let issY = y + 21;
      scan.issues.forEach(iss => {
        const c = iss.indexOf('CRITICAL') !== -1 ? [255,75,75] : iss.indexOf('HIGH') !== -1 ? [255,189,46] : [212,175,55];
        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(c[0], c[1], c[2]);
        const cleanIss = iss.replace(/^\[.*?\]\s*/, '');
        const prefix = iss.match(/^\[.*?\]/)?.[0] || '';
        
        const lines = doc.splitTextToSize(`${prefix} ${cleanIss}`, W - 45);
        doc.text(lines, 24, issY);
        issY += lines.length * 6;
      });

      y += blockHeight + 6;
    });

    // ── Immutable Footer ──
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.4);
      doc.line(15, 285, W - 15, 285);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('TLS_AUDITOR // SECURITY_INTELLIGENCE // MISSION_LOGS', 15, 291);
      doc.text(`OP_SEQUENCE: ${p} / ${totalPages}`, W - 15, 291, { align: 'right' });
    }

    doc.save(`TLS_AUDIT_${auditResults.target.replace(/[^a-z0-9]/gi,'_')}_REPT.pdf`);
  };

  const downloadCertificate = () => {
    const certData = auditResults.scans.find(s => s.cert && s.cert.raw)?.cert;
    if (!certData || !certData.raw) return;

    // Reconstruct PEM from base64 DER telemetry
    const pem = `-----BEGIN CERTIFICATE-----\n${certData.raw.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
    
    const blob = new Blob([pem], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TLS_CERT_${auditResults.target.replace(/[^a-z0-9]/gi,'_')}.pem`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadRecommendationBrief = () => {
    const doc = new jsPDF();
    const allIssues = [...new Set(auditResults.scans.flatMap(s => s.issues))];
    const allRecs = [...new Set(auditResults.scans.flatMap(s => s.recommendations))];
    
    doc.setProperties({ title: `RECOMMENDATION_BRIEF_${auditResults.target}` });
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55);
    doc.text('TLS_AUDITOR // RECOMMENDATION_REPORT', 20, 30);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`TARGET: ${auditResults.target}`, 20, 40);
    doc.text(`TIMESTAMP: ${new Date().toLocaleString()}`, 20, 45);
    doc.line(20, 50, 190, 50);

    doc.setFontSize(11);
    doc.setTextColor(212, 175, 55);
    doc.text('[DETECTED_VULNERABILITIES]', 20, 65);
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let y = 75;
    allIssues.forEach((iss, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${iss}`, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 2;
    });

    y += 10;
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(212, 175, 55);
    doc.text('[TACTICAL_REMEDIATION_STEPS]', 20, y);
    
    y += 10;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    allRecs.forEach((rec, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 170);
      doc.text(lines, 20, y);
      y += (lines.length * 5) + 2;
    });

    doc.save(`RECOMMENDATION_REPORT_${auditResults.target.replace(/[^a-z0-9]/gi,'_')}.pdf`);
  };

  const downloadConfigSnippet = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFont('courier', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text('HARDENED_NGINX_CONFIGURATION', 20, 30);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`INFRASTRUCTURE_TARGET: ${auditResults.target}`, 20, 40);
    doc.line(20, 45, 190, 45);

    const config = `server {
    listen 443 ssl http2;
    server_name ${auditResults.target};

    # MISSION_CRITICAL_SECURITY_CONFIG (TLS_AUDITOR)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";
    
    # SECURITY_HEADERS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}`;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(config, 25, 60);

    doc.save(`HARDENED_CONFIG_${auditResults.target.replace(/[^a-z0-9]/gi,'_')}.pdf`);
  };

  if (showResults && auditResults) {
    const vulnerabilities = auditResults.scans.flatMap(s => s.issues);
    
    let safetyScore;
    let safetyScoreLocal;
    let externalScore = auditResults.externalSafety?.score ?? 0;

    const isPlaintext = auditResults.scans.some(s => s.protocol === 'PLAINTEXT_HTTP');
    const isCriticalFailure = auditResults.scans.length === 0 || 
                             (auditResults.scans.length === 1 && auditResults.scans[0].protocol === 'NONE_DETECTED') ||
                             isPlaintext;

    if (isCriticalFailure || auditResults.overallStatus === 'CRITICAL') {
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
    const strokeDasharrayInternal = `${(safetyScoreLocal * 238) / 100}, 238`;
    const strokeDasharrayExternal = `${(externalScore * 175) / 100}, 175`;

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
          <div className="safety-score-card" style={{ maxWidth: '1000px' }}>
            <div className="report-split-container">
              {/* ── LEFT NODE: METRICS ── */}
              <div className="report-right-node"> {/* Using right-node class for styling but placing on left */}
                <p className="percentage-label">Unified Threat Index</p>
                <h2 className="percentage-value" style={{ color: statusObj.color, fontSize: '5.5rem' }}>{safetyScore}%</h2>
                
                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-gray)', fontSize: '0.65rem', marginBottom: '0.2rem', letterSpacing: '0.1em' }}>INTERNAL</div>
                    <div style={{ color: 'var(--gold-primary)', fontWeight: '900', fontSize: '1.1rem' }}>{safetyScoreLocal}%</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-gray)', fontSize: '0.65rem', marginBottom: '0.2rem', letterSpacing: '0.1em' }}>EXTERNAL</div>
                    <div style={{ color: '#51afef', fontWeight: '900', fontSize: '1.1rem' }}>{externalScore}%</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', background: `${statusObj.color}20`, padding: '0.4rem 1.25rem', borderRadius: '2rem', display: 'inline-block', fontWeight: '900', color: statusObj.color, border: `1px solid ${statusObj.color}40`, letterSpacing: '0.1em', fontSize: '0.85rem' }}>
                  STATUS: {statusObj.text}
                </div>
              </div>

              {/* ── TACTICAL DIVIDER ── */}
              <div className="vertical-divider"></div>

              {/* ── RIGHT NODE: RADAR ── */}
              <div className="report-left-node"> {/* Using left-node class for styling but placing on right */}
                <p className="percentage-label">Visual Threat Vector</p>
                <div className="chart-container">
                  <svg viewBox="0 0 110 110" className="circular-chart" style={{ width: '250px', height: '250px' }}>
                    <circle className="circle-bg" cx="55" cy="55" r="50"></circle>
                    <circle className="circle" cx="55" cy="55" r="50" style={{ strokeDasharray, stroke: statusObj.color, strokeWidth: '4' }}></circle>
                    <circle className="circle-bg" cx="55" cy="55" r="38" style={{ strokeWidth: '2', opacity: '0.15' }}></circle>
                    <circle className="circle" cx="55" cy="55" r="38" style={{ strokeDasharray: strokeDasharrayInternal, stroke: 'var(--gold-primary)', strokeWidth: '3', opacity: '0.6' }}></circle>
                    <circle className="circle-bg" cx="55" cy="55" r="28" style={{ strokeWidth: '1.5', opacity: '0.1' }}></circle>
                    <circle className="circle" cx="55" cy="55" r="28" style={{ strokeDasharray: strokeDasharrayExternal, stroke: '#51afef', strokeWidth: '2.5', opacity: '0.8' }}></circle>
                  </svg>
                  
                  <div className="chart-legend">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusObj.color, boxShadow: `0 0 10px ${statusObj.color}40` }}></div> UNIFIED
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold-primary)', boxShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }}></div> INTERNAL
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#51afef', boxShadow: '0 0 10px rgba(81, 175, 239, 0.4)' }}></div> EXTERNAL
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── MISSION INTELLIGENCE TERMINAL ── */}
        <div className="terminal-preview" style={{ marginTop: '3rem' }}>
          <div className="terminal-header" style={{ display: isRegistered ? 'grid' : 'block', gridTemplateColumns: isRegistered ? '1fr 1fr' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="terminal-dots"><span></span><span></span><span></span></div>
              <div className="terminal-title">TLS_PROTOCOL_STACK_ANALYSIS // {auditResults.target}</div>
            </div>
            {isRegistered && (
              <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                <div className="terminal-title" style={{ color: 'var(--gold-primary)' }}>CRYPTOGRAPHIC_SOLUTIONS_ENGINE // REMEDIATION</div>
              </div>
            )}
          </div>
          
          <div className="terminal-body" style={{ 
            display: isRegistered ? 'grid' : 'block', 
            gridTemplateColumns: isRegistered ? '1fr 1fr' : 'none',
            gap: isRegistered ? '1px' : '0',
            background: isRegistered ? 'rgba(255,255,255,0.05)' : 'transparent'
          }}>
            {/* LEFT PANE: LOGS & SCAN DATA */}
            <div style={{ background: isRegistered ? 'rgba(0,0,0,0.2)' : 'transparent', padding: isRegistered ? '1.5rem' : '0' }}>
              {auditResults.scans.map((scan, i) => (
                <div key={i} style={{ marginBottom: '1.5rem' }}>
                  <div className="terminal-line success">
                    <span className="time">[{scan.protocol}]</span>
                    <span className="msg" style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                      :: {scan.cipher} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>[{scan.cipherBits || 'N/A'}-BIT]</span>
                    </span>
                  </div>
                  {scan.issues.map((iss, j) => (
                    <div key={j} className="terminal-line error" style={{ marginLeft: '1rem' }}>
                      <span className="msg" style={{ fontSize: '0.8rem' }}>{iss}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* RIGHT PANE: SOLUTIONS (ONLY FOR REGISTERED) */}
            {isRegistered && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                {auditResults.scans.map((scan, i) => (
                  <div key={i} style={{ marginBottom: '1.5rem' }}>
                    <div className="terminal-line info">
                      <span className="time" style={{ color: 'var(--gold-primary)' }}>[REMEDY_{i+1}]</span>
                      <span className="msg" style={{ fontWeight: '800', fontSize: '0.8rem' }}>{scan.protocol} SECURITY_FIX</span>
                    </div>
                    {scan.recommendations.map((rec, j) => (
                      <div key={j} className="terminal-line success" style={{ marginLeft: '1rem', opacity: 0.8 }}>
                        <ChevronRight size={12} style={{ display: 'inline', marginRight: '5px' }} />
                        <span className="msg" style={{ fontSize: '0.75rem' }}>{rec}</span>
                      </div>
                    ))}
                    {scan.recommendations.length === 0 && (
                      <div className="terminal-line success" style={{ marginLeft: '1rem', color: '#4ade80' }}>
                        <span className="msg" style={{ fontSize: '0.75rem' }}>Node compliant. No changes required for this stack.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '3rem', paddingBottom: '4rem' }}>
          {isRegistered && (
            <button 
              className="run-btn" 
              onClick={() => setShowRequestModal(true)}
              style={{ padding: '1rem 2.5rem' }}
            >
              <Edit3 size={18} /> REQUEST_CHANGES.MOD
            </button>
          )}
          
          <button className="run-btn" onClick={downloadRecommendationBrief} style={{ padding: '1rem 2.5rem', background: 'rgba(212,175,55,0.15)', color: 'var(--gold-primary)' }}>
            <FileText size={18} /> RECOMMENDATION_REPORT.PDF
          </button>
          <button className="run-btn" onClick={downloadConfigSnippet} style={{ padding: '1rem 2.5rem', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            <Code2 size={18} /> CONFIG_SNIPPET.PDF
          </button>
          <button className="run-btn" onClick={generateReport} style={{ padding: '1rem 2.5rem' }}>
            <Download size={20} /> DOWNLOAD_REPORT.PDF
          </button>
          {auditResults.scans.some(s => s.cert && s.cert.raw) && (
            <button className="run-btn" onClick={downloadCertificate} style={{ padding: '1rem 2.5rem', background: '#51afef', color: '#000', borderColor: '#51afef70' }}>
              <ShieldCheck size={20} /> DOWNLOAD_CERTIFICATE.PEM
            </button>
          )}
        </div>

        {/* ── MISSION_ERROR_POPUP ── */}
        <AnimatePresence>
          {urlError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="error-popup-card"
              >
                <div className="popup-header">
                  <AlertTriangle className="error-icon" size={24} />
                  <h3>SECURE_NODE_ERROR</h3>
                  <button className="close-popup" onClick={() => setUrlError(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="popup-body">
                  <p className="error-code">ERROR_CODE: 404_DEPLOYMENT_NOT_FOUND</p>
                  <p className="error-msg">{urlError}</p>
                  <div className="popup-action">
                    <button className="remedy-btn" onClick={() => { setUrlError(null); setUrl(''); }}>
                      CLEAR_ENDPOINT_CACHE
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TACTICAL_CHANGE_REQUEST_POPUP ── */}
        <AnimatePresence>
          {showRequestModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              style={{ zIndex: 1000 }}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="request-modal-card"
                style={{
                  background: 'rgba(10,10,10,0.95)',
                  border: '1px solid var(--gold-primary)40',
                  borderRadius: '16px',
                  width: '90%',
                  maxWidth: '600px',
                  padding: '2.5rem',
                  boxShadow: '0 0 50px rgba(212, 175, 55, 0.1)',
                  backdropFilter: 'blur(20px)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Edit3 className="gold-icon" size={24} style={{ color: 'var(--gold-primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', letterSpacing: '2px' }}>MODIFICATION_REQUEST</h3>
                      <p style={{ margin: 0, opacity: 0.5, fontSize: '0.7rem' }}>TARGET_PROVIDER: GODADDY / CLOUDFLARE_EDGE</p>
                    </div>
                  </div>
                  <button className="close-popup" onClick={() => setShowRequestModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6 }}>
                    <X size={20} />
                  </button>
                </div>

                <form className="remedy-form" onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  try {
                    await createModificationRequest({
                      operatorName: user.fullName || 'LEAD_OPERATOR_ANISH',
                      contactNode: user.phone || '7975274945',
                      secureEmail: user.email || 'anishkumar07@gmail.com',
                      targetDomain: auditResults?.target || 'N/A',
                      requestedChanges: auditResults?.scans.flatMap(s => s.recommendations) || []
                    });
                    
                    setIsSubmitting(false);
                    setIsSubmitted(true);
                    setTimeout(() => {
                      setIsSubmitted(false);
                      setShowRequestModal(false);
                      addLog('TACTICAL_REQUEST_SENT: Provider notified of TLS reconfiguration. Data vaulted.', 'success');
                    }, 2000);
                  } catch (err) {
                    setIsSubmitting(false);
                    alert('CRITICAL_POST_FAILURE: Architecture vault rejected the packet.');
                  }
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                      <label style={{ display: 'block', margin: '0 0 8px 12px', opacity: 0.5, fontSize: '0.65rem' }}>OPERATOR_NAME</label>
                      <input type="text" value={user.fullName || 'LEAD_OPERATOR_ANISH'} readOnly style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(136, 112, 35, 0.3)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.9rem' }} />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', margin: '0 0 8px 12px', opacity: 0.5, fontSize: '0.65rem' }}>CONTACT_NODE</label>
                      <input type="text" value={user.phone || '7975274945'} readOnly style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(136, 112, 35, 0.3)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.9rem' }} />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', margin: '0 0 8px 12px', opacity: 0.5, fontSize: '0.65rem' }}>SECURE_EMAIL</label>
                      <input type="text" value={user.email || 'anishkumar07@gmail.com'} readOnly style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(136, 112, 35, 0.3)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.9rem' }} />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', margin: '0 0 8px 12px', opacity: 0.5, fontSize: '0.65rem' }}>TARGET_DOMAIN</label>
                      <input type="text" value={auditResults?.target || 'N/A'} readOnly style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(136, 112, 35, 0.3)', borderRadius: '8px', padding: '12px', color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.9rem' }} />
                    </div>
                  </div>

                  <div className="changes-preview" style={{ background: 'rgba(0,0,0,0.3)', border: '1px dashed var(--gold-primary)30', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', letterSpacing: '1px', opacity: 0.8 }}>RECOMMENDED_RECONFIGURATIONS:</h4>
                    {auditResults?.scans.flatMap(s => s.recommendations).map((rec, k) => (
                      <div key={k} style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '8px 0', fontSize: '0.8rem', opacity: 0.7 }}>
                        <ChevronRight size={14} style={{ color: 'var(--gold-primary)' }} /> {rec}
                      </div>
                    ))}
                    {auditResults?.scans.flatMap(s => s.recommendations).length === 0 && (
                      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>No critical changes required. Node is secure.</p>
                    )}
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'flex', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                      <input required type="checkbox" style={{ accentColor: 'var(--gold-primary)', transform: 'scale(1.2)' }} />
                      <span style={{ fontSize: '0.75rem', opacity: 0.8, lineHeight: '1.4' }}>
                        I request the domain provider to implement the above TLS configuration changes to mitigate mission-critical cryptographic vulnerabilities.
                      </span>
                    </label>
                  </div>

                  <button 
                    disabled={isSubmitting || isSubmitted}
                    className="run-btn" 
                    style={{ width: '100%', padding: '1.2rem', position: 'relative' }}
                  >
                    {isSubmitting ? <Loader2 size={24} className="spin" /> : 
                     isSubmitted ? <><CheckCircle size={20} style={{ marginRight: '8px' }} /> REQUEST_DEPLOED</> : 
                     'SEND_MODIFICATION_PACKET'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 2rem;
          }
          .error-popup-card {
            background: #121212;
            border: 1px solid #ff4b4b;
            border-radius: 12px;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 0 50px rgba(255, 75, 75, 0.2);
            overflow: hidden;
          }
          .popup-header {
            background: rgba(255, 75, 75, 0.1);
            padding: 1.25rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid rgba(255, 75, 75, 0.2);
          }
          .popup-header h3 {
            font-family: var(--font-mono);
            margin: 0;
            font-size: 1rem;
            letter-spacing: 0.1em;
            color: #ff4b4b;
            font-weight: 800;
          }
          .error-icon { color: #ff4b4b; }
          .close-popup {
            margin-left: auto;
            background: transparent;
            border: none;
            color: var(--text-gray);
            cursor: pointer;
            transition: 0.2s;
          }
          .close-popup:hover {
            color: white;
            transform: scale(1.1);
          }
          .popup-body { padding: 2rem 1.5rem; }
          .error-code {
            font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-gray); margin-bottom: 0.5rem; opacity: 0.6;
          }
          .error-msg { color: white; font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; font-weight: 500; }
          .remedy-btn {
            width: 100%; background: #ff4b4b; color: white; border: none; padding: 1rem;
            border-radius: 8px; font-family: var(--font-mono); font-weight: 900; letter-spacing: 0.1em;
            cursor: pointer; transition: 0.3s;
          }
          .remedy-btn:hover {
            background: #ff3333;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 75, 75, 0.3);
          }
        `}</style>
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
        <div className="dev-badge">OPERATOR_ACCESS_NODE // {user?.phone || user?.email}</div>
      </header>

      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-header"><Shield size={14} /> ACCESS_NODE</div>
          <div className="stat-value">{user?.phone || user?.email}</div>
          <div className="stat-footer">IP_ENCRYPTED_TUNNEL</div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><CheckCircle size={14} /> SYSTEM_STATUS</div>
          <div className="stat-value">READY_TO_AUDIT</div>
          <div className="stat-footer">CORE_LOGIC_ONLINE</div>
        </div>
      </div>

      <div className="upload-container">
        <form onSubmit={handleAudit} style={{ width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="SYSTEM_ENDPOINT_URL (e.g., google.com)" 
                className="dash-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ width: '100%' }}
                autoComplete="off"
              />
            </div>
            <button className="run-btn" disabled={isAuditing} style={{ position: 'relative', right: '0', top: '0', height: '48px', minWidth: '140px' }}>
              {isAuditing ? <Loader2 className="animate-spin" size={16} /> : 'RUN_AUDIT'}
            </button>
          </div>
        </form>
      </div>

      <div className="terminal-preview" style={{ marginTop: '1.5rem' }}>
        <div className="terminal-header">
          <div className="terminal-dots"><span></span><span></span><span></span></div>
          <div className="terminal-title">operator@tls-auditor: ~/scout</div>
        </div>
        <div className="terminal-body" style={{ minHeight: '160px' }}>
          {terminalLogs.map((log, i) => (
            <div key={i} className={`terminal-line ${log.type}`}>
              <span className="time">{log.time}</span>
              <span className="msg">{log.msg}</span>
            </div>
          ))}
          {isAuditing && (
            <div className="terminal-line typing">
              <span className="time">{new Date().toLocaleTimeString()}</span>
              <span className="msg">Executing hardware-level handshake analysis...</span>
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
            <button className="view-report-btn" onClick={() => setShowResults(true)}>
              <ExternalLink size={18} /> OPEN_MISSION_REPORT
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default DashboardPage;
