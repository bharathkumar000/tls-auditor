import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Loader2,
  Terminal,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { getAssetInventory } from '../services/auditService';

function DomainsPage({ user, onReAudit }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.phone) {
      setLoading(true);
      setError(null);
      getAssetInventory(user.phone)
        .then(data => {
          const unique = {};
          data.forEach(log => {
            if (!unique[log.url] || new Date(log.created_at) > new Date(unique[log.url].created_at)) {
              unique[log.url] = log;
            }
          });
          setDomains(Object.values(unique));
        })
        .catch(err => {
          console.error("Domain Fetch Error:", err);
          setError(err.message || "Failed to retrieve registered assets.");
        })
        .finally(() => setLoading(false));
    }
  }, [user?.phone]);

  return (
    <main className="main-content results-view">
      <header className="results-header" style={{ marginBottom: '2.5rem' }}>
        <div className="dev-badge" style={{ marginBottom: '1rem' }}>NODE_OPERATOR // {user?.phone}</div>
        <h1 className="title">REGISTERED_DOMAIN_INVENTORY</h1>
        <p className="subtitle" style={{ marginTop: '0.5rem' }}>
          Managed Assets for Node Account: {user?.email}
        </p>
      </header>

      <div className="vuln-table-container">
        {error && (
          <div style={{ padding: '2rem', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.2)', borderRadius: '0.75rem', marginBottom: '2rem', color: '#ff6b6b', textAlign: 'center' }}>
            <Terminal size={20} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
            <strong>DOMAIN_INVENTORY_ERROR:</strong> {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--gold-primary)', margin: '0 auto' }} />
            <p style={{ marginTop: '1.5rem', color: 'var(--text-gray)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>RETRIEVING_REGISTERED_ASSETS...</p>
          </div>
        ) : domains.length === 0 ? (
          <div style={{ padding: '6rem 3rem', textAlign: 'center', opacity: 0.6 }}>
            <Globe size={56} style={{ marginBottom: '1.5rem', color: 'var(--gold-primary)' }} />
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>NO REGISTERED DOMAINS</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>This node has no assets registered. Perform an audit to automatically catalog your first system domain.</p>
            <button className="run-btn" onClick={() => onReAudit(null)}>AUDIT_NEW_SYSTEM</button>
          </div>
        ) : (
          <table className="vuln-table">
            <thead>
              <tr>
                <th>Domain Asset</th>
                <th>Safety Status</th>
                <th>Threat Index</th>
                <th>Last Protocols</th>
                <th>Registry Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id} className="vuln-row">
                  <td className="vuln-cipher-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Activity size={14} style={{ color: 'var(--gold-primary)' }} />
                      <code>{domain.url}</code>
                    </div>
                  </td>
                  <td>
                    <span className={`vuln-category-badge ${domain.status === 'SECURE' ? 'success' : 'warn'}`}>
                      {domain.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '40px', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${domain.score}%`, height: '100%', background: domain.score >= 80 ? '#4ade80' : '#ff4b4b' }}></div>
                      </div>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: domain.score >= 80 ? '#4ade80' : '#ff4b4b' }}>{domain.score}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.7rem', opacity: 0.8 }}>{domain.protocols || 'Pending...'}</td>
                  <td style={{ fontSize: '0.75rem', opacity: 0.4 }}>{new Date(domain.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="run-btn" style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem' }} onClick={() => onReAudit(domain.url)}>RE-AUDIT</button>
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

export default DomainsPage;
