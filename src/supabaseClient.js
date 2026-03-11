import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vnttxsfsnkqpytnfexuc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudHR4c2ZzbmtxcHl0bmZleHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDE4MDUsImV4cCI6MjA4ODc3NzgwNX0.K8s8eR44dTkYLlgvGHW8N4KilGJ68mFDr7lWor4SoDk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
