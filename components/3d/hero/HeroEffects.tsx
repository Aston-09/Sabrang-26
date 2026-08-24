'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { HeroQuality } from './heroTier'
import { heroScrollState } from './heroScrollState'
import * as THREE from 'three'

/**
 * Restrained. The reference chamber is dark and clean — the chromatic
 * separation lives in the prism's dispersion and the inner screen shader,
 * not in a full-screen filter, and bloom only picks up genuine highlights.
 *
 * multisampling={0}: the library defaults to 8x MSAA on its HDR target, which the
 * canvas already opted out of with antialias:false.
 *
 * Bloom intensity is faded to near-zero when the hero text scrolls away
 * (progress > 0.4). This effectively short-circuits the full-screen mipmap
 * blur chain that otherwise runs every frame.
 */

function BloomFader({ baseIntensity }: { baseIntensity: number }) {
  const bloomRef = useRef<any>(null)

  useFrame(() => {
    if (!bloomRef.current) return
    const p = THREE.MathUtils.clamp(heroScrollState.progress, 0, 0.3) / 0.3
    // Fade bloom intensity: full below 0.3 progress, zero by 0.5
    const fade = 1 - THREE.MathUtils.smoothstep(p, 0.3, 0.5)
    bloomRef.current.intensity = baseIntensity * fade
  })

  return (
    <Bloom ref={bloomRef} luminanceThreshold={0.75} luminanceSmoothing={0.85} intensity={baseIntensity} mipmapBlur />
  )
}

export default function HeroEffects({ mobile = false, q }: { mobile?: boolean; q: HeroQuality }) {
  return (
    <EffectComposer multisampling={0}>
      <BloomFader baseIntensity={mobile || !q.grain ? 0.55 : 0.7} />
      <Vignette eskil={false} offset={0.18} darkness={0.75} blendFunction={BlendFunction.MULTIPLY} />
    </EffectComposer>
  )
}

