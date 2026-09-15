import { createClient } from '@supabase/supabase-js'

// Had l'valeurs kayjiw mn fichier .env (chouf .env.example)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Khassk dir VITE_SUPABASE_URL w VITE_SUPABASE_ANON_KEY f fichier .env dyalk. Chouf README.md.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
