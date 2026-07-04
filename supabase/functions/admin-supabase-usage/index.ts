import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Free tier limits — https://supabase.com/pricing#compare-plans
const FREE_LIMITS = {
  db_size_bytes:         500 * 1024 * 1024,         // 500 MB
  storage_bytes:         1024 * 1024 * 1024,         // 1 GB
  bandwidth_bytes:       5 * 1024 * 1024 * 1024,    // 5 GB/month
  mau:                   50_000,
  edge_invocations:      500_000,                    // /month
  realtime_connections:  200,                        // peak
  realtime_messages:     2_000_000,                  // /month
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

// Parse Prometheus text format — returns first numeric value for a metric name prefix
function parsePrometheus(text: string, metricName: string): number | null {
  const lines = text.split('\n')
  let sum: number | null = null
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue
    if (line.startsWith(metricName + ' ') || line.startsWith(metricName + '{')) {
      const parts = line.trim().split(/\s+/)
      const val = parseFloat(parts[parts.length - 2] ?? parts[parts.length - 1])
      if (!isNaN(val)) {
        sum = (sum ?? 0) + val
      }
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

  // Auth + admin check
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

  // ── Prometheus (no extra token needed) ────────────────────────────────────
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  const prometheusUrl = `https://${projectRef}.supabase.co/customer/v1/privileged/metrics`
  const basicAuth = btoa(`service_role:${serviceRoleKey}`)

  let prometheus: Record<string, number | null> = {
    db_size_bytes: null,
    storage_bytes: null,
    auth_user_count: null,
    realtime_connections: null,
  }

  try {
    const res = await fetch(prometheusUrl, {
      headers: { Authorization: `Basic ${basicAuth}` },
    })
    if (res.ok) {
      const text = await res.text()
      prometheus = {
        db_size_bytes:       parsePrometheus(text, 'pg_database_size_bytes'),
        storage_bytes:       (() => {
          const mb = parsePrometheus(text, 'storage_storage_size_mb')
          return mb != null ? Math.round(mb * 1024 * 1024) : null
        })(),
        auth_user_count:     parsePrometheus(text, 'auth_users_user_count'),
        realtime_connections: parsePrometheus(text, 'realtime_postgres_changes_total_subscriptions'),
      }
    }
  } catch {
    // Prometheus unavailable — values remain null
  }

  // ── Management API (optional) ─────────────────────────────────────────────
  const mgmtKey = Deno.env.get('MGMT_API_KEY')
  const mgmtRef = Deno.env.get('PROJECT_REF') ?? projectRef

  let management: {
    bandwidth_bytes: number | null
    edge_invocations: number | null
    mau: number | null
    realtime_messages: number | null
  } = { bandwidth_bytes: null, edge_invocations: null, mau: null, realtime_messages: null }

  let management_configured = false

  if (mgmtKey) {
    management_configured = true
    try {
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${mgmtRef}/usage`,
        { headers: { Authorization: `Bearer ${mgmtKey}`, 'Content-Type': 'application/json' } },
      )
      if (res.ok) {
        const body = await res.json()
        // Response shape: { usages: [ { metric, usage, ... } ] }
        const usages: Array<{ metric: string; usage: number }> = body?.usages ?? []
        const get = (key: string) => usages.find((u) => u.metric === key)?.usage ?? null

        // Egress is returned in bytes or GB depending on Supabase version — handle both
        const egressRaw = get('egress')
        const egressBytes = egressRaw != null
          ? (egressRaw < 1_000_000 ? egressRaw * 1024 * 1024 * 1024 : egressRaw)
          : null

        management = {
          bandwidth_bytes:    egressBytes,
          edge_invocations:   get('func_invocations'),
          mau:                get('monthly_active_users'),
          realtime_messages:  get('realtime_message_count'),
        }
      }
    } catch {
      // Management API call failed — continue without it
    }
  }

  return new Response(
    JSON.stringify({
      limits: FREE_LIMITS,
      usage: {
        ...prometheus,
        ...management,
      },
      management_configured,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
