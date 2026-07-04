/**
 * Seed script: resetta e ricrea dati realistici per l'utenza Playwright.
 * Usato per generare screenshot della documentazione.
 * Usage: node scripts/seed-docs-data.mjs
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
  const userId = auth.user.id
  const h = { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': `Bearer ${auth.access_token}` }
  const hRep = { ...h, 'Prefer': 'return=representation' }

  console.log('Signed in as', EMAIL, '(', userId, ')')

  // 1. Elimina tutto nell'ordine giusto (FK RESTRICT: ispezioni → arnie → apiari)
  const existingApiaries = await (await fetch(`${URL}/rest/v1/apiaries?owner_id=eq.${userId}&select=id`, { headers: h })).json()
  const apiaryIds = existingApiaries.map(a => a.id)
  if (apiaryIds.length > 0) {
    const idList = apiaryIds.join(',')
    // Hives
    const hives = await (await fetch(`${URL}/rest/v1/hives?apiary_id=in.(${idList})&select=id`, { headers: h })).json()
    if (hives.length > 0) {
      const hiveIdList = hives.map(h2 => h2.id).join(',')
      await fetch(`${URL}/rest/v1/inspections?hive_id=in.(${hiveIdList})`, { method: 'DELETE', headers: h })
      await fetch(`${URL}/rest/v1/hives?apiary_id=in.(${idList})`, { method: 'DELETE', headers: h })
    }
    for (const a of existingApiaries) {
      await fetch(`${URL}/rest/v1/apiaries?id=eq.${a.id}`, { method: 'DELETE', headers: h })
    }
  }
  console.log(`Eliminati ${existingApiaries.length} apiari esistenti`)

  // 2. Crea apiario principale
  const apiaryInsert = await fetch(`${URL}/rest/v1/apiaries`, {
    method: 'POST', headers: h,
    body: JSON.stringify({
      name: 'Apiario Collina Sud',
      owner_id: userId,
      latitude: 44.4949,
      longitude: 11.3426,
      notes: 'Posizione riparata, esposizione sud. Buona presenza di tiglio e robinia nelle vicinanze.',
    }),
  })
  if (!apiaryInsert.ok) { console.error('Create apiary failed:', apiaryInsert.status, await apiaryInsert.text()); process.exit(1) }
  const apiaryId = (await (await fetch(`${URL}/rest/v1/apiaries?owner_id=eq.${userId}&name=eq.Apiario+Collina+Sud&select=id`, { headers: h })).json())[0]?.id
  if (!apiaryId) { console.error('Could not read apiary ID'); process.exit(1) }
  console.log('Apiario creato:', apiaryId)

  // 3. Crea arnie
  const hiveData = [
    { identifier: 'Arnia 1', hive_type: 'dadant_blatt', bee_race: 'ligustica', nido_frame_count: 10, melari_count: 1 },
    { identifier: 'Arnia 2', hive_type: 'dadant_blatt', bee_race: 'ligustica', nido_frame_count: 10, melari_count: 1 },
    { identifier: 'Arnia 3', hive_type: 'dadant_blatt', bee_race: 'carnica', nido_frame_count: 9, melari_count: 0 },
    { identifier: 'Nucleo Robinia', hive_type: 'altro', bee_race: 'buckfast', nido_frame_count: 5, melari_count: 0 },
  ]

  const hiveIds = []
  for (const hive of hiveData) {
    const hiveInsert = await fetch(`${URL}/rest/v1/hives`, {
      method: 'POST', headers: h,
      body: JSON.stringify({
        ...hive,
        apiary_id: apiaryId,
        status: 'attiva',
        has_apiscampo: false,
        has_pollen_trap: false,
        has_propolis_net: false,
        installed_on: '2026-04-01',
      }),
    })
    if (!hiveInsert.ok) { console.error('Create hive failed:', hive.identifier, hiveInsert.status, await hiveInsert.text()); process.exit(1) }
    const hiveId = (await (await fetch(`${URL}/rest/v1/hives?apiary_id=eq.${apiaryId}&identifier=eq.${encodeURIComponent(hive.identifier)}&select=id`, { headers: h })).json())[0]?.id
    hiveIds.push(hiveId)
    console.log('Arnia creata:', hive.identifier, hiveId)
  }

  // 4. Crea ispezioni realistiche
  const inspections = [
    // Arnia 1
    { hive_id: hiveIds[0], performed_by: userId, performed_at: '2026-04-15', queen_seen: 'vista', population: 'media', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 6, honey_frame_count: 2, empty_frame_count: 2, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [], varroa_count: 2, varroa_count_method: 'lavaggio_alcol' },
    { hive_id: hiveIds[0], performed_by: userId, performed_at: '2026-05-10', queen_seen: 'vista', population: 'forte', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 8, honey_frame_count: 4, empty_frame_count: 0, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [], varroa_count: 1, varroa_count_method: 'lavaggio_alcol', notes: 'Melario ben avviato, scorte abbondanti.' },
    { hive_id: hiveIds[0], performed_by: userId, performed_at: '2026-06-20', queen_seen: 'vista', population: 'forte', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 9, honey_frame_count: 6, empty_frame_count: 0, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [] },
    // Arnia 2
    { hive_id: hiveIds[1], performed_by: userId, performed_at: '2026-04-15', queen_seen: 'vista', population: 'debole', behavior: 'calmo', brood_eggs: true, brood_larvae: false, brood_capped: false, brood_frame_count: 3, honey_frame_count: 1, empty_frame_count: 6, has_queen_cells: false, needs_intervention: true, interventions: [], pending_interventions: ['Monitorare sviluppo covata'], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [], notes: 'Famiglia debole, da tenere d\'occhio.' },
    { hive_id: hiveIds[1], performed_by: userId, performed_at: '2026-05-10', queen_seen: 'vista', population: 'media', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 6, honey_frame_count: 2, empty_frame_count: 2, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [], notes: 'Buon recupero rispetto ad aprile.' },
    { hive_id: hiveIds[1], performed_by: userId, performed_at: '2026-06-20', queen_seen: 'vista', population: 'forte', behavior: 'nervoso', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 8, honey_frame_count: 3, empty_frame_count: 0, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [] },
    // Arnia 3
    { hive_id: hiveIds[2], performed_by: userId, performed_at: '2026-04-20', queen_seen: 'non_cercata', population: 'media', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 5, honey_frame_count: 2, empty_frame_count: 2, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [] },
    { hive_id: hiveIds[2], performed_by: userId, performed_at: '2026-05-18', queen_seen: 'vista', population: 'media', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 7, honey_frame_count: 2, empty_frame_count: 0, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [] },
    // Nucleo Robinia
    { hive_id: hiveIds[3], performed_by: userId, performed_at: '2026-05-05', queen_seen: 'vista', population: 'debole', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: false, brood_frame_count: 2, honey_frame_count: 1, empty_frame_count: 2, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [], notes: 'Nucleo appena formato, in ottimo sviluppo.' },
    { hive_id: hiveIds[3], performed_by: userId, performed_at: '2026-06-01', queen_seen: 'vista', population: 'media', behavior: 'calmo', brood_eggs: true, brood_larvae: true, brood_capped: true, brood_frame_count: 4, honey_frame_count: 1, empty_frame_count: 0, has_queen_cells: false, needs_intervention: false, interventions: [], pending_interventions: [], queen_cell_types: {}, queen_cells_remaining: {}, queen_cells_removed: {}, pathologies: [] },
  ]

  for (const insp of inspections) {
    if (!insp.hive_id) continue
    const res = await fetch(`${URL}/rest/v1/inspections`, {
      method: 'POST', headers: h,
      body: JSON.stringify(insp),
    })
    if (!res.ok) console.error('Inspection failed:', await res.text())
  }
  console.log(`Create ${inspections.length} ispezioni`)
  console.log('\nDone! Dati pronti per screenshot.')
}

main().catch(console.error)
