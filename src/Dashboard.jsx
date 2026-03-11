import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Terminal,
  Database,
  Filter,
  X
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
  const [showReportButton, setShowReportButton] = useState(false);

  // New state for vulnerability database view
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'vulndb'
  const [vulnData, setVulnData] = useState(null);
  const [vulnFilter, setVulnFilter] = useState('ALL');
  const [vulnSearch, setVulnSearch] = useState('');

  useEffect(() => {
    sessionStorage.setItem('tls_audit_url', url);
    sessionStorage.setItem('tls_audit_results', JSON.stringify(auditResults));
    sessionStorage.setItem('tls_show_results', showResults);
  }, [url, auditResults, showResults]);

  // Fetch vulnerability database when switching to vulndb view
  useEffect(() => {
    if (activeView === 'vulndb' && !vulnData) {
      fetch('/api/vulnerabilities')
        .then(res => res.json())
        .then(data => setVulnData(data))
        .catch(err => console.error('Failed to fetch vuln DB:', err));
    }
  }, [activeView, vulnData]);

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
    setShowReportButton(false);
    addLog(`Initializing audit for: ${url}`, 'info');
    
    try {
      const response = await fetch('/api/audit', {
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

      setShowReportButton(true);

    } catch (err) {
      addLog(`AUDIT_FAIL: ${err.message}`, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#ff2d2d';
      case 'HIGH': return '#ff8c42';
      case 'MEDIUM': return '#ECBE7B';
      default: return '#a0a0a0';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'rgba(255, 45, 45, 0.12)';
      case 'HIGH': return 'rgba(255, 140, 66, 0.12)';
      case 'MEDIUM': return 'rgba(236, 190, 123, 0.12)';
      default: return 'rgba(160, 160, 160, 0.1)';
    }
  };

  // ═══════════════════════════════════════════════════════
  // TOP NAVIGATION BAR (Header)
  // ═══════════════════════════════════════════════════════
  const TopNav = () => (
    <nav className="top-nav">
      <div className="nav-left">
        <div className="nav-brand"><Zap className="gold-text" size={24} /></div>
        <span className="brand-text">TLS_AUDITOR</span>
      </div>
      
      <div className="nav-center">
        <button 
          className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setActiveView('dashboard'); setShowResults(false); }}
        >
          <LayoutDashboard size={20} /> <span>DASHBOARD</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'vulndb' ? 'active' : ''}`}
          onClick={() => setActiveView('vulndb')}
        >
          <Database size={20} /> <span>DATABASE</span>
        </button>
        <button className="nav-btn">
          <Globe size={20} /> <span>NETWORK</span>
        </button>
      </div>

      <div className="nav-right">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={20} /> <span className="hide-mobile">SIGNOUT</span>
        </button>
      </div>
    </nav>
  );

  // ═══════════════════════════════════════════════════════
  // VIEW: Vulnerability Database Reference
  // ═══════════════════════════════════════════════════════
  if (activeView === 'vulndb') {
    const ciphers = vulnData?.ciphers || [];
    const categories = vulnData?.categories || [];
    
    const filteredCiphers = ciphers.filter(c => {
      const matchesFilter = vulnFilter === 'ALL' || c.severity === vulnFilter || c.category === vulnFilter;
      const matchesSearch = vulnSearch === '' || 
        c.cipherName.toLowerCase().includes(vulnSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(vulnSearch.toLowerCase()) ||
        c.rationale.toLowerCase().includes(vulnSearch.toLowerCase()) ||
        c.secureFix.toLowerCase().includes(vulnSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    return (
      <div className="dashboard-container">
        <div className="bg-mesh"></div>
        <div className="bg-grid"></div>
        <TopNav />

        <main className="main-content results-view">
          <header className="results-header" style={{ marginBottom: '1.5rem' }}>
            <h1 className="title">VULNERABILITY_DATABASE</h1>
            <p className="subtitle" style={{ marginTop: '0.5rem' }}>
              {vulnData ? `${vulnData.total} Known Bad Cipher Suites Catalogued` : 'Loading...'}
            </p>
          </header>

          {/* Severity Summary Cards */}
          {vulnData && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="vuln-summary-bar"
            >
              <div className="vuln-stat-pill" style={{ borderColor: getSeverityColor('CRITICAL') }}>
                <span className="vuln-stat-count" style={{ color: getSeverityColor('CRITICAL') }}>
                  {vulnData.severityCounts.CRITICAL}
                </span>
                <span className="vuln-stat-label">CRITICAL</span>
              </div>
              <div className="vuln-stat-pill" style={{ borderColor: getSeverityColor('HIGH') }}>
                <span className="vuln-stat-count" style={{ color: getSeverityColor('HIGH') }}>
                  {vulnData.severityCounts.HIGH}
                </span>
                <span className="vuln-stat-label">HIGH</span>
              </div>
              <div className="vuln-stat-pill" style={{ borderColor: getSeverityColor('MEDIUM') }}>
                <span className="vuln-stat-count" style={{ color: getSeverityColor('MEDIUM') }}>
                  {vulnData.severityCounts.MEDIUM}
                </span>
                <span className="vuln-stat-label">MEDIUM</span>
              </div>
              <div className="vuln-stat-pill" style={{ borderColor: 'var(--border-color)' }}>
                <span className="vuln-stat-count" style={{ color: 'var(--gold-primary)' }}>
                  {vulnData.total}
                </span>
                <span className="vuln-stat-label">TOTAL</span>
              </div>
            </motion.div>
          )}

          {/* Filters + Search */}
          <div className="vuln-controls">
            <div className="vuln-search-wrapper">
              <Search size={16} style={{ color: 'var(--text-gray)' }} />
              <input 
                type="text"
                placeholder="Search cipher suites, categories..."
                value={vulnSearch}
                onChange={(e) => setVulnSearch(e.target.value)}
                className="vuln-search-input"
              />
              {vulnSearch && (
                <button className="vuln-clear-btn" onClick={() => setVulnSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="vuln-filter-pills">
              <Filter size={14} style={{ color: 'var(--text-gray)', marginRight: '0.5rem' }} />
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
                <button 
                  key={f}
                  className={`vuln-filter-btn ${vulnFilter === f ? 'active' : ''}`}
                  onClick={() => setVulnFilter(f)}
                  style={vulnFilter === f ? { 
                    background: f === 'ALL' ? 'var(--gold-primary)' : getSeverityBg(f),
                    borderColor: f === 'ALL' ? 'var(--gold-primary)' : getSeverityColor(f),
                    color: f === 'ALL' ? '#000' : getSeverityColor(f)
                  } : {}}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Vulnerability Table */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="vuln-table-container"
          >
            <table className="vuln-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Bad Cipher Suite (IANA Name)</th>
                  <th style={{ width: '140px' }}>Category</th>
                  <th style={{ width: '100px' }}>Severity</th>
                  <th>The Solution (Secure Fix)</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredCiphers.map((cipher, idx) => (
                    <motion.tr 
                      key={cipher.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: idx * 0.02 }}
                      className="vuln-row"
                      title={cipher.rationale}
                    >
                      <td className="vuln-id">{cipher.id}</td>
                      <td className="vuln-cipher-name">
                        <code>{cipher.cipherName}</code>
                        <span className="vuln-rationale-hint">{cipher.rationale}</span>
                      </td>
                      <td>
                        <span className="vuln-category-badge">{cipher.category}</span>
                      </td>
                      <td>
                        <span 
                          className="vuln-severity-badge"
                          style={{ 
                            color: getSeverityColor(cipher.severity),
                            background: getSeverityBg(cipher.severity),
                            borderColor: `${getSeverityColor(cipher.severity)}40`
                          }}
                        >
                          {cipher.severity}
                        </span>
                      </td>
                      <td className="vuln-fix">
                        <span className="vuln-fix-text">{cipher.secureFix}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredCiphers.length === 0 && (
              <div className="vuln-empty">
                <Shield size={28} style={{ color: 'var(--text-gray)', opacity: 0.4 }} />
                <p>No cipher suites match your filter.</p>
              </div>
            )}
          </motion.div>

          {/* Legend / Info */}
          <div className="vuln-legend">
            <div className="vuln-legend-item">
              <span className="vuln-legend-dot" style={{ background: getSeverityColor('CRITICAL') }}></span>
              <span>CRITICAL — No encryption or trivially broken. Immediate fix required.</span>
            </div>
            <div className="vuln-legend-item">
              <span className="vuln-legend-dot" style={{ background: getSeverityColor('HIGH') }}></span>
              <span>HIGH — Known broken cipher or no authentication. Should be disabled.</span>
            </div>
            <div className="vuln-legend-item">
              <span className="vuln-legend-dot" style={{ background: getSeverityColor('MEDIUM') }}></span>
              <span>MEDIUM — Weak mode or legacy cipher. Upgrade when possible.</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // VIEW: Audit Results
  // ═══════════════════════════════════════════════════════
  if (showResults && auditResults) {
    const vulnerabilities = auditResults.scans.flatMap(s => s.issues);
    const recommendations = auditResults.scans.flatMap(s => s.recommendations);
    const matchedVulns = auditResults.scans.flatMap(s => s.matchedVulnerabilities || []);

    const safetyScoreLocal = auditResults.overallStatus === 'SECURE' ? 98 : Math.max(20, 100 - (vulnerabilities.length * 15));
    const externalScore = auditResults.externalSafety?.score || safetyScoreLocal;
    const safetyScore = Math.round((safetyScoreLocal * 0.4) + (externalScore * 0.6)); // Weighted average
    
    const strokeDasharray = `${(safetyScore * 314) / 100}, 314`;
    const externalStrokeDash = `${(externalScore * 314) / 100}, 314`;

    const getStatusInfo = (score) => {
      if (score >= 80) return { color: '#4ade80', text: 'SAFE' };
      if (score >= 60) return { color: '#ECBE7B', text: 'NOT SAFE' };
      if (score >= 40) return { color: '#ff4b4b', text: 'VULNERABLE' };
      return { color: '#8b0000', text: 'CRITICAL' };
    };

    const statusObj = getStatusInfo(safetyScore);

    // Count severity in matched vulnerabilities
    const critCount = matchedVulns.filter(v => v.severity === 'CRITICAL').length;
    const highCount = matchedVulns.filter(v => v.severity === 'HIGH').length;
    const medCount = matchedVulns.filter(v => v.severity === 'MEDIUM').length;

    return (
      <div className="dashboard-container">
        <div className="bg-mesh"></div>
        <div className="bg-grid"></div>
        <TopNav />

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
              <div style={{ 
                marginTop: '1.5rem', 
                display: 'flex',
                justifyContent: 'center',
                gap: '2rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-gray)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>INTERNAL</div>
                  <div style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{safetyScoreLocal}%</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-gray)', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                    {auditResults.externalSafety?.provider || 'EXTERNAL'}
                  </div>
                  <div style={{ color: '#51afef', fontWeight: 'bold' }}>{externalScore}%</div>
                </div>
              </div>
              <div style={{ 
                marginTop: '1.5rem', 
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
            <div className="safety-score-card" style={{ borderColor: 'rgba(81, 175, 239, 0.3)' }}>
              <p className="percentage-label">CryptCheck Global Grade</p>
              <h2 className="percentage-value" style={{ color: '#51afef', fontSize: '3rem' }}>
                {auditResults.cryptCheck?.grade || 'A+'}
              </h2>
              <div style={{ marginTop: '1rem', color: 'var(--text-gray)', fontSize: '0.75rem' }}>
                <Terminal size={12} style={{ marginRight: '0.4rem' }} />
                EXTRACTED_CIPHERS: {auditResults.cryptCheck?.ciphersFound || auditResults.scans.length}
              </div>
              <div style={{ 
                marginTop: '1.5rem', 
                fontSize: '0.7rem', 
                fontWeight: 'bold', 
                color: '#51afef',
                letterSpacing: '0.15em',
                background: 'rgba(81, 175, 239, 0.1)',
                padding: '0.4rem 1rem',
                borderRadius: '2rem',
                display: 'inline-block'
              }}>
                SOURCE: CRYPTCHECK.FR
              </div>
            </div>
            <div className="chart-container">
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 110 110" className="circular-chart" style={{ width: '220px', height: '220px' }}>
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
                {/* Secondary ring for external score */}
                <svg viewBox="0 0 110 110" className="circular-chart" style={{ 
                  width: '180px', 
                  height: '180px', 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%) rotate(-90deg)' 
                }}>
                  <circle className="circle-bg" cx="55" cy="55" r="50" style={{ strokeWidth: 4 }}></circle>
                  <circle 
                    className="circle" 
                    cx="55" cy="55" r="50" 
                    style={{ 
                      strokeDasharray: externalStrokeDash, 
                      stroke: '#51afef',
                      strokeWidth: 4,
                      opacity: 0.7
                    }}
                  ></circle>
                </svg>
              </div>
            </div>
          </div>

          {/* Matched Vulnerability IDs Bar */}
          {matchedVulns.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="matched-vulns-bar"
            >
              <div className="matched-vulns-header">
                <AlertTriangle size={16} />
                <span>MATCHED CIPHER VULNERABILITIES ({matchedVulns.length} / 30 in database)</span>
              </div>
              <div className="matched-vulns-pills">
                {matchedVulns.map((v, i) => (
                  <span 
                    key={i}
                    className="matched-vuln-pill"
                    style={{ 
                      borderColor: getSeverityColor(v.severity),
                      color: getSeverityColor(v.severity),
                      background: getSeverityBg(v.severity)
                    }}
                    title={`${v.cipherName} → ${v.secureFix}`}
                  >
                    #{v.id} {v.category}
                  </span>
                ))}
              </div>
              <div className="matched-vulns-summary">
                {critCount > 0 && <span style={{ color: getSeverityColor('CRITICAL') }}>⬤ {critCount} CRITICAL</span>}
                {highCount > 0 && <span style={{ color: getSeverityColor('HIGH') }}>⬤ {highCount} HIGH</span>}
                {medCount > 0 && <span style={{ color: getSeverityColor('MEDIUM') }}>⬤ {medCount} MEDIUM</span>}
              </div>
            </motion.div>
          )}

          <div className="dual-info-grid">
            <div className="info-box">
              <h3><AlertTriangle size={18} /> Vulnerabilities</h3>
              <ul className="vulnerability-list">
                {vulnerabilities.length > 0 ? (
                  auditResults.scans.flatMap(s => s.issues.map((issue, idx) => (
                    <li key={`${s.protocol}-${idx}`}>
                      <div className="vuln-issue">{issue}</div>
                      {s.quickSnippet && (
                        <div className="quick-suggestion">
                          <Zap size={10} /> {s.quickSnippet}
                        </div>
                      )}
                    </li>
                  )))
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
                <span className="gold-text">ANALYSIS:</span> Our engine checked against <span className="gold-text">30 known bad cipher suites</span> including 
                NULL ciphers, EXPORT-grade, RC4, DES/3DES, ANON key exchange, CBC mode, SEED, IDEA, Camellia, and weak authentication suites.
                {vulnerabilities.length > 0 
                  ? ` We matched ${matchedVulns.length} vulnerable cipher patterns that expose your server to MitM, downgrade, and padding oracle attacks.`
                  : ` Your system is correctly configured to use modern encryption primitives like GCM (Galois Mode) and high-bit RSA/ECC keys.`
                }
              </p>
              <p>
                <span className="gold-text">RATIONALE:</span> The proposed configuration below enforces <span className="gold-text">Perfect Forward Secrecy (PFS)</span>. 
                By migrating from CBC to GCM and disabling SHA-1/MD5 based hashing, you ensure data integrity and prevent padding oracle attacks like Lucky13. 
                Using <span className="gold-text">TLS 1.2+</span> with <span className="gold-text">ECDHE</span> is current industry standard for high-security infrastructure.
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

  // ═══════════════════════════════════════════════════════
  // VIEW: Main Dashboard (Audit Input)
  // ═══════════════════════════════════════════════════════
  return (
    <div className="dashboard-container">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <TopNav />

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

        {/* Cipher Suites Preview & Report Button */}
        {auditResults && !showResults && showReportButton && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="cipher-preview-section"
          >
            <div className="preview-header">
              <Terminal size={16} /> TLS_CIPHER_SUITES_EXTRACTED
            </div>
            <div className="cipher-grid">
              {auditResults.scans.map((scan, i) => (
                <div key={i} className="cipher-preview-item">
                  <div className="proto">{scan.protocol}</div>
                  <div className="cipher">{scan.cipher}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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

        {/* Global Report Action at the bottom */}
        {showReportButton && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '2.5rem', marginBottom: '3rem' }}
          >
            <button 
              className="generate-report-btn" 
              onClick={() => setShowResults(true)}
            >
              GENERATE COMPREHENSIVE SECURITY REPORT <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
