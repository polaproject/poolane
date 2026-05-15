#!/usr/bin/env node
/**
 * Phase 13 — Typography discipline migration.
 *
 * Replace italic-serif headings → sans-headline.
 * Replace italic-serif numerics → sans-numeric.
 *
 * Context-aware: SKIP lines inside <blockquote>, near "Quote" icon,
 * inside blog body containers, or greeting messages ("Chào ...").
 *
 * Run: node scripts/migrate-typography.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TARGET_DIR = join(ROOT, 'src')

const SKIP_DIRS = ['node_modules', '.next', '.git', 'sandbox', 'public', 'qa', 'email']
const SKIP_FILES = ['theme.config.ts', 'theme.config.tsx']

// Lines containing these patterns are PROTECTED — italic preserved
const PROTECT_PATTERNS = [
  /<blockquote/,
  /<\/blockquote>/,
  /Quote\s*className/,           // Lucide Quote icon nearby
  /Chào\s+(buổi|sáng|chiều|tối|ngày|đêm)/i,    // Greeting messages
  /Pola\s*=\s*Polaris/,           // Philosophy quote
  /lqg-display/,                  // Explicit display class (intentional italic)
  /blog-body|prose/,              // Blog body containers
]

// Tracks proximity — if blockquote opened recently, skip until close
function isProtectedContext(lines, currentIdx) {
  // Check current line
  const line = lines[currentIdx]
  if (PROTECT_PATTERNS.some(p => p.test(line))) return true

  // Check 3 lines before/after for blockquote scope
  for (let i = Math.max(0, currentIdx - 5); i < Math.min(lines.length, currentIdx + 3); i++) {
    if (/<blockquote/.test(lines[i])) return true
  }
  return false
}

const REPLACEMENTS = [
  // font-heading italic text-Nxl pattern (specific to avoid false positives)
  {
    pattern: /font-heading\s+italic\s+text-(\d?xl|2xl|3xl|4xl|5xl|6xl|7xl)\s+/g,
    replacement: 'lqg-headline text-$1 ',
  },
  {
    pattern: /font-heading\s+italic\s+text-(\d?xl|2xl|3xl|4xl|5xl|6xl|7xl)"/g,
    replacement: 'lqg-headline text-$1"',
  },
  {
    pattern: /font-heading\s+text-(\d?xl|2xl|3xl|4xl|5xl|6xl|7xl)\s+italic\s+/g,
    replacement: 'lqg-headline text-$1 ',
  },
  {
    pattern: /font-heading\s+text-(\d?xl|2xl|3xl|4xl|5xl|6xl|7xl)\s+italic"/g,
    replacement: 'lqg-headline text-$1"',
  },
  // Standalone "font-heading italic" (no size)
  {
    pattern: /font-heading\s+italic\s+/g,
    replacement: 'lqg-headline ',
  },
  {
    pattern: /font-heading\s+italic"/g,
    replacement: 'lqg-headline"',
  },
  // heading-display utility
  {
    pattern: /\bheading-display\b/g,
    replacement: 'lqg-headline',
  },
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
let protectedSkips = 0

for (const file of walk(TARGET_DIR)) {
  let content
  try { content = readFileSync(file, 'utf8') } catch { continue }

  const lines = content.split('\n')
  let fileChanges = 0
  let fileSkips = 0

  for (let i = 0; i < lines.length; i++) {
    if (isProtectedContext(lines, i)) {
      // Check if line has italic pattern that we'd otherwise change → log skip
      if (/font-heading\s+italic|heading-display/.test(lines[i])) fileSkips++
      continue
    }

    const before = lines[i]
    let after = lines[i]
    for (const { pattern, replacement } of REPLACEMENTS) {
      after = after.replace(pattern, replacement)
    }
    if (after !== before) {
      lines[i] = after
      fileChanges++
    }
  }

  if (fileChanges > 0) {
    writeFileSync(file, lines.join('\n'), 'utf8')
    const rel = file.replace(ROOT, '').replace(/\\/g, '/')
    console.log(`✓ ${rel} — ${fileChanges} replacements${fileSkips ? ` (${fileSkips} skipped/protected)` : ''}`)
    totalChanges += fileChanges
    touched++
    protectedSkips += fileSkips
  }
}

console.log(`\nTotal: ${totalChanges} replacements across ${touched} files`)
console.log(`Protected (kept italic): ${protectedSkips} lines (blockquote/greeting/quote/blog)`)
