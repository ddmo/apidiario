import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/static/img/screenshots')

const APIARY_NAME = 'Apiario Bosco dei Castagni'
const HIVE_NAMES = ['Arnia Alfa', 'Arnia Beta', 'Arnia Gamma']

async function screenshot(page: Parameters<typeof test>[2] extends (args: { page: infer P }) => unknown ? P : never, name: string) {
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/${name}.png`,
    fullPage: false,
  })
}

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 }) // iPhone 14 Pro @3x

test.describe('screenshots documentazione', () => {
  test('01 - home con apiari', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await screenshot(page, '01-home')
  })

  test('02 - form nuovo apiario', async ({ page }) => {
    await page.goto('/apiaries/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await screenshot(page, '02-nuovo-apiario-vuoto')

    await page.fill('#apiary-name', APIARY_NAME)
    await page.waitForTimeout(300)
    await screenshot(page, '03-nuovo-apiario-compilato')
  })

  test('03 - pagina apiario', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    // Cerca un apiario existente
    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    if (await apiaryCard.isVisible()) {
      await apiaryCard.click()
      await page.waitForURL(/\/apiaries\/.+/, { timeout: 10000 })
      await page.waitForTimeout(800)
      await screenshot(page, '04-apiario-dettaglio')
    }
  })

  test('04 - form nuova arnia', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    if (!await apiaryCard.isVisible()) return

    await apiaryCard.click()
    await page.waitForURL(/\/apiaries\/.+/, { timeout: 10000 })
    const apiaryId = page.url().split('/apiaries/')[1]

    await page.goto(`/apiaries/${apiaryId}/hives/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await screenshot(page, '05-nuova-arnia-vuota')

    await page.fill('#hive-identifier', HIVE_NAMES[0]!)
    await page.waitForTimeout(300)
    await screenshot(page, '06-nuova-arnia-compilata')
  })

  test('05 - elenco arnie in apiario', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    if (!await apiaryCard.isVisible()) return

    await apiaryCard.click()
    await page.waitForURL(/\/apiaries\/.+/, { timeout: 10000 })
    await page.waitForTimeout(1200)
    await screenshot(page, '07-elenco-arnie')
  })

  test('06 - dettaglio arnia', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    if (!await apiaryCard.isVisible()) return

    await apiaryCard.click()
    await page.waitForURL(/\/apiaries\/.+/, { timeout: 10000 })
    await page.waitForTimeout(800)

    const hiveBtn = page.locator('a[href*="/hives/"]').first()
    if (await hiveBtn.isVisible()) {
      const href = await hiveBtn.getAttribute('href')
      if (href) await page.goto(href)
      await page.waitForURL(/\/hives\/.+/, { timeout: 10000 })
      await page.waitForTimeout(800)
      await screenshot(page, '08-dettaglio-arnia')
    }
  })
})
