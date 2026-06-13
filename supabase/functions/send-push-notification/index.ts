import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://apidiario.stefano-passiatore.workers.dev',
  'http://localhost:5173',
  'https://localhost:5173',
]

function corsFor(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

// Web‑push is a thin wrapper over the Web Push Protocol.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webpush: any = null
async function getWebpush() {
  if (!webpush) {
    webpush = await import('npm:web-push@3.6.7')
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:notifiche@apidiario.app', publicKey, privateKey)
    }
  }
  return webpush
}

serve(async (req) => {
  const corsHeaders = corsFor(req)
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

  // Verify caller
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Parse body
  let inspectionId: string
  try {
    const body = await req.json()
    inspectionId = body.inspection_id?.trim() ?? ''
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!inspectionId) {
    return new Response(
      JSON.stringify({ error: 'inspection_id richiesto' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Get inspection + hive + apiary info
  const { data: inspection, error: inspErr } = await supabase
    .from('inspections')
    .select('hive_id')
    .eq('id', inspectionId)
    .single()

  if (inspErr || !inspection) {
    return new Response(
      JSON.stringify({ error: 'Ispezione non trovata' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { data: hive, error: hiveErr } = await supabase
    .from('hives')
    .select('identifier, apiary_id')
    .eq('id', inspection.hive_id)
    .single()

  if (hiveErr || !hive) {
    return new Response(
      JSON.stringify({ error: 'Arnia non trovata' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { data: apiary, error: apiaryErr } = await supabase
    .from('apiaries')
    .select('name, owner_id')
    .eq('id', hive.apiary_id)
    .single()

  if (apiaryErr || !apiary) {
    return new Response(
      JSON.stringify({ error: 'Apiario non trovato' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Get caller display name
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const callerName = callerProfile?.display_name ?? user.email ?? 'Qualcuno'

  // Find other users with access to this apiary
  const { data: accessList } = await supabase
    .from('apiary_access')
    .select('user_id')
    .eq('apiary_id', hive.apiary_id)
    .neq('user_id', user.id)

  const otherUserIds: string[] = accessList?.map((a) => a.user_id) ?? []

  // Also include the owner if they are not the caller
  if (apiary.owner_id !== user.id) {
    otherUserIds.push(apiary.owner_id)
  }

  if (otherUserIds.length === 0) {
    // No other users to notify
    const wp = await getWebpush()
    return new Response(
      JSON.stringify({ success: true, notified: 0, vapidConfigured: !!(wp && Deno.env.get('VAPID_PUBLIC_KEY')) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Check VAPID keys
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(
      JSON.stringify({ success: true, notified: 0, warning: 'VAPID keys not configured' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Get push subscriptions for other users
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .in('user_id', otherUserIds)

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(
      JSON.stringify({ success: true, notified: 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Init web-push lazily
  const wp = await getWebpush()

  const payload = JSON.stringify({
    title: `Nuova ispezione: ${apiary.name}`,
    body: `${hive.identifier} — ${callerName}`,
    url: `/hives/${inspection.hive_id}/inspections/${inspectionId}`,
  })

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      await wp.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload,
      )
      sent++
    } catch {
      // Subscription expired / invalid — remove from DB
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      failed++
    }
  }

  return new Response(
    JSON.stringify({ success: true, notified: sent, failed }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
