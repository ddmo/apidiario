#!/usr/bin/env node
// Genera src/types/database.ts dallo schema Supabase locale.
// Il CLI genera già Tables/TablesInsert/TablesUpdate/Enums — non aggiungere duplicati.

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const types = execSync('npx supabase gen types typescript --local --schema public', {
  encoding: 'utf8',
  stdio: ['inherit', 'pipe', 'pipe'],
})

writeFileSync('src/types/database.ts', types, 'utf8')
console.log('✓ src/types/database.ts generato')
