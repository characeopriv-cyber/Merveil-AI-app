// Wired to live Merveil Supabase project (same as Citizen app).
// Anon key is public; RLS protects all tables.
export const SUPABASE_URL      = 'https://dixfybqlepticyudikuz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDM2NzQsImV4cCI6MjA5OTcxOTY3NH0._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg';
// API_BASE is the site origin. Studio routes append /api/... themselves.
// Keeping /api out of this value avoids the accidental /api/api/... requests
// that caused the Studio to fall back to the Visitor state.
export const API_BASE          = typeof location !== 'undefined' && location.origin
  ? location.origin
  : 'https://www.junction.technology';
export const AI_BASE           = 'https://ai.junction.technology';
