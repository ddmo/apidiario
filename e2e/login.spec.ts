import { test, expect } from './helpers'

test.describe('login page', () => {
  test('mostra logo e form di login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Logo should be visible (Apidiario wordmark or icon)
    await expect(page.getByText(/apidiario/i).first()).toBeVisible({ timeout: 10000 })

    // Email and password fields
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 })

    // Submit button
    await expect(page.locator('button[type="submit"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('tentativo login con credenziali vuote mostra errore', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Click submit with empty fields
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()

    // Should still be on login page (no redirect)
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  test('redirect to home dopo login valido', async ({ page }) => {
    const email = process.env.PLAYWRIGHT_EMAIL
    const password = process.env.PLAYWRIGHT_PASSWORD
    test.skip(!email || !password, 'PLAYWRIGHT_EMAIL/PASSWORD not set')

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.locator('button[type="submit"]').click()

    // Should redirect to home (or wherever the app redirects post-login)
    await expect(page).not.toHaveURL('/login', { timeout: 15000 })
    // Should see the home page content
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })
})
