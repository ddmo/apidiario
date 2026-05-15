import { test, expect } from './helpers'

test.describe('single inspection', () => {
  let apiaryId: string
  let hiveId: string

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

    // Also grab first hive ID from the page
    // Hive cards show the identifier text; the URL is /apiaries/:apiaryId
    await ctx.close()
  })

  test('hive card mostra pulsante "Ispeziona"', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    const ispezionaBtn = page.getByRole('button', { name: /ispeziona/i }).first()
    await expect(ispezionaBtn).toBeVisible({ timeout: 10000 })
  })

  test('click "Ispeziona" naviga a nuova ispezione express', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    const ispezionaBtn = page.getByRole('button', { name: /ispeziona/i }).first()
    await expect(ispezionaBtn).toBeVisible({ timeout: 10000 })
    await ispezionaBtn.click()

    // Should navigate to new inspection page
    await expect(page).toHaveURL(/\/inspections\/.+\/new/, { timeout: 10000 })

    // Express mode should be the default — check for queen picker
    // The page should show "Regina" label (queen section)
    await expect(page.getByText('Regina').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Popolazione').first()).toBeVisible({ timeout: 5000 })
  })

  test('creazione ispezione express — salva con dati', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    const ispezionaBtn = page.getByRole('button', { name: /ispeziona/i }).first()
    await expect(ispezionaBtn).toBeVisible({ timeout: 10000 })
    await ispezionaBtn.click()

    await expect(page).toHaveURL(/\/inspections\/.+\/new/, { timeout: 10000 })
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Set queen to "Vista" — radio group
    const queenVista = page.getByRole('radio', { name: 'Vista', exact: true })
    await expect(queenVista).toBeVisible({ timeout: 5000 })
    await queenVista.click()

    // Set population to "Forte"
    const popForte = page.getByRole('radio', { name: 'Forte' })
    await expect(popForte).toBeVisible({ timeout: 5000 })
    await popForte.click()

    // Save — the submit bar has a save button
    const saveBtn = page.getByRole('button', { name: /salva/i }).last()
    await expect(saveBtn).toBeVisible({ timeout: 5000 })

    // Ensure save is enabled (form has changes)
    await expect(saveBtn).toBeEnabled({ timeout: 3000 })
    await saveBtn.click()

    // After saving, should navigate to the inspection detail page
    await expect(page).toHaveURL(/\/inspections\/.+/, { timeout: 30000 })
  })

  test('modalità standard ha campi extra', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    const ispezionaBtn = page.getByRole('button', { name: /ispeziona/i }).first()
    await expect(ispezionaBtn).toBeVisible({ timeout: 10000 })
    await ispezionaBtn.click()

    await expect(page).toHaveURL(/\/inspections\/.+\/new/, { timeout: 10000 })
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Switch to Standard mode
    const standardTab = page.getByRole('radio', { name: /standard/i })
    await expect(standardTab).toBeVisible({ timeout: 5000 })
    await standardTab.click()

    // Standard mode has additional fields
    await expect(page.getByText('Telaini').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Celle reali').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Comportamento').first()).toBeVisible({ timeout: 5000 })
  })
})
