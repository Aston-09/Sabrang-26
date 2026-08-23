'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Wheel, { type WheelHandle } from '@/components/ui/Wheel'
import AboutSection from '@/components/sections/AboutSection'
import HeroSection from '@/components/sections/HeroSection'
import HeroScene from '@/components/3d/hero/HeroScene'
import HeroConclusion from '@/components/sections/HeroConclusion'
import './hero-theme.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}



interface HomeClientProps {
  summitImages: string[]
  summitNames: string[]
  summitBriefs: string[]
}

export default function HomeClient({ 
  summitImages, 
  summitNames, 
  summitBriefs 
}: HomeClientProps) {
  const [mounted, setMounted] = useState(false)
  const [currentSummit, setCurrentSummit] = useState(0)
  const wheelRef = useRef<WheelHandle>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const cardVisibleRef = useRef(false)
  const wheelSectionRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef(0)

  const handleSummitSelect = useCallback((index: number) => {
    setCurrentSummit(index)
  }, [])

  useEffect(() => {
    setMounted(true)

    // Phases: 0 = Head Zoom, 1 = Explosion/DNA, 2 = Space
    const trigger = ScrollTrigger.create({
      trigger: '#scroll-trigger',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress
        if (p < 0.45) {
          phaseRef.current = 0
        } else if (p < 0.55) {
          phaseRef.current = 1
        } else {
          phaseRef.current = 2
        }
      }
    });

    return () => {
      trigger.kill()
    }
  }, [])



  // Separate effect for wheel pin — runs after mount so ref is valid
  useEffect(() => {
    if (!wheelSectionRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: wheelSectionRef.current,
      start: 'top bottom', // Start animating when it enters the screen
      end: 'bottom top',   // Finish animating when it leaves the screen
      pin: false,          // Remove the scroll trap!
      scrub: true,
      onUpdate: (self) => {
        if (wheelRef.current) {
          wheelRef.current.setScrollDrive(self.progress)
        }

        // Direct DOM update for preview visibility to avoid re-renders
        if (previewRef.current) {
          const isVisible = self.progress > 0.01
          if (isVisible !== cardVisibleRef.current) {
            cardVisibleRef.current = isVisible
            if (isVisible) {
              previewRef.current.classList.replace('opacity-0', 'opacity-100')
              previewRef.current.classList.replace('translate-y-12', 'translate-y-0')
              previewRef.current.classList.replace('scale-95', 'scale-100')
              previewRef.current.classList.remove('pointer-events-none')
            } else {
              previewRef.current.classList.replace('opacity-100', 'opacity-0')
              previewRef.current.classList.replace('translate-y-0', 'translate-y-12')
              previewRef.current.classList.replace('scale-100', 'scale-95')
              previewRef.current.classList.add('pointer-events-none')
            }
          }
        }
      }
    })

    return () => {
      trigger.kill()
    }
  }, [])

  return (
    <main className="hero-theme relative w-full">
      <HeroScene />
      
      <div className="relative w-full">
        <HeroSection />

        {/* Scroll Triggers (Main Hero Logic) */}
        <div id="scroll-trigger" className="relative w-full z-10 pointer-events-none">
          <section className="h-[100vh]" data-label="Zoom Phase" />
          <section className="h-[100vh]" data-label="Scatter/DNA Phase" />
        </div>
      </div>

      <HeroConclusion />
      
    </main>
  )
}

