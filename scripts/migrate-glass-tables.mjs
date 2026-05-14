#!/usr/bin/env node
/**
 * Phase 10G — apply glass-table-row to <tr> tags that have key={...} (body rows, not headers).
 * Header rows usually have no key. Body rows have key={...} from map.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const FILES = [
  'src/app/(dashboard)/admin/blog/page.tsx',
  'src/app/(dashboard)/admin/finance/refunds/page.tsx',
  'src/app/(dashboard)/admin/password-resets/page.tsx',
  'src/app/(dashboard)/admin/profile-requests/page.tsx',
  'src/app/(dashboard)/admin/quizzes/page.tsx',
  'src/app/(dashboard)/admin/shop/products/page.tsx',
  'src/app/(dashboard)/admin/skill-heatmap/page.tsx',
  'src/app/(dashboard)/admin/students/page.tsx',
  'src/app/(dashboard)/admin/teacher-metrics/page.tsx',
  'src/app/(dashboard)/admin/vouchers/page.tsx',
  'src/app/(dashboard)/staff/students/page.tsx',
  'src/app/(dashboard)/staff/videos/page.tsx',
]

let totalChanges = 0
for (const rel of FILES) {
  const abs = join(ROOT, rel)
  let content
  try { content = readFileSync(abs, 'utf8') } catch { continue }

  // Match <tr key={...} className="X"> — append glass-table-row to className
  const re1 = /<tr(\s+key=\{[^}]*\})\s+className="([^"]*)"/g
  let n = 0
  content = content.replace(re1, (m, key, cls) => {
    if (cls.includes('glass-table-row')) return m
    n++
    return `<tr${key} className="${cls} glass-table-row"`
  })

  // Match <tr key={...}> bare — add className
  const re2 = /<tr(\s+key=\{[^}]*\})>/g
  content = content.replace(re2, (m, key) => {
    n++
    return `<tr${key} className="glass-table-row">`
  })

  if (n > 0) {
    writeFileSync(abs, content, 'utf8')
    console.log(`✓ ${rel} — ${n} <tr> tagged`)
    totalChanges += n
  } else {
    console.log(`· ${rel}`)
  }
}
console.log(`\nTotal: ${totalChanges}`)
