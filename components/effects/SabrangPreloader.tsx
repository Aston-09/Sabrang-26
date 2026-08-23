"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const WORD = "SABRANG";

interface SabrangPreloaderProps {
  onComplete?: () => void;
}

export default function SabrangPreloader({ onComplete }: SabrangPreloaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(SVGTextElement | null)[]>([]);
  const globalGuidesRef = useRef<(SVGElement | null)[]>([]);
  const letterGuidesRef = useRef<{ [key: number]: (SVGElement | null)[] }>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });
  const sGroupRef = useRef<SVGGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const exitTlRef = useRef<gsap.core.Timeline | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSkip = () => {
    if (tlRef.current) tlRef.current.kill();
    if (exitTlRef.current) exitTlRef.current.kill();
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => {
        document.body.classList.remove("loader-active");
        document.body.style.overflow = "";
        onComplete?.();
      },
    });
  };

  // ── Blueprint Canvas Background Grid (Monochrome) ─────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;

      // Major Cartesian grid (80px)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 80) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // Minor Cartesian grid (20px)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.012)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 20) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [mounted]);

  // ── Main GSAP Construction Timeline ─────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    document.body.classList.add("loader-active");
    document.body.style.overflow = "hidden";

    const globalGuides = globalGuidesRef.current.filter(Boolean) as SVGGeometryElement[];
    const letters = letterRefs.current.filter(Boolean) as SVGTextElement[];

    // Helper to calculate & set strokeDash
    const initStroke = (el: SVGGeometryElement, initialOpacity = 0) => {
      try {
        const len = el.getTotalLength?.() ?? 1400;
        gsap.set(el, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: initialOpacity,
        });
        return len;
      } catch {
        gsap.set(el, { opacity: initialOpacity });
        return 1400;
      }
    };

    // 1. Initialize Global Blueprint Guides
    globalGuides.forEach((el) => initStroke(el, 0));

    // 2. Initialize Letterforms:
    // IMPORTANT: Letters 1..6 (A, B, R, A, N, G) are COMPLETELY INVISIBLE at start!
    // They will only appear when their specific construction lines arrive.
    letters.forEach((el, i) => {
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        fill: "#ffffff",
      });
    });

    // 3. Initialize per-letter guide elements
    for (let i = 0; i < 7; i++) {
      const gElements = (letterGuidesRef.current[i] || []).filter(Boolean) as SVGGeometryElement[];
      gElements.forEach((el) => initStroke(el, 0));
    }

    // Position S-Group at dead center (offset +720px from X=240 anchor to X=960 center)
    if (sGroupRef.current) {
      gsap.set(sGroupRef.current, { x: 720 });
    }

    // ── Build Main Animation Timeline ──
    const tl = gsap.timeline({
      onComplete: () => exitTl.play(),
    });
    tlRef.current = tl;

    // Ambient glow
    tl.to(glowRef.current, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0);

    // ── STAGE 1: S Appears in the Center (t = 0.2s → 1.5s) ──
    const sGuides = (letterGuidesRef.current[0] || []).filter(Boolean) as SVGGeometryElement[];
    sGuides.forEach((el, idx) => {
      tl.to(
        el,
        {
          opacity: 0.75,
          strokeDashoffset: 0,
          duration: 0.9,
          ease: "expo.out",
        },
        0.2 + idx * 0.05
      );
    });

    // ── STAGE 2: Slide S to the Left & Project Typographic Axes (t = 1.5s → 2.6s) ──
    if (sGroupRef.current) {
      tl.to(
        sGroupRef.current,
        {
          x: 0,
          duration: 1.1,
          ease: "power2.inOut",
        },
        1.5
      );
    }

    // Global cap-height, midline, baseline axes shoot across the screen
    globalGuides.forEach((el, idx) => {
      tl.to(
        el,
        {
          opacity: 0.25,
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "expo.out",
        },
        1.6 + idx * 0.04
      );
    });

    // S guides settle to delicate grid
    sGuides.forEach((el) => {
      tl.to(el, { opacity: 0.18, duration: 0.7, ease: "power1.out" }, 2.1);
    });

    // ── STAGE 3: Sequential Architectural Construction & Letter Reveal (A B R A N G) ──
    const letterStep = 0.48;
    const stage3Start = 2.4;

    for (let i = 1; i < 7; i++) {
      const start = stage3Start + (i - 1) * letterStep;
      const letterEl = letters[i];
      const gElements = (letterGuidesRef.current[i] || []).filter(Boolean) as SVGGeometryElement[];

      // Phase A: Architectural crossing rays & guide lines shoot in at high speed
      gElements.forEach((el, elIdx) => {
        tl.to(
          el,
          {
            opacity: 0.9,
            strokeDashoffset: 0,
            duration: 0.65,
            ease: "expo.out",
          },
          start + elIdx * 0.03
        );
      });

      // Phase B: The letter appears directly inside the intersecting lines and illuminates into solid white
      if (letterEl) {
        tl.to(
          letterEl,
          {
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
          },
          start + 0.22
        );
      }

      // Phase C: Guide lines settle down into the background blueprint
      gElements.forEach((el) => {
        tl.to(
          el,
          {
            opacity: 0.18,
            duration: 0.5,
            ease: "power1.out",
          },
          start + 0.5
        );
      });
    }

    // Final letter completes at:
    const finalCompleteTime = stage3Start + 5 * letterStep + 0.25;

    // ── Progress Counter (000 → 100) Synced Exactly with Final Letter Completion ──
    const counterObj = { val: 0 };
    tl.to(
      counterObj,
      {
        val: 100,
        duration: finalCompleteTime,
        ease: "none",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = `${Math.round(counterObj.val).toString().padStart(3, "0")}/100`;
          }
        },
      },
      0
    );

    // Subtle glow flash upon word completion
    tl.to(glowRef.current, { opacity: 1.4, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, finalCompleteTime);

    // ── STAGE 4: Crisp 0.25s Hold then Immediate Exit to Home ──
    tl.to({}, { duration: 0.25 });

    // Exit transition (Swift, punchy dissolve into homepage)
    const exitTl = gsap.timeline({ paused: true, onComplete: handleExit });
    exitTlRef.current = exitTl;

    exitTl
      .to(".preloader-guide-line", { opacity: 0, duration: 0.35, stagger: 0.015, ease: "power2.in" }, 0)
      .to(gridCanvasRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to(glowRef.current, { opacity: 0, scale: 1.05, duration: 0.45, ease: "power2.in" }, 0.03)
      .to(letters, { y: -30, opacity: 0, stagger: 0.02, duration: 0.4, ease: "power3.in" }, 0.05)
      .to(overlayRef.current, { opacity: 0, duration: 0.45, ease: "power2.inOut" }, 0.15);

    function handleExit() {
      document.body.classList.remove("loader-active");
      document.body.style.overflow = "";
      onComplete?.();
    }

    return () => {
      tl.kill();
      exitTl.kill();
      document.body.classList.remove("loader-active");
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  // ── Blueprint Coordinate System (1920 × 1080) ────────────────────────────────
  const vpW = 1920;
  const vpH = 1080;
  const cx = vpW / 2;
  const cy = 540;

  // Typographic bounds (Cap: 410px, Baseline: 670px, Midline: 540px)
  const capY = 410;
  const midY = 540;
  const bslnY = 670;

  // 7 evenly spaced letter centers: 240px step across 1920px (Centers: 240 → 1680)
  const letterPositions = [240, 480, 720, 960, 1200, 1440, 1680];

  // Helper to record per-letter guides
  const addLetterGuide = (letterIdx: number, el: SVGElement | null) => {
    if (el) letterGuidesRef.current[letterIdx].push(el);
  };
  const addGlobalGuide = (el: SVGElement | null) => {
    if (el) globalGuidesRef.current.push(el);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#000000",
        fontFamily: "'Syne', 'Unbounded', sans-serif",
      }}
      aria-label="Loading Sabrang"
      role="status"
    >
      {/* ── Blueprint Canvas Grid (Monochrome) ── */}
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── Ambient Radial Atmosphere ── */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 50%, transparent 80%)",
        }}
      />

      {/* ── SVG Blueprint Construction Overlay ── */}
      <svg
        viewBox={`0 0 ${vpW} ${vpH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        {/* ── 1. GLOBAL BLUEPRINT GUIDES (Cartesian & Typographic Full-Screen Axes) ── */}
        <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1">
          {/* Cap-Height Line */}
          <line ref={addGlobalGuide} x1="0" y1={capY} x2={vpW} y2={capY} strokeDasharray="12 8" />
          {/* Midline / X-Height */}
          <line ref={addGlobalGuide} x1="0" y1={midY} x2={vpW} y2={midY} strokeDasharray="6 6" />
          {/* Baseline */}
          <line ref={addGlobalGuide} x1="0" y1={bslnY} x2={vpW} y2={bslnY} strokeDasharray="12 8" />
          {/* Center Vertical Axis */}
          <line ref={addGlobalGuide} x1={cx} y1="0" x2={cx} y2={vpH} strokeDasharray="8 8" />
        </g>

        {/* ── 2. ARCHITECTURAL INTERSECTING RAYS & LETTERFORMS ── */}

        {/* ── S CLUSTER (Index 0: In sGroupRef for Center → Left translation) ── */}
        <g ref={sGroupRef}>
          {/* S Architectural Construction Guides */}
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1">
            {/* Vertical column bounds */}
            <line ref={(el) => addLetterGuide(0, el)} x1="150" y1="0" x2="150" y2={vpH} strokeDasharray="6 6" />
            <line ref={(el) => addLetterGuide(0, el)} x1="330" y1="0" x2="330" y2={vpH} strokeDasharray="6 6" />
            <line ref={(el) => addLetterGuide(0, el)} x1="240" y1="0" x2="240" y2={vpH} strokeDasharray="4 6" opacity="0.5" />
            {/* Upper and Lower Compass Circles */}
            <circle ref={(el) => addLetterGuide(0, el)} cx="240" cy={capY + 65} r="65" fill="none" strokeDasharray="4 4" />
            <circle ref={(el) => addLetterGuide(0, el)} cx="240" cy={bslnY - 65} r="65" fill="none" strokeDasharray="4 4" />
            {/* Tangent Projections */}
            <line ref={(el) => addLetterGuide(0, el)} x1="0" y1={capY} x2="400" y2={capY} />
            <line ref={(el) => addLetterGuide(0, el)} x1="80" y1={bslnY} x2="440" y2={bslnY} />
            <line ref={(el) => addLetterGuide(0, el)} x1="100" y1={midY} x2="380" y2={midY} strokeDasharray="4 4" />
            {/* Crosshairs */}
            <path ref={(el) => addLetterGuide(0, el)} d="M 225 540 H 255 M 240 525 V 555" strokeWidth="1.2" />
          </g>

          {/* S Letterform */}
          <text
            ref={(el) => { letterRefs.current[0] = el; }}
            x={letterPositions[0]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            S
          </text>
        </g>

        {/* ── A (Index 1, CX = 480) ── Intersecting Diagonal 'X' Rays, Plumb Line & Column Guides ── */}
        <g>
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.2">
            {/* Colossal Intersecting Diagonal 'X' Rays crossing at Apex (480, 410) */}
            <line ref={(el) => addLetterGuide(1, el)} x1="210" y1="0" x2="920" y2={vpH} />
            <line ref={(el) => addLetterGuide(1, el)} x1="750" y1="0" x2="40" y2={vpH} />
            {/* Vertical plumb line through apex */}
            <line ref={(el) => addLetterGuide(1, el)} x1="480" y1="0" x2="480" y2={vpH} strokeDasharray="6 6" />
            {/* Column boundary lines */}
            <line ref={(el) => addLetterGuide(1, el)} x1="390" y1="0" x2="390" y2={vpH} strokeDasharray="4 6" opacity="0.6" />
            <line ref={(el) => addLetterGuide(1, el)} x1="570" y1="0" x2="570" y2={vpH} strokeDasharray="4 6" opacity="0.6" />
            {/* Crossbar projection */}
            <line ref={(el) => addLetterGuide(1, el)} x1="300" y1="570" x2="660" y2="570" strokeDasharray="4 4" />
            {/* Apex Crosshair */}
            <path ref={(el) => addLetterGuide(1, el)} d="M 465 410 H 495 M 480 395 V 425" strokeWidth="1.4" />
          </g>

          {/* A Letterform */}
          <text
            ref={(el) => { letterRefs.current[1] = el; }}
            x={letterPositions[1]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            A
          </text>
        </g>

        {/* ── B (Index 2, CX = 720) ── Vertical Spine, Column Guides & Dual Compass Arcs ── */}
        <g>
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1">
            {/* Vertical spine ray & right bound */}
            <line ref={(el) => addLetterGuide(2, el)} x1="635" y1="0" x2="635" y2={vpH} strokeWidth="1.2" />
            <line ref={(el) => addLetterGuide(2, el)} x1="805" y1="0" x2="805" y2={vpH} strokeDasharray="6 6" />
            {/* Upper and Lower Compass Arcs */}
            <circle ref={(el) => addLetterGuide(2, el)} cx="720" cy={capY + 65} r="65" fill="none" strokeDasharray="4 4" />
            <circle ref={(el) => addLetterGuide(2, el)} cx="725" cy={bslnY - 65} r="65" fill="none" strokeDasharray="4 4" />
            {/* Horizontal tangent projections */}
            <line ref={(el) => addLetterGuide(2, el)} x1="560" y1={midY} x2="880" y2={midY} strokeDasharray="6 6" />
            <line ref={(el) => addLetterGuide(2, el)} x1="560" y1={capY} x2="880" y2={capY} />
            <line ref={(el) => addLetterGuide(2, el)} x1="560" y1={bslnY} x2="880" y2={bslnY} />
            {/* Spine Crosshairs */}
            <path ref={(el) => addLetterGuide(2, el)} d="M 620 410 H 650 M 635 395 V 425 M 620 670 H 650 M 635 655 V 685" strokeWidth="1.2" />
          </g>

          {/* B Letterform */}
          <text
            ref={(el) => { letterRefs.current[2] = el; }}
            x={letterPositions[2]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            B
          </text>
        </g>

        {/* ── R (Index 3, CX = 960) ── Spine, Upper Arc & Diagonal Leg Ray ── */}
        <g>
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1">
            {/* Vertical spine & right column line */}
            <line ref={(el) => addLetterGuide(3, el)} x1="875" y1="0" x2="875" y2={vpH} strokeWidth="1.2" />
            <line ref={(el) => addLetterGuide(3, el)} x1="1045" y1="0" x2="1045" y2={vpH} strokeDasharray="6 6" />
            {/* Upper Lobe Compass Circle */}
            <circle ref={(el) => addLetterGuide(3, el)} cx="960" cy={capY + 65} r="65" fill="none" strokeDasharray="4 4" />
            {/* Diagonal Leg Ray passing through midline intersection */}
            <line ref={(el) => addLetterGuide(3, el)} x1="680" y1="0" x2="1140" y2={vpH} strokeWidth="1.2" />
            <line ref={(el) => addLetterGuide(3, el)} x1="800" y1={midY} x2="1120" y2={midY} strokeDasharray="4 4" />
            {/* Waist Crosshair */}
            <path ref={(el) => addLetterGuide(3, el)} d="M 860 540 H 890 M 875 525 V 555" strokeWidth="1.2" />
          </g>

          {/* R Letterform */}
          <text
            ref={(el) => { letterRefs.current[3] = el; }}
            x={letterPositions[3]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            R
          </text>
        </g>

        {/* ── A (Index 4, CX = 1200) ── Intersecting Diagonal 'X' Rays & Plumb Line ── */}
        <g>
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.2">
            {/* Diagonal 'X' Rays */}
            <line ref={(el) => addLetterGuide(4, el)} x1="930" y1="0" x2="1640" y2={vpH} />
            <line ref={(el) => addLetterGuide(4, el)} x1="1470" y1="0" x2="760" y2={vpH} />
            {/* Vertical plumb line */}
            <line ref={(el) => addLetterGuide(4, el)} x1="1200" y1="0" x2="1200" y2={vpH} strokeDasharray="6 6" />
            {/* Column lines */}
            <line ref={(el) => addLetterGuide(4, el)} x1="1110" y1="0" x2="1110" y2={vpH} strokeDasharray="4 6" opacity="0.6" />
            <line ref={(el) => addLetterGuide(4, el)} x1="1290" y1="0" x2="1290" y2={vpH} strokeDasharray="4 6" opacity="0.6" />
            {/* Crossbar projection */}
            <line ref={(el) => addLetterGuide(4, el)} x1="1020" y1="570" x2="1380" y2="570" strokeDasharray="4 4" />
            {/* Apex Crosshair */}
            <path ref={(el) => addLetterGuide(4, el)} d="M 1185 410 H 1215 M 1200 395 V 425" strokeWidth="1.4" />
          </g>

          {/* A Letterform */}
          <text
            ref={(el) => { letterRefs.current[4] = el; }}
            x={letterPositions[4]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            A
          </text>
        </g>

        {/* ── N (Index 5, CX = 1440) ── Dual Vertical Spines & Diagonal Slash Ray ── */}
        <g>
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1">
            {/* Left and Right Vertical Spines */}
            <line ref={(el) => addLetterGuide(5, el)} x1="1355" y1="0" x2="1355" y2={vpH} strokeWidth="1.2" />
            <line ref={(el) => addLetterGuide(5, el)} x1="1525" y1="0" x2="1525" y2={vpH} strokeWidth="1.2" />
            <line ref={(el) => addLetterGuide(5, el)} x1="1440" y1="0" x2="1440" y2={vpH} strokeDasharray="4 6" opacity="0.5" />
            {/* Infinite Diagonal Ray connecting Top-Left to Bottom-Right */}
            <line ref={(el) => addLetterGuide(5, el)} x1="1170" y1="0" x2="1710" y2={vpH} strokeWidth="1.2" />
            {/* Cap and Baseline horizontal guides */}
            <line ref={(el) => addLetterGuide(5, el)} x1="1280" y1={capY} x2="1600" y2={capY} />
            <line ref={(el) => addLetterGuide(5, el)} x1="1280" y1={bslnY} x2="1600" y2={bslnY} />
            {/* Vertex Crosshairs */}
            <path ref={(el) => addLetterGuide(5, el)} d="M 1340 410 H 1370 M 1355 395 V 425 M 1510 670 H 1540 M 1525 655 V 685" strokeWidth="1.2" />
          </g>

          {/* N Letterform */}
          <text
            ref={(el) => { letterRefs.current[5] = el; }}
            x={letterPositions[5]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            N
          </text>
        </g>

        {/* ── G (Index 6, CX = 1680) ── Compass Arc, Vertical Stop & Inward Crossbar ── */}
        <g>
          <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1">
            {/* Dual Concentric Compass Circles */}
            <circle ref={(el) => addLetterGuide(6, el)} cx="1680" cy={midY} r="130" fill="none" strokeDasharray="6 6" />
            <circle ref={(el) => addLetterGuide(6, el)} cx="1680" cy={midY} r="85" fill="none" strokeDasharray="4 4" opacity="0.5" />
            {/* Horizontal crossbar & vertical stop stem */}
            <line ref={(el) => addLetterGuide(6, el)} x1="1510" y1={midY} x2={vpW} y2={midY} />
            <line ref={(el) => addLetterGuide(6, el)} x1="1800" y1="0" x2="1800" y2={vpH} strokeWidth="1.2" />
            <line ref={(el) => addLetterGuide(6, el)} x1="1550" y1="0" x2="1550" y2={vpH} strokeDasharray="4 6" opacity="0.6" />
            {/* Center Crosshair */}
            <path ref={(el) => addLetterGuide(6, el)} d="M 1665 540 H 1695 M 1680 525 V 555" strokeWidth="1.2" />
          </g>

          {/* G Letterform */}
          <text
            ref={(el) => { letterRefs.current[6] = el; }}
            x={letterPositions[6]}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="280"
            fontWeight="900"
            letterSpacing="2px"
            fill="#ffffff"
            style={{
              fontFamily: "'Syne', 'Unbounded', sans-serif",
            }}
          >
            G
          </text>
        </g>
      </svg>

      {/* ── Top-Left Minimal Progress Indicator ── */}
      <div className="absolute top-6 left-6 pointer-events-none select-none z-10">
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "12px",
            letterSpacing: "0.18em",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <span ref={counterRef}>000/100</span>
        </span>
      </div>

      {/* ── Top-Right Text-Only Skip Button ── */}
      <button
        onClick={handleSkip}
        type="button"
        className="absolute top-6 right-6 z-20 bg-transparent border-0 outline-none p-0 cursor-pointer text-white/50 hover:text-white transition-opacity duration-200"
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          letterSpacing: "0.18em",
        }}
        aria-label="Skip introduction"
      >
        SKIP
      </button>
    </div>
  );
}
