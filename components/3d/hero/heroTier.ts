'use client'

/**
 * Render tier for the hero scene.
 *
 * The scene's cost is dominated by three things that all scale with pixels:
 * the prism's `transmission` pass (re-renders the whole scene off-screen every
 * frame), the chamber's fluid shader (several fbm lookups per pixel), and the
 * bloom composer. Rather than guess from screen width alone, this reads the
 * actual GL renderer string so a software rasteriser -- SwiftShader, llvmpipe,
 * Microsoft Basic Render -- is recognised and dropped to the cheapest settings.
 *
 * The tiers change sample counts and resolutions, never the design: same forms,
 * same palette, same motion at every tier.
 */

export type HeroTier = 'low' | 'mid' | 'high'

export interface HeroQuality {
  tier: HeroTier
  dpr: [number, number]
  /** off-screen target for the prism's refraction, as a fraction of canvas size */
  transmissionScale: number
  /** chamber cylinder radial segments */
  segments: number
  /** fbm octaves and domain-warp levels for the outer fluid backdrop */
  fbmOctaves: 2 | 3
  warpLevels: 1 | 2
  /** cube-map face size feeding the prism's reflections, and seconds between captures */
  envSize: number
  envInterval: number
  /** physical extras on the prism that cost real time in the shader */
  dispersion: number
  iridescence: number
  /** full-screen post passes */
  bloom: boolean
  grain: boolean
  /** the 32-tap light march behind SABRANG */
  textGlow: boolean
}

const QUALITY: Record<HeroTier, Omit<HeroQuality, 'tier'>> = {
  low: {
    dpr: [1, 1],
    transmissionScale: 0.15,
    segments: 32,
    fbmOctaves: 2,
    warpLevels: 1,
    envSize: 32,
    envInterval: 6,
    dispersion: 0,
    iridescence: 0,
    bloom: true,
    grain: false,
    textGlow: false
  },
  mid: {
    dpr: [1, 1],
    transmissionScale: 0.2,
    segments: 48,
    fbmOctaves: 2,
    warpLevels: 1,
    envSize: 48,
    envInterval: 4,
    dispersion: 0,
    iridescence: 0.45,
    bloom: true,
    grain: false,
    textGlow: true
  },
  high: {
    dpr: [1, 1.5],
    transmissionScale: 0.3,
    segments: 64,
    fbmOctaves: 2,
    warpLevels: 2,
    envSize: 64,
    envInterval: 3,
    dispersion: 1.6,
    iridescence: 0.45,
    bloom: true,
    grain: true,
    textGlow: true
  }
}

/**
 * True for GL renderer strings that mean "there is no GPU doing this work".
 * If this misses, the machines that most need the low tier never get it, so it
 * is covered by scripts/test-hero-tier.mts.
 */
export function isSoftwareRenderer(renderer: string) {
  return /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|apple paravirtual/i.test(
    renderer
  )
}

export function detectHeroTier(): HeroTier {
  if (typeof window === 'undefined') return 'mid'

  // Honour an explicit override first: ?hero=low is the only way to reproduce a
  // low-end session on a fast machine.
  const forced = new URLSearchParams(window.location.search).get('hero')
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced

  let renderer = ''
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return 'low' // no WebGL at all -> nothing here will be fast
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    return 'low'
  }

  const cores = navigator.hardwareConcurrency || 4
  if (isSoftwareRenderer(renderer) || cores <= 2) return 'low'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (coarse || window.innerWidth < 768 || cores <= 4) return 'mid'

  return 'high'
}

export function heroQuality(tier: HeroTier): HeroQuality {
  return { tier, ...QUALITY[tier] }
}
