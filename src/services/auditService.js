import { supabase } from '../supabaseClient';

/**
 * Initiates an audit for the target URL.
 * Performs a TLS/SSL scan via the local Express server.
 */
export const runAudit = async (url) => {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    throw new Error(`System Error: ${response.status} - Use Port 9090`);
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
 * Verifies if a domain is registered to the current operator.
 */
export const isDomainRegistered = async (url, user) => {
  if (!user?.email && !user?.phone) return false;
  
  try {
    // Check in audit_logs if there's an entry with a 'registration' flag or similar
    // For now, we'll check if it's in a dedicated table or marked as primary
    const { data, error } = await supabase
      .from('audit_logs')
      .select('url')
      .eq('url', url)
      .or(`operator_phone.eq.${user.phone},operator_email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) return false;
    // For this implementation, we treat any domain previously audited by this user as 'Registered'
    // in the context of showing the split screen and request button.
    return data && data.length > 0;
  } catch (e) {
    return false;
  }
};
