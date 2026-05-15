import { test, expect } from './helpers'

test.describe('batch inspection', () => {
  let apiaryId: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: 'e2e/.auth.json' })
    const page = await ctx.newPage()
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    await expect(apiaryCard).toBeVisible({ timeout: 10000 })
    await apiaryCard.click()
    await expect(page).toHaveURL(/\/apiaries\/.+/, { timeout: 10000 })

    apiaryId = page.url().split('/apiaries/')[1]
    await ctx.close()
  })

  test('bottom nav "Visita" opens picker, select 2+ hives, proceed to batch', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    // Open the "Visita" button from bottom nav
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const visitaBtn = page.getByRole('button', { name: /nuova ispezione/i })
    await expect(visitaBtn).toBeVisible({ timeout: 10000 })
    await visitaBtn.click()

    // Wait for the picker sheet
    const sheet = page.getByRole('dialog', { name: /seleziona arnie/i })
    await expect(sheet).toBeVisible({ timeout: 5000 })

    // Wait for hives to load
    const hiveRows = sheet.locator('button:has(svg.lucide-trees)')
    await expect(hiveRows.first()).toBeVisible({ timeout: 10000 })
    const count = await hiveRows.count()
    test.skip(count < 2, 'Need at least 2 hives for batch test')

    // Click first two hives to select them
    await hiveRows.nth(0).click()
    await hiveRows.nth(1).click()

    // Bottom bar should appear with batch count
    const batchBtn = sheet.getByRole('button', { name: /ispezione multipla/i })
    await expect(batchBtn).toBeVisible({ timeout: 3000 })
    await expect(batchBtn).toContainText(/arne|arnie/)

    // Proceed to batch
    await batchBtn.click()

    // Should land on batch inspection page — step base-form
    await expect(page).toHaveURL(/\/inspections\/batch\//, { timeout: 10000 })
    await expect(page.getByText('Ispezione multipla').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/arnie/)).toBeVisible({ timeout: 5000 })
  })

  test('batch inspection — fill express form, review, save', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    // Open bottom nav picker
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const visitaBtn = page.getByRole('button', { name: /nuova ispezione/i })
    await expect(visitaBtn).toBeVisible({ timeout: 10000 })
    await visitaBtn.click()

    const sheet = page.getByRole('dialog', { name: /seleziona arnie/i })
    await expect(sheet).toBeVisible({ timeout: 5000 })

    const hiveRows = sheet.locator('button:has(svg.lucide-trees)')
    await expect(hiveRows.first()).toBeVisible({ timeout: 10000 })
    const count = await hiveRows.count()
    test.skip(count < 2, 'Need at least 2 hives for batch test')

    // Select all visible hives
    for (let i = 0; i < Math.min(count, 3); i++) {
      await hiveRows.nth(i).click()
    }

    const batchBtn = sheet.getByRole('button', { name: /ispezione multipla/i })
    await expect(batchBtn).toBeVisible({ timeout: 3000 })
    await batchBtn.click()

    await expect(page).toHaveURL(/\/inspections\/batch\//, { timeout: 10000 })

    // Should be on base-form step — fill express fields
    // Queen: click "Vista"
    const vistaBtn = page.getByRole('radio', { name: 'Vista', exact: true })
    await expect(vistaBtn).toBeVisible({ timeout: 5000 })
    await vistaBtn.click()

    // Population: click "Forte"
    const forteBtn = page.getByRole('radio', { name: 'Forte' })
    await expect(forteBtn).toBeVisible({ timeout: 5000 })
    await forteBtn.click()

    // Click "Avanti" to go to review
    const avantiBtn = page.getByRole('button', { name: /avanti/i })
    await expect(avantiBtn).toBeVisible({ timeout: 3000 })
    await avantiBtn.click()

    // Review step — should show hive list with key indicators
    await expect(page.getByText('Revisione ispezioni').first()).toBeVisible({ timeout: 5000 })

    // Save
    const salvaBtn = page.getByRole('button', { name: /salva ispezioni/i })
    await expect(salvaBtn).toBeVisible({ timeout: 3000 })
    await salvaBtn.click()

    // Should navigate back to apiary page after save
    await expect(page).toHaveURL(/\/apiaries\//, { timeout: 30000 })
  })
})
