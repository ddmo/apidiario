import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { decode as decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const ALLOWED_ORIGINS = [
  'https://apidiario.stefano-passiatore.workers.dev',
  'http://localhost:5173',
  'https://localhost:5173',
]

// Vite dev server bound to the LAN IP (testing the PWA from a phone on the same network).
const LAN_DEV_ORIGIN_RE = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):5173$/

const MAX_PDF_BYTES = 15 * 1024 * 1024 // 15MB raw — stays well under Gmail's 25MB message cap once base64-encoded

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildEmailHtml(opts: { apiaryName: string; hiveCount: number; inspectionCount: number; generatedAt: string; appUrl: string }): string {
  const apiaryName = escapeHtml(opts.apiaryName)
  const generatedLabel = new Date(opts.generatedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report apiario — ${apiaryName}</title>
</head>
<body style="margin:0; padding:0; background-color:#FEF3C7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FEF3C7; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background-color:#FFFBEB; border-radius:16px; border:1px solid #FDE68A; overflow:hidden;">

          <!-- Header con logo -->
          <tr>
            <td align="center" style="padding:40px 32px 24px 32px;">
              <img src="${opts.appUrl}/icons/icon-192.png"
              width="88" height="88" alt="Apidiario"
              style="display:block; border-radius:20px;">
              <h1 style="margin:16px 0 0 0; font-size:28px; font-weight:700; color:#78350F; letter-spacing:-0.5px;">Apidiario</h1>
              <p style="margin:4px 0 0 0; font-size:14px; color:#A16207;">Il diario digitale del tuo apiario</p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:600; color:#1F2937;">Il tuo report è pronto 🐝</h2>
              <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#374151;">
                In allegato trovi il report PDF per l'apiario <strong style="color:#78350F;">${apiaryName}</strong>, generato il ${generatedLabel}.
              </p>
              <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#374151;">
                Il report copre <strong>${opts.hiveCount}</strong> arni${opts.hiveCount === 1 ? 'a' : 'e'} e <strong>${opts.inspectionCount}</strong> ispezion${opts.inspectionCount === 1 ? 'e' : 'i'}, con andamento telai, stato regine, patologie, varroa, interventi e trattamenti.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:10px; background-color:#D97706;">
                    <a href="${opts.appUrl}/statistiche" style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:600; color:#FFFBEB; text-decoration:none; border-radius:10px;">
                      Apri Apidiario
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:#FEF3C7; border-top:1px solid #FDE68A;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#A16207; text-align:center;">
                Hai generato tu stesso questo report dalla sezione Statistiche di Apidiario.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function corsFor(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allow = ALLOWED_ORIGINS.includes(origin) || LAN_DEV_ORIGIN_RE.test(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
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

  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  if (!user.email) {
    return new Response(
      JSON.stringify({ error: 'Il tuo account non ha un indirizzo email associato' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let apiaryId: string
  let apiaryName: string
  let pdfBase64: string
  let fileName: string
  let hiveCount: number
  let inspectionCount: number
  let generatedAt: string
  try {
    const body = await req.json()
    apiaryId = String(body.apiaryId ?? '')
    apiaryName = String(body.apiaryName ?? 'apiario')
    pdfBase64 = String(body.pdfBase64 ?? '')
    fileName = String(body.fileName ?? 'report.pdf')
    hiveCount = Number(body.hiveCount ?? 0)
    inspectionCount = Number(body.inspectionCount ?? 0)
    generatedAt = String(body.generatedAt ?? new Date().toISOString())
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!apiaryId || !pdfBase64) {
    return new Response(
      JSON.stringify({ error: 'apiaryId e pdfBase64 sono obbligatori' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // Verifica che l'utente abbia accesso all'apiario (proprietario o condiviso)
  const { data: apiary } = await supabase
    .from('apiaries')
    .select('id, owner_id')
    .eq('id', apiaryId)
    .maybeSingle()
  if (!apiary) {
    return new Response(
      JSON.stringify({ error: 'Apiario non trovato' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  let allowed = apiary.owner_id === user.id
  if (!allowed) {
    const { data: access } = await supabase
      .from('apiary_access')
      .select('user_id')
      .eq('apiary_id', apiaryId)
      .eq('user_id', user.id)
      .maybeSingle()
    allowed = !!access
  }
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let pdfBytes: Uint8Array
  try {
    pdfBytes = decodeBase64(pdfBase64)
  } catch {
    return new Response(
      JSON.stringify({ error: 'pdfBase64 non valido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  console.log('[send-apiary-report] pdfBase64 length:', pdfBase64.length, 'decoded bytes:', pdfBytes.byteLength)
  if (pdfBytes.byteLength === 0) {
    return new Response(
      JSON.stringify({ error: 'PDF vuoto ricevuto dal client' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  if (pdfBytes.byteLength > MAX_PDF_BYTES) {
    return new Response(
      JSON.stringify({ error: 'PDF troppo grande per essere inviato per email' }),
      { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const gmailUser = Deno.env.get('GMAIL_USER')
  const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD')
  if (!gmailUser || !gmailPass) {
    return new Response(
      JSON.stringify({ error: 'Invio email non configurato sul server' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailPass },
    },
  })

  const appUrl = Deno.env.get('APP_URL') ?? 'https://apidiario.stefano-passiatore.workers.dev'

  try {
    await client.send({
      from: gmailUser,
      to: user.email,
      subject: `Report apiario — ${apiaryName}`,
      content: `In allegato il report PDF per l'apiario "${apiaryName}", generato da apidiario.`,
      html: buildEmailHtml({ apiaryName, hiveCount, inspectionCount, generatedAt, appUrl }),
      attachments: [
        { filename: fileName, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' },
      ],
    })
  } catch (err) {
    console.error('[send-apiary-report] invio fallito', err)
    return new Response(
      JSON.stringify({ error: 'Invio email fallito' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } finally {
    await client.close()
  }

  return new Response(
    JSON.stringify({ ok: true, sentTo: user.email }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
