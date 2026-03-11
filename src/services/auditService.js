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

  const { error } = await supabase.from('audit_logs').insert([
    {
      url,
      operator_email: user.email,
      operator_phone: user.phone,
      status: auditData.overallStatus,
      score: auditData.externalSafety?.score || 100,
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
