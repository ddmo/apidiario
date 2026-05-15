import { test, expect } from './helpers'

test.describe('navigation consistency', () => {
  let apiaryId: string

  test.beforeAll(async ({ browser }) => {
    // Grab apiary ID once — fresh context, then discard
    const ctx = await browser.newContext({ storageState: 'e2e/.auth.json' })
    const page = await ctx.newPage()
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    await expect(apiaryCard).toBeVisible({ timeout: 10000 })
    await apiaryCard.click()
    await expect(page).toHaveURL(/\/apiaries\/.+/, { timeout: 10000 })

    apiaryId = page.url().split('/apiaries/')[1]
    console.log('Using apiaryId:', apiaryId)
    await ctx.close()
  })

  test('apiario -> ispeziona -> back torna apiario', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    const ispezionaBtn = page.getByRole('button', { name: /ispeziona/i }).first()
    await expect(ispezionaBtn).toBeVisible({ timeout: 10000 })
    await ispezionaBtn.click()
    await expect(page).toHaveURL(/\/inspections\/.+/, { timeout: 5000 })

    const backBtn = page.getByLabel('Indietro')
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    await expect(page).toHaveURL(`/apiaries/${apiaryId}`, { timeout: 10000 })
  })

  test('lista apiari -> apiario -> back torna lista', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    await expect(apiaryCard).toBeVisible({ timeout: 10000 })
    await apiaryCard.click()
    await expect(page).toHaveURL(/\/apiaries\//)

    const backBtn = page.getByLabel('Indietro')
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('apiario -> lista ispezioni -> back torna apiario', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    // "Visite" link is inside a swipe-reveal panel hidden by translateX.
    // Read href directly instead of simulating the touch swipe.
    const visiteLink = page.getByRole('link', { name: /visite/i }).first()
    const href = await visiteLink.getAttribute('href')
    await page.goto(href!)
    await expect(page).toHaveURL(/\/inspections$/, { timeout: 5000 })
    await page.waitForLoadState('networkidle')

    const backBtn = page.getByLabel('Indietro')
    await expect(backBtn).toBeVisible()
    await backBtn.click()
    await expect(page).toHaveURL(`/apiaries/${apiaryId}`, { timeout: 10000 })
  })
})
