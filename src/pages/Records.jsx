import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  History as HistoryIcon, 
  Globe, 
  Zap, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { getAssetInventory, getRegisteredAssets } from '../services/auditService';

function RecordsPage({ user, onReAudit }) {
  const [allLogs, setAllLogs] = useState([]);
  const [registeredDocs, setRegisteredDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.phone || user?.email) {
      setLoading(true);
      setError(null);
      
      const p1 = getAssetInventory(user.phone, user.email);
      const p2 = getRegisteredAssets(user.phone, user.email);

      Promise.all([p1, p2])
        .then(([history, registered]) => {
          setAllLogs(history);
          setRegisteredDocs(registered);
        })
        .catch(err => {
          console.error("Mission Sync Error:", err);
          setError(err.message || "Failed to synchronize node intelligence.");
        })
        .finally(() => setLoading(false));
    }
  }, [user?.phone, user?.email]);

  // Tactical Filtering Architecture
  const registeredUrls = new Set(registeredDocs.map(d => d.domain_url.toLowerCase()));
  const blacklist = ['yahoo.com', 'github.com', 'gab.com', 'guthub.com'];
  
  // History shows only GUEST nodes (non-registered)
  const historyLogs = allLogs.filter(log => {
    const isRegistered = registeredUrls.has(log.url.toLowerCase());
    const isBlacklisted = blacklist.some(b => log.url.toLowerCase().includes(b));
    return !isRegistered && !isBlacklisted;
  });

  const getStatusColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#ECBE7B';
    return '#ff4b4b';
  };

  return (
    <main className="main-content records-view">
      <header className="results-header" style={{ marginBottom: '3rem' }}>
        <div className="dev-badge" style={{ marginBottom: '1rem' }}>OPERATOR_VAULT // {user?.phone || user?.email}</div>
        <h1 className="title">MISSION_CONTROL_CENTRAL</h1>
        <p className="subtitle" style={{ marginTop: '0.5rem' }}>
          Consolidated Security Intelligence for Node: {user?.email || user?.phone}
        </p>
      </header>

      {loading ? (
        <div className="flex-center" style={{ height: '300px' }}>
          <Loader2 className="animate-spin text-gold" size={40} />
          <span style={{ marginLeft: '1rem', color: 'var(--text-gray)' }}>Synchronizing Database...</span>
        </div>
      ) : error ? (
        <div className="auth-error-banner" style={{ margin: '2rem auto', maxWidth: '600px' }}>
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="records-vertical-stack">
          {/* ── SECTION 1: REGISTERED INFRASTRUCTURE (TOP) ── */}
          <section className="vault-section">
            <div className="column-header">
              <Globe size={18} className="gold-text" />
              <h3>REGISTERED_INFRASTRUCTURE_NODES</h3>
              <div className="badge">{registeredDocs.length} ASSETS</div>
            </div>
            <div className="records-grid">
              {registeredDocs.length === 0 ? (
                <div className="empty-state">No infrastructure nodes registered for this account.</div>
              ) : (
                registeredDocs.map((domain, i) => (
                  <div key={i} className="record-card registered-node">
                    <div className="record-main">
                      <div className="record-url">{domain.domain_url}</div>
                    </div>
                    <button className="audit-mini-btn" onClick={() => onReAudit(domain.domain_url)}>
                      <Zap size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="horizontal-divider"></div>

          {/* ── SECTION 2: AUDIT HISTORY (BOTTOM) ── */}
          <section className="vault-section">
            <div className="column-header">
              <HistoryIcon size={18} className="gold-text" />
              <h3>PERSISTENT_MISSION_HISTORY</h3>
              <div className="badge">{historyLogs.length} LOGS</div>
            </div>
            <div className="records-grid">
              {historyLogs.length === 0 ? (
                <div className="empty-state">Secure node mission history is currently empty.</div>
              ) : (
                historyLogs.map((log, i) => (
                  <div key={i} className="record-card history-node">
                    <div className="record-main">
                      <div className="record-url">{log.url}</div>
                      <div className="record-meta">
                         <span>{new Date(log.created_at).toLocaleString()}</span>
                         <span className="dot">•</span>
                         <span style={{ color: getStatusColor(log.score) }}>{log.score}%</span>
                      </div>
                    </div>
                    <div className="history-badge">
                      {log.protocols?.split(',')[0] || 'NONE'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <style jsx>{`
        .records-vertical-stack {
          display: flex;
          flex-direction: column;
          gap: 4rem;
          margin-bottom: 6rem;
        }
        .vault-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .records-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .column-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .column-header h3 {
          font-family: var(--font-mono);
          font-size: 0.95rem;
          letter-spacing: 0.15em;
          margin: 0;
          color: white;
          font-weight: 900;
        }
        .badge {
          margin-left: auto;
          font-size: 0.65rem;
          background: var(--gold-primary)20;
          color: var(--gold-primary);
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          border: 1px solid var(--gold-primary)30;
        }
        .record-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 0.8rem;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .record-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--gold-primary)50;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .record-url {
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 1rem;
          color: #fff;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
        }
        .record-meta {
          font-size: 0.75rem;
          color: var(--text-gray);
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .status-tag {
          font-weight: 900;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .dot {
          opacity: 0.3;
        }
        .audit-mini-btn {
          background: var(--gold-primary);
          color: black;
          border: none;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .audit-mini-btn:hover {
          transform: scale(1.1) rotate(10deg);
          box-shadow: 0 0 15px var(--gold-primary)60;
        }
        .history-node {
          background: rgba(0, 0, 0, 0.15);
        }
        .history-badge {
          font-size: 0.65rem;
          color: var(--gold-primary);
          opacity: 0.7;
          font-family: var(--font-mono);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 0.3rem;
        }
        .horizontal-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.05), transparent);
        }
        .empty-state {
          grid-column: span 2;
          text-align: center;
          padding: 4rem;
          color: var(--text-gray);
          font-size: 0.9rem;
          font-style: italic;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 1rem;
          border: 1px dashed rgba(255, 255, 255, 0.05);
        }
        @media (max-width: 900px) {
          .records-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export default RecordsPage;
