'use client'

import React, { useEffect, useRef } from 'react'

/* ─── Star shape definitions ─── */

interface DriftStar {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  baseAlpha: number
  twinkle: number
}

interface RisingStar {
  x: number
  y: number
  size: number
  alpha: number
  speedY: number
}

/* ─── Component Props ─── */

interface StarBackgroundProps {
  /** 'drift' = random multi-directional with parallax & twinkle (Competitions).
   *  'rise'  = gentle upward float (IARC / Robogames). */
  mode?: 'drift' | 'rise'
  /** Number of stars to render */
  count?: number
  /** CSS id for the canvas element (useful when multiple instances coexist) */
  canvasId?: string
  /** Sizing strategy:
   *  'viewport' = fixed to window (IARC-style)
   *  'container' = fills a parent wrapper (Competitions-style) */
  sizing?: 'viewport' | 'container'
}

/* ─── Shared star factories ─── */

const createDriftStars = (count: number, width: number, height: number): DriftStar[] =>
  Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    baseAlpha: Math.random() * 0.7 + 0.3,
    twinkle: Math.random() * 0.02,
  }))

const createRisingStars = (count: number, width: number, height: number): RisingStar[] =>
  Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.5,
    alpha: Math.random() * 0.5 + 0.1,
    speedY: Math.random() * 0.15 + 0.05,
  }))

/**
 * A shared, configurable canvas star-field background.
 * Handles both viewport-fixed and container-relative sizing in a single component.
 * Properly cleans up animation frames, resize observers, and event listeners.
 */
const StarBackground = ({
  mode = 'drift',
  count = 300,
  canvasId,
  sizing = 'viewport',
}: StarBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // For container mode, we need the wrapper div
    const container = containerRef.current
    if (sizing === 'container' && !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let driftStars: DriftStar[] = []
    let risingStars: RisingStar[] = []
    let mouseX = 0
    let mouseY = 0
    let requestId: number

    /* ── Sizing ── */
    const measure = () => {
      if (sizing === 'viewport') {
        width = canvas.width = window.innerWidth
        height = canvas.height = window.innerHeight
      } else {
        width = canvas.width = container!.offsetWidth
        height = canvas.height = container!.offsetHeight
      }
    }

    const init = () => {
      measure()
      if (mode === 'drift') {
        driftStars = createDriftStars(count, width, height)
      } else {
        risingStars = createRisingStars(count, width, height)
      }
    }

    // 30fps throttle: skip every other rAF tick.
    // A slow-drifting star field is visually identical at 30fps but costs 50% less CPU.
    let frameCount = 0;

    /* ── Mouse (only needed for drift parallax) ── */
    const handleMouseMove = (e: MouseEvent) => {
      if (sizing === 'container' && container) {
        const rect = container.getBoundingClientRect()
        mouseX = ((e.clientX - rect.left) - width / 2) * 0.04
        mouseY = ((e.clientY - rect.top) - height / 2) * 0.04
      } else {
        mouseX = (e.clientX - width / 2) * 0.04
        mouseY = (e.clientY - height / 2) * 0.04
      }
    }

    /* ── Render loops ── */
    const animateDrift = () => {
      requestId = requestAnimationFrame(animateDrift)
      // 30fps throttle
      frameCount++
      if (frameCount % 2 !== 0) return

      ctx.clearRect(0, 0, width, height)

      for (const s of driftStars) {
        s.x += s.vx
        s.y += s.vy

        if (s.x < 0) s.x = width
        if (s.x > width) s.x = 0
        if (s.y < 0) s.y = height
        if (s.y > height) s.y = 0

        s.baseAlpha += s.twinkle
        if (s.baseAlpha > 1 || s.baseAlpha < 0.2) s.twinkle *= -1

        ctx.beginPath()
        ctx.arc(s.x + mouseX * s.z, s.y + mouseY * s.z, s.z * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(var(--color-white-rgb), ${Math.max(0, s.baseAlpha)})`
        ctx.fill()
      }
    }

    const animateRise = () => {
      requestId = requestAnimationFrame(animateRise)
      // 30fps throttle
      frameCount++
      if (frameCount % 2 !== 0) return

      ctx.clearRect(0, 0, width, height)

      for (const s of risingStars) {
        s.y -= s.speedY
        if (s.y < 0) {
          s.y = height
          s.x = Math.random() * width
        }

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(var(--color-white-rgb), ${s.alpha})`
        ctx.fill()
      }
    }

    /* ── Bootstrap ── */
    init()

    // Pause/resume the loop when the tab is hidden/shown.
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(requestId)
      } else {
        frameCount = 0
        if (mode === 'drift') animateDrift()
        else animateRise()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Resize handling: use ResizeObserver for container, window resize for viewport
    let resizeObserver: ResizeObserver | null = null
    if (sizing === 'container' && container) {
      resizeObserver = new ResizeObserver(() => init())
      resizeObserver.observe(container)
    } else {
      window.addEventListener('resize', init)
    }

    if (mode === 'drift') {
      window.addEventListener('mousemove', handleMouseMove)
      animateDrift()
    } else {
      animateRise()
    }

    /* ── Cleanup ── */
    return () => {
      cancelAnimationFrame(requestId)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener('resize', init)
      }
      if (mode === 'drift') {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [mode, count, sizing])

  /* ── Layout ── */
  if (sizing === 'viewport') {
    return (
      <canvas
        id={canvasId}
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
    >
      <canvas
        id={canvasId}
        ref={canvasRef}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      />
    </div>
  )
}

/**
 * Convenience alias — uses viewport sizing by default.
 * Drop-in replacement for the old duplicated component.
 */
const StarBackgroundViewport = (props: StarBackgroundProps) => (
  <StarBackground {...props} sizing="viewport" />
)

export { StarBackgroundViewport }
export default StarBackground
