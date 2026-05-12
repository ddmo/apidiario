import { test, expect, login } from './helpers'

test.describe('page loads', () => {
  test('caricamento pagina home dopo login', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Apiari', { timeout: 10000 })
  })

  test('pagina Più mostra info utente e theme toggle', async ({ page }) => {
    await login(page)
    await page.goto('/piu')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Più', { timeout: 10000 })
    // User info visible
    await expect(page.getByText('playwright@test.apidiario').first()).toBeVisible({ timeout: 5000 })
    // Logout button present
    await expect(page.getByRole('button', { name: /esci|logout/i })).toBeVisible()
  })

  test('pagina calendario carica', async ({ page }) => {
    await login(page)
    await page.goto('/calendario')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Calendario', { timeout: 10000 })
  })

  test('pagina trattamenti carica', async ({ page }) => {
    await login(page)
    await page.goto('/trattamenti')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Trattamenti', { timeout: 10000 })
  })

  test('pagina arnie carica', async ({ page }) => {
    await login(page)
    await page.goto('/arnie')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Arnie', { timeout: 10000 })
  })

  test('bottom tab navigazione funziona', async ({ page }) => {
    await login(page)

    const tabs = [
      { label: /apiari/i, url: /\// },
      { label: /trattamenti/i, url: /\/trattamenti/ },
      { label: /calendario/i, url: /\/calendario/ },
      { label: /più/i, url: /\/piu/ },
    ]

    for (const tab of tabs) {
      const btn = page.getByRole('link', { name: tab.label }).first()
      await expect(btn).toBeVisible({ timeout: 5000 })
      await btn.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(tab.url, { timeout: 5000 })
    }
  })
})
