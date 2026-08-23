'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { heroConfig, heroDebugEnabled, mountHeroDebugPanel } from './heroConfig'
import { heroInput, heroScrollState, startHeroInput } from './heroScrollState'
import HeroEnvironment from './HeroEnvironment'
import HeroTypography from './HeroTypography'
import HeroPrism from './HeroPrism'
import HeroLights from './HeroLights'
import HeroEffects from './HeroEffects'

function SceneContents({ mobile }: { mobile: boolean }) {
  return (
    <>
      {/* The chamber. Also the reflection source for everything in it. */}
      <HeroEnvironment mobile={mobile} />
      <HeroLights />
      <HeroTypography mobile={mobile} />
      <HeroPrism mobile={mobile} />
      <HeroEffects mobile={mobile} />
    </>
  )
}

/**
 * Past the hero the canvas is still the page's visible backdrop -- AboutSection and
 * everything after it are transparent fixed overlays -- so it cannot simply stop.
 * Demand mode plus a 20Hz tick keeps the drift and the float alive at a third of the
 * cost, for the majority of a session that is spent below the fold.
 */
function FrameThrottle() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const id = setInterval(invalidate, 50)
    return () => clearInterval(id)
  }, [invalidate])
  return null
}

function CameraController() {
  const current = useRef(new THREE.Vector3(0, 0, heroConfig.cameraDistance))

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    const p = THREE.MathUtils.clamp(heroScrollState.progress, 0, 0.3) / 0.3
    const cam = state.camera as THREE.PerspectiveCamera

    if (cam.fov !== heroConfig.cameraFOV) {
      cam.fov = heroConfig.cameraFOV
      cam.updateProjectionMatrix()
    }

    // pull back through the chamber as the hero sequence plays out
    const targetZ = heroConfig.cameraDistance + 12 * p
    const targetX = heroInput.x * 0.25
    const targetY = heroInput.y * 0.15

    current.current.x = THREE.MathUtils.damp(current.current.x, targetX, 4, d)
    current.current.y = THREE.MathUtils.damp(current.current.y, targetY, 4, d)
    current.current.z = THREE.MathUtils.damp(current.current.z, targetZ, 4, d)

    cam.position.copy(current.current)
    cam.lookAt(0, 0, 0)
  })

  return null
}

export default function HeroScene() {
  // null until measured, so the scene is built once at the right quality tier
  const [mobile, setMobile] = useState<boolean | null>(null)
  // The hero pin ends at progress 1. Past it this canvas is still running a full
  // transmission + PMREM + bloom pipeline behind the rest of the page.
  const [awake, setAwake] = useState(true)

  useEffect(() => {
    setMobile(window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
    const stopInput = startHeroInput()
    const stopPanel = heroDebugEnabled() ? mountHeroDebugPanel() : undefined

    // Full rate while scrolling anywhere; throttles a second after the last scroll, and
    // only if the hero is behind us. That delay also outlasts GSAP's 0.8s scrub tail, so
    // progress has settled by the time it is read.
    let sleepTimer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      setAwake(true)
      clearTimeout(sleepTimer)
      sleepTimer = setTimeout(() => setAwake(heroScrollState.progress <= 0.99), 1000)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(sleepTimer)
      stopInput()
      stopPanel?.()
    }
  }, [])

  if (mobile === null) return <div className="hero-scene-wrapper fixed inset-0 z-0" />

  return (
    <div
      className="hero-scene-wrapper fixed inset-0 z-0 pointer-events-none"
      style={{ touchAction: 'none', background: '#000' }}
    >
      <Canvas
        frameloop={awake ? 'always' : 'demand'}
        camera={{ position: [0, 0, heroConfig.cameraDistance], fov: heroConfig.cameraFOV, near: 0.1, far: 200 }}
        dpr={mobile ? [1, 1.25] : [1, 1.75]}
        // opaque: the wrapper is already #000, so blending against the page buys nothing
        gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          // The prism's transmission:1 makes three re-render the whole scene into an
          // offscreen target every frame. Refraction through 0.55 thickness is blurry,
          // so quartering that target's pixel count costs nothing visible.
          gl.transmissionResolutionScale = mobile ? 0.35 : 0.5
        }}
      >
        <CameraController />
        {!awake && <FrameThrottle />}
        <Suspense fallback={null}>
          <SceneContents mobile={mobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}
