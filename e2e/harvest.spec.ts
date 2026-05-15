import { test, expect } from './helpers'

test.describe('harvest CRUD', () => {
  test('pagina raccolti carica', async ({ page }) => {
    await page.goto('/raccolti')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Raccolti', { timeout: 10000 })
  })

  test('creazione nuovo raccolto', async ({ page }) => {
    await page.goto('/raccolti/new')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Nuovo raccolto', { timeout: 10000 })

    // Open apiary picker
    const apiaryTrigger = page.getByText('Seleziona apiario…')
    await expect(apiaryTrigger).toBeVisible({ timeout: 5000 })
    await apiaryTrigger.click()

    // Wait for the picker sheet to appear
    await expect(page.getByText('Seleziona apiario').first()).toBeVisible({ timeout: 3000 })

    // Click first apiary option in the picker (button with Trees icon in the z-50 overlay)
    const apiaryOption = page.locator('.fixed.inset-0.z-50 button:has(svg.lucide-trees)').first()
    const exists = await apiaryOption.count()
    test.skip(exists === 0, 'Nessun apiario disponibile per il test')
    await apiaryOption.click()

    // Picker should close
    await expect(page.getByText('Seleziona apiario')).toHaveCount(0, { timeout: 3000 })

    // Fill date
    const dateInput = page.locator('input[type="date"]').first()
    await expect(dateInput).toBeVisible({ timeout: 3000 })
    await dateInput.fill('2026-05-14')

    // Open honey type picker
    const honeyTrigger = page.getByText('Seleziona tipo…')
    await expect(honeyTrigger).toBeVisible({ timeout: 3000 })
    await honeyTrigger.click()

    // Wait for the honey picker
    await expect(page.getByText('Seleziona tipo miele').first()).toBeVisible({ timeout: 3000 })

    // Select first honey type (Miele or Millefiori)
    const honeyOption = page.locator('.fixed.inset-0.z-50 button:has(svg.lucide-droplet)').first()
    await expect(honeyOption).toBeVisible({ timeout: 3000 })
    await honeyOption.click()

    // Fill kg
    const kgInput = page.locator('input[type="number"]').first()
    await expect(kgInput).toBeVisible({ timeout: 3000 })
    await kgInput.fill('12.5')

    // Save
    const saveBtn = page.getByRole('button', { name: /salva raccolto/i })
    await expect(saveBtn).toBeVisible()
    await expect(saveBtn).toBeEnabled({ timeout: 3000 })
    await saveBtn.click()

    // Wait for redirect to raccolti list
    await expect(page).toHaveURL('/raccolti', { timeout: 15000 })
    // Verify the harvest appears (kg formatted with comma)
    await expect(page.getByText(/12,5/).first()).toBeVisible({ timeout: 10000 })
  })

  test('raccolti lista mostra contenuto', async ({ page }) => {
    await page.goto('/raccolti')
    await page.waitForLoadState('networkidle')

    // Either shows year headers or "Nessun raccolto"
    const content = page.locator('h2').first()
    await expect(content).toBeVisible({ timeout: 5000 })
  })
})
