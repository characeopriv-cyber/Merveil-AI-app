// Wired to live Merveil Supabase project (same as Citizen app).
// Anon key is public; RLS protects all tables.
export const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDM2NzQsImV4cCI6MjA5OTcxOTY3NH0._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg';
// API_BASE is site origin. Routes append /api/... themselves when needed.
export const API_BASE = typeof location !== 'undefined' && location.origin
  ? location.origin
  : 'https://www.junction.technology';
export const AI_BASE = 'https://ai.junction.technology';

// Side-effect modules used by live Developer Platform (must be syntactically complete).
// Load failures are isolated so Studio still boots.
const sideModules = [
  './developer-runtime.js',
  './pro-project-overlay.js',
  './home-integration-bridge.js',
  './home-lifecycle-guard.js',
  './project-flow-guard.js',
  './developer-health-ui.js',
  './developer-integration-finalizer.js',
  './merveil-boost-ui.js',
];

for (const mod of sideModules) {
  import(mod).catch((err) => {
    console.warn('[merveil-config] optional module failed', mod, err?.message || err);
  });
}
