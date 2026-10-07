"use client"

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_PIN_END, HERO_SCRUB } from '@/components/3d/hero/heroScrollState'
import './AboutSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const step1Ref = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Refresh ScrollTrigger after a short delay to ensure everything is in place
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 500)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll-trigger",
          start: "top top",
          // identical range to the hero pin -- see HERO_PIN_END
          end: HERO_PIN_END,
          scrub: HERO_SCRUB,
        }
      });

      // PHASE 01: ROBOT (15 -> end)
      tl.fromTo(step1Ref.current, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 8 }, 15)

      // Background glow sync (delay until hero atmosphere is fading)
      tl.to(glowRef.current, { left: "0%", duration: 5, top: '40%' }, 5)
        .to(glowRef.current, { left: "60%", duration: 20, top: '50%' }, 15)
        .to(glowRef.current, { left: "0%", duration: 20, top: '60%' }, 40)
        .to(glowRef.current, { autoAlpha: 0, duration: 10 }, 75);

      // Force total duration to exactly 100 so `30` maps perfectly to 0.3 progress
      tl.set({}, {}, 100);
    });

    return () => {
      ctx.revert()
      clearTimeout(timer)
    };
  }, []);

  return (
    <div id="about" ref={containerRef} className="fixed inset-0 z-30 pointer-events-none overflow-hidden">


      <div className="relative w-full h-full flex items-center">
        
        {/* Subtle glow for background depth */}
        <div 
          ref={glowRef}
          style={{
            position: 'absolute',
            width: '50vw',
            height: '50vw',
            background: 'radial-gradient(circle, var(--white-subtle) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
            zIndex: -1,
            transform: 'translateY(-50%)',
          }}
        ></div>

        {/* STEP 1: LEFT ALIGNED — Varun Jain Featured Artist */}
        <div ref={step1Ref} className="about-card about-card--artist invisible" style={{ left: '5%' }}>
          <div className="artist-card-inner">
            <div className="artist-image-wrapper">
              <Image
                src="/images/varun-jain.jpg"
                alt="Varun Jain performing live"
                width={400}
                height={400}
                className="artist-image"
                priority
              />
              <div className="artist-image-glow" />
            </div>
            <div className="artist-info">
              <span className="text-[var(--text-muted)] tracking-[4px] mb-4 block text-[0.75rem]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>/ PHASE_01</span>
              <h2 className="about-heading">Varun Jain<br /><i>Live</i></h2>
              <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed">
                Get ready for an electrifying night as Varun Jain takes the stage at Sabrang &apos;26 — bringing soulful melodies and raw energy to the heart of the fest.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
