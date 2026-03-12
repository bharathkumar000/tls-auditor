import { supabase } from '../supabaseClient';

/**
 * Initiates an audit for the target URL.
 * Performs a TLS/SSL scan via the local Express server.
 */
export const runAudit = async (url) => {
  // 🛰️ TACTICAL PORT FUSION: Try local node if relative fetch fails or returns 404
  const apiEndpoint = '/api/audit';
  const localFallBack = 'http://localhost:9090/api/audit';

  let response;
  try {
    response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    // If hosted (Vercel) returns 404, it means the scanner isn't deployed there.
    // We must switch to the Local High-Fidelity node.
    if (!response.ok && response.status === 404) {
      throw new Error("PROCEED_TO_LOCAL_FALLBACK");
    }
  } catch (e) {
    try {
      response = await fetch(localFallBack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    } catch (localError) {
      throw new Error(`MISSION_LINK_FAILURE: Could not connect to the Local Scan Node on Port 9090. Please ensure 'node server.cjs' is running.`);
    }
  }

  if (!response || !response.ok) {
    const errorMsg = response ? `System Error: ${response.status}` : "Handshake Timeout";
    throw new Error(`${errorMsg} - Ensure Local Scan Node is active on Port 9090`);
  }

  return await response.json();
};

/**
 * Persists the audit record to the operator's registered asset log in Supabase.
 */
export const saveAuditLog = async (url, user, auditData) => {
  if (!user?.email) return;

  // Calculate Unified Score (Synchronized with Dashboard Report Logic)
  const isPlaintext = auditData.scans.some(s => s.protocol === 'PLAINTEXT_HTTP');
  const vulnerabilities = auditData.scans.flatMap(s => s.issues || []);
  const safetyScoreLocal = auditData.overallStatus === 'SECURE' ? 95 : Math.max(10, 100 - (vulnerabilities.length * 20));
  const extScore = auditData.externalSafety?.score ?? safetyScoreLocal;
  
  // High-Fidelity Scoring Enforcement: HTTP/Plaintext = Absolute Zero
  let unifiedScore = Math.round((safetyScoreLocal * 0.4) + (extScore * 0.6));
  if (isPlaintext || auditData.overallStatus === 'CRITICAL') unifiedScore = 0;

  const { error } = await supabase.from('audit_logs').insert([
    {
      url,
      operator_email: user.email,
      operator_phone: user.phone,
      status: auditData.overallStatus,
      score: unifiedScore,
      protocols: auditData.scans.map(s => s.protocol).join(', ')
    }
  ]);

  if (error) {
    console.error('Failed to log audit:', error);
    throw error;
  }
};

/**
 * Retrieves the comprehensive asset history and registered domains for an operator.
 * Searches across both phone and email vectors to ensure zero data loss.
 */
export const getAssetInventory = async (phone, email) => {
  if (!phone && !email) return [];
  
  if (phone === '1') {
    return [
      { url: 'google.com', score: 98, status: 'SECURE', protocols: 'TLS 1.3', created_at: new Date(Date.now() - 3600000).toISOString() },
      { url: 'microsoft.com', score: 92, status: 'SECURE', protocols: 'TLS 1.2, TLS 1.3', created_at: new Date(Date.now() - 86400000).toISOString() },
      { url: 'apple.com', score: 95, status: 'SECURE', protocols: 'TLS 1.3', created_at: new Date(Date.now() - 172800000).toISOString() },
      { url: 'neverssl.com', score: 0, status: 'CRITICAL', protocols: 'PLAINTEXT_HTTP', created_at: new Date(Date.now() - 259200000).toISOString() }
    ];
  }

  let query = supabase.from('audit_logs').select('*');
  
  // High-Fidelity Multi-Vector Search
  if (phone && email) {
    query = query.or(`operator_phone.eq.${phone},operator_email.eq.${email}`);
  } else if (phone) {
    query = query.eq('operator_phone', phone);
  } else {
    query = query.eq('operator_email', email);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('DATABASE_FETCH_ERROR:', error);
    throw error;
  }
  
  return data || [];
};
/**
 * Verifies if a domain is registered to the current operator via the registered_assets table.
 */
export const isDomainRegistered = async (url, user) => {
  if (!user?.email && !user?.phone) return false;
  
  try {
    const { data, error } = await supabase
      .from('registered_assets')
      .select('domain_url')
      .eq('domain_url', url)
      .or(`operator_phone.eq.${user.phone},operator_email.eq.${user.email}`)
      .limit(1);

    if (error) return false;
    return data && data.length > 0;
  } catch (e) {
    return false;
  }
};

/**
 * Retrieves only the manually registered infrastructure nodes for an operator.
 */
export const getRegisteredAssets = async (phone, email) => {
  if (!phone && !email) return [];
  
  if (phone === '1') return [];
  
  let query = supabase.from('registered_assets').select('*');
  
  if (phone && email) {
    query = query.or(`operator_phone.eq.${phone},operator_email.eq.${email}`);
  } else if (phone) {
    query = query.eq('operator_phone', phone);
  } else {
    query = query.eq('operator_email', email);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('REGISTERED_FETCH_ERROR:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Automatically provisions legacy audit logs into the registered_assets vault for a new operator.
 */
export const provisionLegacyAssets = async (phone, email) => {
  if (!phone && !email) return;

  // 1. Fetch any existing history for this identity
  const history = await getAssetInventory(phone, email);
  if (history.length === 0) return;

  // 2. Extract unique URLs
  const uniqueUrls = [...new Set(history.map(h => h.url))];

  // 3. Batch insert into registered_assets
  const assetsToRegister = uniqueUrls.map(url => ({
    operator_email: email,
    operator_phone: phone,
    domain_url: url
  }));

  const { error } = await supabase
    .from('registered_assets')
    .upsert(assetsToRegister, { onConflict: 'operator_email,domain_url', ignoreDuplicates: true });

  if (error) {
    console.error('LEGACY_PROVISION_ERROR:', error);
  }
};

/**
 * Deploys a high-fidelity modification request to the tactical vault.
 */
export const createModificationRequest = async (requestData) => {
  const { error } = await supabase
    .from('mod_requests')
    .insert([{
      operator_name: requestData.operatorName,
      contact_node: requestData.contactNode,
      secure_email: requestData.secureEmail,
      target_domain: requestData.targetDomain,
      requested_changes: requestData.requestedChanges,
      provider_info: 'GODADDY_CLOUDFLARE_HYBRID'
    }]);

  if (error) {
    console.error('MOD_REQUEST_INSERT_FAIL:', error);
    throw error;
  }
};
