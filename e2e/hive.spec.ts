import { test, expect, login } from './helpers'

test.describe('hive CRUD', () => {
  let apiaryId: string

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await login(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const apiaryCard = page.locator('button:has(svg.lucide-trees)').first()
    await expect(apiaryCard).toBeVisible({ timeout: 10000 })
    await apiaryCard.click()
    await expect(page).toHaveURL(/\/apiaries\/.+/, { timeout: 10000 })
    apiaryId = page.url().split('/apiaries/')[1]
    await ctx.close()
  })

  test('creazione nuova arnia da pagina apiario', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')
    await login(page)

    await page.goto(`/apiaries/${apiaryId}/hives/new`)
    await page.waitForLoadState('networkidle')

    const uid = Date.now().toString(36)
    const hiveId = `PW-${uid}`

    const idInput = page.locator('#hive-identifier')
    await expect(idInput).toBeVisible({ timeout: 10000 })
    await idInput.fill(hiveId)

    const notesInput = page.locator('#hive-notes')
    await notesInput.fill('Arnia creata da test PW')

    const saveBtn = page.getByRole('button', { name: /salva arnia/i })
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()

    await page.waitForURL(`/apiaries/${apiaryId}`, { timeout: 15000 })
    await expect(page.getByText(hiveId).first()).toBeVisible({ timeout: 10000 })
  })

  test('pagina elenco ispezioni carica', async ({ page }) => {
    test.skip(!apiaryId, 'Nessun apiario')
    await login(page)

    await page.goto(`/apiaries/${apiaryId}`)
    await page.waitForLoadState('networkidle')

    // Get the first hive's inspections link href from the swipe panel
    const visiteLink = page.getByRole('link', { name: /visite/i }).first()
    const href = await visiteLink.getAttribute('href')

    await page.goto(href!)
    await expect(page).toHaveURL(/\/inspections$/, { timeout: 5000 })
    await page.waitForLoadState('networkidle')
    // Inspections list shows "Visite" subheading
    await expect(page.getByText('Visite').first()).toBeVisible({ timeout: 5000 })
  })
})
