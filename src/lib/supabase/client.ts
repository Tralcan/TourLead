import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("La URL y la clave anónima de Supabase son requeridas en el archivo .env.local");
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
