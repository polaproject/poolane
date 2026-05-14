#!/usr/bin/env node
/**
 * Token migration script for Phase 7B.
 * Replaces hard-coded hex colors with design tokens in target files.
 *
 * Run: node scripts/migrate-tokens.mjs <file1> <file2> ...
 * Or:  node scripts/migrate-tokens.mjs --all  (uses default list)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const DEFAULT_FILES = [
  'src/app/(dashboard)/admin/finance/refunds/new/NewRefundForm.tsx',
  'src/app/(dashboard)/admin/reports/ReportsTools.tsx',
  'src/app/(dashboard)/admin/profile-requests/[id]/page.tsx',
  'src/app/(dashboard)/staff/videos/VideoForm.tsx',
  'src/app/(dashboard)/admin/students/[id]/enroll/page.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/app/(auth)/forgot-password/page.tsx',
  'src/app/(dashboard)/student/quiz/[id]/QuizRunner.tsx',
  'src/app/(dashboard)/shared/notifications/page.tsx',
  'src/app/(dashboard)/admin/quizzes/QuizForm.tsx',
  'src/app/(dashboard)/staff/lesson-plan/[sessionId]/LessonPlanForm.tsx',
  'src/app/(dashboard)/admin/shop/products/ProductForm.tsx',
  'src/app/(dashboard)/admin/vouchers/VoucherForm.tsx',
]

// Replacement rules — order matters (more specific first)
const RULES = [
  // Hex ink-soft (#1C2B4A)
  [/bg-\[#1C2B4A\](?!\/)/g, 'bg-ink-soft'],
  [/bg-\[#1C2B4A\]\/(\d+)/g, 'bg-ink/$1'],
  [/text-\[#1C2B4A\](?!\/)/g, 'text-ink'],
  [/text-\[#1C2B4A\]\/(\d+)/g, 'text-ink/$1'],
  [/border-\[#1C2B4A\](?!\/)/g, 'border-ink'],
  [/border-\[#1C2B4A\]\/(\d+)/g, 'border-ink/$1'],
  [/ring-\[#1C2B4A\]\/(\d+)/g, 'ring-ink/$1'],
  [/divide-\[#1C2B4A\]\/(\d+)/g, 'divide-ink/$1'],
  [/from-\[#1C2B4A\]\/(\d+)/g, 'from-ink/$1'],
  [/to-\[#1C2B4A\]\/(\d+)/g, 'to-ink/$1'],

  // Hex paper (#F6F1EA)
  [/bg-\[#F6F1EA\](?!\/)/g, 'bg-paper'],
  [/bg-\[#F6F1EA\]\/(\d+)/g, 'bg-paper/$1'],
  [/text-\[#F6F1EA\](?!\/)/g, 'text-paper'],
  [/text-\[#F6F1EA\]\/(\d+)/g, 'text-paper/$1'],
  [/border-\[#F6F1EA\](?!\/)/g, 'border-paper'],

  // Red → danger
  [/text-red-(500|600|700)\b/g, 'text-danger'],
  [/bg-red-50\b/g, 'bg-danger/10'],
  [/bg-red-100\b/g, 'bg-danger/15'],
  [/border-red-(200|300)\b/g, 'border-danger/30'],
  [/hover:bg-red-50\b/g, 'hover:bg-danger/10'],
  [/hover:bg-red-100\b/g, 'hover:bg-danger/15'],

  // Green → success
  [/text-green-(500|600|700)\b/g, 'text-success'],
  [/bg-green-50\b/g, 'bg-success/10'],
  [/bg-green-(500|600|700)\b/g, 'bg-success'],
  [/border-green-(200|300)\b/g, 'border-success/30'],
  [/hover:bg-green-(600|700)\b/g, 'hover:bg-success/90'],

  // Yellow/amber → warn
  [/text-amber-(500|600|700)\b/g, 'text-warn'],
  [/bg-amber-50\b/g, 'bg-warn/10'],
  [/bg-amber-100\b/g, 'bg-warn/15'],
  [/border-amber-(200|300)\b/g, 'border-warn/30'],

  // Rounded utility unification (be conservative — only safe cases)
  [/\brounded-2xl\b/g, 'rounded-card-lg'],
  [/\brounded-3xl\b/g, 'rounded-card-xl'],
  // KEEP rounded-lg, rounded-xl, rounded-md as-is (used by shadcn internals)
]

const arg = process.argv.slice(2)
const files = arg[0] === '--all' || arg.length === 0 ? DEFAULT_FILES : arg

let totalChanges = 0
for (const relPath of files) {
  const abs = join(ROOT, relPath)
  let content
  try {
    content = readFileSync(abs, 'utf8')
  } catch (e) {
    console.warn(`⚠️  Skip (not found): ${relPath}`)
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
    writeFileSync(abs, content, 'utf8')
    console.log(`✓ ${relPath} — ${fileChanges} replacements`)
    totalChanges += fileChanges
  } else {
    console.log(`· ${relPath} — no changes`)
  }
}
console.log(`\nTotal: ${totalChanges} replacements across ${files.length} files`)
