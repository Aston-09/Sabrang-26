// node scripts/test-scroll-ranges.mts
// Guards the ScrollTrigger unit bug: GSAP's end/start parser understands
// keywords, `%` and bare numbers ONLY. Any other unit is dropped by parseFloat,
// so '+=200vh' silently means 200 PIXELS. That pinned the hero for 200px instead
// of ~1136px and let one wheel notch skip the entire sequence.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/* --- 1. reproduce GSAP's parser, so the bug is documented, not folklore ----
 * Transcribed from node_modules/gsap/ScrollTrigger.js (_offsetToPx).
 */
const KEYWORDS: Record<string, number> = { top: 0, left: 0, center: 0.5, bottom: 1, right: 1 }
function offsetToPx(value: string, size: number) {
  const eqIndex = value.indexOf('=')
  let relative = ~eqIndex ? +(value.charAt(eqIndex - 1) + 1) * parseFloat(value.substr(eqIndex + 1)) : 0
  if (~eqIndex) {
    if (value.indexOf('%') > eqIndex) relative *= size / 100
    value = value.substr(0, eqIndex - 1)
  }
  return (
    relative +
    (value in KEYWORDS
      ? KEYWORDS[value] * size
      : ~value.indexOf('%')
        ? (parseFloat(value) * size) / 100
        : parseFloat(value) || 0)
  )
}

const VH = 568 // the viewport the bug was measured at
// the bug: the unit is dropped, 200vh collapses to 200px
assert.equal(offsetToPx('200vh', VH), 200, 'vh is silently truncated -- this is why')
// `%` is the ONLY unit that scales
assert.equal(offsetToPx('200%', VH), VH * 2, '% scales to the viewport')
// and the fix: precomputed pixels round-trip exactly
assert.equal(offsetToPx(String(VH * 2), VH), VH * 2, 'plain px survives')

/* --- 2. no source file may reintroduce a unit-bearing start/end ---------- */
const BAD = /\b(?:start|end):\s*["'`][^"'`]*\d+(?:vh|vw|px|rem|em|ch|dvh|svh|lvh)\b/
function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(p)) out.push(p)
  }
  return out
}
const offenders: string[] = []
for (const file of [...walk('components'), ...walk('app')]) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (BAD.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`)
    })
}
assert.deepEqual(
  offenders,
  [],
  'ScrollTrigger start/end must be a number or a function returning px -- ' +
    'these carry a unit GSAP will silently drop:\n' + offenders.join('\n')
)

/* --- 3. the three triggers on #scroll-trigger must share one range ------- */
const sources = {
  HeroSection: 'components/sections/HeroSection.tsx',
  HomeClient: 'components/layout/HomeClient.tsx',
  AboutSection: 'components/sections/AboutSection.tsx'
}
for (const [name, path] of Object.entries(sources)) {
  const src = readFileSync(path, 'utf8')
  assert.ok(
    src.includes('HERO_PIN_END'),
    `${name} drives #scroll-trigger and must use the shared HERO_PIN_END range`
  )
  assert.ok(!/scrub:\s*true/.test(src), `${name} must use HERO_SCRUB, not scrub: true`)
}

console.log('scroll ranges: ok')
