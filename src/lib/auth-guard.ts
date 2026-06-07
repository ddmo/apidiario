import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// getUser() verifica il token sul server (richiede rete).
// Offline il fetch fallisce: fallback a getSession() che legge localStorage.
export async function getAuthUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
  }
}
