import { supabase } from '../supabaseClient';

/**
 * Sends a one-time password (OTP) via SMS to the provided phone number.
 */
export const sendOtp = async (phone) => {
  return await supabase.auth.signInWithOtp({ phone });
};

/**
 * Verifies the OTP token against the phone number.
 */
export const verifyOtp = async (phone, token) => {
  return await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
};

/**
 * Legacy/Standard login support for phone and password.
 */
export const login = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

/**
 * Register a new node with full metadata (Email, Name).
 * Syncs the account creation both to the Auth Vault and the public primary database.
 */
export const signUp = async (email, password, phone, fullName) => {
  // 1. Initialize Auth Vault Entry
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone: phone,
        full_name: fullName
      }
    }
  });

  if (authError) return { data: null, error: authError };

  // 2. Synchronize to Public Node Database (Primary Record)
  if (authData.user) {
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        phone: phone,
        full_name: fullName,
        updated_at: new Date().toISOString()
      });
      
    if (dbError) console.warn('METADATA_SYNC_DELAY: Auth succeeded but profile sync failed.', dbError);
  }

  return { data: authData, error: null };
};

/**
 * Sign out the current operator.
 */
export const logout = async () => {
  return await supabase.auth.signOut();
};
