import { createClient } from '@supabase/supabase-js'

// ¡IMPORTANTE!
// Mueve estas variables a un archivo .env.local para mayor seguridad.
// Ejemplo .env.local:
// NEXT_PUBLIC_SUPABASE_URL=https://tu-url.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon

const supabaseUrl = 'https://aynezfkditlxshoffzov.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmV6a2RkaXRseHNob2Zmem92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTk3NTEsImV4cCI6MjA2NjQzNTc1MX0.xUR7l8uXwNfi4RJShe7iaDGzx05dK-YZeNF2nLOSrXA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
