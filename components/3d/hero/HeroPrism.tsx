'use client'

import React, { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { heroConfig } from './heroConfig'
import { heroInput, heroScrollState } from './heroScrollState'
import type { HeroQuality } from './heroTier'

const MODEL_PATH = '/models/SABRANG_TRANSPARENT_STRIP_PRISM.glb'

/* ==================================================================
 * PROCEDURAL SURFACE NOISE
 *
 * Injected into MeshPhysicalMaterial's roughness so the chrome/glass
 * reads as physically imperfect rather than a perfect mirror. Object
 * space, so the irregularity sticks to the surface as it rotates.
 * ================================================================== */

const NOISE_GLSL = /* glsl */ `
  varying vec3 vObjPos;
  uniform float uNoiseScale;
  uniform float uNoiseAmount;

  float hnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec2 o = vec2(1.0, 0.0);
    #define H(q) fract(sin(dot(i + (q), vec3(12.9898, 78.233, 37.719))) * 43758.5453)
    float n = mix(
      mix(mix(H(o.yyy), H(o.xyy), f.x), mix(H(o.yxy), H(o.xxy), f.x), f.y),
      mix(mix(H(o.yyx), H(o.xyx), f.x), mix(H(o.yxx), H(o.xxx), f.x), f.y),
      f.z
    );
    #undef H
    return n;
  }

  float surfaceNoise(vec3 p) {
    return hnoise(p) * 0.6 + hnoise(p * 2.7) * 0.3 + hnoise(p * 6.1) * 0.1;
  }
`

function patchMaterial(material: THREE.MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNoiseScale = { value: heroConfig.noiseScale }
    shader.uniforms.uNoiseAmount = { value: heroConfig.noiseAmount }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;')

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + NOISE_GLSL)
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         float sn = surfaceNoise(vObjPos * uNoiseScale);
         roughnessFactor = clamp(roughnessFactor + (sn - 0.5) * uNoiseAmount * 0.25, 0.0, 1.0);`
      )

    material.userData.shader = shader
  }
  material.customProgramCacheKey = () => 'hero-prism-noise'
}

/* ==================================================================
 * REFRACTION LIGHT BEAMS (PINK FLOYD EFFECT)
 * ================================================================== */
const BEAM_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const BEAM_FRAGMENT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 uColor;
  uniform float uProgress;
  uniform float uBeamType; // 0.0 = white incident, 1.0 = rainbow refracted
  void main() {
    // Fade out softly at both ends of the cylinder (y=0 and y=1)
    float fadeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
    
    // Core glow (fresnel): brighter in center, fading at edges
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - abs(dot(viewDir, normal));
    rim = smoothstep(0.0, 1.0, rim);
    
    // Animation logic
    float progressMask = 1.0;
    if (uBeamType == 0.0) {
      // White beam animates left (0) to right (1)
      progressMask = smoothstep(vUv.y - 0.1, vUv.y, uProgress);
    } else {
      // Rainbow beams animate from left (0) to right (1) after white beam finishes
      progressMask = smoothstep(vUv.y - 0.2, vUv.y, uProgress - 1.0);
    }
    
    float alpha = (1.0 - rim) * fadeY * 1.5 * progressMask;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`

function LightBeams({ prismGroupRef }: { prismGroupRef: React.RefObject<THREE.Group | null> }) {
  const rainbowGroupRef = useRef<THREE.Group>(null)
  
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 }
  }), [])

  useFrame((state) => {
    // Delay animation slightly on load, then play: white beam (0-1), rainbow (1-2)
    const t = Math.max(0, state.clock.elapsedTime - 0.5)
    uniforms.uProgress.value = Math.min(t * 1.5, 2.5)
    
    if (prismGroupRef.current && rainbowGroupRef.current) {
      const pEuler = new THREE.Euler().setFromQuaternion(prismGroupRef.current.quaternion)
      // Refraction physics: rainbow bends inversely to the prism's rotation
      rainbowGroupRef.current.rotation.y = pEuler.y * -0.7
      rainbowGroupRef.current.rotation.x = pEuler.x * -0.4
    }
  })

  const whiteBeamMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: BEAM_VERTEX,
    fragmentShader: BEAM_FRAGMENT,
    uniforms: { 
      uColor: { value: new THREE.Color('#ffffff') },
      uProgress: uniforms.uProgress,
      uBeamType: { value: 0.0 }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  }), [uniforms])

  const colors = ['#ff2a2a', '#ff7a00', '#ffdf00', '#2aff2a', '#00aaff', '#aa00ff']
  
  const rainbowMats = useMemo(() => colors.map(c => new THREE.ShaderMaterial({
    vertexShader: BEAM_VERTEX,
    fragmentShader: BEAM_FRAGMENT,
    uniforms: { 
      uColor: { value: new THREE.Color(c) },
      uProgress: uniforms.uProgress,
      uBeamType: { value: 1.0 }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  })), [uniforms])

  return (
    <group>
      {/* Incident White Beam (Fixed in space) */}
      <mesh material={whiteBeamMat} position={[-2.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 5, 16, 1, true]} />
      </mesh>

      {/* Refracted Rainbow Beams (Bends dynamically based on prism rotation) */}
      <group ref={rainbowGroupRef} position={[0, 0, 0]}>
        {colors.map((color, i) => {
          const spread = 0.21
          const angle = (i / (colors.length - 1)) * spread - (spread / 2)
          return (
            <group key={color} rotation={[0, 0, angle]}>
              <mesh material={rainbowMats[i]} position={[2.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <cylinderGeometry args={[0.012, 0.001, 5, 16, 1, true]} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

/* ================================================================== */

export default function HeroPrism({ mobile = false, q }: { mobile?: boolean; q: HeroQuality }) {
  const { scene } = useGLTF(MODEL_PATH)
  const { size } = useThree()

  const wrapperRef = useRef<THREE.Group>(null)
  const prismRef = useRef<THREE.Group>(null)
  const targetQuat = useRef(new THREE.Quaternion())
  const euler = useRef(new THREE.Euler())
  const lastProgress = useRef(0)
  const scrollVel = useRef(0)
  const lastColor = useRef('')

  /* ----------------------------------------------------------------
   * ORIGINAL GLB GEOMETRY, normalised to a unit height so the
   * responsive sizing below is in real world units.
   * ---------------------------------------------------------------- */

  const { geometry, unitScale } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    scene.traverse((child) => {
      if (!geo && child instanceof THREE.Mesh && child.geometry) geo = child.geometry
    })
    if (!geo) return { geometry: null, unitScale: 1 }

    const g = geo as THREE.BufferGeometry
    g.computeBoundingBox()
    const size = new THREE.Vector3()
    g.boundingBox!.getSize(size)
    return { geometry: g, unitScale: 1 / Math.max(size.y, 1e-4) }
  }, [scene])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: heroConfig.materialColor,
      metalness: 0,
      roughness: heroConfig.roughness,
      transmission: 1,
      thickness: 0.55,
      ior: 1.52,
      // dispersion is the physical chromatic split -- extra samples per pixel
      // through an already full-screen transmission pass, so only the top tier
      // pays for it.
      dispersion: q.dispersion,
      iridescence: q.iridescence,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [120, 520],
      clearcoat: 0.4,
      clearcoatRoughness: 0.05,
      envMapIntensity: heroConfig.reflectionIntensity,
      transparent: false
    })
    patchMaterial(m)
    return m
  }, [q])

  /* ----------------------------------------------------------------
   * RESPONSIVE SIZE
   *
   * Height-driven with a width guard, so the prism stays visually
   * dominant on a narrow viewport instead of collapsing with it.
   * ---------------------------------------------------------------- */

  const vFov = (heroConfig.cameraFOV * Math.PI) / 180
  const baseHeight = 2 * Math.tan(vFov / 2) * heroConfig.cameraDistance
  const baseWidth = baseHeight * (size.width / size.height)

  const worldHeight =
    Math.min(baseHeight * 0.62, baseWidth * 0.85) * heroConfig.objectScale

  useFrame((state, delta) => {
    const wrapper = wrapperRef.current
    const prism = prismRef.current
    if (!wrapper || !prism) return

    const cfg = heroConfig
    const d = Math.min(delta, 0.05)

    // hero sequence completes by 30% of the page scroll
    const raw = heroScrollState.progress
    const progress = THREE.MathUtils.clamp(raw, 0, 0.3) / 0.3

    // scroll velocity, damped -> a restrained nudge, never a spin-up
    const instantVel = d > 0 ? (raw - lastProgress.current) / d : 0
    lastProgress.current = raw
    scrollVel.current = THREE.MathUtils.damp(
      scrollVel.current,
      THREE.MathUtils.clamp(instantVel, -3, 3),
      3,
      d
    )

    // depth + float
    wrapper.position.z = THREE.MathUtils.damp(
      wrapper.position.z,
      THREE.MathUtils.mapLinear(progress, 0, 1, 0, 4.5),
      4,
      d
    )
    wrapper.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12

    /* --------------------------------------------------------------
     * ORIENTATION
     *
     * mouse -> target euler -> quaternion -> slerp. Never assigned
     * straight from the cursor, and the idle term is an oscillation
     * rather than a constant spin, so it always settles back toward
     * neutral when the pointer stops.
     * -------------------------------------------------------------- */

    const t = state.clock.elapsedTime
    const idleY = Math.sin(t * cfg.idleSpeed) * 0.55 + t * cfg.idleSpeed * 0.35
    const mouse = cfg.mouseInfluence * Math.PI

    euler.current.set(
      cfg.rotationX + heroInput.y * mouse * 0.7,
      cfg.rotationY +
        heroInput.x * mouse +
        idleY +
        progress * Math.PI * cfg.scrollInfluence +
        scrollVel.current * 0.35,
      cfg.rotationZ + heroInput.x * mouse * 0.12
    )
    targetQuat.current.setFromEuler(euler.current)
    prism.quaternion.slerp(targetQuat.current, 1 - Math.exp(-3.2 * d))

    wrapper.scale.setScalar(worldHeight * unitScale)

    // live-tunable material
    material.roughness = cfg.roughness
    material.thickness = 0.25 + cfg.screenDistortion * 0.8
    material.envMapIntensity = cfg.reflectionIntensity
    // .set() parses a CSS string; only the debug panel ever changes this value
    if (cfg.materialColor !== lastColor.current) {
      lastColor.current = cfg.materialColor
      material.color.set(cfg.materialColor)
    }
    const shader = material.userData.shader
    if (shader) {
      shader.uniforms.uNoiseScale.value = cfg.noiseScale
      shader.uniforms.uNoiseAmount.value = cfg.noiseAmount
    }
  })

  if (!geometry) return null

  return (
    <group ref={wrapperRef}>
      <group ref={prismRef}>
        <mesh geometry={geometry} material={material} />
      </group>
      {/* Disabled: white beam → rainbow refraction effect. Re-enable by uncommenting. */}
      {/* <LightBeams prismGroupRef={prismRef} /> */}
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
