import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  const jwt = authHeader.slice(7)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  // 1. Verifica JWT chiamante
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 2. Controllo admin
  const { data: adminRow } = await supabase
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: not an admin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 3. Lista utenti da auth.users
  const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    return new Response(
      JSON.stringify({ error: listErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 4. Lista admin per join
  const { data: adminRows } = await supabase
    .from('app_admins')
    .select('user_id')

  const adminIds = new Set(adminRows?.map((r) => r.user_id) ?? [])

  // 5. Shape risposta
  const users = usersData.users.map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.user_metadata?.display_name ?? u.email,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    isConfirmed: u.email_confirmed_at != null,
    isAdmin: adminIds.has(u.id),
  }))

  return new Response(
    JSON.stringify({ users }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
