import { test } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/static/img/screenshots')

const APIARY_NAME = 'Apiario Collina Sud'
const HIVE_NAME = 'Arnia Test'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const EMAIL = 'playwright@test.apidiario'
const PASSWORD = 'PlaywrightTest123!'

async function ss(page: Parameters<typeof test>[2] extends (args: { page: infer P }) => unknown ? P : never, name: string) {
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: false })
}

// Fetch apiary + hive IDs directly via Supabase REST (bypass swipe-reveal DOM issue)
async function getTestIds(): Promise<{ apiaryId: string; hiveIds: string[]; inspectionIds: string[] }> {
  const auth = await (await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })).json()
  const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${auth.access_token}` }
  const apiaries = await (await fetch(`${SUPABASE_URL}/rest/v1/apiaries?owner_id=eq.${auth.user.id}&name=eq.Apiario%20Collina%20Sud&select=id`, { headers: h })).json()
  const apiaryId = apiaries[0]?.id
  const hives = await (await fetch(`${SUPABASE_URL}/rest/v1/hives?apiary_id=eq.${apiaryId}&select=id&order=created_at.asc`, { headers: h })).json()
  const hiveIds = hives.map((hv: { id: string }) => hv.id)
  const inspections = hiveIds[0]
    ? await (await fetch(`${SUPABASE_URL}/rest/v1/inspections?hive_id=eq.${hiveIds[0]}&select=id&order=performed_at.desc`, { headers: h })).json()
    : []
  const inspectionIds = Array.isArray(inspections) ? inspections.slice(0, 3).map((i: { id: string }) => i.id) : []
  return { apiaryId, hiveIds, inspectionIds }
}

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })

test.describe('screenshots documentazione', () => {
  let ids: { apiaryId: string; hiveIds: string[]; inspectionIds: string[] }

  test.beforeAll(async () => {
    ids = await getTestIds()
  })

  // ── APIARI ──────────────────────────────────────────────────────────────────

  test('01 - home con apiari', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await ss(page, '01-home')
  })

  test('02 - form nuovo apiario vuoto', async ({ page }) => {
    await page.goto('/apiaries/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await ss(page, '02-nuovo-apiario-vuoto')
  })

  test('03 - form nuovo apiario compilato', async ({ page }) => {
    await page.goto('/apiaries/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.fill('#apiary-name', APIARY_NAME)
    await page.waitForTimeout(300)
    await ss(page, '03-nuovo-apiario-compilato')
  })

  test('04 - pagina apiario', async ({ page }) => {
    await page.goto(`/apiaries/${ids.apiaryId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1200)
    await ss(page, '04-apiario-dettaglio')
  })

  // ── ARNIE ───────────────────────────────────────────────────────────────────

  test('05 - form nuova arnia vuoto', async ({ page }) => {
    await page.goto(`/apiaries/${ids.apiaryId}/hives/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await ss(page, '05-nuova-arnia-vuota')
  })

  test('06 - form nuova arnia compilato', async ({ page }) => {
    await page.goto(`/apiaries/${ids.apiaryId}/hives/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.fill('#hive-identifier', HIVE_NAME)
    await page.waitForTimeout(300)
    await ss(page, '06-nuova-arnia-compilata')
  })

  test('07 - elenco arnie in apiario', async ({ page }) => {
    await page.goto(`/apiaries/${ids.apiaryId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1200)
    await ss(page, '07-elenco-arnie')
  })

  test('08 - dettaglio arnia (schematico)', async ({ page }) => {
    await page.goto(`/apiaries/${ids.apiaryId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    // Espandi il primo schematico arnia
    const expandBtn = page.locator('button:has(svg.lucide-chevron-down), button:has(svg.lucide-chevron-up)').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await page.waitForTimeout(500)
    }
    await ss(page, '08-dettaglio-arnia')
  })

  // ── ISPEZIONI ───────────────────────────────────────────────────────────────

  test('09 - storico ispezioni arnia', async ({ page }) => {
    await page.goto(`/hives/${ids.hiveIds[0]}/inspections`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await ss(page, '09-storico-ispezioni')
  })

  test('10 - form nuova ispezione (inizio)', async ({ page }) => {
    await page.goto(`/inspections/${ids.hiveIds[0]}/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await ss(page, '10-nuova-ispezione')
  })

  test('11 - form nuova ispezione (covata)', async ({ page }) => {
    await page.goto(`/inspections/${ids.hiveIds[0]}/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await page.evaluate(() => window.scrollBy(0, 350))
    await page.waitForTimeout(300)
    await ss(page, '11-nuova-ispezione-covata')
  })

  test('12 - dettaglio ispezione', async ({ page }) => {
    if (!ids.inspectionIds[0]) return
    await page.goto(`/hives/${ids.hiveIds[0]}/inspections/${ids.inspectionIds[0]}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await ss(page, '12-dettaglio-ispezione')
  })

  test('13 - ispezione batch', async ({ page }) => {
    await page.goto(`/inspections/batch/${ids.apiaryId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await ss(page, '13-ispezione-batch')
  })

  // ── TRATTAMENTI ─────────────────────────────────────────────────────────────

  test('14 - lista trattamenti', async ({ page }) => {
    await page.goto('/trattamenti')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await ss(page, '14-trattamenti')
  })

  test('15 - form nuovo trattamento (inizio)', async ({ page }) => {
    await page.goto('/trattamenti/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await ss(page, '15-nuovo-trattamento')
  })

  test('16 - form nuovo trattamento (dettagli)', async ({ page }) => {
    await page.goto('/trattamenti/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await page.evaluate(() => window.scrollBy(0, 350))
    await page.waitForTimeout(300)
    await ss(page, '16-nuovo-trattamento-dettagli')
  })

  // ── STATISTICHE ─────────────────────────────────────────────────────────────

  test('17 - statistiche (header)', async ({ page }) => {
    await page.goto('/statistiche')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await ss(page, '17-statistiche')
  })

  test('18 - statistiche (grafici)', async ({ page }) => {
    await page.goto('/statistiche')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(400)
    await ss(page, '18-statistiche-grafici')
  })

  // ── CALENDARIO ──────────────────────────────────────────────────────────────

  test('19 - calendario', async ({ page }) => {
    await page.goto('/calendario')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await ss(page, '19-calendario')
  })

})
