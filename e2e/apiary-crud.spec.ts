import { test, expect } from './helpers'

test.describe('apiary CRUD', () => {
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

  test('creazione nuovo apiario', async ({ page }) => {
    await page.goto('/apiaries/new')
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('#apiary-name')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('Apiario di test PW')

    const saveBtn = page.getByRole('button', { name: /salva apiario/i })
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()

    // Verify redirect to home + new apiary appears
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByText('Apiario di test PW').first()).toBeVisible({ timeout: 10000 })
  })

  test('campi obbligatori — nome richiesto', async ({ page }) => {
    await page.goto('/apiaries/new')
    await page.waitForLoadState('networkidle')

    // Click save with empty name
    const saveBtn = page.getByRole('button', { name: /salva apiario/i })
    await saveBtn.click()

    // Should show validation error
    await expect(page.locator('#apiary-name')).toBeVisible({ timeout: 5000 })
  })

  test('modifica nome apiario esistente', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')
    await page.goto(`/apiaries/${apiaryId}/edit`)
    await page.waitForLoadState('networkidle')

    const nameInput = page.locator('#apiary-name')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill('Apiario rinominato PW')

    const updateBtn = page.getByRole('button', { name: /aggiorna apiario/i })
    await expect(updateBtn).toBeVisible()
    await updateBtn.click()

    // Verify redirect to home
    await expect(page).toHaveURL('/', { timeout: 10000 })
    // Verify the renamed apiary appears
    await expect(page.getByText('Apiario rinominato PW').first()).toBeVisible({ timeout: 10000 })


    // Rename back to original name for other tests
    await page.goto(`/apiaries/${apiaryId}/edit`)
    await page.waitForLoadState('networkidle')
    await page.locator('#apiary-name').fill('Test Apiario Playwright')
    await page.getByRole('button', { name: /aggiorna apiario/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })
  })
})
