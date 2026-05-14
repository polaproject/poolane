#!/usr/bin/env node
/**
 * Phase 10 — mass migrate solid surfaces → Liquid Glass.
 * Replace common patterns:
 *   bg-white rounded-X shadow-Y     → glass-card rounded-X
 *   bg-white rounded-card-lg ...    → glass-card
 *   className="... bg-white ..."    → glass-card
 *
 * Run: node scripts/migrate-glass.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TARGET_DIR = join(ROOT, 'src')

const RULES = [
  // Card patterns with bg-white + rounded-* + shadow-* (the most common card)
  // Convert to glass-card (which already includes background, border, radius, shadow)
  [/\bbg-white\s+rounded-card-lg\s+shadow-(?:sm|soft)\s+border\s+border-ink\/8\b/g, 'glass-card glass-card-hover'],
  [/\bbg-white\s+rounded-card-lg\s+shadow-soft\s+ring-1\s+ring-ink\/8\b/g, 'glass-card glass-card-hover'],
  [/\brounded-card-lg\s+bg-white\s+shadow-soft\s+ring-1\s+ring-ink\/8\b/g, 'glass-card glass-card-hover'],
  [/\bbg-white\s+rounded-card\s+border\s+border-ink\/8\b/g, 'glass-card'],
  [/\bbg-white\s+rounded-card-lg\b/g, 'glass-card'],
  [/\bbg-white\s+rounded-card\b/g, 'glass-card'],
  [/\bbg-white\s+rounded-xl\b/g, 'glass-card'],
  [/\bbg-white\s+rounded-2xl\b/g, 'glass-card'],
  // Standalone bg-white where surface needed → bg-[var(--surface)]
  [/\bbg-white\b/g, 'bg-[var(--surface)]'],
]

function* walk(dir) {
  const entries = readdirSync(dir)
  for (const e of entries) {
    const full = join(dir, e)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (['node_modules', '.next', '.git', 'sandbox', 'public', 'qa'].includes(e)) continue
      yield* walk(full)
    } else if (/\.(tsx|jsx|ts|js)$/.test(e)) {
      yield full
    }
  }
}

let totalChanges = 0
let touchedFiles = 0
for (const file of walk(TARGET_DIR)) {
  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch (e) {
    continue
  }
  let fileChanges = 0
  for (const [pattern, replacement] of RULES) {
    const matches = content.match(pattern)
    if (matches) {
      fileChanges += matches.length
      content = content.replace(pattern, replacement)
    }
  }
  if (fileChanges > 0) {
    writeFileSync(file, content, 'utf8')
    const rel = file.replace(ROOT, '').replace(/\\/g, '/')
    console.log(`✓ ${rel} — ${fileChanges} replacements`)
    totalChanges += fileChanges
    touchedFiles++
  }
}
console.log(`\nTotal: ${totalChanges} replacements across ${touchedFiles} files`)
