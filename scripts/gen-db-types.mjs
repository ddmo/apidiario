#!/usr/bin/env node
// Genera src/types/database.ts dallo schema Supabase locale.
// Il CLI genera già Tables/TablesInsert/TablesUpdate/Enums — non aggiungere duplicati.

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const raw = execSync('npx supabase gen types typescript --local --schema public', {
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'pipe'],
})

// Strip CLI noise (init messages, upgrade notices, plugin hints) — keep only TS
const types = raw.replace(/^.*(Initialising|A new version of Supabase CLI|<claude-code-hint).*\n?/gm, '').trim()

writeFileSync('src/types/database.ts', types + '\n', 'utf8')
console.log('✓ src/types/database.ts generato')
