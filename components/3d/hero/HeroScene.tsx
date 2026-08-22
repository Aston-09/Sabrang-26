'use client'

import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { heroScrollState } from '@/components/3d/hero/heroScrollState'
import { Environment, Lightformer } from '@react-three/drei'
import HeroTypography from './HeroTypography'
import HeroPrism from './HeroPrism'
import HeroLights from './HeroLights'
import HeroEffects from './HeroEffects'

function SceneContents() {
  return (
    <>
      {/* 
        Custom white studio environment using Lightformers.
        This provides massive, soft white rectangles for the glass to reflect,
        completely eliminating the dark HDRI mirror effect while keeping the 
        background neutral.
      */}
      <Environment resolution={512}>
        <Lightformer form="rect" intensity={2} position={[0, 4, -4]} scale={[20, 2, 1]} color="white" />
        <Lightformer form="rect" intensity={1.5} position={[-4, 2, 4]} scale={[2, 10, 1]} color="white" />
        <Lightformer form="rect" intensity={1.5} position={[4, 2, 4]} scale={[2, 10, 1]} color="#f2f2f2" />
        <Lightformer form="rect" intensity={0.5} position={[0, -4, 0]} scale={[10, 10, 1]} color="#f8f8f8" rotation={[-Math.PI / 2, 0, 0]} />
        {/* Subtle spectral edge highlights */}
        <Lightformer form="rect" intensity={1} position={[-5, 0, -5]} scale={[1, 5, 1]} color="#e0f2fe" />
        <Lightformer form="rect" intensity={1} position={[5, 0, -5]} scale={[1, 5, 1]} color="#f3e8ff" />
      </Environment>
      <HeroLights />
      <HeroTypography />
      <HeroPrism />
      <HeroEffects />
    </>
  )
}

function CameraController() {
  const currentCameraPos = useRef(new THREE.Vector3(0, 0, 8))
  
  useFrame((state, delta) => {
    const rawProgress = heroScrollState.progress
    // Normalize progress so the camera zoom completes by 30% of scroll
    const p = THREE.MathUtils.clamp(rawProgress, 0, 0.3) / 0.3

    // PHASE 2: Camera Z movement (8 -> 20)
    // Map progress 0->1 to Z 8->20
    const targetZ = 8 + (12 * p)

    // PHASE 7: Mouse parallax for Camera
    // Max movement: X +/- 0.25, Y +/- 0.15
    const targetX = (state.pointer.x * 0.25)
    const targetY = (state.pointer.y * 0.15)

    // Interpolate towards target (Damping ~4 for heavy cinematic feel)
    currentCameraPos.current.x = THREE.MathUtils.damp(currentCameraPos.current.x, targetX, 4, delta)
    currentCameraPos.current.y = THREE.MathUtils.damp(currentCameraPos.current.y, targetY, 4, delta)
    currentCameraPos.current.z = THREE.MathUtils.damp(currentCameraPos.current.z, targetZ, 4, delta)

    state.camera.position.copy(currentCameraPos.current)
    state.camera.lookAt(0, 0, 0)
  })
  
  return null
}

export default function HeroScene() {
  return (
    <div className="hero-scene-wrapper fixed inset-0 z-10 pointer-events-none" style={{ touchAction: 'none' }}>
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 40, near: 0.1, far: 100 }} 
        style={{ pointerEvents: 'auto' }} 
        dpr={[1, 1.75]} 
        gl={{ antialias: false, alpha: true }}
      >
        <CameraController />
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  )
}
