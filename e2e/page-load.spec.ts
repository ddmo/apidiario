import { test, expect } from './helpers'

test.describe('page loads', () => {
  test('caricamento pagina home dopo login', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Apidiario', { timeout: 10000 })
  })

  test('pagina Più mostra info utente e theme toggle', async ({ page }) => {
    await page.goto('/piu')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Più', { timeout: 10000 })
    await expect(page.getByText('playwright@test.apidiario').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /esci|logout/i })).toBeVisible()
  })

  test('pagina calendario carica', async ({ page }) => {
    await page.goto('/calendario')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Calendario', { timeout: 10000 })
  })

  test('pagina trattamenti carica', async ({ page }) => {
    await page.goto('/trattamenti')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Trattamenti', { timeout: 10000 })
  })

  test('pagina arnie carica', async ({ page }) => {
    await page.goto('/arnie')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Arnie', { timeout: 10000 })
  })

  test('bottom tab navigazione funziona', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const tabs = [
      { label: /home/i, url: /\// },
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
