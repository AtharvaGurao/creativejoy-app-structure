import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = "https://rzzcefjuvuvgciknaqwe.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6emNlZmp1dnV2Z2Npa25hcXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTM4NzQsImV4cCI6MjA3OTY2OTg3NH0.Lnaib5B3ST9iSLqL9aBH0c554Ifak1lNrzKGulvkKOU";

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);
