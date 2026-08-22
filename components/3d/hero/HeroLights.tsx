'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function HeroLights() {
  const purpleLight = useRef<THREE.PointLight>(null)
  const blueLight = useRef<THREE.PointLight>(null)
  const cyanLight = useRef<THREE.PointLight>(null)
  const whiteLight = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (purpleLight.current) {
      purpleLight.current.position.x = -5 + Math.sin(t * 0.3) * 2
      purpleLight.current.position.y = 5 + Math.cos(t * 0.2) * 1
    }
    if (blueLight.current) {
      blueLight.current.position.x = 5 + Math.cos(t * 0.4) * 2
      blueLight.current.position.z = 2 + Math.sin(t * 0.3) * 2
    }
    if (cyanLight.current) {
      cyanLight.current.position.x = 4 + Math.sin(t * 0.5) * 1.5
      cyanLight.current.position.y = -3 + Math.cos(t * 0.4) * 1.5
    }
    if (whiteLight.current) {
      whiteLight.current.position.x = -2 + Math.cos(t * 0.2) * 1
      whiteLight.current.position.y = 2 + Math.sin(t * 0.1) * 1
    }
  })

  return (
    <>
      <ambientLight intensity={0.2} color="#050510" />
      <pointLight ref={purpleLight} position={[-5, 5, -2]} intensity={20} color="#8b5cf6" distance={20} />
      <pointLight ref={blueLight} position={[5, 2, 2]} intensity={30} color="#3b82f6" distance={20} />
      <pointLight ref={cyanLight} position={[4, -3, -2]} intensity={15} color="#06b6d4" distance={15} />
      <pointLight ref={whiteLight} position={[-2, 2, 5]} intensity={10} color="#ffffff" distance={15} />
    </>
  )
}
