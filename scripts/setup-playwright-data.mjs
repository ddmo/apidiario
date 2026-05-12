/**
 * Setup script: signs in as playwright user, creates test apiary + hive.
 * Usage: node scripts/setup-playwright-data.mjs
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const EMAIL = 'playwright@test.apidiario'
const PASSWORD = 'PlaywrightTest123!'
const URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!URL || !KEY) { console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'); process.exit(1) }

async function main() {
  // Sign in
  const auth = await (await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })).json()
  if (!auth.access_token) { console.error('Signin failed:', auth); process.exit(1) }
  console.log('Signed in:', auth.user.id)

  const h = { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': `Bearer ${auth.access_token}` }

  // Find existing apiary
  const apiaries = await (await fetch(`${URL}/rest/v1/apiaries?owner_id=eq.${auth.user.id}&select=id,name`, { headers: h })).json()
  let apiaryId = apiaries.find(a => a.name === 'Test Apiario Playwright')?.id

  if (!apiaryId) {
    const r = await fetch(`${URL}/rest/v1/apiaries`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ name: 'Test Apiario Playwright', owner_id: auth.user.id, latitude: 42.5, longitude: 12.5 }),
    })
    if (!r.ok) { console.error('Create apiary failed:', r.status, await r.text()); process.exit(1) }
    // Re-query to get the ID
    apiaryId = (await (await fetch(`${URL}/rest/v1/apiaries?owner_id=eq.${auth.user.id}&select=id,name`, { headers: h })).json()).find(a => a.name === 'Test Apiario Playwright')?.id
    console.log('Apiary created:', apiaryId)
  } else {
    console.log('Apiary exists:', apiaryId)
  }

  // Find existing hive
  const hives = await (await fetch(`${URL}/rest/v1/hives?apiary_id=eq.${apiaryId}&select=id,identifier`, { headers: h })).json()
  let hiveId = hives.find(h => h.identifier === 'A1')?.id

  if (!hiveId) {
    const r = await fetch(`${URL}/rest/v1/hives`, {
      method: 'POST', headers: h,
      body: JSON.stringify({
        apiary_id: apiaryId, identifier: 'A1', hive_type: 'dadant_blatt',
        bee_race: 'ligustica', status: 'attiva', nido_frame_count: 10, melari_count: 0,
        has_apiscampo: false, has_pollen_trap: false, has_propolis_net: false,
      }),
    })
    if (!r.ok) { console.error('Create hive failed:', r.status, await r.text()); process.exit(1) }
    hiveId = (await (await fetch(`${URL}/rest/v1/hives?apiary_id=eq.${apiaryId}&select=id`, { headers: h })).json())[0]?.id
    console.log('Hive created:', hiveId)
  } else {
    console.log('Hive exists:', hiveId)
  }

  if (!apiaryId || !hiveId) { console.error('Failed to get IDs'); process.exit(1) }
  console.log('\nTest data ready!')
}

main().catch(console.error)
