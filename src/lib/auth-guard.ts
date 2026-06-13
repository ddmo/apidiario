import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Distingue "errore di rete" (offline → fallback legittimo alla sessione cachata)
// da "token non valido/scaduto" (deve fallire l'auth, niente fallback).
// Supabase usa AuthRetryableFetchError per i fallimenti di rete.
function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const name = (error as { name?: string }).name
  const status = (error as { status?: number }).status
  return name === 'AuthRetryableFetchError' || status === 0 || status === undefined
}

// getUser() verifica il token sul server (richiede rete).
// Offline il fetch fallisce: fallback a getSession() che legge localStorage.
// Un token scaduto/manomesso NON deve passare: il fallback scatta solo
// quando l'errore è di rete (genuinamente offline).
export async function getAuthUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      if (!isNetworkError(error)) return null
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user ?? null
    }
    return user
  } catch (err) {
    // fetch ha lanciato (offline): fallback alla sessione cachata
    if (!isNetworkError(err) && err instanceof Error && err.name !== 'TypeError') {
      return null
    }
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
  }
}
