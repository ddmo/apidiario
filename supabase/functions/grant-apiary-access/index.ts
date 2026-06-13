import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.16'

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  // 1. Verifica JWT chiamante
  const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt)
  if (userErr || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 2. Parsing body
  let apiaryId: string
  let email: string
  let role: string
  try {
    const body = await req.json()
    apiaryId = body.apiary_id?.trim() ?? ''
    email = body.email?.trim() ?? ''
    role = body.role?.trim() ?? ''
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 3. Validazione
  if (!apiaryId) {
    return new Response(
      JSON.stringify({ error: 'apiary_id richiesto' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  if (!EMAIL_RE.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Email non valida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  if (role !== 'reader' && role !== 'editor') {
    return new Response(
      JSON.stringify({ error: 'Ruolo deve essere reader o editor' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 4. Verifica chiamante è owner dell'apiario
  const { data: ownsApiary, error: ownsErr } = await supabase
    .from('apiaries')
    .select('id')
    .eq('id', apiaryId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownsErr || !ownsApiary) {
    return new Response(
      JSON.stringify({ error: 'Non sei il proprietario di questo apiario' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 5. Cerca utente destinatario per email
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers()
  if (usersErr) {
    return new Response(
      JSON.stringify({ error: 'Errore nella ricerca utente' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const targetUser = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!targetUser) {
    return new Response(
      JSON.stringify({ error: 'Nessun utente trovato con questa email' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!targetUser.email_confirmed_at) {
    return new Response(
      JSON.stringify({ error: "L'utente non ha ancora confermato l'email. Puoi condividere solo con utenti che hanno completato la registrazione." }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 6. Ottieni display_name dal profilo
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', targetUser.id)
    .single()

  // 7. Inserisci in apiary_access
  const { error: insertErr } = await supabase
    .from('apiary_access')
    .insert({
      apiary_id: apiaryId,
      user_id: targetUser.id,
      role,
      granted_by: user.id,
    })

  if (insertErr) {
    if (insertErr.code === '23505') {
      return new Response(
        JSON.stringify({ error: 'Utente già presente tra gli accessi di questo apiario' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    return new Response(
      JSON.stringify({ error: insertErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 8. Notifica email via Gmail SMTP
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPass = Deno.env.get('SMTP_PASS')
  const appUrl = Deno.env.get('APP_URL') ?? ''
  let emailSent = false

  if (smtpUser && smtpPass) {
    try {
      const roleLabel = role === 'editor' ? 'scrittura' : 'lettura'
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: `"Apidiario" <${smtpUser}>`,
        to: email,
        subject: `${profile?.display_name ?? user.email} ha condiviso un apiario con te`,
        html: `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apiario condiviso con te</title>
</head>
<body style="margin:0; padding:0; background-color:#FEF3C7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FEF3C7; padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background-color:#FFFBEB; border-radius:16px; border:1px solid #FDE68A; overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 32px 24px 32px;">
              <img src="https://apidiario.stefano-passiatore.workers.dev/icons/icon-192.png"
                   width="88" height="88" alt="Apidiario"
                   style="display:block; border-radius:20px;">
              <h1 style="margin:16px 0 0 0; font-size:28px; font-weight:700; color:#78350F; letter-spacing:-0.5px;">Apidiario</h1>
              <p style="margin:4px 0 0 0; font-size:14px; color:#A16207;">Il diario digitale del tuo apiario</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <h2 style="margin:0 0 16px 0; font-size:22px; font-weight:600; color:#1F2937;">Un apiario è stato condiviso con te 🐝</h2>
              <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#374151;">
                Ciao! <strong style="color:#78350F;">${profile?.display_name ?? user.email}</strong> ha condiviso con te un apiario su Apidiario.
              </p>
              <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#374151;">
                Hai ricevuto accesso in <strong style="color:#78350F;">${roleLabel}</strong>.
              </p>
            </td>
          </tr>
          ${appUrl ? `
          <tr>
            <td align="center" style="padding:0 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:10px; background-color:#D97706;">
                    <a href="${appUrl}" style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:600; color:#FFFBEB; text-decoration:none; border-radius:10px;">
                      Apri Apidiario
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:0; font-size:13px; line-height:1.5; color:#78716C; text-align:center;">
                Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
                <a href="${appUrl}" style="color:#A16207; word-break:break-all;">${appUrl}</a>
              </p>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:20px 32px; background-color:#FEF3C7; border-top:1px solid #FDE68A;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#A16207; text-align:center;">
                Se non ti aspettavi questa email, puoi ignorarla in sicurezza.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      })

      emailSent = true
    } catch (err) {
      console.error('Email send failed:', err)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      profile: {
        id: targetUser.id,
        email: targetUser.email,
        display_name: profile?.display_name ?? targetUser.email,
      },
      email_sent: emailSent,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
