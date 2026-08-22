'use client'

import React, { useMemo, useRef } from 'react'
import {
  Center,
  MeshTransmissionMaterial,
  useGLTF,
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { heroScrollState } from '@/components/3d/hero/heroScrollState'

const MODEL_PATH = '/models/SABRANG_TRANSPARENT_STRIP_PRISM.glb'

export default function HeroPrism() {
  const { scene } = useGLTF(MODEL_PATH)

  const groupRef = useRef<THREE.Group>(null)

  const { viewport } = useThree()

  /*
   * ================================================================
   * RESPONSIVE SCALE
   * ================================================================
   */

  const PRISM_SCALE_MULTIPLIER = 0.85

  const scale = Math.min(
    viewport.width * 0.25,
    3.5
  ) * PRISM_SCALE_MULTIPLIER

  /*
   * ================================================================
   * SMOOTH MOUSE ROTATION
   * ================================================================
   */

  const currentRotation = useRef(
    new THREE.Vector2(0, 0)
  )

  /*
   * ================================================================
   * EXTRACT FIRST VALID MESH GEOMETRY
   *
   * We keep the ORIGINAL GLB geometry.
   *
   * No new prism.
   * No silhouette changes.
   * No geometry replacement.
   * ================================================================
   */

  const customGeometry = useMemo<THREE.BufferGeometry | null>(() => {
    let geometry: THREE.BufferGeometry | null = null

    scene.traverse((child) => {
      if (
        !geometry &&
        child instanceof THREE.Mesh &&
        child.geometry
      ) {
        geometry = child.geometry
      }
    })

    return geometry
  }, [scene])

  /*
   * ================================================================
   * ANIMATION
   * ================================================================
   */

  useFrame((state, delta) => {
    const group = groupRef.current

    if (!group) return

    /*
     * --------------------------------------------------------------
     * SCROLL PROGRESS
     * --------------------------------------------------------------
     */

    // Normalize progress so the hero animation completes by 30% of scroll
    const progress = THREE.MathUtils.clamp(
      heroScrollState.progress,
      0,
      0.3
    ) / 0.3

    /*
     * --------------------------------------------------------------
     * DEPTH MOVEMENT
     *
     * 0 → 4.5
     * --------------------------------------------------------------
     */

    const targetZ = THREE.MathUtils.mapLinear(
      progress,
      0,
      1,
      0,
      4.5
    )

    group.position.z = THREE.MathUtils.damp(
      group.position.z,
      targetZ,
      4,
      delta
    )

    /*
     * --------------------------------------------------------------
     * SCROLL ROTATION
     *
     * One complete rotation through the hero sequence.
     * --------------------------------------------------------------
     */

    const scrollRotationY =
      progress * Math.PI

    /*
     * --------------------------------------------------------------
     * VERY SUBTLE IDLE ROTATION
     * --------------------------------------------------------------
     */

    const idleRotationY =
      state.clock.elapsedTime * 0.1

    /*
     * --------------------------------------------------------------
     * MOUSE PARALLAX
     * --------------------------------------------------------------
     */

    const targetMouseRotX =
      state.pointer.y *
      Math.PI *
      0.15

    const targetMouseRotY =
      state.pointer.x *
      Math.PI *
      0.15

    currentRotation.current.x =
      THREE.MathUtils.damp(
        currentRotation.current.x,
        targetMouseRotX,
        4,
        delta
      )

    currentRotation.current.y =
      THREE.MathUtils.damp(
        currentRotation.current.y,
        targetMouseRotY,
        4,
        delta
      )

    /*
     * --------------------------------------------------------------
     * APPLY ROTATION
     * --------------------------------------------------------------
     */

    group.rotation.y =
      idleRotationY +
      scrollRotationY +
      currentRotation.current.y

    group.rotation.x =
      currentRotation.current.x

    /*
     * --------------------------------------------------------------
     * SUBTLE FLOATING
     * --------------------------------------------------------------
     */

    group.position.y =
      Math.sin(
        state.clock.elapsedTime * 0.45
      ) * 0.15

    /*
     * --------------------------------------------------------------
     * RESPONSIVE SCALE
     * --------------------------------------------------------------
     */

    group.scale.setScalar(scale)
  })

  /*
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
    >
      <Center>
        {customGeometry && (
          <mesh
            geometry={customGeometry}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color="#FFFFFF"
              transmission={1.0}
              thickness={0.18}
              roughness={0.008}
              ior={1.46}
              clearcoat={0.08}
              clearcoatRoughness={0.005}
              transparent={false}
              opacity={1.0}
              envMapIntensity={1.0}
            />
          </mesh>
        )}
      </Center>
    </group>
  )
}

/*
 * ==================================================================
 * PRELOAD
 * ==================================================================
 *
 * IMPORTANT:
 * This MUST be outside the component.
 * ==================================================================
 */

useGLTF.preload(MODEL_PATH)