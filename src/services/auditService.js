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
    throw new Error(`System Error: ${response.status} - Use Port 3000`);
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
 * Retrieves the registered asset inventory for a specific operator.
 */
export const getAssetInventory = async (email) => {
  if (!email) return [];
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('operator_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch assets:', error);
    throw error;
  }
  
  return data || [];
};
