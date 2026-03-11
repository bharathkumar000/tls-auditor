import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  History as HistoryIcon, 
  Loader2 
} from 'lucide-react';
import { getAssetInventory } from '../services/auditService';

function HistoryPage({ user, onReAudit }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      getAssetInventory(user.email)
        .then(data => setHistory(data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <main className="main-content results-view">
      <header className="results-header" style={{ marginBottom: '2.5rem' }}>
        <div className="dev-badge" style={{ marginBottom: '1rem' }}>ASSET_OWNER // {user?.phone}</div>
        <h1 className="title">REGISTERED_DOMAIN_INVENTORY</h1>
        <p className="subtitle" style={{ marginTop: '0.5rem' }}>
          Managed Assets for Node Account: {user?.email}
        </p>
      </header>

        <div className="vuln-table-container">
          {loading ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={40} style={{ color: 'var(--gold-primary)', margin: '0 auto' }} />
              <p style={{ marginTop: '1.5rem', color: 'var(--text-gray)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>SCANNING_SECURE_VAULT...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '6rem 3rem', textAlign: 'center', opacity: 0.6 }}>
              <HistoryIcon size={56} style={{ marginBottom: '1.5rem', color: 'var(--gold-primary)' }} />
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>NO REGISTERED DOMAINS</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>This node has no purchased assets registered under this phone or email. Register your first domain to begin.</p>
              <button 
                className="run-btn" 
                onClick={() => onReAudit(null)}
                style={{ padding: '0.75rem 2rem' }}
              >
                AUDIT & REGISTER NOW
              </button>
            </div>
          ) : (
            <table className="vuln-table shadow-2xl">
              <thead>
                <tr>
                  <th>Domain Asset</th>
                  <th>Security Status</th>
                  <th>Threat Index</th>
                  <th>Protocols</th>
                  <th>Purchase Date</th>
                  <th style={{ textAlign: 'right' }}>Asset Audit</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id} className="vuln-row">
                    <td className="vuln-cipher-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Globe size={14} style={{ color: 'var(--gold-primary)' }} />
                        <code>{log.url}</code>
                      </div>
                    </td>
                    <td>
                      <span className={`vuln-category-badge ${log.status === 'SECURE' ? 'success' : 'warn'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '4px', 
                          background: '#222', 
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${log.score}%`, 
                            height: '100%', 
                            background: log.score >= 80 ? '#4ade80' : '#ff4b4b' 
                          }}></div>
                        </div>
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: log.score >= 80 ? '#4ade80' : '#ff4b4b' }}>
                          {log.score}%
                        </span>
                      </div>
                    </td>
                    <td className="vuln-rationale-hint" style={{ fontSize: '0.7rem' }}>{log.protocols}</td>
                    <td style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="run-btn" 
                        style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem' }}
                        onClick={() => onReAudit(log.url)}
                      >
                        RE-AUDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </main>
  );
}

export default HistoryPage;
