import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Free tier limits — https://supabase.com/pricing#compare-plans
const FREE_LIMITS = {
  db_size_bytes:        500 * 1024 * 1024,   // 500 MB
  storage_bytes:        1024 * 1024 * 1024,  // 1 GB
  auth_user_count:      50_000,              // proxy MAU
  realtime_connections: 200,                 // concurrent peak
}

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

// Prometheus text format: metric_name{labels} value [timestamp]
// value is always the second whitespace-separated token (index 1)
function parsePrometheus(text: string, metricName: string): number | null {
  let sum: number | null = null
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    if (line.startsWith(metricName + ' ') || line.startsWith(metricName + '{')) {
      const val = parseFloat(line.trim().split(/\s+/)[1])
      if (!isNaN(val)) sum = (sum ?? 0) + val
    }
  }
  return sum
}

serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.slice(7))
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const { data: adminRow } = await supabase.from('app_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!adminRow) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Prometheus endpoint — Basic auth with service_role key, no extra token needed
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  const prometheusUrl = `https://${projectRef}.supabase.co/customer/v1/privileged/metrics`
  const basicAuth = btoa(`service_role:${serviceRoleKey}`)

  let usage = {
    db_size_bytes:        null as number | null,
    storage_bytes:        null as number | null,
    auth_user_count:      null as number | null,
    realtime_connections: null as number | null,
  }
  let prometheus_status: number | null = null
  let prometheus_error: string | null = null

  try {
    const res = await fetch(prometheusUrl, {
      headers: { Authorization: `Basic ${basicAuth}` },
    })
    prometheus_status = res.status
    if (res.ok) {
      const text = await res.text()
      const storageMb = parsePrometheus(text, 'storage_storage_size_mb')
      usage = {
        db_size_bytes:        parsePrometheus(text, 'pg_database_size_bytes'),
        storage_bytes:        storageMb != null ? Math.round(storageMb * 1024 * 1024) : null,
        auth_user_count:      parsePrometheus(text, 'auth_users_user_count'),
        realtime_connections: parsePrometheus(text, 'realtime_postgres_changes_total_subscriptions'),
      }
    } else {
      prometheus_error = await res.text()
    }
  } catch (e) {
    prometheus_error = String(e)
  }

  return new Response(
    JSON.stringify({ limits: FREE_LIMITS, usage, prometheus_status, prometheus_error }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
