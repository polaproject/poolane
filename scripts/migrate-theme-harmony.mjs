#!/usr/bin/env node
/**
 * Phase 11 — theme harmony migration.
 *
 * Replace non-adaptive hardcodes:
 * - `bg-ink text-paper` in hero patterns → `hero-block`
 * - `text-ink` → `text-foreground` (adaptive via shadcn var)
 * - `text-ink/N` → `text-foreground/N`
 * - `border-ink/N` → `border-foreground/N`
 * - `ring-ink/N` → `ring-foreground/N`
 *
 * Skips:
 * - SVG fill attributes
 * - email templates
 * - sandbox folder
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TARGET_DIR = join(ROOT, 'src')

const SKIP_DIRS = ['node_modules', '.next', '.git', 'sandbox', 'public', 'qa', 'email']
const SKIP_FILES = ['theme.config.ts', 'theme.config.tsx']

const RULES = [
  // Hero band pattern: bg-ink text-paper với padding to (hero) → hero-block
  // Pattern khá đặc trưng — div bg-ink text-paper followed by px-* with relative overflow-hidden
  [/\bbg-ink\s+text-paper(\s+px-\d)/g, 'hero-block$1'],

  // text-ink/N (semi-transparent dark text — fail in dark mode if not in hero)
  [/\btext-ink\/(\d+)\b/g, 'text-foreground/$1'],

  // text-ink (full opacity dark text)
  [/\btext-ink\b(?!-)/g, 'text-foreground'],

  // border-ink/N adaptive
  [/\bborder-ink\/(\d+)\b/g, 'border-foreground/$1'],

  // ring-ink/N adaptive
  [/\bring-ink\/(\d+)\b/g, 'ring-foreground/$1'],

  // divide-ink/N adaptive
  [/\bdivide-ink\/(\d+)\b/g, 'divide-foreground/$1'],

  // hover:bg-ink/N adaptive
  [/\bhover:bg-ink\/(\d+)\b/g, 'hover:bg-foreground/$1'],
]

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (SKIP_DIRS.includes(e)) continue
      yield* walk(full)
    } else if (/\.(tsx|jsx)$/.test(e) && !SKIP_FILES.includes(e)) {
      yield full
    }
  }
}

let totalChanges = 0
let touched = 0
for (const file of walk(TARGET_DIR)) {
  let content
  try { content = readFileSync(file, 'utf8') } catch { continue }
  let n = 0
  for (const [pattern, replacement] of RULES) {
    const m = content.match(pattern)
    if (m) {
      n += m.length
      content = content.replace(pattern, replacement)
    }
  }
  if (n > 0) {
    writeFileSync(file, content, 'utf8')
    const rel = file.replace(ROOT, '').replace(/\\/g, '/')
    console.log(`✓ ${rel} — ${n}`)
    totalChanges += n
    touched++
  }
}
console.log(`\nTotal: ${totalChanges} replacements across ${touched} files`)
