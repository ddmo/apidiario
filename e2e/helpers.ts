import { test as base, expect, type Page } from '@playwright/test'

/**
 * Log in via the login form using email + password from env.
 * Must set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD.
 */
async function login(page: Page) {
  const email = process.env.PLAYWRIGHT_EMAIL
  const password = process.env.PLAYWRIGHT_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD env vars to run authenticated tests.',
    )
  }

  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/apiari$|\/$/, { timeout: 15000 })
}

/**
 * Custom test with shared fixtures/extensions.
 * For now identical to base — we extend it here for future use.
 */
const test = base

export { test, expect, login }
