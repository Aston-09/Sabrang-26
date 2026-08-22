'use client'

import React, { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { heroScrollState } from '@/components/3d/hero/heroScrollState'

export default function HeroTypography() {
  const { viewport } = useThree()
  const textRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  const groupRef = useRef<THREE.Group>(null)

  // Dynamically calculate font size to span ~70-80% of viewport width
  // Since "SABRANG" is 7 letters, a rough multiplier gives a good fit
  const fontSize = Math.min(viewport.width * 0.22, 18)

  useFrame((state, delta) => {
    if (!textRef.current || !groupRef.current || !materialRef.current) return
    
    const p = heroScrollState.progress

    // PHASE 3 & 4: Map scroll progress to targets
    let targetZ = -2
    let targetScale = 1
    let targetOpacity = 1

    if (p <= 0.88) {
      targetZ = THREE.MathUtils.mapLinear(p, 0, 0.88, -2, -21)
      targetScale = THREE.MathUtils.mapLinear(p, 0, 0.88, 1, 0.7)
    } else {
      targetZ = -21
      targetScale = 0.7
    }

    if (p < 0.25) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0, 0.25, 1, 0.85)
    } else if (p < 0.50) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0.25, 0.50, 0.85, 0.50)
    } else if (p < 0.70) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0.50, 0.70, 0.50, 0.22)
    } else if (p <= 0.88) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0.70, 0.88, 0.22, 0)
    } else {
      targetOpacity = 0
    }

    // Damped interpolation for physical feel
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 4, delta)
    textRef.current.scale.setScalar(THREE.MathUtils.damp(textRef.current.scale.x, targetScale, 4, delta))
    materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, targetOpacity, 6, delta)

    // Very subtle idle floating for the text itself
    textRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
  })

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      <Text
        ref={textRef}
        fontSize={fontSize}
        letterSpacing={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        SABRANG
        <meshBasicMaterial 
          ref={materialRef}
          color="#ffffff" 
          transparent={true}
          opacity={1} 
          toneMapped={false}
        />
      </Text>
    </group>
  )
}
