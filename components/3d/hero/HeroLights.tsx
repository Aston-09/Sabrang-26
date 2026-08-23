'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Direct lighting is deliberately minimal: nearly all of the prism's look comes
 * from the captured chamber environment map. These are specular accents only —
 * teal, deep violet, and a single white key, matching the chamber palette.
 */
export default function HeroLights() {
  const violet = useRef<THREE.PointLight>(null)
  const teal = useRef<THREE.PointLight>(null)
  const key = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (violet.current) {
      violet.current.position.x = -5 + Math.sin(t * 0.18) * 1.5
      violet.current.position.y = 4 + Math.cos(t * 0.13) * 1.0
    }
    if (teal.current) {
      teal.current.position.x = 5 + Math.cos(t * 0.22) * 1.5
      teal.current.position.z = 2 + Math.sin(t * 0.17) * 1.5
    }
    if (key.current) {
      key.current.position.x = -1.5 + Math.cos(t * 0.11) * 0.8
      key.current.position.y = 2.5 + Math.sin(t * 0.08) * 0.6
    }
  })

  return (
    <>
      <ambientLight intensity={0.12} color="#0a1416" />
      <pointLight ref={violet} position={[-5, 4, -2]} intensity={14} color="#6d4fd6" distance={22} />
      <pointLight ref={teal} position={[5, 1, 2]} intensity={16} color="#1fb4a8" distance={22} />
      <pointLight ref={key} position={[-1.5, 2.5, 5]} intensity={9} color="#fff4e6" distance={16} />
    </>
  )
}
