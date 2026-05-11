import { test, expect, login } from './helpers'

test.describe('navigation consistency', () => {
  let apiaryId: string

  test.beforeAll(async ({ browser }) => {
    // Log in once, navigate to home, grab first apiary ID from URL
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)

    // Navigate to apiaries list (home)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click first apiary card link
    const apiaryLink = page.locator('a[href^="/apiaries/"]').first()
    await expect(apiaryLink).toBeVisible({ timeout: 10000 })
    const href = await apiaryLink.getAttribute('href')
    apiaryId = href!.replace('/apiaries/', '')
    await ctx.close()
  })

  test('apiario -> ispeziona -> back torna all\'apiario', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario trovato nel DB')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    // Click first "Ispeziona" button on a hive card
    const ispezionaBtn = page.getByRole('link', { name: /ispeziona/i }).first()
    await expect(ispezionaBtn).toBeVisible({ timeout: 10000 })
    await ispezionaBtn.click()

    // Should be on new inspection page
    await expect(page).toHaveURL(/\/inspections\/.+/, { timeout: 10000 })

    // Click back button (ArrowLeft with aria-label="Indietro")
    const backBtn = page.getByLabel('Indietro')
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Should be back on the same apiary page
    await expect(page).toHaveURL(`/apiaries/${apiaryId}`, { timeout: 10000 })
  })

  test('lista apiari -> apiario -> back torna alla lista', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario trovato nel DB')

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click first apiary
    const apiaryLink = page.locator('a[href^="/apiaries/"]').first()
    await expect(apiaryLink).toBeVisible({ timeout: 10000 })
    await apiaryLink.click()
    await expect(page).toHaveURL(/\/apiaries\//)

    // Click back
    const backBtn = page.getByLabel('Indietro')
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Should be back at home
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })

  test('apiario -> lista ispezioni -> back torna all\'apiario', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario trovato nel DB')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    // Click first hive card with swipe → "Visite" link
    // The swipe panel link has text "Visite" and links to /hives/.../inspections
    const visiteLink = page.locator('a[href*="/inspections"]').first()
    await expect(visiteLink).toBeVisible({ timeout: 10000 })
    await visiteLink.click()

    // Should be on inspections list
    await expect(page).toHaveURL(/\/inspections$/, { timeout: 10000 })

    // Click back
    const backBtn = page.getByLabel('Indietro')
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Should be back on the apiary page
    await expect(page).toHaveURL(`/apiaries/${apiaryId}`, { timeout: 10000 })
  })
})
