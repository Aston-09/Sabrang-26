'use client'

import React from 'react'
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

export default function HeroEffects() {
  return (
    <EffectComposer disableNormalPass>
      {/* Subtle bloom for typography and specular highlights */}
      <Bloom 
        luminanceThreshold={0.5}
        luminanceSmoothing={0.9}
        intensity={1.2}
        mipmapBlur
      />
      {/* Very subtle chromatic aberration globally (mostly handled by material, but this grounds the lens) */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL} // blend mode
        offset={new THREE.Vector2(0.001, 0.001)} // color offset
      />
      {/* Film grain to unify the dark environment */}
      <Noise 
        premultiply
        blendFunction={BlendFunction.OVERLAY}
        opacity={0.3}
      />
      {/* Focus the center */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.9}
        blendFunction={BlendFunction.MULTIPLY}
      />
    </EffectComposer>
  )
}
