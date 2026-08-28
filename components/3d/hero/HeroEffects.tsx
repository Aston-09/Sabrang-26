'use client'

import React from 'react'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { HeroQuality } from './heroTier'

/**
 * Restrained. The reference chamber is dark and clean — the chromatic
 * separation lives in the prism's dispersion and the inner screen shader,
 * not in a full-screen filter, and bloom only picks up genuine highlights.
 *
 * multisampling={0}: the library defaults to 8x MSAA on its HDR target, which the
 * canvas already opted out of with antialias:false.
 */
export default function HeroEffects({ mobile = false, q }: { mobile?: boolean; q: HeroQuality }) {
  // The grain pass is a full-screen read/write for a 4.5% overlay -- the first
  // thing to go when there is no GPU doing the work.
  if (mobile || !q.grain) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.75} luminanceSmoothing={0.85} intensity={0.55} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.75} blendFunction={BlendFunction.MULTIPLY} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.72} luminanceSmoothing={0.9} intensity={0.7} mipmapBlur />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.045} />
      <Vignette eskil={false} offset={0.16} darkness={0.8} blendFunction={BlendFunction.MULTIPLY} />
    </EffectComposer>
  )
}
