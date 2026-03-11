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
export const login = async (phone, password) => {
  return await supabase.auth.signInWithPassword({ phone, password });
};

/**
 * Register a new node with full metadata (Email, Name).
 */
export const signUp = async (phone, password, email, fullName) => {
  return await supabase.auth.signUp({
    phone,
    password,
    options: {
      data: {
        email: email,
        full_name: fullName
      }
    }
  });
};

/**
 * Sign out the current operator.
 */
export const logout = async () => {
  return await supabase.auth.signOut();
};
