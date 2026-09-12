// Wired to live Merveil Supabase project (same as Citizen app).
export const SUPABASE_URL      = 'https://dixfybqlepticyudikuz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGZ5YnFsZXB0aWN5dWRpa3V6Iiwic3ViIjoiZGl4ZnlicWxlcHRpY3l1ZGlla3V6IiwiaWF0IjoxNzg0MTQzNjc0LCJleHAiOjIwOTk3MTk2NzZ9._U9bEobzrQbdHxyu6NiRsvGzzeCmXaEX7HvJZJisSqg';
export const API_BASE          = typeof location !== 'undefined' && location.origin ? location.origin : 'https://www.junction.technology';
export const AI_BASE           = 'https://ai.junction.technology';

// Shared Developer Platform runtime: active project persistence, real project
// filesystem sync, Debug/Build Check ingestion, and build history.
import './developer-runtime.js';
