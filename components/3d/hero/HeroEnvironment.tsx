'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { heroConfig } from './heroConfig'
import { heroScrollState } from './heroScrollState'
import type { HeroQuality } from './heroTier'

/**
 * The curved architectural chamber the whole hero lives inside.
 *
 * Two open-ended cylinders (the camera sits inside both) carry a single procedural
 * shader: multi-level technical grid + micro texture + faint geometric markings
 * + soft light zones. The inner shell is additive and counter-rotates, which is
 * what gives the walls parallax depth rather than a flat wallpaper.
 *
 * The same meshes are also captured by a CubeCamera on a dedicated layer and fed
 * back as `scene.environment`, so the prism reflects the actual chamber it is
 * standing in instead of a synthetic studio.
 *
 * OUTER vs INNER
 * --------------
 * Only the OUTER shell (the clockwise one, r=30) carries the generative
 * fluid/topographic backdrop, behind `#define FLUID`. The INNER shell -- the
 * anticlockwise additive layer at r=15 -- still runs the original illumination-zone
 * code untouched, and the grid / markings / panels / fog composite over both exactly
 * as before. The fluid shader is compiled into one material only, so it cannot reach
 * the inner shell, the grid, the prism or the typography.
 */

const ENV_LAYER = 1

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying float vDepth;

  uniform float uTime;
  uniform float uGridOpacity;
  uniform float uIntensity;
  uniform float uTint;        // 0 = teal chamber, 1 = violet chamber
  uniform float uSeed;
  uniform float uCellScale;   // grid density multiplier (lowered on mobile)
  uniform float uFog;

  // --- outer fluid backdrop only (see the FLUID block below) ---
  uniform float uFlow;        // fluid clock; stops advancing under reduced-motion
  uniform float uScroll;
  uniform float uFluidScale;
  uniform float uFluidBands;
  uniform float uFluidIntensity;
  uniform float uFluidContrast;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      s += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return s;
  }

  // Derivative-antialiased grid. fwidth grows with distance and grazing angle,
  // so lines dissolve naturally into the distance instead of aliasing.
  float gridMask(vec2 uv, vec2 cells, float thick) {
    vec2 g = uv * cells;
    vec2 d = 0.5 - abs(fract(g) - 0.5);
    vec2 w = fwidth(g);
    vec2 l = 1.0 - smoothstep(vec2(0.0), w * thick, d);
    return clamp(max(l.x, l.y), 0.0, 1.0);
  }

  float dotMask(vec2 uv, vec2 cells) {
    vec2 g = uv * cells;
    vec2 f = fract(g) - 0.5;
    vec2 w = fwidth(g);
    float d = length(f);
    return 1.0 - smoothstep(0.07, 0.07 + max(w.x, w.y) * 2.0, d);
  }

  // Equilateral triangle SDF (Inigo Quilez).
  float sdTri(vec2 p, float r) {
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
  }

  // Faint technical markings embedded in the architecture.
  float markings(vec2 uv, vec2 cells) {
    vec2 g = uv * cells;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash21(id + uSeed);
    if (h < 0.60) return 0.0;

    float ang = (h - 0.5) * 2.2;
    float s = sin(ang);
    float c = cos(ang);
    f = mat2(c, -s, s, c) * f;

    float size = 0.13 + 0.20 * fract(h * 17.31);
    float d = sdTri(f, size);
    float w = max(fwidth(g.x), fwidth(g.y)) * 0.6 + 0.004;

    float outline = 1.0 - smoothstep(0.0, w * 2.5, abs(d) - 0.007);
    float fill = 1.0 - smoothstep(-0.004, w * 2.0, d);
    return outline * 0.6 + fill * 0.10;
  }

  // Large soft panels: the white / warm reflection sources of the chamber.
  float panels(vec2 uv, vec2 cells) {
    vec2 g = uv * cells;
    vec2 id = floor(g);
    vec2 f = fract(g);
    float h = hash21(id + uSeed + 7.13);
    if (h < 0.80) return 0.0;
    vec2 e = smoothstep(0.10, 0.30, f) * smoothstep(0.10, 0.30, 1.0 - f);
    float pulse = 0.55 + 0.45 * sin(uTime * 0.22 + h * 30.0);
    return e.x * e.y * pulse;
  }

#ifdef FLUID
  /* ==================================================================
   * OUTER BACKDROP -- generative fluid / topographic field
   *
   * uv -> pointer displacement -> domain warp -> scalar field -> contour
   * extraction -> colour map. Compiled into the OUTER shell material only.
   *
   * Contour thickness is measured in FIELD space rather than screen space,
   * which is what makes this read as terrain instead of stripes: bands spread
   * wide across a plateau and pinch to a hairline on a steep gradient, and
   * both of those change as the warp moves. Nothing is translated or scaled
   * as a whole -- the field itself deforms.
   * ================================================================== */

  // u wraps 2*pi*30 = 188 world units, v spans 64, so raw uv would stretch the
  // field ~3:1 around the chamber.
  #define SHELL_ASPECT 2.945

  vec3 hsv2rgb(vec3 c) {
    vec3 k = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(k - 1.0, 0.0, 1.0), c.y);
  }

  float fbmF(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < FBM_OCT; i++) {
      s += a * vnoise(p);
      p = p * 2.07 + 17.31;
      a *= 0.5;
    }
    return s;
  }

  vec3 fluidBackdrop(vec2 uv, vec3 accent) {
    float t = uFlow;

    vec2 p = vec2(uv.x * SHELL_ASPECT, uv.y) * uFluidScale;

    // Scroll shifts where the field is sampled -- the flow drifts, nothing scales.
    p += vec2(uScroll * 1.1, uScroll * -0.35);

    // Domain warping (Inigo Quilez). Two nested levels give the stretch /
    // compress / merge behaviour and kill any visible period.
    vec2 q = vec2(fbmF(p), fbmF(p + vec2(5.2, 1.3)));
    #if WARP_LEVELS > 1
      vec2 r = vec2(fbmF(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.021),
                    fbmF(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.017));
      float f = fbmF(p + 3.2 * r + t * 0.009);
    #else
      float f = fbmF(p + 3.4 * q + vec2(t * 0.02, -t * 0.013));
    #endif

    // A 3-octave fbm of a 0..1 noise lands in roughly [0.18, 0.66] -- it never
    // reaches the top of a 0..1 ramp. Normalising first is what lets the colour
    // ramp and the crest highlights below actually reach their bright ends;
    // without it the whole field sits at its darkest colour and reads as flat navy.
    float fn = clamp((f - 0.18) * 2.15, 0.0, 1.0);

    /* --- SOLID TERRACES ------------------------------------------------
     * Filled ribbons with dark gaps, not hairlines: each level of the field is
     * flooded across ~half its period, so the result reads as stacked cut-paper
     * terraces. The duty cycle is itself noise-driven, which is what varies the
     * band thickness along a run.
     */
    float b = fn * uFluidBands;
    float w = fwidth(b);
    float s = fract(b);
    float duty = 0.50 + 0.16 * vnoise(p * 0.30 + vec2(5.7, t * 0.004));

    float ribbon = smoothstep(0.0, w * 1.6, s) *
                   (1.0 - smoothstep(duty - w * 1.6, duty, s));
    // bright inner lip on each step -- the lit edge of a terrace
    float lip = (1.0 - smoothstep(0.0, w * 4.0, s)) +
                (1.0 - smoothstep(0.0, w * 4.0, duty - s));
    ribbon = clamp(ribbon + lip * 0.30, 0.0, 1.0);
    ribbon *= 1.0 - smoothstep(0.40, 1.10, w);  // dissolve at grazing angles

    /* --- THE LIGHT BEHIND THE FIELD ------------------------------------
     * One slowly wandering hot core. Distance from it drives brightness AND
     * hue, which is what gives the reference its magenta-to-cyan sweep with a
     * pale centre, instead of colour scattered at random.
     */
    vec2 c = vec2(0.5 + 0.06 * sin(t * 0.021), 0.5 + 0.03 * cos(t * 0.017));
    float du = uv.x - c.x;
    du -= floor(du + 0.5);          // shortest way round the shell
    du *= SHELL_ASPECT;
    float rad = length(vec2(du, (uv.y - c.y) * 1.35));
    // tight: rad reaches ~0.48 at the frame corners, so this has to fall to near
    // nothing by then or the whole wall lights up and milks out the hero.
    float glow = 0.02 + 0.98 * exp(-rad * rad * 10.0);

    /* --- colour ---------------------------------------------------------
     * One hue that wanders the cyan -> blue -> violet -> magenta arc, plus a
     * FIXED spatial offset so the two halves of the wall always contrast with
     * each other while travelling together. Both terms are continuous in t, so
     * the palette drifts with no step, no banding and no loop point: the wall
     * passes through the teal/magenta pairing, the all-violet state, and -- when
     * saturation dips -- the near-monochrome silver state.
     *
     * The arc deliberately never crosses into green/yellow; that half of the
     * wheel fights the chamber's own teal-violet lighting.
     */
    const vec3 C_DEEP = vec3(0.0008, 0.0011, 0.0026);
    const vec3 C_PALE = vec3(0.800, 0.820, 0.950);

    // The arc runs 0.52 -> 1.16, i.e. cyan -> blue -> violet -> magenta -> rose
    // -> amber, wrapping past 1.0 into the warm end (which the site's own palette
    // already carries as copper/amber). It never enters 0.16..0.52, so green and
    // yellow are excluded structurally rather than by tuning.
    float hBase = 0.76 + 0.24 * sin(t * 0.075);                          // 0.52 .. 1.00
    float hx = hBase + 0.16 * smoothstep(-0.55, 0.55, du);               // .. 1.16
    // Opens black-and-white: at sat 0 the terraces are pure silver, which is the
    // monochrome state of the reference. Colour then blooms in on a smoothstep --
    // no moment where it switches on -- and the hue rotation takes over. The hue
    // is already turning underneath during the mono phase, so the first colour to
    // appear is wherever the cycle has reached rather than a fixed one.
    float intro = smoothstep(4.0, 15.0, t);
    float sat = intro * (0.95 - 0.30 * smoothstep(0.55, 1.0, 0.5 + 0.5 * sin(t * 0.031)));

    vec3 hue = hsv2rgb(vec3(fract(hx), sat, 1.0)) * 0.78;
    hue = mix(hue, C_PALE, smoothstep(0.66, 0.99, glow));    // pale hot centre
    hue = mix(hue, accent, 0.08);  // ties the field to the chamber's tint drift

    // uFluidContrast is how black the gaps between ribbons go: 1 = pure black,
    // 0 = gaps lit as brightly as the ribbons themselves.
    float body = ribbon + (1.0 - uFluidContrast) * 0.40;

    vec3 col = C_DEEP;
    col += hue * body * glow;
    col += hue * glow * glow * 0.05;                        // haze pooling behind the terraces
    col += C_PALE * pow(glow, 6.0) * 0.10;                  // specular bloom at the core
    return col * uFluidIntensity;
  }
#endif

  void main() {
    vec2 uv = vUv;

    const vec3 TEAL   = vec3(0.035, 0.150, 0.145);
    const vec3 CYAN   = vec3(0.130, 0.500, 0.490);
    const vec3 BLUE   = vec3(0.070, 0.065, 0.260);
    const vec3 VIOLET = vec3(0.230, 0.150, 0.520);
    const vec3 WARM   = vec3(1.000, 0.910, 0.800);

    vec3 coolA = mix(TEAL, BLUE, uTint);
    vec3 coolB = mix(CYAN, VIOLET, uTint);

    // --- backdrop -----------------------------------------------------
#ifdef FLUID
    vec3 col = fluidBackdrop(uv, coolB);
#else
    // broad illumination zones -- inner shell, unchanged
    float drift = uTime * 0.012;
    float zone = fbm(vec2(uv.x * 3.0 + drift, uv.y * 2.0 + uSeed));
    float zone2 = fbm(vec2(uv.x * 7.0 - drift * 1.7, uv.y * 4.0 + 11.0));

    vec3 col = mix(vec3(0.004), coolA, smoothstep(0.42, 0.86, zone) * 0.85);
    col += coolB * smoothstep(0.62, 1.0, zone2) * 0.13;

    // brighter band across the eye line, dark floor and ceiling
    float band = exp(-pow((uv.y - 0.5) * 3.2, 2.0));
    col += coolA * band * 0.30;
#endif

    // --- technical grid, three levels ---------------------------------
    vec2 primary = vec2(46.0, 24.0) * uCellScale;
    float g1 = gridMask(uv, primary, 1.4);
    float g2 = gridMask(uv, primary * 4.0, 1.0);
    float micro = dotMask(uv, primary * 12.0);

    vec3 lineCol = mix(vec3(0.30, 0.36, 0.36), coolB, 0.55);
    col += lineCol * g1 * uGridOpacity;
    col += lineCol * g2 * uGridOpacity * 0.28;
    col += vec3(0.16, 0.20, 0.20) * micro * uGridOpacity * 0.35;

    // --- embedded geometry + reflection panels ------------------------
    col += mix(vec3(0.18), coolB, 0.4) * markings(uv, vec2(17.0, 9.0)) * 0.34;

    float pan = panels(uv, vec2(9.0, 4.0));
    col += mix(vec3(0.55), WARM, 0.35) * pan * 0.16;

    // --- depth + framing ----------------------------------------------
    float vFade = smoothstep(0.0, 0.24, uv.y) * smoothstep(1.0, 0.76, uv.y);
    float fog = exp(-vDepth * uFog);

    col *= vFade * fog * uIntensity;
    col = max(col, vec3(0.0));

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

function makeMaterial(
  seed: number,
  cellScale: number,
  additive: boolean,
  fluid: boolean,
  q: HeroQuality
) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: !additive,
    transparent: additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    // The fluid costs 5 fbm lookups per pixel at two warp levels; the low tier
    // drops to one warp level and 2 octaves -- 2 lookups -- which keeps the same
    // forms at lower detail rather than a different-looking effect.
    defines: fluid
      ? { FLUID: '', FBM_OCT: String(q.fbmOctaves), WARP_LEVELS: String(q.warpLevels) }
      : {},
    uniforms: {
      uTime: { value: 0 },
      uGridOpacity: { value: heroConfig.gridOpacity },
      uIntensity: { value: heroConfig.environmentIntensity },
      uTint: { value: heroConfig.envTint },
      uSeed: { value: seed },
      uCellScale: { value: cellScale },
      uFog: { value: additive ? 0.05 : 0.028 },
      uFlow: { value: 0 },
      uScroll: { value: 0 },
      uFluidScale: { value: heroConfig.fluidScale },
      uFluidBands: { value: heroConfig.fluidBands },
      uFluidIntensity: { value: heroConfig.fluidIntensity },
      uFluidContrast: { value: heroConfig.fluidContrast }
    }
  })
}

export default function HeroEnvironment({ mobile = false, q }: { mobile?: boolean; q: HeroQuality }) {
  const { scene, gl } = useThree()
  const outerRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const nextCapture = useRef(0)
  const flow = useRef(0)
  const reduced = useRef(false)

  const segments = q.segments
  const cellScale = mobile ? 0.62 : 1

  const outerMat = useMemo(
    () => makeMaterial(0.0, cellScale, false, true, q),
    [cellScale, q]
  )
  const innerMat = useMemo(
    () => makeMaterial(31.7, cellScale * 0.55, true, false, q),
    [cellScale, q]
  )

  const outerGeo = useMemo(
    () => new THREE.CylinderGeometry(30, 30, 64, segments, 1, true),
    [segments]
  )
  const innerGeo = useMemo(
    () => new THREE.CylinderGeometry(15, 15, 40, Math.max(32, segments / 2), 1, true),
    [segments]
  )

  // --- environment capture: the chamber reflecting into the prism -----
  const cubeRT = useMemo(
    () =>
      new THREE.WebGLCubeRenderTarget(q.envSize, {
        type: THREE.HalfFloatType,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter
      }),
    [q.envSize]
  )

  const cubeCam = useMemo(() => {
    const cam = new THREE.CubeCamera(1, 150, cubeRT)
    cam.layers.set(ENV_LAYER) // sees only the chamber, never the prism
    return cam
  }, [cubeRT])

  useEffect(() => {
    outerRef.current?.layers.enable(ENV_LAYER)
    innerRef.current?.layers.enable(ENV_LAYER)
    scene.environment = cubeRT.texture
    return () => {
      scene.environment = null
      cubeRT.dispose()
      outerGeo.dispose()
      innerGeo.dispose()
      outerMat.dispose()
      innerMat.dispose()
    }
  }, [scene, cubeRT, outerGeo, innerGeo, outerMat, innerMat])

  // Reduced motion freezes the fluid clock only. The chamber's own drift, the
  // prism and the scroll sequence are left exactly as they are.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => (reduced.current = mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Each capture is six scene renders plus a full PMREM convolution. The shells spin
  // at ~0.007 rad/s and the tint drifts on a 140s period, so a second-old reflection
  // in a near-mirror surface is not a difference anyone can see.
  const captureInterval = q.envInterval

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const p = heroScrollState.progress
    const d = Math.min(delta, 0.05)

    for (const m of [outerMat, innerMat]) {
      m.uniforms.uTime.value = t
      m.uniforms.uGridOpacity.value = heroConfig.gridOpacity
      m.uniforms.uIntensity.value = heroConfig.environmentIntensity
      // slow tint drift between the teal and violet chamber states
      m.uniforms.uTint.value =
        heroConfig.envTint * 0.6 + (0.5 + 0.5 * Math.sin(t * 0.045)) * 0.4
    }
    innerMat.uniforms.uIntensity.value = heroConfig.environmentIntensity * 0.45

    // counter-rotating shells: parallax depth, plus a restrained scroll nudge
    const spin = heroConfig.envDrift
    const outerRotY = t * spin * 0.35 + p * 0.25
    if (outerRef.current) outerRef.current.rotation.y = outerRotY
    if (innerRef.current) innerRef.current.rotation.y = -t * spin * 0.6 - p * 0.4

    /* --- outer fluid backdrop ----------------------------------------
     * Its own clock, so freezing it for reduced motion cannot stall uTime and
     * with it the chamber's panel pulse.
     */
    flow.current += reduced.current ? 0 : d
    const u = outerMat.uniforms
    u.uFlow.value = flow.current
    u.uScroll.value = p
    u.uFluidScale.value = heroConfig.fluidScale
    u.uFluidBands.value = heroConfig.fluidBands
    u.uFluidIntensity.value = heroConfig.fluidIntensity
    u.uFluidContrast.value = heroConfig.fluidContrast

    scene.environmentIntensity = heroConfig.environmentIntensity

    if (t >= nextCapture.current) {
      nextCapture.current = t + captureInterval
      cubeCam.update(gl, scene)
      cubeRT.texture.needsPMREMUpdate = true
    }
  })

  return (
    <>
      <mesh ref={outerRef} geometry={outerGeo} material={outerMat} frustumCulled={false} />
      <mesh ref={innerRef} geometry={innerGeo} material={innerMat} frustumCulled={false} />
    </>
  )
}
