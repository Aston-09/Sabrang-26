'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { heroConfig } from './heroConfig'
import { heroScrollState } from './heroScrollState'

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

  void main() {
    vec2 uv = vUv;

    const vec3 TEAL   = vec3(0.035, 0.150, 0.145);
    const vec3 CYAN   = vec3(0.130, 0.500, 0.490);
    const vec3 BLUE   = vec3(0.070, 0.065, 0.260);
    const vec3 VIOLET = vec3(0.230, 0.150, 0.520);
    const vec3 WARM   = vec3(1.000, 0.910, 0.800);

    vec3 coolA = mix(TEAL, BLUE, uTint);
    vec3 coolB = mix(CYAN, VIOLET, uTint);

    // --- broad illumination zones -------------------------------------
    float drift = uTime * 0.012;
    float zone = fbm(vec2(uv.x * 3.0 + drift, uv.y * 2.0 + uSeed));
    float zone2 = fbm(vec2(uv.x * 7.0 - drift * 1.7, uv.y * 4.0 + 11.0));

    vec3 col = mix(vec3(0.004), coolA, smoothstep(0.42, 0.86, zone) * 0.85);
    col += coolB * smoothstep(0.62, 1.0, zone2) * 0.13;

    // brighter band across the eye line, dark floor and ceiling
    float band = exp(-pow((uv.y - 0.5) * 3.2, 2.0));
    col += coolA * band * 0.30;

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

function makeMaterial(seed: number, cellScale: number, additive: boolean) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: !additive,
    transparent: additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uGridOpacity: { value: heroConfig.gridOpacity },
      uIntensity: { value: heroConfig.environmentIntensity },
      uTint: { value: heroConfig.envTint },
      uSeed: { value: seed },
      uCellScale: { value: cellScale },
      uFog: { value: additive ? 0.05 : 0.028 }
    }
  })
}

export default function HeroEnvironment({ mobile = false }: { mobile?: boolean }) {
  const { scene, gl } = useThree()
  const outerRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const nextCapture = useRef(0)

  const segments = mobile ? 64 : 128
  const cellScale = mobile ? 0.62 : 1

  const outerMat = useMemo(() => makeMaterial(0.0, cellScale, false), [cellScale])
  const innerMat = useMemo(() => makeMaterial(31.7, cellScale * 0.55, true), [cellScale])

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
      new THREE.WebGLCubeRenderTarget(mobile ? 64 : 128, {
        type: THREE.HalfFloatType,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter
      }),
    [mobile]
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

  // Each capture is six scene renders plus a full PMREM convolution. The shells spin
  // at ~0.007 rad/s and the tint drifts on a 140s period, so a second-old reflection
  // in a near-mirror surface is not a difference anyone can see.
  const captureInterval = mobile ? 2 : 1

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = heroScrollState.progress

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
    if (outerRef.current) outerRef.current.rotation.y = t * spin * 0.35 + p * 0.25
    if (innerRef.current) innerRef.current.rotation.y = -t * spin * 0.6 - p * 0.4

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
