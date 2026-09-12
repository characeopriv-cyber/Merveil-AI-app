// Wired to live Merveil Supabase project (same as Citizen app).
// Anon key is public; RLS protects all tables.
export const SUPABASE_URL      = 'https://dixfybqlepticyudikuz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkaXhjeWJx bG VwdGljeXVkaWt1eiIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDM2NzQsImV4cCI6MjA5OTcxOTY3NH0._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg'.replace(/\s/g,'');
// API_BASE is the site origin. Studio routes append /api/... themselves.
export const API_BASE          = typeof location !== 'undefined' && location.origin
  ? location.origin
  : 'https://www.junction.technology';
export const AI_BASE           = 'https://ai.junction.technology';

// Shared Developer Platform runtime.
import './developer-runtime.js';
// Pro Studio project filesystem synchronization.
import './pro-project-overlay.js';
// Developer Home provider connection bridge.
import './home-integration-bridge.js';
// Developer Home project lifecycle guard.
import './home-lifecycle-guard.js';
// Project source selection + persistence fail-closed guard.
import './project-flow-guard.js';
// Live Developer Platform health surface.
import './developer-health-ui.js';
// Final lifecycle bridge: live health, OAuth callback refresh, verified build flow.
import './developer-integration-finalizer.js';
// Thin commercial/intelligence activation layer shared with Interface.
import './merveil-boost-ui.js';