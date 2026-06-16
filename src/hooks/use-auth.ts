import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type Profile = Tables<'profiles'>

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
      setSessionLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const { data: profile = null, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', session!.user.id).single()
      return data ?? null
    },
    enabled: !!session?.user?.id,
    staleTime: 10 * 60 * 1000,
  })

  return { session, profile, loading: sessionLoading || profileLoading }
}
