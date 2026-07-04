import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Free tier limits (https://supabase.com/pricing)
const FREE_LIMITS = {
  db_size_bytes: 500 * 1024 * 1024,        // 500 MB
  storage_bytes: 1024 * 1024 * 1024,        // 1 GB
  bandwidth_bytes: 5 * 1024 * 1024 * 1024,  // 5 GB/month
  mau: 50_000,
  edge_invocations: 500_000,               // /month
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

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

  // DB size + auth user count via SQL
  const [{ data: dbSizeData }, { data: authCountData }, { data: storageData }] = await Promise.all([
    supabase.rpc('get_db_size'),
    supabase.rpc('get_auth_user_count'),
    supabase.rpc('get_storage_usage', { bucket_name: 'apidiario-media' }),
  ])

  const db_size_bytes = (dbSizeData as number | null) ?? null
  const auth_user_count = (authCountData as number | null) ?? null
  const storage_bytes = (storageData as { total_size: number }[] | null)?.[0]?.total_size ?? null

  // Management API (optional — requires SUPABASE_MANAGEMENT_KEY + SUPABASE_PROJECT_REF secrets)
  let management: {
    bandwidth_bytes: number | null
    edge_invocations: number | null
    mau: number | null
  } = { bandwidth_bytes: null, edge_invocations: null, mau: null }

  const mgmtKey = Deno.env.get('MGMT_API_KEY')
  const projectRef = Deno.env.get('PROJECT_REF')

  if (mgmtKey && projectRef) {
    try {
      const usageRes = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/usage`,
        { headers: { Authorization: `Bearer ${mgmtKey}`, 'Content-Type': 'application/json' } },
      )
      if (usageRes.ok) {
        const usage = await usageRes.json()
        // Supabase usage API returns metrics array
        // https://api.supabase.com/v1/projects/{ref}/usage
        const find = (key: string) => {
          if (Array.isArray(usage?.usages)) {
            return usage.usages.find((u: { metric: string }) => u.metric === key)?.usage ?? null
          }
          return usage?.[key] ?? null
        }
        management = {
          bandwidth_bytes: find('egress') ? Number(find('egress')) * 1024 * 1024 * 1024 : null,
          edge_invocations: find('func_invocations') ? Number(find('func_invocations')) : null,
          mau: find('monthly_active_users') ? Number(find('monthly_active_users')) : null,
        }
      }
    } catch {
      // Token configured but API call failed — continue without management data
    }
  }

  return new Response(
    JSON.stringify({
      limits: FREE_LIMITS,
      usage: {
        db_size_bytes,
        storage_bytes,
        auth_user_count,
        ...management,
      },
      management_configured: !!(mgmtKey && projectRef),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
