import { test as setup } from '@playwright/test'
import { login } from './helpers'

const STORAGE_STATE = 'e2e/.auth.json'

setup('authenticate', async ({ page }) => {
  await login(page)
  await page.context().storageState({ path: STORAGE_STATE })
})
