/**
 * Gen PNG icons từ public/icon.svg
 * Chạy: npx tsx scripts/gen-icons.ts
 */
import { Resvg } from '@resvg/resvg-js'
import fs from 'fs'
import path from 'path'

const svgPath = path.join(process.cwd(), 'public', 'icon.svg')
const svgBuffer = fs.readFileSync(svgPath)

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  const resvg = new Resvg(svgBuffer, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  fs.writeFileSync(path.join(process.cwd(), 'public', name), png)
  console.log(`✓ Generated ${name} (${size}x${size}) — ${(png.length / 1024).toFixed(1)}KB`)
}

console.log('\n✅ Done!')
