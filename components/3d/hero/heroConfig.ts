'use client'

/**
 * Live-tunable knobs for the hero WebGL scene.
 * Read every frame by the R3F loop, so mutating a value is enough — no re-render.
 *
 * The debug panel is opt-in: append `?debug=hero` to the URL. It is never mounted
 * otherwise, so production ships nothing but this plain object.
 */
export const heroConfig = {
  // --- camera ---
  cameraFOV: 40,
  cameraDistance: 8,

  // --- central object ---
  objectScale: 0.85,
  roughness: 0.035,
  noiseScale: 3.4,
  noiseAmount: 0.16,
  materialColor: '#ffffff',
  reflectionIntensity: 2.4,
  screenDistortion: 0.42, // transmission thickness -> refraction strength
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,

  // --- motion ---
  mouseInfluence: 0.16,
  scrollInfluence: 0.55,
  idleSpeed: 0.035,

  // --- environment ---
  environmentIntensity: 1.0,
  gridOpacity: 0.62,
  envTint: 0.5,     // 0 = teal chamber, 1 = violet chamber
  envDrift: 0.02,

  // --- outer fluid backdrop (outer shell only) ---
  fluidScale: 3.0,      // field frequency across the shell
  fluidBands: 7.0,      // terrace levels per unit of field
  fluidIntensity: 1.05,
  fluidContrast: 0.82,  // how black the gaps between terraces go

  // --- typography ---
  textGlow: 0.21, // cursor light / shadow pass behind SABRANG
  textBlur: 2.6   // mip bias on the occlusion mask; higher = softer shafts
}

export type HeroConfig = typeof heroConfig

const RANGES: Record<string, [number, number, number]> = {
  cameraFOV: [20, 70, 0.5],
  cameraDistance: [4, 16, 0.1],
  objectScale: [0.4, 2, 0.01],
  roughness: [0, 0.6, 0.005],
  noiseScale: [0.5, 12, 0.1],
  noiseAmount: [0, 1.5, 0.01],
  reflectionIntensity: [0, 4, 0.05],
  screenDistortion: [0, 1.5, 0.01],
  rotationX: [-Math.PI, Math.PI, 0.01],
  rotationY: [-Math.PI, Math.PI, 0.01],
  rotationZ: [-Math.PI, Math.PI, 0.01],
  mouseInfluence: [0, 0.6, 0.005],
  scrollInfluence: [0, 3, 0.01],
  idleSpeed: [0, 0.4, 0.005],
  environmentIntensity: [0, 3, 0.01],
  gridOpacity: [0, 1.5, 0.01],
  envTint: [0, 1, 0.01],
  envDrift: [0, 0.2, 0.001],
  fluidScale: [1, 20, 0.1],
  fluidBands: [2, 24, 0.25],
  fluidIntensity: [0, 2.5, 0.01],
  fluidContrast: [0, 1, 0.01],
  textGlow: [0, 2.5, 0.01],
  textBlur: [0, 6, 0.1]
}

export function heroDebugEnabled() {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'hero'
  )
}

/** Builds a plain-DOM slider panel. No dependency, no React tree, removed on cleanup. */
export function mountHeroDebugPanel() {
  const cfg: Record<string, number | string> = heroConfig
  const panel = document.createElement('div')
  panel.style.cssText =
    'position:fixed;top:8px;right:8px;z-index:9999;background:rgba(0,0,0,.82);' +
    'border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:10px 12px;' +
    'font:11px/1.5 ui-monospace,monospace;color:#cfe;max-height:92vh;overflow:auto;width:230px'

  for (const [key, value] of Object.entries(heroConfig)) {
    const row = document.createElement('label')
    row.style.cssText = 'display:block;margin-bottom:6px'
    const label = document.createElement('span')
    row.appendChild(label)

    if (typeof value === 'string') {
      label.textContent = key
      const input = document.createElement('input')
      input.type = 'color'
      input.value = value
      input.style.cssText = 'width:100%;height:20px;background:none;border:0'
      input.oninput = () => (cfg[key] = input.value)
      row.appendChild(input)
    } else {
      const [min, max, step] = RANGES[key] ?? [0, 2, 0.01]
      label.textContent = `${key} ${value}`
      const input = document.createElement('input')
      input.type = 'range'
      input.min = String(min)
      input.max = String(max)
      input.step = String(step)
      input.value = String(value)
      input.style.cssText = 'width:100%'
      input.oninput = () => {
        const v = parseFloat(input.value)
        cfg[key] = v
        label.textContent = `${key} ${v}`
      }
      row.appendChild(input)
    }
    panel.appendChild(row)
  }

  document.body.appendChild(panel)
  ;(window as unknown as { heroConfig: HeroConfig }).heroConfig = heroConfig
  return () => panel.remove()
}
