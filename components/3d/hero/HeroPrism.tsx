'use client'

import React, { useRef, useMemo, useLayoutEffect } from 'react'
import { useGLTF, MeshTransmissionMaterial, Center } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { heroScrollState } from '@/components/3d/hero/heroScrollState'

export default function HeroPrism() {
  const { scene } = useGLTF('/models/alche_style_optical_prism.glb')
  const groupRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  // Dynamic scaling
  const scale = Math.min(viewport.width * 0.25, 3.5)

  // Configure target rotations
  const currentRotation = useRef(new THREE.Vector2(0, 0))

  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const p = heroScrollState.progress

    // PHASE 5: Prism Z movement (0 -> 4.5)
    const targetZ = THREE.MathUtils.mapLinear(p, 0, 1, 0, 4.5)

    // PHASE 6: Prism scroll rotation
    const scrollRotationY = p * Math.PI

    // Idle rotation
    const idleRotationY = state.clock.elapsedTime * 0.1

    // PHASE 7: Mouse rotation parallax
    const targetMouseRotX = (state.pointer.x * Math.PI) * 0.15
    const targetMouseRotY = (state.pointer.y * Math.PI) * 0.15

    currentRotation.current.x = THREE.MathUtils.damp(currentRotation.current.x, targetMouseRotX, 4, delta)
    currentRotation.current.y = THREE.MathUtils.damp(currentRotation.current.y, targetMouseRotY, 4, delta)

    // Apply combined transformations with damping for physical feel
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 4, delta)
    groupRef.current.rotation.y = idleRotationY + scrollRotationY + currentRotation.current.x
    groupRef.current.rotation.x = currentRotation.current.y

    // Subtle float remains
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.15

    // Scale remains constant; Z movement creates the depth illusion
    groupRef.current.scale.setScalar(scale)
  })
  
  // Extract geometry to build custom mesh
  let customGeometry = null
  scene.traverse((child: any) => {
    if ((child as THREE.Mesh).isMesh && !customGeometry) {
      customGeometry = (child as THREE.Mesh).geometry.clone()
      customGeometry.computeBoundingBox()
    }
  })

  useLayoutEffect(() => {
    if (customGeometry) {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      console.log('--- PRISM BOUNDS ---')
      console.log('Size:', size)
      console.log('Min:', box.min)
      console.log('Max:', box.max)
    }
  }, [scene, customGeometry])

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {customGeometry && (
        <Center>
          <mesh geometry={customGeometry}>
            <MeshTransmissionMaterial
              backside
              samples={4}
              thickness={1.5}
              chromaticAberration={0.08}
              anisotropy={0.2}
              distortion={0.1}
              distortionScale={0.2}
              temporalDistortion={0.05}
              ior={1.48}
              color="#e2e8f0"
              attenuationDistance={2}
              attenuationColor="#4f46e5"
              clearcoat={1}
              roughness={0}
              transmission={1}
            />
          </mesh>
        </Center>
      )}
    </group>
  )
}

useGLTF.preload('/models/alche_style_optical_prism.glb')
