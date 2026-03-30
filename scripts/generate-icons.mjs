import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '../public/icons')

// Inline the SVG so we don't need a file read race condition
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Background -->
  <rect width="512" height="512" fill="#FFD034" rx="112"/>

  <!-- Subtle warm glow top-right -->
  <radialGradient id="glow" cx="72%" cy="25%" r="24%">
    <stop offset="0%" stop-color="#FFF5A0" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#FFD034" stop-opacity="0"/>
  </radialGradient>
  <rect width="512" height="512" fill="url(#glow)" rx="112"/>

  <!-- Left stroke of N -->
  <rect x="110" y="138" width="72" height="236" rx="18" fill="white"/>
  <!-- Right stroke of N -->
  <rect x="330" y="138" width="72" height="236" rx="18" fill="white"/>
  <!-- Diagonal stroke (top-left to bottom-right) -->
  <polygon points="182,138 254,138 402,374 330,374" fill="white"/>

  <!-- Spark dots accent (top-right) -->
  <circle cx="385" cy="110" r="17" fill="white" opacity="0.92"/>
  <circle cx="412" cy="82" r="11" fill="white" opacity="0.60"/>
  <circle cx="398" cy="70" r="7" fill="white" opacity="0.38"/>
</svg>`

const buf = Buffer.from(svg)

const sizes = [
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-180.png', size: 180 },
]

for (const { name, size } of sizes) {
  const dest = join(iconsDir, name)
  await sharp(buf, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(dest)
  console.log(`✓ ${name} (${size}×${size})`)
}

console.log('\nDone! Icons written to public/icons/')
