'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { heroScrollState } from '@/components/3d/hero/heroScrollState'
import './HeroBackground.css'

export default function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Subtle parallax
    const target = new THREE.Vector2(0, 0)
    const current = new THREE.Vector2(0, 0)
    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to -1 to +1
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Damping loop for smooth parallax
    let lastTime = performance.now()
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time

      // Damp towards target mouse
      current.x = THREE.MathUtils.damp(current.x, target.x, 3, delta)
      current.y = THREE.MathUtils.damp(current.y, target.y, 3, delta)

      // PHASE 8: Background parallax based on scroll
      const p = heroScrollState.progress
      const targetScale = 1 + (p * 0.05) // 1.0 to 1.05
      const targetScrollY = p * 40 // subtle 40px Y shift over scroll

      // Apply subtle transform (mouse + scroll)
      if (container) {
        container.style.transform = `translate3d(${-current.x * 15}px, ${-current.y * 15 + targetScrollY}px, 0) scale(${targetScale})`
      }

      animationFrameId = requestAnimationFrame(loop)
    }
    
    animationFrameId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="hero-background-wrapper">
      {/* Preload for hero */}
      <link rel="preload" as="image" href="/images/home-bg.png" />
      
      <div ref={containerRef} className="hero-background-parallax">
        <img 
          src="/images/home-bg.png" 
          alt="Atmospheric Background" 
          className="hero-background-image"
          draggable={false}
        />
        {/* Layer 1: Atmospheric Darkening & Center Protection */}
        <div className="hero-background-overlay" />
      </div>
    </div>
  )
}
