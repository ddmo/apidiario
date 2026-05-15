import { test as base, expect, type Page } from '@playwright/test'

/**
 * Log in via the login form using email + password from env.
 * Must set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD.
 */
async function login(page: Page, { retries = 2 } = {}) {
  const email = process.env.PLAYWRIGHT_EMAIL
  const password = process.env.PLAYWRIGHT_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD env vars to run authenticated tests.',
    )
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    await page.goto('/login')
    // If already logged in, /login redirects to /
    if (!page.url().includes('/login')) return

    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    try {
      await page.waitForURL(/\/$/, { timeout: 20000 })
      return
    } catch {
      if (attempt === retries) throw new Error('Login failed after retries')
      // Likely rate limited — wait before retry
      await page.waitForTimeout(3000)
    }
  }
}

/**
 * Custom test with shared fixtures/extensions.
 * For now identical to base — we extend it here for future use.
 */
const test = base

export { test, expect, login }
