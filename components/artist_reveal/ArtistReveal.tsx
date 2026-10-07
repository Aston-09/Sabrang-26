'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DepthGalleryEngine, type LabelData } from './DepthGalleryEngine'
import './ArtistReveal.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function ArtistReveal() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<DepthGalleryEngine | null>(null)
  const [labelData, setLabelData] = useState<LabelData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleLabelUpdate = useCallback((data: LabelData) => {
    setLabelData(data)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !sectionRef.current) return

    const canvas = canvasRef.current
    const section = sectionRef.current

    // Create engine
    const engine = new DepthGalleryEngine(canvas, handleLabelUpdate)
    engineRef.current = engine

    let scrollTriggerInstance: ScrollTrigger | null = null

    // Init engine, then wire up ScrollTrigger
    engine
      .init()
      .then(() => {
        setIsLoading(false)

        // ScrollTrigger tracks the section's scroll progress and drives the engine
        scrollTriggerInstance = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            engine.setProgress(self.progress)
            section.setAttribute('data-progress', self.progress.toString())
          },
        })
      })
      .catch((err) => {
        console.error('ArtistReveal: Engine init failed', err)
        setIsLoading(false)
      })

    return () => {
      scrollTriggerInstance?.kill()
      engine.dispose()
      engineRef.current = null
    }
  }, [handleLabelUpdate])

  return (
    <section id="artist-reveal" ref={sectionRef} className="artist-reveal">
      <div className="artist-reveal__viewport">
        {/* Three.js canvas */}
        <canvas ref={canvasRef} className="artist-reveal__canvas" />

        {/* Loading indicator */}
        {isLoading && (
          <div className="artist-reveal__loading">
            <div className="artist-reveal__loading-bar" />
          </div>
        )}

      </div>
    </section>
  )
}
