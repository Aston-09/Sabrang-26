// node scripts/test-hero-tier.mts
// Guards the two things in the hero quality system that fail silently:
// software-GPU detection, and the palette arc staying out of green/yellow.
import assert from 'node:assert/strict'
import { isSoftwareRenderer, heroQuality } from '../components/3d/hero/heroTier.ts'

/* --- software renderer detection ---------------------------------------
 * A miss here means the machines that most need the low tier never get it.
 * These are real UNMASKED_RENDERER_WEBGL strings.
 */
const SOFTWARE = [
  'Google SwiftShader',
  'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
  'Mesa/X.org, llvmpipe (LLVM 15.0.7, 256 bits)',
  'Microsoft Basic Render Driver',
  'Mesa OffScreen',
  'Apple Paravirtual device'
]
const HARDWARE = [
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)',
  'Adreno (TM) 730',
  'Mali-G78 MP14'
]
for (const r of SOFTWARE) assert.ok(isSoftwareRenderer(r), `should be software: ${r}`)
for (const r of HARDWARE) assert.ok(!isSoftwareRenderer(r), `should be hardware: ${r}`)

/* --- quality tiers must be monotonic ------------------------------------
 * low must never cost more than high on any axis, or the "optimisation"
 * silently makes weak machines do more work.
 */
const low = heroQuality('low')
const mid = heroQuality('mid')
const high = heroQuality('high')
for (const [name, get] of [
  ['dpr', (q: typeof low) => q.dpr[1]],
  ['transmissionScale', (q: typeof low) => q.transmissionScale],
  ['segments', (q: typeof low) => q.segments],
  ['fbmOctaves', (q: typeof low) => q.fbmOctaves],
  ['warpLevels', (q: typeof low) => q.warpLevels],
  ['envSize', (q: typeof low) => q.envSize],
  ['dispersion', (q: typeof low) => q.dispersion],
  ['iridescence', (q: typeof low) => q.iridescence]
] as const) {
  assert.ok(get(low) <= get(mid), `${name}: low must not exceed mid`)
  assert.ok(get(mid) <= get(high), `${name}: mid must not exceed high`)
}
// env capture interval is the one axis where BIGGER is cheaper
assert.ok(low.envInterval >= mid.envInterval && mid.envInterval >= high.envInterval,
  'envInterval must not shrink as the tier drops')

/* --- palette arc --------------------------------------------------------
 * Mirrors the GLSL in HeroEnvironment's fluidBackdrop. Two invariants:
 * it opens monochrome, and it never lands on a green-dominant colour.
 */
const ss = (a: number, b: number, x: number) => {
  const u = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return u * u * (3 - 2 * u)
}
const hsv2rgb = (h: number, s: number, v: number) =>
  [0, 2 / 3, 1 / 3].map((o) => {
    const k = Math.abs(((h + o) % 1) * 6 - 3)
    return v * (1 + (Math.min(Math.max(k - 1, 0), 1) - 1) * s)
  })
const satAt = (t: number) =>
  ss(4, 15, t) * (0.95 - 0.3 * ss(0.55, 1.0, 0.5 + 0.5 * Math.sin(t * 0.031)))
const hueAt = (t: number, side: number) => 0.76 + 0.24 * Math.sin(t * 0.075) + 0.16 * side

// opens black and white
assert.equal(satAt(0), 0, 'must open fully desaturated')
assert.ok(satAt(4) === 0, 'still monochrome at the end of the hold')
assert.ok(satAt(15) > 0.6, 'colour must have bloomed in by 15s')
for (const t of [0, 1, 2, 3, 4]) {
  const [r, g, b] = hsv2rgb(hueAt(t, 0), satAt(t), 1)
  assert.ok(Math.abs(r - g) < 1e-9 && Math.abs(g - b) < 1e-9, `t=${t}s must be greyscale`)
}

// never green-dominant, on either side of the wall, across a full cycle
let green = 0
for (let t = 0; t <= 300; t += 2) {
  for (const side of [0, 1]) {
    const [r, g, b] = hsv2rgb(hueAt(t, side), satAt(t), 1)
    if (g > r + 1e-9 && g > b + 1e-9) green++
  }
}
assert.equal(green, 0, `palette entered green on ${green} samples`)

console.log('hero tier + palette: ok')
