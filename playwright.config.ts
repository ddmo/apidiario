import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
    use: {
    baseURL: 'https://localhost:5173',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/*.setup.ts',
    },
    {
      name: 'chromium-auth',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/login.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-login',
      testMatch: '**/login.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
