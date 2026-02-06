// Load environment variables FIRST (before any other code)
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Client for auth operations (uses ANON_KEY)
// Use this for: signUp, signInWithPassword, signOut, getUser
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Client for database operations (uses SERVICE_ROLE_KEY to bypass RLS)
// Use this for: database inserts, updates, deletes
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabaseAuth,   // For auth operations
  supabaseAdmin,  // For database operations
  supabase: supabaseAdmin  // Default export for backward compatibility
};
