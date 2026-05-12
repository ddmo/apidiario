/**
 * Setup script: creates a Playwright test user via Supabase Auth API
 * and writes credentials to .env.local.
 *
 * Usage: node scripts/setup-playwright-user.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local')
dotenv.config({ path: envPath })

// Test credentials
const EMAIL = 'playwright@test.apidiario'
const PASSWORD = 'PlaywrightTest123!'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local')
  process.exit(1)
}

async function main() {
  // Try signup
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })

  const body = await res.json()

  if (res.status === 200) {
    console.log('User created (or already exists).')
  } else if (body.code === 422 && body.msg?.includes('already exists')) {
    console.log('User already exists. Updating .env.local.')
  } else {
    console.error('Signup failed:', body)
    process.exit(1)
  }

  // Preserve existing VITE_* vars, update only PLAYWRIGHT_*
  const existing = fs.readFileSync(envPath, 'utf-8')
  const lines = existing.split('\n').filter((l) => !l.startsWith('PLAYWRIGHT_'))
  lines.push(
    '# Playwright E2E — managed by scripts/setup-playwright-user.mjs',
    `PLAYWRIGHT_EMAIL=${EMAIL}`,
    `PLAYWRIGHT_PASSWORD=${PASSWORD}`,
    '',
  )
  fs.writeFileSync(envPath, lines.join('\n'), 'utf-8')
  console.log(`Updated ${envPath}`)
  console.log('Run: npm run test:e2e')
}

main()
